import express, { type ErrorRequestHandler, type RequestHandler } from 'express';
import type { GoogleGenAI } from '@google/genai';
import {
  parseCopilotRequest,
  buildSystemInstruction,
  buildContextPayload,
  generateDeterministicGroundedResponse,
} from './copilot';
import { createRateLimiter } from './rateLimit';

export const GEMINI_MODEL = 'gemini-3.8-flash';

interface AppOptions {
  aiClient: GoogleGenAI | null;
  isProduction: boolean;
}

const securityHeaders =
  (isProduction: boolean): RequestHandler =>
  (_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'microphone=(self), camera=(), geolocation=()');
    if (isProduction) {
      // Dev is excluded because Vite injects inline HMR scripts.
      res.setHeader(
        'Content-Security-Policy',
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
          'font-src https://fonts.gstatic.com',
          "img-src 'self' data: blob:",
          "connect-src 'self'",
          "object-src 'none'",
          "base-uri 'self'",
        ].join('; ')
      );
    }
    next();
  };

/**
 * Builds the API application. Static/Vite asset serving is attached by the caller.
 */
export function createApp({ aiClient, isProduction }: AppOptions) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(securityHeaders(isProduction));

  app.post(
    '/api/gemini/copilot',
    createRateLimiter({ windowMs: 60_000, max: 20 }),
    express.json({ limit: '200kb' }),
    async (req, res) => {
      const parsed = parseCopilotRequest(req.body);
      if (!parsed.ok) {
        res.status(400).json({ success: false, error: parsed.error });
        return;
      }
      const request = parsed.value;

      if (!aiClient) {
        res.json({
          success: true,
          text: generateDeterministicGroundedResponse(request),
          grounded: true,
          source: 'deterministic-offline-engine',
        });
        return;
      }

      try {
        const response = await aiClient.models.generateContent({
          model: GEMINI_MODEL,
          contents: buildContextPayload(request),
          config: {
            systemInstruction: buildSystemInstruction(request),
            temperature: 0.2, // low temperature for grounded fidelity
          },
        });
        res.json({
          success: true,
          text: response.text || generateDeterministicGroundedResponse(request),
          grounded: true,
          source: response.text ? GEMINI_MODEL : 'deterministic-fallback',
        });
      } catch (error) {
        // Log details server-side only; never echo upstream errors to the client.
        console.error('Gemini request failed:', error);
        res.json({
          success: true,
          text: generateDeterministicGroundedResponse(request),
          grounded: true,
          source: 'deterministic-fallback',
        });
      }
    }
  );

  return app;
}

/** Final error handler: malformed JSON, oversized bodies, unexpected failures. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === 'number' && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status === 500) console.error('Unhandled server error:', err);
  res.status(status).json({
    success: false,
    error: status === 413 ? 'Request body too large.' : status === 500 ? 'Internal server error.' : 'Invalid request.',
  });
};

import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import type { GoogleGenAI } from '@google/genai';
import { createApp, errorHandler, GEMINI_MODEL } from '../server/app';
import { createRateLimiter } from '../server/rateLimit';
import { buildCopilotBody } from './fixtures';

function appWith(aiClient: GoogleGenAI | null = null, isProduction = false) {
  const app = createApp({ aiClient, isProduction });
  app.use(errorHandler);
  return app;
}

function fakeGemini(impl: () => Promise<{ text?: string }>) {
  const generateContent = vi.fn(impl);
  return { client: { models: { generateContent } } as unknown as GoogleGenAI, generateContent };
}

const ROUTE = '/api/gemini/copilot';

describe('POST /api/gemini/copilot', () => {
  it('answers from the deterministic engine when no API key is configured', async () => {
    const res = await request(appWith()).post(ROUTE).send(buildCopilotBody());
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ success: true, grounded: true, source: 'deterministic-offline-engine' });
    expect(res.body.text).toContain('AquaSense Decision Briefing');
  });

  it('rejects invalid input with 400 and a field-level message', async () => {
    const res = await request(appWith()).post(ROUTE).send(buildCopilotBody(0, { language: 'xx' }));
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: expect.stringContaining('language') });
  });

  it('rejects malformed JSON without leaking parser details', async () => {
    const res = await request(appWith()).post(ROUTE).set('Content-Type', 'application/json').send('{"prompt":');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ success: false, error: 'Invalid request.' });
  });

  it('rejects oversized bodies with 413', async () => {
    const res = await request(appWith())
      .post(ROUTE)
      .send(buildCopilotBody(0, { padding: 'x'.repeat(300_000) }));
    expect(res.status).toBe(413);
  });

  it('forwards whitelisted context to Gemini and returns its answer', async () => {
    const { client, generateContent } = fakeGemini(async () => ({ text: 'grounded answer' }));
    const res = await request(appWith(client)).post(ROUTE).send(buildCopilotBody());
    expect(res.body).toMatchObject({ success: true, text: 'grounded answer', source: GEMINI_MODEL });

    const call = generateContent.mock.calls[0] as unknown as [{ contents: string; config: { systemInstruction: string } }];
    expect(call[0].contents).not.toContain('hidden_ground_truth_need');
    expect(call[0].config.systemInstruction).toContain('NEVER fabricate');
  });

  it('falls back without exposing the upstream error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { client } = fakeGemini(async () => {
      throw new Error('secret upstream detail');
    });
    const res = await request(appWith(client)).post(ROUTE).send(buildCopilotBody());
    expect(res.status).toBe(200);
    expect(res.body.source).toBe('deterministic-fallback');
    expect(JSON.stringify(res.body)).not.toContain('secret upstream detail');
    consoleSpy.mockRestore();
  });
});

describe('security headers', () => {
  it('sets hardening headers and hides the framework', async () => {
    const res = await request(appWith()).post(ROUTE).send(buildCopilotBody());
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('adds a Content-Security-Policy in production only', async () => {
    const prod = await request(appWith(null, true)).post(ROUTE).send(buildCopilotBody());
    const dev = await request(appWith(null, false)).post(ROUTE).send(buildCopilotBody());
    expect(prod.headers['content-security-policy']).toContain("default-src 'self'");
    expect(dev.headers['content-security-policy']).toBeUndefined();
  });
});

describe('createRateLimiter', () => {
  function limitedApp(now: () => number) {
    const app = express();
    app.get('/', createRateLimiter({ windowMs: 1000, max: 2, now }), (_req, res) => {
      res.send('ok');
    });
    return app;
  }

  it('returns 429 with Retry-After once the limit is exceeded, then resets', async () => {
    let clock = 0;
    const app = limitedApp(() => clock);
    expect((await request(app).get('/')).status).toBe(200);
    expect((await request(app).get('/')).status).toBe(200);
    const blocked = await request(app).get('/');
    expect(blocked.status).toBe(429);
    expect(blocked.headers['retry-after']).toBe('1');

    clock = 1001;
    expect((await request(app).get('/')).status).toBe(200);
  });
});

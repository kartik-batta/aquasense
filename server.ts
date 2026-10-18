import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { createApp, errorHandler } from './server/app';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Gemini is optional: without a key the copilot answers from the deterministic offline engine.
const apiKey = process.env.GEMINI_API_KEY;
const aiClient = apiKey
  ? new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } })
  : null;

async function startServer() {
  const app = createApp({ aiClient, isProduction });

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.use(errorHandler);

  app.listen(port, '0.0.0.0', () => {
    console.log(`AquaSense server running on http://0.0.0.0:${port}`);
  });
}

startServer();

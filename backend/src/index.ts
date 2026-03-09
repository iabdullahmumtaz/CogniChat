import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import { isDemoMode } from './services/openai.js';
import chatRoutes from './routes/chat.js';
import documentRoutes from './routes/documents.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 6022;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5022' }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'CogniChat API',
    demoMode: isDemoMode(),
    mongodb: Boolean(process.env.MONGODB_URI || true),
  });
});

app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentRoutes);

async function start() {
  await connectDB();
  app.listen(PORT, () => {
    console.log(`CogniChat API running on port ${PORT}${isDemoMode() ? ' (demo mode — no OpenAI key)' : ''}`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

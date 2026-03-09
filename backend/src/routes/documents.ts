import express from 'express';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import pdf from 'pdf-parse/lib/pdf-parse.js';
import Document from '../models/Document.js';
import { createEmbedding } from '../services/openai.js';
import { chunkText } from '../services/vectorSearch.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/plain', 'application/pdf', 'text/markdown'];
    if (allowed.includes(file.mimetype) || file.originalname.endsWith('.md')) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, and .pdf files allowed'));
    }
  },
});

import { errorMessage } from '../utils/errors.js';

const router = express.Router();

async function extractText(filePath: string, mimeType: string, originalName: string): Promise<string> {
  if (mimeType === 'application/pdf' || originalName.endsWith('.pdf')) {
    const buffer = await fs.readFile(filePath);
    const data = await pdf(buffer);
    return data.text;
  }
  return fs.readFile(filePath, 'utf-8');
}

router.get('/', async (_req, res) => {
  try {
    const docs = await Document.find().sort({ createdAt: -1 }).select('-chunks.embedding');
    res.json(
      docs.map((d) => ({
        _id: d._id,
        filename: d.filename,
        originalName: d.originalName,
        chunkCount: d.chunks.length,
        createdAt: d.createdAt,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const text = await extractText(req.file.path, req.file.mimetype, req.file.originalname);
    const textChunks = chunkText(text);

    const chunks = [];
    for (let i = 0; i < textChunks.length; i++) {
      const embedding = await createEmbedding(textChunks[i]);
      chunks.push({ text: textChunks[i], embedding, index: i });
    }

    const doc = await Document.create({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      chunks,
    });

    res.status(201).json({
      _id: doc._id,
      originalName: doc.originalName,
      chunkCount: chunks.length,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: errorMessage(err) });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: 'Not found' });

    try {
      await fs.unlink(path.join(uploadDir, doc.filename));
    } catch {
      /* file may already be removed */
    }

    await Document.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: errorMessage(err) });
  }
});

export default router;

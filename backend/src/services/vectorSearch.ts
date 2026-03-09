import Document from '../models/Document.js';
import type { ScoredChunk } from '../types/openai.js';
import { createEmbedding, cosineSimilarity, isDemoMode } from './openai.js';

export async function searchSimilarChunks(query: string, limit = 5): Promise<ScoredChunk[]> {
  const queryEmbedding = await createEmbedding(query);
  const documents = await Document.find({ 'chunks.0': { $exists: true } });

  const scored: ScoredChunk[] = [];
  for (const doc of documents) {
    for (const chunk of doc.chunks) {
      const score = cosineSimilarity(queryEmbedding, chunk.embedding);
      scored.push({
        score,
        text: chunk.text,
        documentName: doc.originalName,
      });
    }
  }

  const sorted = scored.sort((a, b) => b.score - a.score).slice(0, limit);
  if (isDemoMode()) return sorted;
  return sorted.filter((item) => item.score > 0.3);
}

export function chunkText(text: string, chunkSize = 800, overlap = 100): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end).trim());
    start += chunkSize - overlap;
  }
  return chunks.filter(Boolean);
}

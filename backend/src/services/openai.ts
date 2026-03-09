import OpenAI from 'openai';
import type { ChatMessage } from '../types/openai.js';

const DEMO_KEY_PREFIXES = ['sk-your', 'sk-placeholder', 'your-openai'];

export function isDemoMode(): boolean {
  const key = process.env.OPENAI_API_KEY?.trim();
  if (!key) return true;
  return DEMO_KEY_PREFIXES.some((prefix) => key.toLowerCase().startsWith(prefix));
}

let openai: OpenAI | null = null;

function getClient(): OpenAI {
  if (isDemoMode()) {
    throw new Error('OpenAI client unavailable in demo mode');
  }
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

function hashToEmbedding(text: string, dims = 64): number[] {
  const embedding = new Array<number>(dims).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    embedding[i % dims] += text.charCodeAt(i) / 1000;
  }
  const norm = Math.sqrt(embedding.reduce((sum, value) => sum + value * value, 0)) || 1;
  return embedding.map((value) => value / norm);
}

function demoChatReply(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');
  const userText =
    typeof lastUser?.content === 'string' ? lastUser.content.trim() : '';
  const systemMsg = messages.find((message) => message.role === 'system');
  const system =
    typeof systemMsg?.content === 'string' ? systemMsg.content : '';
  const hasContext = system.includes('Context:') && system.includes('[Source');

  if (hasContext) {
    const contextMatch = system.match(/Context:\n([\s\S]*)/);
    const contextPreview = contextMatch?.[1]?.slice(0, 280).trim() || 'uploaded documents';
    return `**Demo mode** — CogniChat is running without a valid \`OPENAI_API_KEY\`, so this is a mock RAG response.

**Your question:** ${userText}

**Matched context preview:**
> ${contextPreview}${contextPreview.length >= 280 ? '…' : ''}

Add a real OpenAI API key to the backend \`.env\` to enable GPT-4o-mini answers with full document retrieval.`;
  }

  return `**Demo mode** — CogniChat is running without a valid \`OPENAI_API_KEY\`.

**Your message:** ${userText || '(empty)'}

This is a placeholder reply. Configure \`OPENAI_API_KEY\` in the backend environment for live AI chat and document embeddings.`;
}

export async function createEmbedding(text: string): Promise<number[]> {
  if (isDemoMode()) {
    return hashToEmbedding(text);
  }
  const client = getClient();
  const response = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  });
  return response.data[0].embedding;
}

export async function chatCompletion(messages: ChatMessage[]): Promise<string> {
  if (isDemoMode()) {
    return demoChatReply(messages);
  }
  const client = getClient();
  const response = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    messages,
    temperature: 0.7,
  });
  return response.choices[0].message.content ?? '';
}

export function cosineSimilarity(a: number[], b: number[]): number {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

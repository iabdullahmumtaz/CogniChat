import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type ChatMessage = ChatCompletionMessageParam;

export interface ScoredChunk {
  score: number;
  text: string;
  documentName: string;
}

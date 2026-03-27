export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  role: MessageRole;
  content: string;
  createdAt?: string;
}

export interface ConversationSummary {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface Conversation extends ConversationSummary {
  messages: ChatMessage[];
}

export interface DocumentSummary {
  _id: string;
  filename?: string;
  originalName: string;
  chunkCount: number;
  createdAt: string;
}

export interface HealthResponse {
  status: string;
  service: string;
  demoMode: boolean;
  mongodb: boolean;
}

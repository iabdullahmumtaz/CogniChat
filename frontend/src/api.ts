import type {
  ChatMessage,
  Conversation,
  ConversationSummary,
  DocumentSummary,
  HealthResponse,
} from './types';

const API = '/api';

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const res = await fetch(`${API}/chat/conversations`);
  if (!res.ok) throw new Error('Failed to load conversations');
  return res.json();
}

export async function fetchConversation(id: string): Promise<Conversation> {
  const res = await fetch(`${API}/chat/conversations/${id}`);
  if (!res.ok) throw new Error('Failed to load conversation');
  return res.json();
}

export async function createConversation(title = 'New Chat'): Promise<Conversation> {
  const res = await fetch(`${API}/chat/conversations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to create conversation');
  return res.json();
}

export async function deleteConversation(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/chat/conversations/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete conversation');
  return res.json();
}

export async function sendMessage(
  conversationId: string,
  content: string,
  useRag = true
): Promise<{ message: ChatMessage; sources: string | null }> {
  const res = await fetch(`${API}/chat/conversations/${conversationId}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, useRag }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Failed to send message');
  }
  return res.json();
}

export async function fetchDocuments(): Promise<DocumentSummary[]> {
  const res = await fetch(`${API}/documents`);
  if (!res.ok) throw new Error('Failed to load documents');
  return res.json();
}

export async function uploadDocument(file: File): Promise<DocumentSummary> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${API}/documents/upload`, { method: 'POST', body: form });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  return res.json();
}

export async function deleteDocument(id: string): Promise<{ success: boolean }> {
  const res = await fetch(`${API}/documents/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete document');
  return res.json();
}

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

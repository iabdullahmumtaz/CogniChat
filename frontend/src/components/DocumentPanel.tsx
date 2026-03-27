import { useState, useEffect } from 'react';
import { fetchDocuments, uploadDocument, deleteDocument } from '../api';
import type { DocumentSummary } from '../types';

interface DocumentPanelProps {
  onClose: () => void;
}

export default function DocumentPanel({ onClose }: DocumentPanelProps) {
  const [docs, setDocs] = useState<DocumentSummary[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { loadDocs(); }, []);

  async function loadDocs() {
    try {
      setDocs(await fetchDocuments());
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    }
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      await uploadDocument(file);
      await loadDocs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteDocument(id);
      setDocs((d) => d.filter((doc) => doc._id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  }

  return (
    <aside className="doc-panel">
      <header>
        <h2>Knowledge Base</h2>
        <button type="button" onClick={onClose} aria-label="Close">×</button>
      </header>
      <p className="doc-hint">Upload .txt, .md, or .pdf files for RAG-powered answers.</p>
      <label className="upload-btn">
        {uploading ? 'Uploading…' : 'Upload document'}
        <input type="file" accept=".txt,.md,.pdf" onChange={handleUpload} disabled={uploading} hidden />
      </label>
      {error && <p className="doc-error">{error}</p>}
      <ul className="doc-list">
        {docs.map((d) => (
          <li key={d._id}>
            <div>
              <strong>{d.originalName}</strong>
              <span>{d.chunkCount} chunks</span>
            </div>
            <button type="button" onClick={() => handleDelete(d._id)}>Delete</button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

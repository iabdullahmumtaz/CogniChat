import type { ConversationSummary } from '../types';

interface SidebarProps {
  conversations: ConversationSummary[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onToggleDocs: () => void;
}

export default function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
  onToggleDocs,
}: SidebarProps) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="logo">CogniChat</div>
        <button type="button" className="btn-new" onClick={onNew}>+ New Chat</button>
      </div>
      <button type="button" className="btn-docs" onClick={onToggleDocs}>📄 Documents</button>
      <div className="conv-list">
        {conversations.map((c) => (
          <div
            key={c._id}
            className={`conv-item ${activeId === c._id ? 'active' : ''}`}
            onClick={() => onSelect(c._id)}
          >
            <span className="conv-title">{c.title || 'New Chat'}</span>
            <button
              type="button"
              className="conv-delete"
              onClick={(e) => { e.stopPropagation(); onDelete(c._id); }}
              aria-label="Delete"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}

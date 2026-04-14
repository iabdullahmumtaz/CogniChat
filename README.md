# CogniChat

AI chatbot SaaS with conversation memory, document upload, and RAG using OpenAI embeddings and MongoDB vector search.

## Features

- Persistent chat conversations with full message history
- Document upload (.txt, .md, .pdf)
- RAG pipeline with text-embedding-3-small
- Cosine similarity search over document chunks
- Sidebar navigation: conversations, documents panel, RAG toggle

## Tech Stack

| Layer    | Technology              |
|----------|-------------------------|
| Backend  | TypeScript, Node.js, Express, Mongoose, tsx |
| Frontend | TypeScript, React, Vite                   |
| Database | MongoDB                 |
| AI       | OpenAI GPT-4o-mini      |

## Ports

| Service | Port |
|---------|------|
| UI      | 5022 |
| API     | 6022 |

## Quick Start

```bash
cp .env.example .env
cd backend && npm install
cd ../frontend && npm install
```

Terminal 1: `cd backend && npm run dev`  
Terminal 2: `cd frontend && npm run dev`

- **UI:** http://localhost:5022
- **API:** http://localhost:6022

Set `OPENAI_API_KEY` in `.env` for live AI; omit for demo mode.

## Project Structure

```
CogniChat/
├── backend/          # Express API + RAG
├── frontend/         # React chat UI
└── .env.example
```

## License

MIT

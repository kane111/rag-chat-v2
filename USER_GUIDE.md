# RAG Chat v2 — User Guide

This guide explains how to set up the app, what the UI does, and how to configure providers and RAG settings. It’s written for third‑party users who want to run and use the app locally.

---

## 1) Overview
- Full‑stack RAG chat application
- Frontend: Next.js 16 (App Router), TailwindCSS, shadcn/ui
- Backend: FastAPI, SQLite, Chroma vector store
- Model providers: Ollama (local) and optionally OpenAI (cloud)

Key code locations:
- Frontend app entry: [app/page.tsx](app/page.tsx)
- Config screen (providers + RAG): [app/config/page.tsx](app/config/page.tsx)
- Backend app: [backend/main.py](backend/main.py)
- Backend settings: [backend/config.py](backend/config.py)
- Runtime config storage: [backend/storage/runtime_config.json](backend/storage/runtime_config.json)

Additional documentation:
- [GETTING_STARTED.md](GETTING_STARTED.md)
- [DOCUMENTATION.md](DOCUMENTATION.md)
- [API_INTEGRATION.md](API_INTEGRATION.md)
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)
- [README.md](README.md)

---

## 2) Prerequisites
- Node.js 18+ and npm
- Python 3.11+ (virtual environment recommended)
- Windows, macOS, or Linux
- Optional for local LLMs: Ollama with compatible models installed
  - Default expects Ollama at http://localhost:11434
- Optional for cloud LLMs: OpenAI account and `OPENAI_API_KEY`

---

## 3) Quick Start (Local Development)
Run backend and frontend in separate terminals.

Terminal A — Backend (FastAPI):
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
Backend starts on `http://localhost:8000`.

Terminal B — Frontend (Next.js):
```powershell
npm install
npm run dev
```
Frontend starts on `http://localhost:3000`.

Open the app at http://localhost:3000.

---

## 4) Configuration

### 4.1 Providers and Models (UI)
- Visit `/config` (e.g., http://localhost:3000/config)
- Choose the LLM provider and model (Ollama or OpenAI)
- Choose the Embedding provider and model (can differ from chat)
- Click “Save selection” to apply

The app only lists providers/models detected at runtime:
- Ollama: requires the `ollama` Python package and a running Ollama daemon with models pulled
- OpenAI: requires the OpenAI SDKs and a valid `OPENAI_API_KEY`

Configuration is persisted to [backend/storage/runtime_config.json](backend/storage/runtime_config.json).

### 4.2 RAG Settings (UI)
- On `/config`, switch to the “RAG Config” tab
- Adjust retrieval strategy (similarity, threshold, MMR), `top_k`, thresholds, and vector backend
- Settings are saved and applied immediately to new queries

### 4.3 Environment Variables (Backend)
The backend reads `.env` with `RAG_` prefix (see [backend/config.py](backend/config.py)):
- `RAG_allowed_origins`: comma‑separated list for CORS (defaults include `http://localhost:3000`)
- `RAG_ollama_base_url`: override Ollama host (default `http://localhost:11434`)
- `RAG_embedding_model`, `RAG_chat_model`, `RAG_top_k`, etc.

Place the `.env` file at the repository root or inside `backend/`.

### 4.4 Frontend API Base URL
- Defaults to `http://localhost:8000` during dev
- Can be overridden via `NEXT_PUBLIC_API_BASE`

Example (PowerShell):
```powershell
$env:NEXT_PUBLIC_API_BASE = "http://localhost:8000"
npm run dev
```

---

## 5) UI Walkthrough

### 5.1 Main Chat
- Type a question in the input and press Enter (or Ctrl+Enter)
- Answers stream in real‑time
- Status badges show message count, file count, and streaming state
- Clear chat via the header button

Keyboard shortcuts:
- Ctrl+Enter: send query
- Escape: close modals
- Tab / Shift+Tab: navigate focus

### 5.2 Knowledge Base Sidebar
- Toggle via the header button (desktop shows a collapsible panel; mobile slides over)
- Upload files by drag‑and‑drop or click‑to‑select
- See files with metadata: name, size, upload date, type/icon
- View file chunks; expand/collapse to inspect retrieved context
- Delete files with confirmation modal

### 5.3 Suggested Questions & Chunks
- The chat displays retrieved context chunks alongside answers
- For each file, you can view chunks via the sidebar controls

### 5.4 Theme & Layout
- Light/dark mode via the theme toggle
- Fully responsive: desktop two‑pane layout, mobile stacked UI

---

## 6) File Types, Limits, and Storage
- Typical supported inputs: PDF, DOCX, TXT (see ingestion pipeline)
- Default size limit is small for demos (configurable in [backend/config.py](backend/config.py))
- Files are stored under `backend/storage/files`
- Vector DB (Chroma) stores under `backend/storage/chroma`
- SQLite DB at `backend/storage/rag.db` (created automatically)

---

## 7) Troubleshooting
- Backend won’t start
  - Ensure virtual env is active and `pip install -r backend/requirements.txt` completed
  - If port 8000 is busy, change the port: `uvicorn backend.main:app --reload --port 8010`
- CORS / Network errors
  - Keep frontend on 3000 and backend on 8000, or update `RAG_allowed_origins`
  - Set `NEXT_PUBLIC_API_BASE` so the frontend calls the correct backend URL
- No providers/models listed on `/config`
  - Ollama: install Ollama, run the daemon, and `ollama pull <model>`
  - OpenAI: set `OPENAI_API_KEY` and install OpenAI SDKs
- Streaming hangs
  - Check backend logs; `/query` uses SSE and expects a live connection
- Styling looks off
  - Confirm Tailwind is configured; restart `npm run dev` after dependency changes

---

## 8) Production Notes
- Frontend
  ```bash
  npm run build
  npm run start
  ```
- Backend
  ```bash
  uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 2
  ```
- Set proper CORS and environment variables for your deployment host(s)
- Persist `backend/storage/` volumes if you need to keep files, vectors, and the SQLite DB

---

## 9) API Overview (Quick)
Common endpoints (see [API_INTEGRATION.md](API_INTEGRATION.md) for details):
- `POST /ingest` — upload and index a file
- `GET /files` — list files
- `GET /file/{id}/chunks` — file chunks
- `DELETE /file/{id}` — delete file
- `POST /query` — ask a question (SSE streaming)
- Provider/model discovery & selection under `/providers/*`

---

## 10) FAQ
- Can I use OpenAI instead of Ollama?
  - Yes. Set `OPENAI_API_KEY`, then select OpenAI models on `/config`.
- Where does the app store data?
  - Under `backend/storage/` (files, vectors, SQLite DB, runtime selection).
- Can I change chunking or retrieval settings?
  - Yes on `/config` → “RAG Config”.
- How do I change the backend port?
  - `uvicorn backend.main:app --port 8010` and set `NEXT_PUBLIC_API_BASE` accordingly.

---

## 11) Support & Further Reading
- Frontend code and components: [app/components/index.ts](app/components/index.ts)
- Backend routers: [backend/routers/query.py](backend/routers/query.py), [backend/routers/files.py](backend/routers/files.py)
- Deep dives: [DOCUMENTATION.md](DOCUMENTATION.md), [GETTING_STARTED.md](GETTING_STARTED.md)

If you hit issues, check browser console, backend terminal logs, and the docs above.

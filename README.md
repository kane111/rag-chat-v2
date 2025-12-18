# RAG Chat v2

A modern, full-stack RAG (Retrieval-Augmented Generation) chat application with real-time streaming, file management, and configurable AI providers.

---

## 1) Overview
**RAG Chat v2** is a modern chat application that combines document retrieval with AI-powered responses. Upload your documents, ask questions, and get accurate answers with cited sources.

### Tech Stack
- **Frontend**: Next.js 16.0.10 (App Router), React 19.2.1, TailwindCSS 4, shadcn/ui
- **Backend**: FastAPI, SQLite, ChromaDB, LangChain
- **AI Providers**: Ollama (local LLMs), OpenAI (cloud LLMs)
- **Document Processing**: Docling, pdfminer.six, python-docx, langchain-text-splitters

### Key Features
- 📄 **Document Upload**: PDF, DOCX, TXT with Docling conversion and intelligent chunking
- 💬 **Real-time Chat**: Streaming responses with Server-Sent Events (SSE)
- 🔍 **Context Retrieval**: View source chunks with file citations and page references
- 🔌 **Multi-Provider Support**: Ollama (local) and OpenAI (cloud) with dynamic model loading
- ⚙️ **Configurable RAG**: Multiple retrieval strategies (similarity, MMR), adjustable parameters
- 📊 **Context Visualization**: View retrieved chunks, suggested questions, and file metadata
- 🎨 **Modern UI**: Dark/light themes, responsive design, accessibility-focused
- 🔐 **Secure Configuration**: Environment-based secrets, persistent runtime config

---

## 2) Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.9+ (3.11+ recommended for best compatibility)
- **AI Providers** (choose one or both):
  - **Ollama** (for local AI models)
    - Install from: https://ollama.ai
    - Pull required models: `ollama pull mistral`, `ollama pull gemma2`, or other supported models
    - Embedding models: `ollama pull nomic-embed-text` or `ollama pull all-minilm`
  - **OpenAI** (for cloud-based models)
    - Get API key from: https://platform.openai.com/api-keys
    - Set `RAG_OPENAI_API_KEY` in your `.env` file
    - Supports GPT-3.5-turbo, GPT-4, and latest models

---

## 3) Quick Start (Local Development)

### Backend Setup
```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn backend.main:app --reload
```
Backend will start on **http://localhost:8000**

### Frontend Setup
```powershell
npm install
npm run dev
```
Frontend will start on **http://localhost:3000**

Open the app at http://localhost:3000.

---

## 4) Configuration

### 4.1 Provider Configuration
Visit the **Config page** at `/config`:
- **Chat Model**: Select the LLM for generating responses
- **Embedding Model**: Select the model for document embeddings
- **Provider**: Supports Ollama (local) and OpenAI (cloud)
- **Dynamic Model Loading**: When you select a provider, available models are automatically fetched

**OpenAI Setup**:
1. Create a `.env` file from `.env.example`
2. Add your OpenAI API key: `RAG_OPENAI_API_KEY=sk-...`
3. Restart the backend
4. Select "OpenAI" as provider in the config page
5. Available models will be fetched automatically with context window information

Configuration is saved to `backend/storage/runtime_config.json`

### 4.2 RAG Configuration
On the Config page, adjust RAG parameters:
- **Retrieval Strategy**: 
  - `similarity`: Standard vector similarity search
  - `similarity_threshold`: Similarity with minimum score filtering
  - `mmr` (Maximal Marginal Relevance): Balance between relevance and diversity
- **Top K**: Number of chunks to retrieve (1-20, default: 5)
- **Score Threshold**: Minimum relevance score (0.0-1.0, optional)
- **MMR Lambda**: Diversity vs relevance balance (0.0-1.0, default: 0.5)
- **Fetch K**: Internal parameter for MMR algorithm (affects quality)

### 4.3 Environment Variables
Create a `.env` file in the **project root** (copy from `.env.example`):
```bash
# OpenAI API Key (required for OpenAI provider)
RAG_OPENAI_API_KEY=your_openai_api_key_here

# Ollama Configuration
RAG_OLLAMA_BASE_URL=http://localhost:11434

# CORS settings
RAG_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Default models (can be changed in the config UI)
RAG_EMBEDDING_MODEL=embeddinggemma:latest
RAG_CHAT_MODEL=gemma3:4b

# RAG parameters
RAG_TOP_K=12
RAG_MAX_FILE_MB=50
RAG_CHUNK_SIZE=1024
RAG_CHUNK_OVERLAP=400
```

All settings use the `RAG_` prefix (see [backend/config.py](backend/config.py))

### 4.4 Frontend Environment
Optional frontend configuration:
```bash
NEXT_PUBLIC_API_BASE=http://localhost:8000
```

---

## 5) Usage

### Uploading Documents
1. Click the **sidebar toggle** in the header
2. **Drag and drop** files or click to browse
3. Supported formats: PDF, DOCX, TXT
4. Files are automatically processed with Docling when available

### Chatting
1. **Select files** from the sidebar (optional - use for context)
2. **Type your question** in the input area
3. Press **Enter** or **Ctrl+Enter** to send
4. Watch the **real-time streaming** response
5. View **source chunks** in the context panel

### Viewing Context
- Expand **chunk viewers** to see retrieved content
- Click **file names** in citations to view details
- See **page numbers** and **section headings** when available

### Managing Files
- **View chunks**: Click the chunks icon on any file
- **Suggested questions**: Click the questions icon
- **Delete files**: Click delete and confirm

---

## 6) Project Structure

```
rag-chat-v2/
├── app/                    # Next.js frontend
│   ├── components/        # React components
│   ├── hooks/             # Custom React hooks
│   ├── config/            # Config page
│   ├── page.tsx           # Main chat interface
│   └── layout.tsx         # Root layout
├── backend/               # FastAPI backend
│   ├── routers/          # API route handlers
│   ├── services/         # Business logic
│   ├── models.py         # Database models
│   ├── config.py         # Configuration
│   └── main.py           # FastAPI app
├── components/           # shadcn/ui components
└── public/               # Static assets
```

---

## 7) API Endpoints

Key endpoints (see [API_INTEGRATION.md](API_INTEGRATION.md) for details):
- `POST /ingest` - Upload and process a file
- `GET /files` - List all uploaded files
- `GET /file/{id}/chunks` - Get file chunks
- `GET /file/{id}/questions` - Get suggested questions
- `DELETE /file/{id}` - Delete a file
- `POST /query` - Ask a question (streaming SSE)
- `GET /providers/models` - List available models
- `POST /providers/selection` - Save provider selection

---

## 8) Troubleshooting

### Backend Issues
- **Port 8000 busy**: Use `uvicorn backend.main:app --reload --port 8010`
- **No models available**: Ensure Ollama is running and models are pulled
- **Import errors**: Activate venv and reinstall: `pip install -r requirements.txt`

### Frontend Issues
- **CORS errors**: Check `RAG_allowed_origins` in backend config
- **API not found**: Verify `NEXT_PUBLIC_API_BASE` points to backend
- **Styling broken**: Clear `.next` folder and restart: `rm -rf .next && npm run dev`

### Ollama Issues
- **Connection refused**: Start Ollama: `ollama serve`
- **Model not found**: Pull models: `ollama pull gemma3:4b`
- **Slow responses**: Consider using smaller models or adjust parameters

---

## 9) Development

### Adding Components
```bash
npx shadcn@latest add [component-name]
```

### Database Migrations
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend (not yet implemented)
npm test
```

---

## 10) Production Deployment

### Frontend
```bash
npm run build
npm run start
```

### Backend
```bash
uvicorn backend.main:app --host 0.0.0.0 --port 8000 --workers 4
```

**Important**: 
- Set appropriate CORS origins
- Persist the `backend/storage/` directory
- Configure environment variables
- Use a production-grade database (PostgreSQL recommended)

---

## 11) Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - Detailed setup guide
- **[API_INTEGRATION.md](API_INTEGRATION.md)** - API documentation
- **[USER_GUIDE.md](USER_GUIDE.md)** - User-facing documentation

---

## 12) License

This project is available under the MIT License.

---

## 13) Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

*Built with ❤️ using Next.js, FastAPI, and Ollama*

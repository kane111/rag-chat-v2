# Getting Started with RAG Chat v2

## Overview

This guide will help you set up and run the RAG Chat v2 application locally. Follow the steps below to get started.

---

## Prerequisites

Before you begin, ensure you have the following installed:

### 1. Node.js and npm
- **Version**: Node.js 18 or higher
- **Download**: https://nodejs.org/
- **Verify installation**:
  ```bash
  node --version
  npm --version
  ```

### 2. Python
- **Version**: Python 3.11 or higher
- **Download**: https://www.python.org/downloads/
- **Verify installation**:
  ```bash
  python --version
  ```

### 3. Ollama (for AI models)
- **Download**: https://ollama.ai
- **Install** the appropriate version for your OS
- **Start Ollama**: 
  ```bash
  ollama serve
  ```
- **Pull required models**:
  ```bash
  ollama pull gemma3:4b
  ollama pull embeddinggemma:latest
  ```

---

## Installation

### Step 1: Clone the Repository (if applicable)
```bash
git clone <repository-url>
cd rag-chat-v2
```

### Step 2: Backend Setup

#### 2.1. Navigate to backend directory
```bash
cd backend
```

#### 2.2. Create a virtual environment
```bash
python -m venv .venv
```

#### 2.3. Activate the virtual environment
**On Windows (PowerShell)**:
```powershell
.\.venv\Scripts\Activate.ps1
```

**On Windows (Command Prompt)**:
```cmd
.venv\Scripts\activate.bat
```

**On Linux/Mac**:
```bash
source .venv/bin/activate
```

#### 2.4. Install Python dependencies
```bash
pip install -r requirements.txt
```

#### 2.5. (Optional) Create a .env file
Create a `.env` file in the `backend/` directory with custom settings:
```bash
RAG_allowed_origins=http://localhost:3000,http://127.0.0.1:3000
RAG_ollama_base_url=http://localhost:11434
RAG_embedding_model=embeddinggemma:latest
RAG_chat_model=gemma3:4b
RAG_top_k=12
RAG_max_file_mb=50
```

#### 2.6. Start the backend server
```bash
uvicorn backend.main:app --reload
```

The backend will start on **http://localhost:8000**

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
```

### Step 3: Frontend Setup

Open a **new terminal window** (keep the backend running).

#### 3.1. Navigate to the project root
```bash
cd d:\test_nextjs\rag-chat-v2
```

#### 3.2. Install Node.js dependencies
```bash
npm install
```

#### 3.3. Start the development server
```bash
npm run dev
```

The frontend will start on **http://localhost:3000**

You should see:
```
  ▲ Next.js 16.0.10
  - Local:        http://localhost:3000
  - Network:      http://<your-ip>:3000

  ✓ Ready in 2.1s
```

#### 3.4. Open the application
Open your browser and navigate to: **http://localhost:3000**

---

## First-Time Configuration

### 1. Configure AI Models

Once the app is running, navigate to the **Config page**: http://localhost:3000/config

1. **Select Chat Model**: Choose `gemma3:4b` (or any model you pulled)
2. **Select Embedding Model**: Choose `embeddinggemma:latest`
3. Click **Save Selection**

### 2. Configure RAG Settings

On the same config page, switch to the **RAG Config** tab:

- **Retrieval Strategy**: Start with `similarity` or `mmr`
- **Top K**: Set to `10-15` for best results
- **Score Threshold**: Set to `0.3-0.5` for balanced filtering
- **MMR Lambda**: Set to `0.5` for balanced diversity

Click **Save Changes**

---

## Using the Application

### 1. Upload Documents

1. Click the **sidebar toggle** button in the header
2. Drag and drop files into the upload zone, or click to browse
3. Supported formats: **PDF, DOCX, TXT**
4. Wait for the upload to complete

Files will be automatically processed and indexed.

### 2. Ask Questions

1. (Optional) Select specific files from the sidebar
2. Type your question in the chat input
3. Press **Enter** or **Ctrl+Enter** to send
4. Watch the real-time streaming response

### 3. View Context

- Expand the **context chunks** panel to see retrieved sources
- Click on file names to view more details
- See **citations** with page numbers and sections

### 4. Manage Files

- Click the **chunks icon** to view all chunks in a file
- Click the **questions icon** to see suggested questions
- Click **delete** to remove a file (with confirmation)

---

## Troubleshooting

### Backend Not Starting

**Problem**: `ModuleNotFoundError` or import errors

**Solution**:
1. Ensure virtual environment is activated
2. Reinstall dependencies: `pip install -r requirements.txt`
3. Check Python version: `python --version` (should be 3.11+)

---

### Port Already in Use

**Problem**: `Address already in use`

**Solution**:
- Backend: Change port with `uvicorn backend.main:app --reload --port 8010`
- Frontend: Kill the process or use a different port: `PORT=3001 npm run dev`

---

### Ollama Connection Failed

**Problem**: Cannot connect to Ollama at `http://localhost:11434`

**Solution**:
1. Ensure Ollama is installed
2. Start Ollama: `ollama serve`
3. Verify it's running: Open http://localhost:11434 in a browser
4. Check the backend `.env` file for correct `RAG_ollama_base_url`

---

### Models Not Showing Up

**Problem**: No models available in the config dropdown

**Solution**:
1. Pull models: `ollama pull gemma3:4b` and `ollama pull embeddinggemma:latest`
2. List models: `ollama list`
3. Restart the backend server
4. Check backend logs for errors

---

### CORS Errors in Browser

**Problem**: `CORS policy: No 'Access-Control-Allow-Origin' header`

**Solution**:
1. Check `RAG_allowed_origins` in backend `.env` file
2. Add your frontend URL: `RAG_allowed_origins=http://localhost:3000`
3. Restart the backend server

---

### Frontend Build Errors

**Problem**: TypeScript or build errors

**Solution**:
1. Delete `.next` folder: `rm -rf .next`
2. Delete `node_modules`: `rm -rf node_modules`
3. Reinstall: `npm install`
4. Restart: `npm run dev`

---

## Next Steps

Now that you have the application running:

1. **Upload some documents** to build your knowledge base
2. **Experiment with RAG settings** to optimize retrieval
3. **Try different models** to see which works best for your use case
4. **Read the [USER_GUIDE.md](USER_GUIDE.md)** for detailed feature documentation

---

## Additional Resources

- **[README.md](README.md)** - Project overview
- **[API_INTEGRATION.md](API_INTEGRATION.md)** - API documentation
- **[USER_GUIDE.md](USER_GUIDE.md)** - User manual

---

**Need help?** Check the browser console (F12) for frontend errors and the terminal for backend logs.

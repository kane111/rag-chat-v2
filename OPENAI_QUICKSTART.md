# OpenAI Integration - Quick Start

## Prerequisites
- Python 3.9+
- Node.js 16+
- OpenAI API Key (from https://platform.openai.com/api-keys)

## Installation

### 1. Backend Setup

```bash
cd backend

# Install dependencies (including langchain-openai and openai)
pip install -r requirements.txt

# Set your OpenAI API key
export RAG_OPENAI_API_KEY="sk-..."  # or set in .env file as RAG_OPENAI_API_KEY=sk-...

# Start the backend server
uvicorn main:app --reload
```

### 2. Frontend Setup

```bash
# In a new terminal, from project root
npm install
npm run dev
```

The frontend will be available at http://localhost:3000

## Using OpenAI

### Step 1: Configure Providers

1. Open http://localhost:3000/config
2. In **LLM Provider Configuration**:
   - Click the Provider dropdown
   - Select "OpenAI"
   - Choose a model (e.g., "gpt-4", "gpt-3.5-turbo")
3. In **Embedding Provider Configuration**:
   - Click the Provider dropdown
   - Select "OpenAI"
   - Choose an embedding model (e.g., "text-embedding-ada-002")
4. Click **Save selection**

### Step 2: Upload Documents

1. Go to http://localhost:3000
2. Click "Upload Files"
3. Select your documents (PDF, DOCX, TXT, MD)
4. Wait for processing to complete

**Important**: When switching embedding providers, you must **re-upload documents** to re-index them with the new embedding model.

### Step 3: Chat

1. Type your question in the chat input
2. The OpenAI GPT model will generate responses using your documents as context
3. Citations show which documents were used

## Switching Between Providers

You can independently switch:
- **LLM Provider** (Ollama ↔ OpenAI) - changes response generation
- **Embedding Provider** (Ollama ↔ OpenAI) - changes search quality

Just go to `/config` and select different providers.

**Note**: Switching the embedding provider requires re-uploading documents to re-index them.

## Troubleshooting

### "OpenAI provider not available"
- Ensure you've set the `RAG_OPENAI_API_KEY` environment variable
- Verify the OpenAI API key is valid
- Check that `langchain-openai` and `openai` packages are installed

### "Model not found"
- Make sure your OpenAI API key has access to the model
- Some models (like gpt-4) require approval or specific subscription tiers

### "Embedding failed"
- Verify your API key is set and has embedding access
- Check your OpenAI account has sufficient credits

## Cost Considerations

Using OpenAI will incur API costs:
- **LLM Usage**: Charged per token (varies by model)
- **Embedding Usage**: Charged per token (same rate across models)

Compare with **Ollama** (free, runs locally but requires GPU for good performance).

## Example Configurations

### Budget-Conscious Setup (Ollama Everything)
```
LLM Provider: Ollama (e.g., mistral:latest)
Embedding Provider: Ollama (e.g., embeddinggemma:latest)
Cost: Free (runs locally)
```

### Best Quality Setup (OpenAI Everything)
```
LLM Provider: OpenAI (gpt-4 or gpt-4-turbo)
Embedding Provider: OpenAI (text-embedding-3-large)
Cost: ~$0.10-$0.50+ per query depending on document size
```

### Hybrid Setup (Local LLM + OpenAI Embeddings)
```
LLM Provider: Ollama (mistral:latest)
Embedding Provider: OpenAI (text-embedding-3-small)
Cost: Lower than full OpenAI, better embeddings than Ollama
```

## Environment Variables

```bash
# Required if using OpenAI
RAG_OPENAI_API_KEY=sk-your-api-key-here

# Optional Ollama configuration
RAG_OLLAMA_BASE_URL=http://localhost:11434  # Default

# Optional storage configuration
RAG_STORAGE_DIR=./backend/storage  # Default
```

You can set these in a `.env` file in the `backend` directory or as system environment variables.

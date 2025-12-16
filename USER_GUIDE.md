# RAG Chat v2 - User Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [User Interface Overview](#user-interface-overview)
4. [Uploading Documents](#uploading-documents)
5. [Chatting with Your Documents](#chatting-with-your-documents)
6. [Understanding Context and Citations](#understanding-context-and-citations)
7. [Managing Files](#managing-files)
8. [Configuring the Application](#configuring-the-application)
9. [Tips and Best Practices](#tips-and-best-practices)
10. [Troubleshooting](#troubleshooting)
11. [Keyboard Shortcuts](#keyboard-shortcuts)
12. [FAQ](#faq)

---

## Introduction

RAG Chat v2 is an intelligent chat application that lets you ask questions about your documents. It uses Retrieval-Augmented Generation (RAG) to find relevant information in your uploaded files and generate accurate, cited answers.

### What can it do?

- **Upload documents**: PDF, DOCX, and TXT files
- **Ask questions**: Get answers based on your document content
- **See sources**: View the exact text snippets used to generate answers
- **Real-time responses**: Watch answers appear as they're generated
- **Configurable**: Adjust how the system retrieves and generates answers

---

## Getting Started

### Prerequisites

Before using RAG Chat v2, ensure:

1. The **backend server** is running (usually at `http://localhost:8000`)
2. The **frontend server** is running (usually at `http://localhost:3000`)
3. **Ollama** is installed and running with required models

If you haven't set up the application yet, see [GETTING_STARTED.md](GETTING_STARTED.md).

### First Launch

1. Open your browser and navigate to `http://localhost:3000`
2. You'll see the main chat interface
3. Click the **sidebar toggle** button to open the file manager
4. Go to `/config` to configure AI models (first time only)

---

## User Interface Overview

### Main Components

The interface has three main areas:

1. **Header Bar** (top)
   - Application title
   - Configuration button (⚙️)
   - Sidebar toggle button
   - Theme toggle (🌙/☀️)
   - Clear chat button

2. **Sidebar** (left/overlay on mobile)
   - File upload zone
   - List of uploaded files
   - File management actions

3. **Main Chat Area** (center)
   - Chat messages
   - Context chunks viewer
   - Message input
   - Status indicators

### Desktop vs Mobile

- **Desktop (>1024px)**: Side-by-side layout with persistent sidebar
- **Tablet (640-1024px)**: Flexible layout
- **Mobile (<640px)**: Stacked layout with overlay sidebar

---

## Uploading Documents

### Supported Formats

- **PDF** (.pdf) - Adobe PDF documents
- **DOCX** (.docx) - Microsoft Word documents
- **TXT** (.txt) - Plain text files

### Upload Methods

#### Method 1: Drag and Drop

1. Click the **sidebar toggle** to open the file panel
2. Drag files from your computer
3. Drop them onto the upload zone
4. Wait for processing to complete

#### Method 2: Click to Browse

1. Click the **sidebar toggle** to open the file panel
2. Click anywhere in the upload zone
3. Select files from the file picker dialog
4. Wait for processing to complete

### Upload Process

When you upload a file:

1. **File is uploaded** to the server
2. **Content is extracted** (text, structure, metadata)
3. **Docling conversion** may be applied (if available)
4. **Text is chunked** into smaller segments
5. **Chunks are embedded** using AI models
6. **Vectors are stored** in the database

A progress bar shows the upload status.

### Upload Limits

- **Maximum file size**: 50MB (configurable)
- **File type**: Must be PDF, DOCX, or TXT
- **Number of files**: No hard limit, but performance may vary

---

## Chatting with Your Documents

### Asking Questions

1. **Type your question** in the input field at the bottom
2. **Press Enter** or **Ctrl+Enter** to send
3. **Watch the response** stream in real-time
4. **View context chunks** that were used to answer

### Query Tips

**Good questions**:
- "What are the main findings in the research paper?"
- "Summarize the introduction section"
- "What does the document say about climate change?"

**Less effective**:
- "Tell me everything" (too broad)
- "What's on page 5?" (RAG retrieves by content, not page)

### Selecting Files for Context

By default, the system searches **all uploaded files**. To limit the search:

1. Click **checkboxes** next to specific files in the sidebar
2. Only selected files will be used for context
3. Uncheck to search all files again

### Streaming Responses

Answers appear **in real-time** as they're generated:

- **Typing indicator** (animated dots) shows when generation starts
- **Text streams** word-by-word or in small chunks
- **Context chunks** appear before the answer
- **End marker** appears when generation completes

### Clearing the Chat

Click the **Clear Chat** button in the header to:
- Remove all messages
- Clear context chunks
- Start a fresh conversation

---

## Understanding Context and Citations

### What are Context Chunks?

When you ask a question, the system:

1. **Searches** your documents for relevant text
2. **Retrieves** the most similar chunks (10-15 by default)
3. **Shows these chunks** in the context panel
4. **Uses them** to generate the answer

### Reading Citations

Each context chunk shows:

- **Filename**: Which document it came from
- **Page Number**: Where in the document (if available)
- **Section Heading**: The section name (if available)
- **Chunk Text**: The actual content retrieved

### Why Citations Matter

Citations help you:
- **Verify** the AI's answer
- **Find** the source material
- **Trust** the information provided
- **Learn more** by reading the full context

### Expanding Chunks

- Click a chunk to **expand** and see full text
- Click again to **collapse**
- Scroll within expanded chunks if content is long

---

## Managing Files

### Viewing File Information

Each file in the sidebar shows:

- **File name**
- **File type** (icon: 🔴 PDF, 🔵 DOCX, ⚪ TXT)
- **File size** (in MB)
- **Upload date**
- **Docling badge** (if processed with Docling)

### File Actions

Each file has action buttons:

1. **View Chunks** (📄)
   - Shows all chunks created from the file
   - Displays chunk text and metadata
   - Helps understand how the file was processed

2. **Suggested Questions** (❓)
   - Shows AI-generated questions about the file
   - Click a question to ask it instantly
   - Helps you get started with queries

3. **Delete** (🗑️)
   - Removes the file and all its chunks
   - Shows confirmation dialog
   - Cannot be undone

### Deleting Files

To delete a file:

1. Click the **delete** button (🗑️)
2. **Confirm** in the modal dialog
3. File and chunks are **permanently removed**
4. File list **refreshes** automatically

**Note**: Deletion cannot be undone. Make sure you want to delete before confirming.

---

## Configuring the Application

### Accessing Configuration

Click the **Configuration** button (⚙️) in the header, or navigate to `/config`.

### Model Configuration

#### Chat Model

The LLM used to generate answers:

1. Select **Provider** (e.g., Ollama)
2. Select **Model** (e.g., gemma3:4b)
3. Click **Save Selection**

Popular models:
- **gemma3:4b**: Fast, efficient, good for most tasks
- **llama2**: Larger, more capable, slower

#### Embedding Model

The model used to create document embeddings:

1. Select **Provider** (e.g., Ollama)
2. Select **Model** (e.g., embeddinggemma:latest)
3. Click **Save Selection**

**Note**: Changing embedding model requires re-uploading files.

### RAG Configuration

Switch to the **RAG Config** tab to adjust retrieval settings.

#### Retrieval Strategy

- **Similarity**: Basic cosine similarity search (fast)
- **Similarity with Threshold**: Filter by minimum score (balanced)
- **MMR**: Maximal Marginal Relevance (diverse results)

#### Top K

Number of chunks to retrieve:
- **Lower (5-10)**: Faster, more focused
- **Higher (15-20)**: Slower, more comprehensive
- **Recommended**: 10-15

#### Score Threshold

Minimum relevance score (0.0-1.0):
- **Lower (0.1-0.3)**: More results, may include irrelevant
- **Higher (0.5-0.7)**: Fewer results, more focused
- **Recommended**: 0.3-0.5

#### MMR Lambda

Balance between relevance and diversity (0.0-1.0):
- **0.0**: Maximum diversity
- **1.0**: Maximum relevance
- **0.5**: Balanced (recommended)

#### Chunking Method

How documents are split:
- **Recursive Character**: Split by characters with overlap (general-purpose)
- **Markdown**: Split by markdown headers (for .md files)
- **Token-based**: Split by token count (advanced)

### Saving Configuration

1. Adjust settings
2. Click **Save Changes**
3. Settings apply **immediately** to new queries
4. Settings are **persisted** across sessions

---

## Tips and Best Practices

### Uploading Documents

✅ **Do**:
- Upload well-structured documents (headings, sections)
- Use clear file names
- Upload related documents together
- Check file size before uploading

❌ **Don't**:
- Upload scanned images without OCR
- Use very large files (split if possible)
- Upload duplicate content
- Upload sensitive/private information

### Asking Questions

✅ **Do**:
- Be specific in your questions
- Ask about topics in your documents
- Use keywords from the documents
- Rephrase if results aren't good

❌ **Don't**:
- Ask about information not in documents
- Use overly broad questions
- Expect knowledge beyond your documents
- Rely solely on AI without verification

### Using Context

✅ **Do**:
- Check citations for accuracy
- Read the context chunks
- Verify critical information
- Use page numbers to find more

❌ **Don't**:
- Trust answers without verification
- Ignore low relevance scores
- Assume all information is correct
- Skip reading source material

---

## Troubleshooting

### No Answer Generated

**Problem**: Query completes but no answer appears

**Solutions**:
- Check if files are uploaded
- Try selecting specific files
- Adjust RAG settings (lower threshold)
- Check backend logs for errors

---

### Irrelevant Results

**Problem**: Context chunks don't match the question

**Solutions**:
- Rephrase your question
- Increase score threshold
- Try different retrieval strategy (MMR)
- Check if relevant documents are uploaded

---

### Slow Performance

**Problem**: Queries take a long time

**Solutions**:
- Reduce Top K (fewer chunks)
- Use a smaller/faster model
- Close other applications
- Check Ollama is running properly

---

### Upload Fails

**Problem**: File upload doesn't complete

**Solutions**:
- Check file size (max 50MB)
- Verify file format (PDF, DOCX, TXT)
- Check internet/network connection
- Look for backend error messages

---

### Models Not Available

**Problem**: No models show in configuration

**Solutions**:
- Ensure Ollama is running (`ollama serve`)
- Pull models: `ollama pull gemma3:4b`
- Restart backend server
- Check backend logs

---

## Keyboard Shortcuts

| Shortcut     | Action                       |
| ------------ | ---------------------------- |
| `Enter`      | Send message                 |
| `Ctrl+Enter` | Send message (alternative)   |
| `Escape`     | Close modals/dialogs         |
| `Tab`        | Navigate to next element     |
| `Shift+Tab`  | Navigate to previous element |

---

## FAQ

### Can I upload multiple files at once?

Yes! Drag and drop multiple files, and they'll be uploaded sequentially.

---

### How long does processing take?

Depends on file size and content. Small PDFs take 5-10 seconds, larger files may take 30-60 seconds.

---

### Where are my files stored?

Files are stored locally in `backend/storage/files/`. They're not sent to any cloud service.

---

### Can I use OpenAI instead of Ollama?

Currently, only Ollama is fully supported. OpenAI integration is planned for a future release.

---

### What happens if I delete a file?

The file and all its chunks are permanently removed from the database and file system. This cannot be undone.

---

### Can I export my chat history?

Not currently, but this feature is planned for a future release.

---

### Why do I see "Converted with Docling"?

Docling is an advanced document converter that extracts better structure and formatting. This badge means your document was processed with Docling for improved quality.

---

### How accurate are the answers?

Accuracy depends on:
- Quality of your documents
- Relevance of retrieved context
- AI model capabilities
- Your question phrasing

Always verify important information against the source documents.

---

### Can I use this offline?

Yes! If you're using local models (Ollama), everything runs on your machine. No internet required after initial setup.

---

## Getting More Help

### Resources

- **[README.md](README.md)**: Project overview
- **[GETTING_STARTED.md](GETTING_STARTED.md)**: Setup instructions
- **[API_INTEGRATION.md](API_INTEGRATION.md)**: API documentation

### Logs

Check logs for errors:
- **Frontend**: Browser console (F12)
- **Backend**: Terminal where backend is running

### Support

For bugs or feature requests:
1. Check existing documentation
2. Review backend/frontend logs
3. Create a detailed bug report with steps to reproduce

---

*Last updated: December 16, 2024*

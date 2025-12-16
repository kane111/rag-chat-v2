export type FileMeta = {
  id: number;
  filename: string;
  filepath: string;
  filetype: string;
  size_mb: number;
  uploaded_at: string;
  updated_at: string;
  converted_with_docling: boolean;
  raw_markdown?: string | null;
};

export type SuggestedQuestions = {
  file_id: number;
  filename: string;
  questions: string[];
};

export type Chunk = {
  id: number;
  file_id: number;
  chunk_index: number;
  content: string;
  section_heading: string | null;
  page_number: number | null;
  created_at: string;
};

export type ContextChunk = {
  chunk: string;
  citation: {
    doc_id: string;
    filename?: string;
    page?: number | null;
    section?: string | null;
  };
};

export type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  rawContent?: string;
  contexts?: ContextChunk[];
  timestamp: Date;
};

export type ProviderSelection = {
  llm: { provider: string; model: string };
  embedding: { provider: string; model: string };
};

export type RagSelection = {
  retrieval_strategy: string;
  top_k: number;
  score_threshold?: number | null;
  fetch_k?: number | null;
  lambda_mult?: number | null;
  chunking_method?: string | null;
  vector_backend: string;
};

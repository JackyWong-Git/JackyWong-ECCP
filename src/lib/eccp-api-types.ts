export interface KnowledgeBaseApiItem {
  id: string;
  name: string;
  description: string;
  document_count: number;
  chunk_count: number;
  embedding_model: string;
  status: 'ready' | 'indexing' | 'error';
  size_bytes: number;
  updated_at: string;
}

export interface DocumentApiItem {
  id: string;
  knowledge_base_id: string;
  name: string;
  content_type: string;
  size_bytes: number;
  status: 'queued' | 'processing' | 'processed' | 'error';
  chunk_count: number;
  error_message: string;
  created_at: string;
}

export interface SearchApiItem {
  chunk_id: string;
  document_id: string;
  document_name: string;
  content: string;
  score: number;
  ordinal: number;
}

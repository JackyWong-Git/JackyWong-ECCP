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
  concept_id: string;
  document_metadata: Record<string, unknown>;
  created_at: string;
}

export interface OkfConceptApiItem {
  id: string;
  title: string;
  type: string;
  description: string;
  tags: string[];
  trust: 'unverified' | 'machine-confirmed' | 'human-reviewed';
  status: string;
  links: string[];
  document_id: string;
}

export interface OkfGraphApiItem {
  okf_version: string;
  concepts: OkfConceptApiItem[];
  edges: Array<{ source: string; target: string }>;
  trust_counts: Record<string, number>;
}

export interface SearchApiItem {
  chunk_id: string;
  document_id: string;
  document_name: string;
  content: string;
  score: number;
  ordinal: number;
}

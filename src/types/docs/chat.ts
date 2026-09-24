export type DocsChatRole = "user" | "assistant";

export interface DocsChatApiMessage {
  role: DocsChatRole;
  content: string;
}

export interface DocsChatRagSource {
  chunk_id: string;
  document_id: string;
  filename: string;
  page: number | null;
  section: string | null;
  score: number;
  excerpt: string;
}

export interface DocsChatRagMetrics {
  grounding_status: string;
  context_trimmed: boolean;
}

export interface DocsChatCompletionResponse {
  choices?: Array<{
    message?: {
      role?: string;
      content?: string;
    };
  }>;
  rag_sources?: DocsChatRagSource[];
  rag_metrics?: DocsChatRagMetrics;
}

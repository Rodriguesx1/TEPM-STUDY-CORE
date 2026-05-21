export type UserRole = "user" | "admin";
export type LicenseStatus = "active" | "trial" | "expired" | "blocked" | "lifetime";
export type DocumentStatus = "uploaded" | "processing" | "processed" | "failed";

export type Profile = {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  created_at: string;
};

export type License = {
  id: string;
  user_id: string;
  plan_id: string | null;
  invite_code: string | null;
  status: LicenseStatus;
  starts_at: string;
  expires_at: string | null;
  created_by: string | null;
  created_at: string;
};

export type DocumentRecord = {
  id: string;
  user_id: string;
  title: string;
  file_path: string | null;
  file_url?: string | null;
  file_name?: string | null;
  file_size?: number | null;
  mime_type: string;
  status: DocumentStatus;
  summary: string | null;
  theme: string | null;
  themes?: string[] | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at?: string;
};

export type DocumentChunk = {
  id: string;
  user_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type DocumentWithChunks = DocumentRecord & {
  chunks: DocumentChunk[];
};

export type RagSource = {
  source_type?: "document" | "video" | "note";
  document_id: string;
  document_title: string;
  chunk_id: string;
  chunk_index: number;
  similarity: number | null;
  excerpt: string;
  start_seconds?: number | null;
  end_seconds?: number | null;
};

export type AiChat = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
};

export type AiMessage = {
  id: string;
  chat_id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  sources: RagSource[];
  created_at: string;
};

export type VideoRecord = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  file_path: string | null;
  file_name: string | null;
  file_size: number | null;
  mime_type: string | null;
  duration_seconds: number | null;
  status: DocumentStatus;
  transcript_status: string;
  summary: string | null;
  topics: unknown[];
  fixation_questions: unknown[];
  created_at: string;
  updated_at?: string;
};

export type VideoChunk = {
  id: string;
  user_id: string;
  video_id: string;
  chunk_index: number;
  start_seconds: number | null;
  end_seconds: number | null;
  content: string;
  token_count: number;
  created_at: string;
};

export type SlideProject = {
  id: string;
  user_id: string;
  title: string;
  source_type: string | null;
  source_id: string | null;
  theme: Record<string, unknown>;
  slides: unknown[];
  markdown: string | null;
  created_at: string;
  updated_at?: string;
};

export type SlidePage = {
  id: string;
  user_id: string;
  project_id: string;
  page_index: number;
  title: string;
  body: string;
  speaker_notes: string | null;
  layout: string;
  created_at: string;
};

export type ChatRoom = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  access_code: string;
  is_locked: boolean;
  created_at: string;
};

export type RoomMessage = {
  id: string;
  user_id: string;
  room_id: string;
  body: string;
  created_at: string;
};

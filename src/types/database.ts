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

export type StudyEvent = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  event_type: "study" | "review" | "weekly_goal" | "therapy_session" | "license_alert";
  starts_at: string;
  ends_at: string | null;
  status: "scheduled" | "completed" | "cancelled";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type StudyTask = {
  id: string;
  user_id: string;
  event_id: string | null;
  document_id: string | null;
  video_id: string | null;
  title: string;
  description: string | null;
  task_type: "study" | "review" | "goal" | "therapy_session" | "automation";
  priority: "low" | "medium" | "high";
  due_at: string | null;
  status: "pending" | "completed" | "cancelled";
  completed_at: string | null;
  points_awarded: number;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type StudyGoal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  target_count: number;
  current_count: number;
  period_start: string;
  period_end: string;
  status: "active" | "completed" | "paused" | "cancelled";
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
};

export type UserPoints = {
  user_id: string;
  total_points: number;
  level: number;
  updated_at: string;
};

export type BillingPlan = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cents: number;
  currency: string;
  interval: "free" | "month" | "year" | "lifetime";
  features: string[];
  limits: Record<string, number>;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at?: string;
};

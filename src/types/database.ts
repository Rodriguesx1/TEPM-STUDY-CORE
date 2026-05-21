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
  mime_type: string;
  status: DocumentStatus;
  summary: string | null;
  theme: string | null;
  created_at: string;
};

export type DocumentChunk = {
  id: string;
  user_id: string;
  document_id: string;
  chunk_index: number;
  content: string;
  token_count: number;
  created_at: string;
};

export type DocumentWithChunks = DocumentRecord & {
  chunks: DocumentChunk[];
};

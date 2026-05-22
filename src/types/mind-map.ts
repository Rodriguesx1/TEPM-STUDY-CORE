export type MindMapRecord = {
  id: string;
  user_id: string;
  document_id?: string | null;
  title: string;
  map_json?: unknown;
  nodes?: unknown;
  edges?: unknown;
  markdown: string | null;
  created_at: string;
  documents?: {
    title: string | null;
    theme: string | null;
  } | null;
};

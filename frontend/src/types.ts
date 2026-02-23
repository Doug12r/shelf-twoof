export interface Household {
  id: string;
  name: string;
  invite_code: string | null;
  user_a_id: string;
  user_b_id: string | null;
  anniversary: string | null;
  created_at: string;
}

export interface Photo {
  id: string;
  filename: string;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  uploaded_at: string;
}

export interface Memory {
  id: string;
  created_by: string;
  title: string;
  content: string | null;
  memory_date: string;
  location: string | null;
  mood: string | null;
  tags: string[];
  pinned: boolean;
  photos: Photo[];
  created_at: string;
}

export interface MemoryListResponse {
  memories: Memory[];
  total: number;
  page: number;
  per_page: number;
}

export interface DateIdea {
  id: string;
  created_by: string;
  title: string;
  description: string | null;
  category: string | null;
  estimated_cost: string | null;
  location: string | null;
  url: string | null;
  done: boolean;
  done_date: string | null;
  priority: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string | null;
  milestone_date: string;
  recurring: boolean;
  icon: string | null;
  days_until: number | null;
  created_at: string;
}

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  memory_date: string;
  location: string | null;
}

import type {
  Household,
  Memory,
  MemoryListResponse,
  Photo,
  DateIdea,
  Milestone,
  SearchResult,
} from "./types";

const BASE = "/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...init?.headers },
    ...init,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Household
export const getHousehold = () => request<Household>("/household");
export const createHousehold = (name?: string, anniversary?: string) =>
  request<Household>("/household", {
    method: "POST",
    body: JSON.stringify({ name: name || "Us", anniversary }),
  });
export const joinHousehold = (invite_code: string) =>
  request<Household>("/household/join", {
    method: "POST",
    body: JSON.stringify({ invite_code }),
  });
export const updateHousehold = (data: { name?: string; anniversary?: string }) =>
  request<Household>("/household", {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const regenerateInvite = () =>
  request<Household>("/household/regenerate-invite", { method: "POST" });

// Memories
export const getMemories = (params?: {
  page?: number;
  per_page?: number;
  year?: number;
  month?: number;
  tag?: string;
  pinned?: boolean;
}) => {
  const qs = new URLSearchParams();
  if (params?.page) qs.set("page", String(params.page));
  if (params?.per_page) qs.set("per_page", String(params.per_page));
  if (params?.year) qs.set("year", String(params.year));
  if (params?.month) qs.set("month", String(params.month));
  if (params?.tag) qs.set("tag", params.tag);
  if (params?.pinned !== undefined) qs.set("pinned", String(params.pinned));
  return request<MemoryListResponse>(`/memories?${qs}`);
};
export const getMemory = (id: string) => request<Memory>(`/memories/${id}`);
export const createMemory = (data: {
  title: string;
  content?: string;
  memory_date: string;
  location?: string;
  mood?: string;
  tags?: string[];
  pinned?: boolean;
}) =>
  request<Memory>("/memories", { method: "POST", body: JSON.stringify(data) });
export const updateMemory = (id: string, data: Record<string, unknown>) =>
  request<Memory>(`/memories/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteMemory = (id: string) =>
  request<void>(`/memories/${id}`, { method: "DELETE" });

// Photos
export const uploadPhotos = async (memoryId: string, files: File[]): Promise<Photo[]> => {
  const form = new FormData();
  files.forEach((f) => form.append("files", f));
  const res = await fetch(`${BASE}/memories/${memoryId}/photos`, {
    method: "POST",
    credentials: "include",
    body: form,
  });
  if (res.status === 401) {
    window.location.href = "/login";
    throw new Error("Session expired");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Upload failed");
  }
  return res.json();
};
export const deletePhoto = (id: string) =>
  request<void>(`/photos/${id}`, { method: "DELETE" });
export const photoUrl = (id: string) => `${BASE}/photos/${id}/file`;

// Date Ideas
export const getDateIdeas = (params?: {
  category?: string;
  done?: boolean;
  priority?: number;
}) => {
  const qs = new URLSearchParams();
  if (params?.category) qs.set("category", params.category);
  if (params?.done !== undefined) qs.set("done", String(params.done));
  if (params?.priority !== undefined) qs.set("priority", String(params.priority));
  return request<DateIdea[]>(`/dates?${qs}`);
};
export const createDateIdea = (data: {
  title: string;
  description?: string;
  category?: string;
  estimated_cost?: string;
  location?: string;
  url?: string;
  priority?: number;
}) =>
  request<DateIdea>("/dates", { method: "POST", body: JSON.stringify(data) });
export const updateDateIdea = (id: string, data: Record<string, unknown>) =>
  request<DateIdea>(`/dates/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteDateIdea = (id: string) =>
  request<void>(`/dates/${id}`, { method: "DELETE" });
export const toggleDateDone = (id: string) =>
  request<DateIdea>(`/dates/${id}/done`, { method: "PATCH" });

// Milestones
export const getMilestones = () => request<Milestone[]>("/milestones");
export const createMilestone = (data: {
  title: string;
  description?: string;
  milestone_date: string;
  recurring?: boolean;
  icon?: string;
}) =>
  request<Milestone>("/milestones", {
    method: "POST",
    body: JSON.stringify(data),
  });
export const updateMilestone = (id: string, data: Record<string, unknown>) =>
  request<Milestone>(`/milestones/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
export const deleteMilestone = (id: string) =>
  request<void>(`/milestones/${id}`, { method: "DELETE" });

// Search
export const search = (q: string) =>
  request<SearchResult[]>(`/search?q=${encodeURIComponent(q)}`);

// Export
export const exportData = () => {
  window.open(`${BASE}/export`, "_blank");
};

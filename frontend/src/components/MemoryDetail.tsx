import { useState, useEffect } from "react";
import type { Memory } from "../types";
import * as api from "../api";
import PhotoGallery from "./PhotoGallery";

interface Props {
  memoryId: string;
  onBack: () => void;
  onEdit: (m: Memory) => void;
  onDeleted: () => void;
  showToast?: (message: string, type?: "success" | "error") => void;
}

export default function MemoryDetail({ memoryId, onBack, onEdit, onDeleted, showToast }: Props) {
  const [memory, setMemory] = useState<Memory | null>(null);

  useEffect(() => {
    api.getMemory(memoryId).then(setMemory).catch(() => {});
  }, [memoryId]);

  if (!memory) {
    return (
      <div className="text-center py-12 animate-fadeIn">
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 mx-auto mb-3 animate-pulse" />
        <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
      </div>
    );
  }

  const handleDelete = async () => {
    if (!confirm("Delete this memory and all its photos?")) return;
    await api.deleteMemory(memory.id);
    showToast?.("Memory deleted");
    onDeleted();
  };

  const handleDeletePhoto = async (photoId: string) => {
    await api.deletePhoto(photoId);
    setMemory({
      ...memory,
      photos: memory.photos.filter((p) => p.id !== photoId),
    });
    showToast?.("Photo removed");
  };

  return (
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <button
        onClick={onBack}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 apple-button font-medium mb-6"
      >
        &larr; Back to timeline
      </button>

      {/* Header */}
      <div className="apple-card rounded-2xl shadow-md p-6 card-enter mb-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {memory.mood && <span className="text-2xl">{memory.mood}</span>}
              <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{memory.title}</h2>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-slate-500 dark:text-slate-400">{memory.memory_date}</span>
              {memory.location && (
                <>
                  <span className="text-slate-300 dark:text-slate-600">&middot;</span>
                  <span className="text-sm text-slate-500 dark:text-slate-400">{memory.location}</span>
                </>
              )}
              {memory.pinned && (
                <span className="text-xs bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full">
                  Pinned
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onEdit(memory)}
              className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium apple-button"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Photos */}
      <PhotoGallery photos={memory.photos} onDelete={handleDeletePhoto} />

      {/* Content */}
      {memory.content && (
        <div className="apple-card rounded-2xl shadow-md p-6 card-enter mt-4">
          <div className="text-gray-800 dark:text-gray-100 leading-relaxed whitespace-pre-wrap">
            {memory.content}
          </div>
        </div>
      )}

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex gap-1.5 mt-4 flex-wrap">
          {memory.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

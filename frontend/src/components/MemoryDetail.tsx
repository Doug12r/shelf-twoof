import { useState, useEffect } from "react";
import type { Memory } from "../types";
import * as api from "../api";
import PhotoGallery from "./PhotoGallery";

interface Props {
  memoryId: string;
  onBack: () => void;
  onEdit: (m: Memory) => void;
  onDeleted: () => void;
}

export default function MemoryDetail({ memoryId, onBack, onEdit, onDeleted }: Props) {
  const [memory, setMemory] = useState<Memory | null>(null);

  useEffect(() => {
    api.getMemory(memoryId).then(setMemory).catch(() => {});
  }, [memoryId]);

  if (!memory) {
    return <p className="text-stone-500 text-center py-12">Loading...</p>;
  }

  const handleDelete = async () => {
    if (!confirm("Delete this memory and all its photos?")) return;
    await api.deleteMemory(memory.id);
    onDeleted();
  };

  const handleDeletePhoto = async (photoId: string) => {
    await api.deletePhoto(photoId);
    setMemory({
      ...memory,
      photos: memory.photos.filter((p) => p.id !== photoId),
    });
  };

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={onBack} className="text-sm text-stone-500 hover:text-stone-300 mb-6">
        &larr; Back to timeline
      </button>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              {memory.mood && <span className="text-2xl">{memory.mood}</span>}
              <h2 className="text-2xl font-bold text-stone-100">{memory.title}</h2>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-sm text-stone-400">{memory.memory_date}</span>
              {memory.location && (
                <>
                  <span className="text-stone-600">&middot;</span>
                  <span className="text-sm text-stone-400">{memory.location}</span>
                </>
              )}
              {memory.pinned && (
                <span className="text-xs bg-rose-500/20 text-rose-400 px-2 py-0.5 rounded-full">
                  Pinned
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => onEdit(memory)}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 hover:bg-stone-700 transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="text-xs px-3 py-1.5 rounded-lg bg-stone-800 text-red-400 hover:bg-stone-700 transition-colors"
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
        <div className="mt-6 text-stone-300 leading-relaxed whitespace-pre-wrap">
          {memory.content}
        </div>
      )}

      {/* Tags */}
      {memory.tags.length > 0 && (
        <div className="flex gap-1.5 mt-6 flex-wrap">
          {memory.tags.map((t) => (
            <span
              key={t}
              className="text-xs px-2.5 py-1 rounded-full bg-stone-800 text-stone-400"
            >
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

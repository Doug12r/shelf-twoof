import { useState, useRef } from "react";
import type { Memory } from "../types";
import * as api from "../api";

interface Props {
  memory: Memory | null;
  onSaved: (m: Memory) => void;
  onCancel: () => void;
}

const MOODS = ["", "💛", "🥰", "🎉", "😊", "🌅", "✨", "🏖️", "🍽️", "🎬", "🥂", "😌", "🤗"];

export default function MemoryEditor({ memory, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(memory?.title || "");
  const [content, setContent] = useState(memory?.content || "");
  const [memoryDate, setMemoryDate] = useState(
    memory?.memory_date || new Date().toISOString().slice(0, 10)
  );
  const [location, setLocation] = useState(memory?.location || "");
  const [mood, setMood] = useState(memory?.mood || "");
  const [tagsStr, setTagsStr] = useState((memory?.tags || []).join(", "));
  const [pinned, setPinned] = useState(memory?.pinned || false);
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Give this memory a title");
      return;
    }
    setSaving(true);
    setError("");
    const tags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    try {
      let saved: Memory;
      if (memory) {
        saved = await api.updateMemory(memory.id, {
          title: title.trim(),
          content: content || null,
          memory_date: memoryDate,
          location: location || null,
          mood: mood || null,
          tags,
          pinned,
        });
      } else {
        saved = await api.createMemory({
          title: title.trim(),
          content: content || undefined,
          memory_date: memoryDate,
          location: location || undefined,
          mood: mood || undefined,
          tags,
          pinned,
        });
      }
      // Upload photos if any
      if (files.length > 0) {
        await api.uploadPhotos(saved.id, files);
        saved = await api.getMemory(saved.id);
      }
      onSaved(saved);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-stone-100">
          {memory ? "Edit Memory" : "New Memory"}
        </h2>
        <button onClick={onCancel} className="text-sm text-stone-500 hover:text-stone-300">
          Cancel
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm text-stone-400 mb-1.5">What happened?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Our first trip to..."
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50 text-lg"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">When</label>
            <input
              type="date"
              value={memoryDate}
              onChange={(e) => setMemoryDate(e.target.value)}
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Where</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Paris, the park, home..."
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-1.5">The story</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            placeholder="Tell the story of this memory..."
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-3 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50 leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-2">Mood</label>
          <div className="flex gap-1.5 flex-wrap">
            {MOODS.map((m) => (
              <button
                key={m || "none"}
                onClick={() => setMood(m)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all ${
                  mood === m
                    ? "bg-rose-600/30 ring-2 ring-rose-500 scale-110"
                    : "bg-stone-800 hover:bg-stone-700"
                }`}
              >
                {m || <span className="text-xs text-stone-500">-</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Photo upload */}
        <div>
          <label className="block text-sm text-stone-400 mb-2">Photos</label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <div
                key={i}
                className="relative w-20 h-20 rounded-xl overflow-hidden bg-stone-800 group"
              >
                <img
                  src={URL.createObjectURL(f)}
                  alt=""
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => removeFile(i)}
                  className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 rounded-xl border-2 border-dashed border-stone-700 text-stone-500 hover:border-rose-500/50 hover:text-rose-400 flex items-center justify-center text-2xl transition-colors"
            >
              +
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">
              Tags <span className="text-stone-600">(comma separated)</span>
            </label>
            <input
              type="text"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="travel, anniversary"
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setPinned(!pinned)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pinned
                  ? "bg-rose-600/20 text-rose-400 border border-rose-500/40"
                  : "bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700"
              }`}
            >
              {pinned ? "Pinned" : "Pin this memory"}
            </button>
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {saving ? "Saving..." : memory ? "Update Memory" : "Save Memory"}
        </button>
      </div>
    </div>
  );
}

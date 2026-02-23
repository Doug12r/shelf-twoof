import { useState, useRef } from "react";
import type { Memory } from "../types";
import * as api from "../api";

interface Props {
  memory: Memory | null;
  onSaved: (m: Memory) => void;
  onCancel: () => void;
  showToast?: (message: string, type?: "success" | "error") => void;
}

const MOODS = ["", "\uD83D\uDC9B", "\uD83E\uDD70", "\uD83C\uDF89", "\uD83D\uDE0A", "\uD83C\uDF05", "\u2728", "\uD83C\uDFD6\uFE0F", "\uD83C\uDF7D\uFE0F", "\uD83C\uDFAC", "\uD83E\uDD42", "\uD83D\uDE0C", "\uD83E\uDD17"];

export default function MemoryEditor({ memory, onSaved, onCancel, showToast }: Props) {
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
      showToast?.(memory ? "Memory updated" : "Memory saved");
      onSaved(saved);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
      showToast?.(msg, "error");
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
    <div className="max-w-2xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {memory ? "Edit Memory" : "New Memory"}
        </h2>
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 apple-button font-medium"
        >
          Cancel
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}

      <div className="apple-card rounded-2xl shadow-md p-6 card-enter">
        <div className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">What happened?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Our first trip to..."
              className="modern-input w-full text-lg"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">When</label>
              <input
                type="date"
                value={memoryDate}
                onChange={(e) => setMemoryDate(e.target.value)}
                className="modern-input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Where</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Paris, the park, home..."
                className="modern-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">The story</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Tell the story of this memory..."
              className="modern-input w-full leading-relaxed"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Mood</label>
            <div className="flex gap-1.5 flex-wrap">
              {MOODS.map((m) => (
                <button
                  key={m || "none"}
                  onClick={() => setMood(m)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-lg transition-all apple-button ${
                    mood === m
                      ? "bg-rose-100 dark:bg-rose-900/30 ring-2 ring-rose-500 scale-110"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {m || <span className="text-xs text-slate-400 dark:text-slate-500">-</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Photo upload */}
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Photos</label>
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
                  className="relative w-20 h-20 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 group"
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
                className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 text-slate-400 dark:text-slate-500 hover:border-rose-500 hover:text-rose-500 flex items-center justify-center text-2xl transition-colors apple-button"
              >
                +
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">
                Tags <span className="text-slate-400 dark:text-slate-500">(comma separated)</span>
              </label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="travel, anniversary"
                className="modern-input w-full"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setPinned(!pinned)}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors apple-button ${
                  pinned
                    ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm"
                    : "apple-card text-slate-500 dark:text-slate-400 shadow-sm"
                }`}
              >
                {pinned ? "Pinned" : "Pin this memory"}
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : memory ? "Update Memory" : "Save Memory"}
          </button>
        </div>
      </div>
    </div>
  );
}

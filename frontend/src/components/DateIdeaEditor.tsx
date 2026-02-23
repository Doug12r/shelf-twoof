import { useState } from "react";
import type { DateIdea } from "../types";
import * as api from "../api";

interface Props {
  idea: DateIdea | null;
  onSaved: () => void;
  onCancel: () => void;
  showToast?: (message: string, type?: "success" | "error") => void;
}

export default function DateIdeaEditor({ idea, onSaved, onCancel, showToast }: Props) {
  const [title, setTitle] = useState(idea?.title || "");
  const [description, setDescription] = useState(idea?.description || "");
  const [category, setCategory] = useState(idea?.category || "");
  const [estimatedCost, setEstimatedCost] = useState(idea?.estimated_cost || "");
  const [location, setLocation] = useState(idea?.location || "");
  const [url, setUrl] = useState(idea?.url || "");
  const [priority, setPriority] = useState(idea?.priority || 0);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Give this idea a name");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (idea) {
        await api.updateDateIdea(idea.id, {
          title: title.trim(),
          description: description || null,
          category: category || null,
          estimated_cost: estimatedCost || null,
          location: location || null,
          url: url || null,
          priority,
        });
      } else {
        await api.createDateIdea({
          title: title.trim(),
          description: description || undefined,
          category: category || undefined,
          estimated_cost: estimatedCost || undefined,
          location: location || undefined,
          url: url || undefined,
          priority,
        });
      }
      showToast?.(idea ? "Date idea updated" : "Date idea added");
      onSaved();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Failed to save";
      setError(msg);
      showToast?.(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
          {idea ? "Edit Date Idea" : "New Date Idea"}
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
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">What's the idea?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Sunset hike, cooking class, road trip..."
              className="modern-input w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Notes, links, inspiration..."
              className="modern-input w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="modern-input w-full"
              >
                <option value="">None</option>
                <option value="restaurant">Restaurant</option>
                <option value="outdoors">Outdoors</option>
                <option value="travel">Travel</option>
                <option value="home">At Home</option>
                <option value="entertainment">Entertainment</option>
                <option value="creative">Creative</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Est. Cost</label>
              <input
                type="text"
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="$, $$, $$$"
                className="modern-input w-full"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Location</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Optional"
                className="modern-input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Link</label>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                className="modern-input w-full"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Priority</label>
            <div className="flex gap-2">
              {[
                { v: 0, label: "None" },
                { v: 1, label: "Nice to do" },
                { v: 2, label: "Want to" },
                { v: 3, label: "Must do!" },
              ].map((opt) => (
                <button
                  key={opt.v}
                  onClick={() => setPriority(opt.v)}
                  className={`flex-1 px-3 py-2 rounded-full text-sm font-medium apple-button transition-colors ${
                    priority === opt.v
                      ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm"
                      : "apple-card text-slate-500 dark:text-slate-400 shadow-sm"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : idea ? "Update" : "Add to Wishlist"}
          </button>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { DateIdea } from "../types";
import * as api from "../api";

interface Props {
  idea: DateIdea | null;
  onSaved: () => void;
  onCancel: () => void;
}

export default function DateIdeaEditor({ idea, onSaved, onCancel }: Props) {
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
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-stone-100">
          {idea ? "Edit Date Idea" : "New Date Idea"}
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

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-stone-400 mb-1.5">What's the idea?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Sunset hike, cooking class, road trip..."
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-1.5">Details</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Notes, links, inspiration..."
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 focus:outline-none focus:border-rose-500/50"
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
            <label className="block text-sm text-stone-400 mb-1.5">Est. Cost</label>
            <input
              type="text"
              value={estimatedCost}
              onChange={(e) => setEstimatedCost(e.target.value)}
              placeholder="$, $$, $$$"
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Optional"
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Link</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-2">Priority</label>
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
                className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  priority === opt.v
                    ? "bg-rose-600 text-white"
                    : "bg-stone-800 text-stone-400 hover:bg-stone-700"
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
          className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {saving ? "Saving..." : idea ? "Update" : "Add to Wishlist"}
        </button>
      </div>
    </div>
  );
}

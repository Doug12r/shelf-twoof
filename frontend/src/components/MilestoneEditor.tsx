import { useState } from "react";
import type { Milestone } from "../types";
import * as api from "../api";

interface Props {
  milestone: Milestone | null;
  onSaved: () => void;
  onCancel: () => void;
}

const ICONS = ["📌", "💍", "🎂", "🏠", "✈️", "🎓", "💝", "🌟", "🎉", "👶", "🐾", "📅"];

export default function MilestoneEditor({ milestone, onSaved, onCancel }: Props) {
  const [title, setTitle] = useState(milestone?.title || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [milestoneDate, setMilestoneDate] = useState(
    milestone?.milestone_date || new Date().toISOString().slice(0, 10)
  );
  const [recurring, setRecurring] = useState(milestone?.recurring || false);
  const [icon, setIcon] = useState(milestone?.icon || "📌");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      setError("Give this milestone a name");
      return;
    }
    setSaving(true);
    setError("");
    try {
      if (milestone) {
        await api.updateMilestone(milestone.id, {
          title: title.trim(),
          description: description || null,
          milestone_date: milestoneDate,
          recurring,
          icon,
        });
      } else {
        await api.createMilestone({
          title: title.trim(),
          description: description || undefined,
          milestone_date: milestoneDate,
          recurring,
          icon,
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
          {milestone ? "Edit Milestone" : "New Milestone"}
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
          <label className="block text-sm text-stone-400 mb-2">Icon</label>
          <div className="flex gap-1.5 flex-wrap">
            {ICONS.map((ic) => (
              <button
                key={ic}
                onClick={() => setIcon(ic)}
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all ${
                  icon === ic
                    ? "bg-rose-600/30 ring-2 ring-rose-500 scale-110"
                    : "bg-stone-800 hover:bg-stone-700"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-1.5">What's the milestone?</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="First date, anniversary, moved in together..."
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-1.5">Date</label>
          <input
            type="date"
            value={milestoneDate}
            onChange={(e) => setMilestoneDate(e.target.value)}
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <div>
          <label className="block text-sm text-stone-400 mb-1.5">Notes</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Optional details..."
            className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-600 focus:outline-none focus:border-rose-500/50"
          />
        </div>

        <button
          onClick={() => setRecurring(!recurring)}
          className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
            recurring
              ? "bg-rose-600/20 text-rose-400 border border-rose-500/40"
              : "bg-stone-800 text-stone-400 border border-stone-700 hover:bg-stone-700"
          }`}
        >
          {recurring ? "Repeats yearly (click to toggle)" : "Make this repeat yearly"}
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors"
        >
          {saving ? "Saving..." : milestone ? "Update" : "Add Milestone"}
        </button>
      </div>
    </div>
  );
}

import { useState } from "react";
import type { Milestone } from "../types";
import * as api from "../api";

interface Props {
  milestone: Milestone | null;
  onSaved: () => void;
  onCancel: () => void;
  showToast?: (message: string, type?: "success" | "error") => void;
}

const ICONS = ["\uD83D\uDCCC", "\uD83D\uDC8D", "\uD83C\uDF82", "\uD83C\uDFE0", "\u2708\uFE0F", "\uD83C\uDF93", "\uD83D\uDC9D", "\uD83C\uDF1F", "\uD83C\uDF89", "\uD83D\uDC76", "\uD83D\uDC3E", "\uD83D\uDCC5"];

export default function MilestoneEditor({ milestone, onSaved, onCancel, showToast }: Props) {
  const [title, setTitle] = useState(milestone?.title || "");
  const [description, setDescription] = useState(milestone?.description || "");
  const [milestoneDate, setMilestoneDate] = useState(
    milestone?.milestone_date || new Date().toISOString().slice(0, 10)
  );
  const [recurring, setRecurring] = useState(milestone?.recurring || false);
  const [icon, setIcon] = useState(milestone?.icon || "\uD83D\uDCCC");
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
      showToast?.(milestone ? "Milestone updated" : "Milestone added");
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
          {milestone ? "Edit Milestone" : "New Milestone"}
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
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">Icon</label>
            <div className="flex gap-1.5 flex-wrap">
              {ICONS.map((ic) => (
                <button
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-all apple-button ${
                    icon === ic
                      ? "bg-rose-100 dark:bg-rose-900/30 ring-2 ring-rose-500 scale-110"
                      : "bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  {ic}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">What's the milestone?</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="First date, anniversary, moved in together..."
              className="modern-input w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Date</label>
            <input
              type="date"
              value={milestoneDate}
              onChange={(e) => setMilestoneDate(e.target.value)}
              className="modern-input w-full"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Notes</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Optional details..."
              className="modern-input w-full"
            />
          </div>

          <button
            onClick={() => setRecurring(!recurring)}
            className={`w-full px-4 py-2.5 rounded-xl text-sm font-medium transition-colors text-left apple-button ${
              recurring
                ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-sm"
                : "apple-card text-slate-500 dark:text-slate-400 shadow-sm"
            }`}
          >
            {recurring ? "Repeats yearly (click to toggle)" : "Make this repeat yearly"}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm disabled:opacity-50"
          >
            {saving ? "Saving..." : milestone ? "Update" : "Add Milestone"}
          </button>
        </div>
      </div>
    </div>
  );
}

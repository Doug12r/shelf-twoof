import { useState, useEffect } from "react";
import type { Milestone } from "../types";
import * as api from "../api";
import MilestoneEditor from "./MilestoneEditor";

interface Props {}

export default function MilestoneList({}: Props) {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [showEditor, setShowEditor] = useState(false);
  const [editMilestone, setEditMilestone] = useState<Milestone | null>(null);

  const load = () => {
    api.getMilestones().then(setMilestones).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this milestone?")) return;
    await api.deleteMilestone(id);
    load();
  };

  if (showEditor || editMilestone) {
    return (
      <MilestoneEditor
        milestone={editMilestone}
        onSaved={() => {
          setShowEditor(false);
          setEditMilestone(null);
          load();
        }}
        onCancel={() => {
          setShowEditor(false);
          setEditMilestone(null);
        }}
      />
    );
  }

  const upcoming = milestones.filter((m) => m.days_until != null && m.days_until >= 0);
  const past = milestones.filter((m) => m.days_until == null || m.days_until < 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-stone-100">Milestones</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
        >
          + Add Milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-stone-400">No milestones yet.</p>
          <p className="text-stone-500 text-sm mt-1">Track the moments that matter most.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-400 mb-3">Upcoming</h3>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800/60"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{m.icon || "📌"}</span>
                        <div>
                          <p className="font-medium text-stone-200">{m.title}</p>
                          <p className="text-sm text-stone-500 mt-0.5">
                            {m.milestone_date}
                            {m.recurring && (
                              <span className="text-xs text-rose-400 ml-2">Repeats yearly</span>
                            )}
                          </p>
                          {m.description && (
                            <p className="text-sm text-stone-500 mt-1">{m.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {m.days_until === 0 ? (
                          <span className="text-lg font-bold text-rose-400">Today!</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-rose-400 tabular-nums">
                              {m.days_until}
                            </span>
                            <p className="text-xs text-stone-500">
                              day{m.days_until !== 1 ? "s" : ""}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 justify-end">
                      <button
                        onClick={() => setEditMilestone(m)}
                        className="text-xs px-2 py-1 rounded-lg bg-stone-800 text-stone-400 hover:bg-stone-700 transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="text-xs px-2 py-1 rounded-lg bg-stone-800 text-red-400 hover:bg-stone-700 transition-colors"
                      >
                        Del
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Past */}
          {past.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-stone-400 mb-3">Past</h3>
              <div className="space-y-2">
                {past.map((m) => (
                  <div
                    key={m.id}
                    className="p-4 rounded-2xl bg-stone-900/40 border border-stone-800/40"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.icon || "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-stone-400">{m.title}</p>
                        <p className="text-xs text-stone-600">{m.milestone_date}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditMilestone(m)}
                          className="text-xs px-2 py-1 rounded-lg bg-stone-800 text-stone-500 hover:bg-stone-700 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-stone-800 text-red-400/60 hover:bg-stone-700 transition-colors"
                        >
                          Del
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

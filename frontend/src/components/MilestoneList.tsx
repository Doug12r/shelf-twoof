import { useState, useEffect } from "react";
import type { Milestone } from "../types";
import * as api from "../api";
import MilestoneEditor from "./MilestoneEditor";

interface Props {
  showToast?: (message: string, type?: "success" | "error") => void;
}

export default function MilestoneList({ showToast }: Props) {
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
    showToast?.("Milestone deleted");
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
        showToast={showToast}
      />
    );
  }

  const upcoming = milestones.filter((m) => m.days_until != null && m.days_until >= 0);
  const past = milestones.filter((m) => m.days_until == null || m.days_until < 0);

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Milestones</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm text-sm"
        >
          + Add Milestone
        </button>
      </div>

      {milestones.length === 0 ? (
        <div className="apple-card rounded-2xl shadow-md p-12 text-center card-enter">
          <p className="text-4xl mb-3">🎯</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">No milestones yet.</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Track the moments that matter most.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Upcoming</h3>
              <div className="space-y-2">
                {upcoming.map((m) => (
                  <div
                    key={m.id}
                    className="apple-card rounded-2xl shadow-md p-4 card-enter"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{m.icon || "\uD83D\uDCCC"}</span>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-gray-100">{m.title}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                            {m.milestone_date}
                            {m.recurring && (
                              <span className="text-xs text-rose-600 dark:text-rose-400 ml-2">Repeats yearly</span>
                            )}
                          </p>
                          {m.description && (
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{m.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {m.days_until === 0 ? (
                          <span className="text-lg font-bold text-rose-600 dark:text-rose-400">Today!</span>
                        ) : (
                          <>
                            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                              {m.days_until}
                            </span>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              day{m.days_until !== 1 ? "s" : ""}
                            </p>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 mt-2 justify-end">
                      <button
                        onClick={() => setEditMilestone(m)}
                        className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm text-xs"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium apple-button text-xs"
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
              <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Past</h3>
              <div className="space-y-2">
                {past.map((m) => (
                  <div
                    key={m.id}
                    className="apple-card rounded-2xl shadow-md p-4 card-enter opacity-70"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{m.icon || "\uD83D\uDCCC"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-800 dark:text-gray-100">{m.title}</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500">{m.milestone_date}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <button
                          onClick={() => setEditMilestone(m)}
                          className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm text-xs"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(m.id)}
                          className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium apple-button text-xs"
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

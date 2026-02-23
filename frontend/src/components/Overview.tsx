import { useState, useEffect } from "react";
import type { Household, Milestone, Memory } from "../types";
import * as api from "../api";

interface Props {
  household: Household;
  onNavigate: (tab: string) => void;
}

export default function Overview({ household, onNavigate }: Props) {
  const [memoryCount, setMemoryCount] = useState(0);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [recent, setRecent] = useState<Memory[]>([]);

  useEffect(() => {
    api.getMemories({ per_page: 3 }).then((r) => {
      setMemoryCount(r.total);
      setRecent(r.memories);
    }).catch(() => {});
    api.getMilestones().then(setMilestones).catch(() => {});
  }, []);

  const upcoming = milestones.filter((m) => m.days_until != null && m.days_until >= 0).slice(0, 3);

  // Days together
  let daysTogether: number | null = null;
  if (household.anniversary) {
    const start = new Date(household.anniversary);
    const now = new Date();
    daysTogether = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  }

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Hero stats */}
      <div className="apple-card rounded-2xl shadow-md p-8 text-center card-enter bg-gradient-to-br from-rose-50 to-white dark:from-rose-950/30 dark:to-gray-900/80">
        <p className="text-5xl mb-2">💕</p>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">{household.name}</h2>
        {daysTogether != null && daysTogether >= 0 && (
          <div className="mt-4">
            <span className="text-4xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {daysTogether.toLocaleString()}
            </span>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">days together</p>
          </div>
        )}
        {!household.user_b_id && household.invite_code && (
          <div className="mt-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-500/20">
            <p className="text-sm text-rose-600 dark:text-rose-400">Share this code with your partner</p>
            <p className="text-2xl font-mono font-bold text-rose-600 dark:text-rose-400 mt-1 tracking-widest">
              {household.invite_code}
            </p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Memory count */}
        <button
          onClick={() => onNavigate("timeline")}
          className="apple-card rounded-2xl shadow-md p-5 text-left card-enter apple-button"
        >
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">{memoryCount}</span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            memor{memoryCount === 1 ? "y" : "ies"} saved
          </p>
        </button>

        {/* Milestones count */}
        <button
          onClick={() => onNavigate("milestones")}
          className="apple-card rounded-2xl shadow-md p-5 text-left card-enter apple-button"
        >
          <span className="text-3xl font-bold text-gray-800 dark:text-gray-100 tabular-nums">{milestones.length}</span>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">milestones tracked</p>
        </button>
      </div>

      {/* Upcoming milestones */}
      {upcoming.length > 0 && (
        <div className="apple-card rounded-2xl shadow-md p-5 card-enter">
          <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300 mb-3">Coming Up</h3>
          <div className="space-y-3">
            {upcoming.map((m) => (
              <div key={m.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{m.icon || "\uD83D\uDCCC"}</span>
                  <div>
                    <p className="text-sm text-gray-800 dark:text-gray-100">{m.title}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{m.milestone_date}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-rose-600 dark:text-rose-400 tabular-nums">
                  {m.days_until === 0 ? "Today!" : `${m.days_until}d`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent memories */}
      {recent.length > 0 && (
        <div className="apple-card rounded-2xl shadow-md p-5 card-enter">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-600 dark:text-slate-300">Recent Memories</h3>
            <button
              onClick={() => onNavigate("timeline")}
              className="text-xs text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 font-medium apple-button"
            >
              View all
            </button>
          </div>
          <div className="space-y-2">
            {recent.map((m) => (
              <div key={m.id} className="flex items-center gap-3">
                {m.photos.length > 0 ? (
                  <img
                    src={api.photoUrl(m.photos[0].id)}
                    alt=""
                    className="w-10 h-10 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center text-sm">
                    {m.mood || "\uD83D\uDCDD"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{m.title}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{m.memory_date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

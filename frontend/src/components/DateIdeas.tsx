import { useState, useEffect } from "react";
import type { DateIdea } from "../types";
import * as api from "../api";
import DateIdeaEditor from "./DateIdeaEditor";

interface Props {
  showToast?: (message: string, type?: "success" | "error") => void;
}

const CATEGORIES = [
  { value: "", label: "All" },
  { value: "restaurant", label: "Restaurant" },
  { value: "outdoors", label: "Outdoors" },
  { value: "travel", label: "Travel" },
  { value: "home", label: "At Home" },
  { value: "entertainment", label: "Entertainment" },
  { value: "creative", label: "Creative" },
];

const PRIORITY_LABELS: Record<number, string> = {
  0: "",
  1: "Nice to do",
  2: "Want to do",
  3: "Must do!",
};

export default function DateIdeas({ showToast }: Props) {
  const [ideas, setIdeas] = useState<DateIdea[]>([]);
  const [filter, setFilter] = useState<"all" | "todo" | "done">("todo");
  const [catFilter, setCatFilter] = useState("");
  const [showEditor, setShowEditor] = useState(false);
  const [editIdea, setEditIdea] = useState<DateIdea | null>(null);

  const load = () => {
    const params: { done?: boolean; category?: string } = {};
    if (filter === "todo") params.done = false;
    if (filter === "done") params.done = true;
    if (catFilter) params.category = catFilter;
    api.getDateIdeas(params).then(setIdeas).catch(() => {});
  };

  useEffect(() => {
    load();
  }, [filter, catFilter]);

  const handleToggle = async (id: string) => {
    await api.toggleDateDone(id);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this date idea?")) return;
    await api.deleteDateIdea(id);
    showToast?.("Date idea deleted");
    load();
  };

  if (showEditor || editIdea) {
    return (
      <DateIdeaEditor
        idea={editIdea}
        onSaved={() => {
          setShowEditor(false);
          setEditIdea(null);
          load();
        }}
        onCancel={() => {
          setShowEditor(false);
          setEditIdea(null);
        }}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Date Ideas</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm text-sm"
        >
          + Add Idea
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(["all", "todo", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={
              filter === f
                ? "bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-full px-4 py-2 text-sm font-medium apple-button shadow-sm"
                : "apple-card rounded-full px-4 py-2 text-sm font-medium text-slate-500 dark:text-slate-400 apple-button shadow-sm"
            }
          >
            {f === "all" ? "All" : f === "todo" ? "To Do" : "Done"}
          </button>
        ))}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="modern-input rounded-full px-4 py-2 text-sm"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {ideas.length === 0 ? (
        <div className="apple-card rounded-2xl shadow-md p-12 text-center card-enter">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">No date ideas yet.</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start building your wishlist together.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((d) => (
            <div
              key={d.id}
              className={`apple-card rounded-2xl shadow-md p-4 card-enter ${
                d.done ? "opacity-70" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(d.id)}
                  className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors apple-button ${
                    d.done
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-slate-300 dark:border-slate-600 hover:border-rose-500"
                  }`}
                >
                  {d.done && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${d.done ? "text-slate-400 dark:text-slate-500 line-through" : "text-gray-800 dark:text-gray-100"}`}>
                    {d.title}
                  </p>
                  {d.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{d.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {d.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                        {d.category}
                      </span>
                    )}
                    {d.estimated_cost && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{d.estimated_cost}</span>
                    )}
                    {d.location && (
                      <span className="text-xs text-slate-500 dark:text-slate-400">{d.location}</span>
                    )}
                    {d.priority > 0 && (
                      <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{PRIORITY_LABELS[d.priority]}</span>
                    )}
                    {d.done_date && (
                      <span className="text-xs text-slate-400 dark:text-slate-500">Done {d.done_date}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditIdea(d)}
                    className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm text-xs"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl px-4 py-2.5 text-sm font-medium apple-button text-xs"
                  >
                    Del
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

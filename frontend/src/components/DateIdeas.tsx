import { useState, useEffect } from "react";
import type { DateIdea } from "../types";
import * as api from "../api";
import DateIdeaEditor from "./DateIdeaEditor";

interface Props {}

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

export default function DateIdeas({}: Props) {
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
      />
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-stone-100">Date Ideas</h2>
        <button
          onClick={() => setShowEditor(true)}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
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
            className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
              filter === f
                ? "bg-rose-600/20 text-rose-400 border border-rose-500/40"
                : "bg-stone-800 text-stone-400 border border-stone-700/50 hover:bg-stone-700"
            }`}
          >
            {f === "all" ? "All" : f === "todo" ? "To Do" : "Done"}
          </button>
        ))}
        <select
          value={catFilter}
          onChange={(e) => setCatFilter(e.target.value)}
          className="rounded-xl bg-stone-800 border border-stone-700/50 px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-rose-500/40"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {ideas.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">💡</p>
          <p className="text-stone-400">No date ideas yet.</p>
          <p className="text-stone-500 text-sm mt-1">Start building your wishlist together.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {ideas.map((d) => (
            <div
              key={d.id}
              className={`p-4 rounded-2xl border transition-colors ${
                d.done
                  ? "bg-stone-900/40 border-stone-800/40"
                  : "bg-stone-900/80 border-stone-800/60 hover:border-stone-700/60"
              }`}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggle(d.id)}
                  className={`w-6 h-6 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center transition-colors ${
                    d.done
                      ? "border-rose-500 bg-rose-500 text-white"
                      : "border-stone-600 hover:border-rose-500"
                  }`}
                >
                  {d.done && (
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium ${d.done ? "text-stone-500 line-through" : "text-stone-200"}`}>
                    {d.title}
                  </p>
                  {d.description && (
                    <p className="text-sm text-stone-500 mt-0.5 line-clamp-2">{d.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {d.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-stone-800 text-stone-400">
                        {d.category}
                      </span>
                    )}
                    {d.estimated_cost && (
                      <span className="text-xs text-stone-500">{d.estimated_cost}</span>
                    )}
                    {d.location && (
                      <span className="text-xs text-stone-500">{d.location}</span>
                    )}
                    {d.priority > 0 && (
                      <span className="text-xs text-rose-400">{PRIORITY_LABELS[d.priority]}</span>
                    )}
                    {d.done_date && (
                      <span className="text-xs text-stone-600">Done {d.done_date}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => setEditIdea(d)}
                    className="text-xs px-2 py-1 rounded-lg bg-stone-800 text-stone-400 hover:bg-stone-700 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="text-xs px-2 py-1 rounded-lg bg-stone-800 text-red-400 hover:bg-stone-700 transition-colors"
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

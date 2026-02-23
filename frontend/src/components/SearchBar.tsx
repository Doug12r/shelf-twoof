import { useState } from "react";
import type { SearchResult } from "../types";
import * as api from "../api";

interface Props {
  onSelect: (memoryId: string) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);

  const doSearch = async (q: string) => {
    setQuery(q);
    if (q.length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }
    try {
      const r = await api.search(q);
      setResults(r);
      setOpen(true);
    } catch {
      setResults([]);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => doSearch(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 200)}
        placeholder="Search memories..."
        className="modern-input w-full"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 apple-card rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto border border-white/20 dark:border-white/10">
          {results.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => {
                onSelect(r.id);
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors border-b border-slate-100 dark:border-slate-800 last:border-b-0 apple-button"
            >
              <p className="text-sm text-gray-800 dark:text-gray-100 font-medium">{r.title}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {r.memory_date}{r.location ? ` \u00b7 ${r.location}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

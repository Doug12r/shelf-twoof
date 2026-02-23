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
        className="w-full rounded-xl bg-stone-800/60 border border-stone-700/50 px-4 py-2.5 text-sm text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-500/40"
      />
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-stone-800 border border-stone-700 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto">
          {results.map((r) => (
            <button
              key={r.id}
              onMouseDown={() => {
                onSelect(r.id);
                setOpen(false);
                setQuery("");
                setResults([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-stone-700/50 transition-colors border-b border-stone-700/30 last:border-b-0"
            >
              <p className="text-sm text-stone-200 font-medium">{r.title}</p>
              <p className="text-xs text-stone-500 mt-0.5">
                {r.memory_date}{r.location ? ` \u00b7 ${r.location}` : ""}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

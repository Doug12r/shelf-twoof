import { useState, useEffect } from "react";
import type { Memory } from "../types";
import * as api from "../api";
import MemoryCard from "./MemoryCard";

interface Props {
  onSelect: (memory: Memory) => void;
  onAdd: () => void;
}

export default function Timeline({ onSelect, onAdd }: Props) {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(12);
  const [filterYear, setFilterYear] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api
      .getMemories({
        page,
        per_page: perPage,
        year: filterYear ? Number(filterYear) : undefined,
      })
      .then((res) => {
        setMemories(res.memories);
        setTotal(res.total);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [page, perPage, filterYear]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-stone-100">Timeline</h2>
          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setPage(1);
            }}
            className="rounded-xl bg-stone-800/60 border border-stone-700/50 px-3 py-1.5 text-sm text-stone-300 focus:outline-none focus:border-rose-500/40"
          >
            <option value="">All time</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onAdd}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-sm font-medium transition-colors"
        >
          + New Memory
        </button>
      </div>

      {loading ? (
        <p className="text-stone-500 text-sm py-12 text-center">Loading...</p>
      ) : memories.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-stone-400">No memories yet.</p>
          <p className="text-stone-500 text-sm mt-1">Start capturing your story together.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {memories.map((m) => (
              <MemoryCard key={m.id} memory={m} onClick={() => onSelect(m)} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 text-sm disabled:opacity-30 hover:bg-stone-700 transition-colors"
              >
                Prev
              </button>
              <span className="text-sm text-stone-500">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg bg-stone-800 text-stone-400 text-sm disabled:opacity-30 hover:bg-stone-700 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

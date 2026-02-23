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
    <div className="animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Timeline</h2>
          <select
            value={filterYear}
            onChange={(e) => {
              setFilterYear(e.target.value);
              setPage(1);
            }}
            className="modern-input rounded-full px-4 py-2 text-sm"
          >
            <option value="">All time</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button
          onClick={onAdd}
          className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm text-sm"
        >
          + New Memory
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="apple-card rounded-2xl shadow-md p-12 text-center card-enter">
          <p className="text-4xl mb-3">📸</p>
          <p className="text-gray-800 dark:text-gray-100 font-medium">No memories yet.</p>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Start capturing your story together.</p>
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
                className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm disabled:opacity-30"
              >
                Prev
              </button>
              <span className="text-sm text-slate-500 dark:text-slate-400 tabular-nums">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm disabled:opacity-30"
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

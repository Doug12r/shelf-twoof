import { useState } from "react";
import type { Household } from "../types";
import * as api from "../api";

interface Props {
  onDone: (h: Household) => void;
}

export default function HouseholdSetup({ onDone }: Props) {
  const [mode, setMode] = useState<"choose" | "create" | "join">("choose");
  const [name, setName] = useState("Us");
  const [anniversary, setAnniversary] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    setLoading(true);
    setError("");
    try {
      const h = await api.createHousehold(name, anniversary || undefined);
      onDone(h);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create");
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setLoading(true);
    setError("");
    try {
      const h = await api.joinHousehold(code.trim());
      onDone(h);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to join");
    } finally {
      setLoading(false);
    }
  };

  if (mode === "choose") {
    return (
      <div className="max-w-md mx-auto mt-20 text-center animate-fadeIn">
        <div className="text-5xl mb-4">💕</div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-2">
          TwoOf<span className="text-rose-500">.</span>
        </h2>
        <p className="text-slate-500 dark:text-slate-400 mb-10 leading-relaxed">
          A shared space for your memories, milestones, and date ideas — just the two of you.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode("create")}
            className="bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm"
          >
            Start Together
          </button>
          <button
            onClick={() => setMode("join")}
            className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm py-3 text-base"
          >
            Join Your Partner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20 animate-fadeIn">
      <button
        onClick={() => { setMode("choose"); setError(""); }}
        className="text-sm text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 apple-button font-medium mb-6"
      >
        &larr; Back
      </button>

      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {mode === "create" ? "Create Your Space" : "Join Your Partner"}
      </h2>

      {error && (
        <div className="text-red-500 text-sm mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20">
          {error}
        </div>
      )}

      <div className="apple-card rounded-2xl shadow-md p-6 card-enter">
        {mode === "create" ? (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Your name for this</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Us, Team [Name], etc."
                className="modern-input w-full"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">When did it all begin?</label>
              <input
                type="date"
                value={anniversary}
                onChange={(e) => setAnniversary(e.target.value)}
                className="modern-input w-full"
              />
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Optional — sets your anniversary for countdowns</p>
            </div>
            <button
              onClick={handleCreate}
              disabled={loading || !name.trim()}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm disabled:opacity-50 mt-2"
            >
              {loading ? "Creating..." : "Create"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">Invite Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter the code your partner shared"
                className="modern-input w-full"
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={loading || !code.trim()}
              className="w-full bg-gradient-to-r from-rose-500 to-rose-600 text-white px-5 py-3 rounded-xl font-semibold apple-button shadow-sm disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

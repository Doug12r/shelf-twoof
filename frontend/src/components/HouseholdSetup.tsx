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
      <div className="max-w-md mx-auto mt-20 text-center">
        <div className="text-5xl mb-4">👑</div>
        <h2 className="text-3xl font-bold text-stone-100 mb-2">TwoOf</h2>
        <p className="text-stone-400 mb-10 leading-relaxed">
          A shared space for your memories, milestones, and date ideas — just the two of you.
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => setMode("create")}
            className="px-6 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-medium transition-colors"
          >
            Start Together
          </button>
          <button
            onClick={() => setMode("join")}
            className="px-6 py-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium transition-colors"
          >
            Join Your Partner
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-20">
      <button
        onClick={() => { setMode("choose"); setError(""); }}
        className="text-sm text-stone-500 hover:text-stone-300 mb-6"
      >
        &larr; Back
      </button>

      <h2 className="text-xl font-bold text-stone-100 mb-6">
        {mode === "create" ? "Create Your Space" : "Join Your Partner"}
      </h2>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
          {error}
        </div>
      )}

      {mode === "create" ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Your name for this</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Us, Team [Name], etc."
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">When did it all begin?</label>
            <input
              type="date"
              value={anniversary}
              onChange={(e) => setAnniversary(e.target.value)}
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 focus:outline-none focus:border-rose-500/50"
            />
            <p className="text-xs text-stone-600 mt-1">Optional — sets your anniversary for countdowns</p>
          </div>
          <button
            onClick={handleCreate}
            disabled={loading || !name.trim()}
            className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors mt-2"
          >
            {loading ? "Creating..." : "Create"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-stone-400 mb-1.5">Invite Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter the code your partner shared"
              className="w-full rounded-xl bg-stone-800/60 border border-stone-700 px-4 py-2.5 text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-500/50"
            />
          </div>
          <button
            onClick={handleJoin}
            disabled={loading || !code.trim()}
            className="w-full px-4 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-medium transition-colors"
          >
            {loading ? "Joining..." : "Join"}
          </button>
        </div>
      )}
    </div>
  );
}

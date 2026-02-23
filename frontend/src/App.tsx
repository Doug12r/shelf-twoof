import { useState, useEffect, useCallback } from "react";
import type { Household, Memory } from "./types";
import * as api from "./api";
import HouseholdSetup from "./components/HouseholdSetup";
import Overview from "./components/Overview";
import Timeline from "./components/Timeline";
import MemoryDetail from "./components/MemoryDetail";
import MemoryEditor from "./components/MemoryEditor";
import DateIdeas from "./components/DateIdeas";
import MilestoneList from "./components/MilestoneList";
import SearchBar from "./components/SearchBar";

type View =
  | { kind: "overview" }
  | { kind: "timeline" }
  | { kind: "memory-detail"; memoryId: string }
  | { kind: "add-memory" }
  | { kind: "edit-memory"; memory: Memory }
  | { kind: "dates" }
  | { kind: "milestones" };

type Tab = "overview" | "timeline" | "dates" | "milestones";

export default function App() {
  const [household, setHousehold] = useState<Household | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>({ kind: "overview" });

  const loadHousehold = useCallback(async () => {
    try {
      const h = await api.getHousehold();
      setHousehold(h);
    } catch {
      setHousehold(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHousehold();
  }, [loadHousehold]);

  const currentTab: Tab =
    view.kind === "timeline" || view.kind === "memory-detail" || view.kind === "add-memory" || view.kind === "edit-memory"
      ? "timeline"
      : view.kind === "dates"
        ? "dates"
        : view.kind === "milestones"
          ? "milestones"
          : "overview";

  const navigateTab = (tab: Tab | string) => {
    if (tab === "overview") setView({ kind: "overview" });
    else if (tab === "timeline") setView({ kind: "timeline" });
    else if (tab === "dates") setView({ kind: "dates" });
    else if (tab === "milestones") setView({ kind: "milestones" });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 flex items-center justify-center">
        <p className="text-stone-500">Loading...</p>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100">
        <div className="max-w-5xl mx-auto px-6 py-8">
          <HouseholdSetup onDone={(h) => setHousehold(h)} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Header */}
        <header className="mb-8 flex items-start justify-between">
          <div>
            <h1
              onClick={() => setView({ kind: "overview" })}
              className="text-2xl font-bold text-stone-100 cursor-pointer hover:text-rose-300 transition-colors"
            >
              TwoOf <span className="text-rose-500">.</span>
            </h1>
            <p className="text-sm text-stone-500 mt-0.5">{household.name}</p>
          </div>
          <button
            onClick={() => api.exportData()}
            className="text-xs px-3 py-1.5 rounded-xl bg-stone-800/60 text-stone-400 hover:bg-stone-700 hover:text-stone-200 transition-colors"
          >
            Export Data
          </button>
        </header>

        {/* Search */}
        <div className="mb-6">
          <SearchBar onSelect={(id) => setView({ kind: "memory-detail", memoryId: id })} />
        </div>

        {/* Nav */}
        <nav className="flex gap-1 mb-8 border-b border-stone-800/60 pb-px">
          {(
            [
              { id: "overview", label: "Home" },
              { id: "timeline", label: "Memories" },
              { id: "dates", label: "Date Ideas" },
              { id: "milestones", label: "Milestones" },
            ] as { id: Tab; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigateTab(tab.id)}
              className={`px-4 py-2.5 text-sm rounded-t-xl transition-colors ${
                currentTab === tab.id
                  ? "text-rose-400 border-b-2 border-rose-400 -mb-px"
                  : "text-stone-500 hover:text-stone-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Views */}
        {view.kind === "overview" && (
          <Overview household={household} onNavigate={navigateTab} />
        )}

        {view.kind === "timeline" && (
          <Timeline
            onSelect={(m) => setView({ kind: "memory-detail", memoryId: m.id })}
            onAdd={() => setView({ kind: "add-memory" })}
          />
        )}

        {view.kind === "memory-detail" && (
          <MemoryDetail
            memoryId={view.memoryId}
            onBack={() => setView({ kind: "timeline" })}
            onEdit={(m) => setView({ kind: "edit-memory", memory: m })}
            onDeleted={() => setView({ kind: "timeline" })}
          />
        )}

        {view.kind === "add-memory" && (
          <MemoryEditor
            memory={null}
            onSaved={(m) => setView({ kind: "memory-detail", memoryId: m.id })}
            onCancel={() => setView({ kind: "timeline" })}
          />
        )}

        {view.kind === "edit-memory" && (
          <MemoryEditor
            memory={view.memory}
            onSaved={(m) => setView({ kind: "memory-detail", memoryId: m.id })}
            onCancel={() => setView({ kind: "memory-detail", memoryId: view.memory.id })}
          />
        )}

        {view.kind === "dates" && <DateIdeas />}

        {view.kind === "milestones" && <MilestoneList />}
      </div>
    </div>
  );
}

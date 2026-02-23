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
import { useToast } from "./hooks/useToast";
import { ToastContainer } from "./components/Toast";

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
  const { toasts, showToast } = useToast();

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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "overview", label: "Home", icon: "\uD83D\uDC95" },
    { id: "timeline", label: "Timeline", icon: "\uD83D\uDCC5" },
    { id: "dates", label: "Date Ideas", icon: "\uD83D\uDCA1" },
    { id: "milestones", label: "Milestones", icon: "\uD83C\uDFAF" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center animate-fadeIn">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-rose-500 to-rose-600 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-500 dark:text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!household) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100">
        <div className="max-w-lg mx-auto px-4 py-8">
          <HouseholdSetup onDone={(h) => setHousehold(h)} />
        </div>
        <ToastContainer toasts={toasts} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-950 text-gray-800 dark:text-gray-100">
      {/* Glassmorphism header */}
      <header className="apple-card sticky top-0 z-40 border-b border-white/20 dark:border-white/5 rounded-none px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1
              onClick={() => setView({ kind: "overview" })}
              className="text-xl font-bold text-gray-800 dark:text-gray-100 cursor-pointer hover:text-rose-600 dark:hover:text-rose-400 transition-colors apple-button"
            >
              TwoOf<span className="text-rose-500 ml-0.5">.</span>
            </h1>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{household.name}</span>
          </div>
          <button
            onClick={() => api.exportData()}
            className="apple-card rounded-xl px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 apple-button shadow-sm"
          >
            Export
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-4 pb-32 pt-4">
        {/* Search */}
        <div className="mb-5">
          <SearchBar onSelect={(id) => setView({ kind: "memory-detail", memoryId: id })} />
        </div>

        {/* Views */}
        <div className="animate-fadeIn">
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
              showToast={showToast}
            />
          )}

          {view.kind === "add-memory" && (
            <MemoryEditor
              memory={null}
              onSaved={(m) => setView({ kind: "memory-detail", memoryId: m.id })}
              onCancel={() => setView({ kind: "timeline" })}
              showToast={showToast}
            />
          )}

          {view.kind === "edit-memory" && (
            <MemoryEditor
              memory={view.memory}
              onSaved={(m) => setView({ kind: "memory-detail", memoryId: m.id })}
              onCancel={() => setView({ kind: "memory-detail", memoryId: view.memory.id })}
              showToast={showToast}
            />
          )}

          {view.kind === "dates" && <DateIdeas showToast={showToast} />}

          {view.kind === "milestones" && <MilestoneList showToast={showToast} />}
        </div>
      </div>

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 apple-card rounded-none border-t border-white/20 dark:border-white/5 pb-[env(safe-area-inset-bottom)]">
        <div className="max-w-lg mx-auto flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigateTab(tab.id)}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium apple-button transition-colors ${
                currentTab === tab.id
                  ? "text-rose-600 dark:text-rose-400"
                  : "text-slate-400 dark:text-slate-500"
              }`}
            >
              <span className="text-lg leading-none">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <ToastContainer toasts={toasts} />
    </div>
  );
}

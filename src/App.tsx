import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Calendar,
  Save,
  FolderOpen,
  Cpu,
  CheckCircle2,
  Clock,
  CircleDashed,
  Ban,
  FilePlus,
} from "lucide-react";
import type { ProjectData, TabType } from "./types";
import { useAppStore } from "./store";
import { loadStatusFile, saveStatusFile, browseForFile, loadFileAtPath, createNewFile } from "./tauri-api";
import Dashboard from "./components/Dashboard";
import GanttChart from "./components/GanttChart";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "gantt", label: "Gantt Chart", icon: Calendar },
];

export default function App() {
  const store = useAppStore();
  const [data, setData] = useState<ProjectData | null>(store.data);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(store.filePath);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [showStartup, setShowStartup] = useState(false);

  // On mount: try to load existing, or show startup screen
  useEffect(() => {
    const init = async () => {
      try {
        const projectData = await loadStatusFile();
        if (projectData) {
          setData(projectData);
          const path = await getFilePath();
          setFilePath(path);
          store.setData(projectData);
          store.setFilePath(path || "");
        } else {
          setShowStartup(true);
        }
      } catch (err) {
        console.error("Failed to load:", err);
        setShowStartup(true);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // ── FILE OPERATIONS ──

  const handleNewFile = async () => {
    try {
      const path = await createNewFile();
      if (!path) return;
      const emptyData: ProjectData = {
        sections: [],
      };
      await saveStatusFile(emptyData, path);
      setData(emptyData);
      setFilePath(path);
      setIsModified(false);
      setShowStartup(false);
      store.setData(emptyData);
      store.setFilePath(path);
    } catch (err) {
      console.error("New file failed:", err);
      alert("Failed to create new file.");
    }
  };

  const handleBrowse = async () => {
    try {
      const path = await browseForFile();
      if (!path) return;
      const projectData = await loadFileAtPath(path);
      setData(projectData);
      setFilePath(path);
      setIsModified(false);
      setShowStartup(false);
      store.setData(projectData);
      store.setFilePath(path);
    } catch (err) {
      console.error("Browse failed:", err);
      alert("Failed to load file.");
    }
  };

  const handleSave = async () => {
    if (!data) return;
    setSaveStatus("saving");
    try {
      const savedPath = await saveStatusFile(data, filePath || undefined);
      setFilePath(savedPath);
      setIsModified(false);
      setSaveStatus("saved");
      store.setFilePath(savedPath);
      store.setIsModified(false);
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("Save failed:", err);
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 3000);
    }
  };

  const updateData = useCallback((newData: ProjectData) => {
    setData(newData);
    setIsModified(true);
    store.setData(newData);
    store.setIsModified(true);
  }, []);

  // ── RENDER STATES ──

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-github-bg">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <div className="w-16 h-16 border-4 border-github-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-github-dim text-lg">Loading Project Manager...</p>
        </motion.div>
      </div>
    );
  }

  // Startup screen: New or Open
  if (showStartup || !data) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-github-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-12 max-w-lg w-full text-center"
        >
          <Cpu className="w-16 h-16 text-github-blue mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-2">Project Manager</h1>
          <p className="text-github-dim mb-8">Create a new project or open an existing one.</p>

          <div className="flex flex-col gap-3">
            <button onClick={handleNewFile} className="btn-primary text-lg px-8 py-3 flex items-center justify-center gap-2">
              <FilePlus className="w-5 h-5" />
              Create New Project
            </button>
            <button onClick={handleBrowse} className="btn-secondary text-lg px-8 py-3 flex items-center justify-center gap-2">
              <FolderOpen className="w-5 h-5" />
              Open Existing File
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  const allTasks = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks);
  const totalTasks = allTasks.length;
  const doneTasks = allTasks.filter(t => t.done && !t.cancelledReason).length;
  const inProgressTasks = allTasks.filter(t => !t.done && !t.cancelledReason && t.actStart).length;
  const cancelledTasks = allTasks.filter(t => t.cancelledReason).length;
  const pendingTasks = totalTasks - doneTasks - inProgressTasks - cancelledTasks;

  return (
    <div className="h-screen w-screen flex flex-col bg-github-bg overflow-hidden">
      {/* Header */}
      <header className="h-16 border-b border-github-border bg-github-card/50 backdrop-blur flex items-center px-6 justify-between shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-github-blue to-github-purple flex items-center justify-center">
              <Cpu className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white leading-tight">Project Manager</h1>
              <p className="text-xs text-github-dim">{totalTasks} tasks total</p>
            </div>
          </div>

          <div className="h-8 w-px bg-github-border mx-2" />

          <div className="flex items-center gap-4 text-xs text-github-dim">
            <span className="flex items-center gap-1.5 text-github-green-bright">
              <CheckCircle2 className="w-3.5 h-3.5" /> {doneTasks} Done
            </span>
            <span className="flex items-center gap-1.5 text-github-yellow">
              <Clock className="w-3.5 h-3.5" /> {inProgressTasks} In Progress
            </span>
            <span className="flex items-center gap-1.5 text-github-red">
              <CircleDashed className="w-3.5 h-3.5" /> {pendingTasks} Pending
            </span>
            <span className="flex items-center gap-1.5 text-github-dim">
              <Ban className="w-3.5 h-3.5" /> {cancelledTasks} Cancelled
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isModified && (
            <motion.span initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="text-xs text-github-yellow font-medium">
              Modified
            </motion.span>
          )}

          <button onClick={handleBrowse} className="btn-secondary text-sm py-1.5">
            <FolderOpen className="w-4 h-4" />
            Open
          </button>

          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className={`btn-primary text-sm py-1.5 ${saveStatus === "saved" ? "bg-github-green-bright" : ""}`}
          >
            <Save className="w-4 h-4" />
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save"}
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav className="h-12 border-b border-github-border bg-github-bg flex items-center px-6 gap-1 shrink-0">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2
                ${isActive ? "text-white" : "text-github-dim hover:text-github-fg"}`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-github-blue/10 border border-github-blue/30 rounded-lg"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === "dashboard" && <Dashboard data={data} onUpdate={updateData} />}
            {activeTab === "gantt" && <GanttChart data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Status Bar */}
      <footer className="h-8 border-t border-github-border bg-github-bg/80 flex items-center px-4 justify-between text-xs text-github-dim shrink-0">
        <div className="flex items-center gap-4">
          {filePath && <span className="truncate max-w-md">{filePath}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>{data.sections.length} Sections</span>
          <span>{data.sections.reduce((sum, s) => sum + s.cards.length, 0)} Cards</span>
          <span>{totalTasks} Tasks</span>
        </div>
      </footer>
    </div>
  );
}

async function getFilePath(): Promise<string | null> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    return invoke("get_file_path");
  } catch {
    return null;
  }
}
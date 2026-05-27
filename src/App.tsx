import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Calendar, 
  AlertTriangle, 
  Save, 
  FolderOpen,
  Cpu,
  Monitor,
  Battery,
  Wifi,
  Users,
  CheckCircle2,
  Clock,
  CircleDashed,
  Ban,
  Zap
} from "lucide-react";
import type { ProjectData, TabType } from "./types";
import { loadStatusFile, saveStatusFile, browseForFile, loadFileAtPath } from "./tauri-api";
import Dashboard from "./components/Dashboard";
import GanttChart from "./components/GanttChart";
import Blockers from "./components/Blockers";

const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "gantt", label: "Gantt Chart", icon: Calendar },
  { id: "blockers", label: "Blockers", icon: AlertTriangle },
];

export default function App() {
  const [data, setData] = useState<ProjectData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [isLoading, setIsLoading] = useState(true);
  const [isModified, setIsModified] = useState(false);
  const [filePath, setFilePath] = useState<string | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  useEffect(() => {
    loadInitialFile();
  }, []);

  const loadInitialFile = async () => {
    try {
      const projectData = await loadStatusFile();
      setData(projectData);
      setFilePath(await getFilePath());
      if (projectData.meta?.title) {
        document.title = projectData.meta.title;
      }
    } catch (err) {
      console.error("Failed to load:", err);
    } finally {
      setIsLoading(false);
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
      if (projectData.meta?.title) {
        document.title = projectData.meta.title;
      }
    } catch (err) {
      console.error("Browse failed:", err);
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
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-github-bg">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-github-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-github-dim text-lg">Loading Project Manager...</p>
        </motion.div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-github-bg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-12 max-w-lg w-full text-center"
        >
          <Cpu className="w-16 h-16 text-github-blue mx-auto mb-6" />
          <h1 className="text-2xl font-bold text-white mb-4">Project Manager</h1>
          <p className="text-github-dim mb-8">No STATUS.md file found. Please select one to get started.</p>
          <button onClick={handleBrowse} className="btn-primary text-lg px-8 py-3">
            <FolderOpen className="w-5 h-5" />
            Select STATUS.md
          </button>
        </motion.div>
      </div>
    );
  }

  const totalTasks = data.sections.reduce((sum, s) => sum + s.cards.reduce((c, card) => c + card.tasks.length, 0), 0);
  const doneTasks = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks).filter(t => t.done && !t.cancelledReason).length;
  const inProgress = data.milestones.filter(m => m.status === "inprogress").length;
  const pending = totalTasks - doneTasks - data.sections.flatMap(s => s.cards).flatMap(c => c.tasks).filter(t => t.cancelledReason).length;

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
              <h1 className="text-lg font-bold text-white leading-tight">{data?.meta?.title || "Project Manager"}</h1>
              <p className="text-xs text-github-dim truncate max-w-md">{data?.meta?.focus || data?.meta?.owner || "Project Status Tracker"}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-github-border mx-2" />

          <div className="flex items-center gap-4 text-xs text-github-dim">
            {data?.meta?.mcu && <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> {data.meta.mcu}</span>}
            {data?.meta?.display && <span className="flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" /> {data.meta.display}</span>}
            {data?.meta?.ram && <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5" /> {data.meta.ram}</span>}
            {data?.meta?.power && <span className="flex items-center gap-1.5"><Battery className="w-3.5 h-3.5" /> {data.meta.power}</span>}
            {data?.meta?.comm && <span className="flex items-center gap-1.5"><Wifi className="w-3.5 h-3.5" /> {data.meta.comm}</span>}
            {data?.meta?.targetUsers && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {data.meta.targetUsers}</span>}
            {data?.meta?.owner && !data?.meta?.targetUsers && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {data.meta.owner}</span>}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1 text-github-green-bright">
              <CheckCircle2 className="w-3.5 h-3.5" /> {doneTasks}
            </span>
            <span className="flex items-center gap-1 text-github-yellow">
              <Clock className="w-3.5 h-3.5" /> {inProgress}
            </span>
            <span className="flex items-center gap-1 text-github-red">
              <CircleDashed className="w-3.5 h-3.5" /> {pending}
            </span>
            <span className="flex items-center gap-1 text-github-dim">
              <Ban className="w-3.5 h-3.5" /> {data.blockers.length}
            </span>
          </div>

          <div className="h-6 w-px bg-github-border" />

          {isModified && (
            <motion.span
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-xs text-github-yellow font-medium"
            >
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
            {activeTab === "blockers" && <Blockers data={data} />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Status Bar */}
      <footer className="h-8 border-t border-github-border bg-github-bg/80 flex items-center px-4 justify-between text-xs text-github-dim shrink-0">
        <div className="flex items-center gap-4">
          <span>Last updated: {data.lastUpdated}</span>
          {filePath && <span className="truncate max-w-md">{filePath}</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>{data.sections.length} Sections</span>
          <span>{data.milestones.length} Milestones</span>
          <span>{data.blockers.length} Blockers</span>
        </div>
      </footer>
    </div>
  );
}

async function getFilePath(): Promise<string | null> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke("get_file_path");
}

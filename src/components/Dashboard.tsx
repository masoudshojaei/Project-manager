import { useState, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronRight,
  ChevronDown,
  CheckSquare,
  Square,
  Plus,
  Trash2,
  Edit3,
  XCircle,
  CircleDashed,
  ArrowUp,
  ArrowDown,
  FolderPlus,
  FilePlus,
  ListPlus,
  PlayCircle,
} from "lucide-react";
import type { ProjectData, Task } from "../types";
import { STATUS_COLORS, STATUS_EMOJI } from "../types";
import TaskDetailsPanel from "./TaskDetailsPanel";
import DateInput from "./DateInput";

interface DashboardProps {
  data: ProjectData;
  onUpdate: (data: ProjectData) => void;
}

interface AddMenuItem {
  label: string;
  icon: React.ElementType;
  action: () => void;
  color?: string;
}

// ── DATE VALIDATION ──

function validateDates(start?: string, end?: string): boolean {
  if (!start || !end) return true;
  return new Date(start) <= new Date(end);
}

function validateTaskDates(task: Task): boolean {
  if (!validateDates(task.estStart, task.estEnd)) {
    alert("Estimated start date must be before or equal to estimated end date.");
    return false;
  }
  if (!validateDates(task.actStart, task.actEnd)) {
    alert("Actual start date must be before or equal to actual end date.");
    return false;
  }
  return true;
}

// ── STATUS HELPERS ──

function getTaskStatus(task: Task): "completed" | "cancelled" | "inprogress" | "pending" {
  if (task.done) return "completed";
  if (task.cancelledReason) return "cancelled";
  if (task.actStart) return "inprogress";
  return "pending";
}

function getStatusBg(status: string): string {
  switch (status) {
    case "completed": return "#23863620";
    case "inprogress": return "#d2992220";
    case "pending": return "#f8514920";
    case "cancelled": return "#8b949e20";
    default: return "transparent";
  }
}

function getStatusBorder(status: string): string {
  switch (status) {
    case "completed": return "#23863640";
    case "inprogress": return "#d2992240";
    case "pending": return "#f8514940";
    case "cancelled": return "#8b949e40";
    default: return "transparent";
  }
}

export default function Dashboard({ data, onUpdate }: DashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(data.sections.map(s => s.id)));
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(data.sections.flatMap(s => s.cards.map(c => c.id))));
  const [selectedTask, setSelectedTask] = useState<{ sectionId: string; cardId: string; taskIndex: number } | null>(null);
  const [detailsPanel, setDetailsPanel] = useState<{ sectionId: string; cardId: string; taskIndex: number } | null>(null);
  // NEW: Store a snapshot of the task when the details panel opens, to detect dirty state without needing TaskDetailsPanel to report it
  const [detailsSnapshot, setDetailsSnapshot] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; items: AddMenuItem[]; adjusted?: boolean } | null>(null);
  const [editingTask, setEditingTask] = useState<{ sectionId: string; cardId: string; taskIndex: number; text: string } | null>(null);
  const [addingTask, setAddingTask] = useState<{ sectionId: string; cardId: string } | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<string | null>(null);

  const stats = useMemo(() => {
    const allTasks = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks);
    const totalTasks = allTasks.length;
    const doneTasks = allTasks.filter(t => t.done && !t.cancelledReason).length;
    const inProgress = allTasks.filter(t => !t.done && !t.cancelledReason && t.actStart).length;
    const cancelled = allTasks.filter(t => t.cancelledReason).length;
    const pending = totalTasks - doneTasks - inProgress - cancelled;
    return { totalTasks, doneTasks, inProgress, pending, cancelled };
  }, [data]);

  // NEW: Close context menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContextMenu(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // NEW: Close context menu when clicking outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => setContextMenu(null);
    const timer = setTimeout(() => {
      window.addEventListener("click", handleClick);
    }, 50);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("click", handleClick);
    };
  }, [contextMenu]);

  const toggleSection = (id: string) => {
    const next = new Set(expandedSections);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedSections(next);
  };

  const toggleCard = (id: string) => {
    const next = new Set(expandedCards);
    if (next.has(id)) next.delete(id); else next.add(id);
    setExpandedCards(next);
  };

  const toggleTask = (sectionId: string, cardId: string, taskIndex: number) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    const task = card.tasks[taskIndex];
    task.done = !task.done;
    if (task.done) {
      task.cancelledReason = undefined;
      task.actEnd = new Date().toISOString().split("T")[0];
    } else {
      task.actEnd = undefined;
    }
    recalcCard(card);
    onUpdate(newData);
  };

  const recalcCard = (card: any) => {
    const total = card.tasks.length;
    const done = card.tasks.filter((t: Task) => t.done && !t.cancelledReason).length;
    card.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    if (card.progress === 100) card.status = "completed";
    else if (card.progress > 0) card.status = "inprogress";
    else card.status = "pending";
  };

  const setTaskStatus = (sectionId: string, cardId: string, taskIndex: number, status: "done" | "inprogress" | "pending" | "cancelled", reason?: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    const task = card.tasks[taskIndex];

    if (status === "done") {
      task.done = true;
      task.cancelledReason = undefined;
      task.actStart = task.actStart || new Date().toISOString().split("T")[0];
      task.actEnd = new Date().toISOString().split("T")[0];
    } else if (status === "pending") {
      task.done = false;
      task.cancelledReason = undefined;
      task.actStart = undefined;
      task.actEnd = undefined;
    } else if (status === "cancelled") {
      task.done = false;
      task.cancelledReason = reason || "Cancelled";
      task.actEnd = undefined;
    } else if (status === "inprogress") {
      task.done = false;
      task.cancelledReason = undefined;
      task.actStart = task.actStart || new Date().toISOString().split("T")[0];
      task.actEnd = undefined;
    }

    recalcCard(card);
    onUpdate(newData);
    setContextMenu(null);
  };

  const deleteTask = (sectionId: string, cardId: string, taskIndex: number) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    card.tasks.splice(taskIndex, 1);
    recalcCard(card);
    onUpdate(newData);
    setContextMenu(null);
  };

  const moveTaskUp = (sectionId: string, cardId: string, taskIndex: number) => {
    if (taskIndex === 0) return;
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    const tasks = card.tasks;
    [tasks[taskIndex - 1], tasks[taskIndex]] = [tasks[taskIndex], tasks[taskIndex - 1]];
    if (selectedTask?.sectionId === sectionId && selectedTask?.cardId === cardId) {
      if (selectedTask.taskIndex === taskIndex) setSelectedTask({ ...selectedTask, taskIndex: taskIndex - 1 });
      else if (selectedTask.taskIndex === taskIndex - 1) setSelectedTask({ ...selectedTask, taskIndex: taskIndex });
    }
    if (editingTask?.sectionId === sectionId && editingTask?.cardId === cardId) {
      if (editingTask.taskIndex === taskIndex) setEditingTask({ ...editingTask, taskIndex: taskIndex - 1 });
      else if (editingTask.taskIndex === taskIndex - 1) setEditingTask({ ...editingTask, taskIndex: taskIndex });
    }
    onUpdate(newData);
  };

  const moveTaskDown = (sectionId: string, cardId: string, taskIndex: number) => {
    const section = data.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    if (taskIndex >= card.tasks.length - 1) return;
    const newData = { ...data };
    const sec = newData.sections.find(s => s.id === sectionId)!;
    const c = sec.cards.find(c => c.id === cardId)!;
    const tasks = c.tasks;
    [tasks[taskIndex], tasks[taskIndex + 1]] = [tasks[taskIndex + 1], tasks[taskIndex]];
    if (selectedTask?.sectionId === sectionId && selectedTask?.cardId === cardId) {
      if (selectedTask.taskIndex === taskIndex) setSelectedTask({ ...selectedTask, taskIndex: taskIndex + 1 });
      else if (selectedTask.taskIndex === taskIndex + 1) setSelectedTask({ ...selectedTask, taskIndex: taskIndex });
    }
    if (editingTask?.sectionId === sectionId && editingTask?.cardId === cardId) {
      if (editingTask.taskIndex === taskIndex) setEditingTask({ ...editingTask, taskIndex: taskIndex + 1 });
      else if (editingTask.taskIndex === taskIndex + 1) setEditingTask({ ...editingTask, taskIndex: taskIndex });
    }
    onUpdate(newData);
  };

  const moveCardUp = (sectionId: string, cardIndex: number) => {
    if (cardIndex === 0) return;
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const cards = section.cards;
    [cards[cardIndex - 1], cards[cardIndex]] = [cards[cardIndex], cards[cardIndex - 1]];
    onUpdate(newData);
  };

  const moveCardDown = (sectionId: string, cardIndex: number) => {
    const section = data.sections.find(s => s.id === sectionId)!;
    if (cardIndex >= section.cards.length - 1) return;
    const newData = { ...data };
    const sec = newData.sections.find(s => s.id === sectionId)!;
    const cards = sec.cards;
    [cards[cardIndex], cards[cardIndex + 1]] = [cards[cardIndex + 1], cards[cardIndex]];
    onUpdate(newData);
  };

  const moveSectionUp = (sectionIndex: number) => {
    if (sectionIndex === 0) return;
    const newData = { ...data };
    const sections = newData.sections;
    [sections[sectionIndex - 1], sections[sectionIndex]] = [sections[sectionIndex], sections[sectionIndex - 1]];
    onUpdate(newData);
  };

  const moveSectionDown = (sectionIndex: number) => {
    if (sectionIndex >= data.sections.length - 1) return;
    const newData = { ...data };
    const sections = newData.sections;
    [sections[sectionIndex], sections[sectionIndex + 1]] = [sections[sectionIndex + 1], sections[sectionIndex]];
    onUpdate(newData);
  };

  const addSection = () => {
    const newData = { ...data };
    const newId = `section-${Date.now()}`;
    newData.sections.push({ id: newId, title: "New Section", cards: [] });
    onUpdate(newData);
    setExpandedSections(prev => new Set(prev).add(newId));
    setEditingSection(newId);
  };

  const addCard = (sectionId: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const newId = `card-${Date.now()}`;
    section.cards.push({ id: newId, name: "New Card", status: "pending", progress: 0, tasks: [] });
    onUpdate(newData);
    setExpandedCards(prev => new Set(prev).add(newId));
    setEditingCard(newId);
  };

  const addTask = (sectionId: string, cardId: string) => {
    if (!newTaskText.trim()) return;
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    card.tasks.push({
      text: newTaskText.trim(),
      done: false,
      estStart: undefined,
      estEnd: undefined,
      actStart: undefined,
      actEnd: undefined,
      note: undefined,
      cancelledReason: undefined,
      blockers: undefined,
    });
    recalcCard(card);
    onUpdate(newData);
    setNewTaskText("");
    setAddingTask(null);
  };

  const deleteSection = (sectionId: string) => {
    if (!confirm("Delete this section and all its cards?")) return;
    const newData = { ...data };
    newData.sections = newData.sections.filter(s => s.id !== sectionId);
    onUpdate(newData);
  };

  const deleteCard = (sectionId: string, cardId: string) => {
    if (!confirm("Delete this card and all its tasks?")) return;
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    section.cards = section.cards.filter(c => c.id !== cardId);
    onUpdate(newData);
  };

  const editTaskText = (sectionId: string, cardId: string, taskIndex: number, newText: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    card.tasks[taskIndex].text = newText;
    onUpdate(newData);
    setEditingTask(null);
  };

  // ── CONTEXT MENU BUILDERS ──

  // NEW: Helper to close existing menu and open new one with boundary detection
  const openContextMenu = useCallback((e: React.MouseEvent, items: AddMenuItem[]) => {
    e.preventDefault();
    e.stopPropagation();

    // Always close any existing menu first (only one menu at a time)
    setContextMenu(null);

    requestAnimationFrame(() => {
      const menuHeight = items.length * 36 + 16;
      const menuWidth = 200;

      let x = e.clientX;
      let y = e.clientY;
      let adjusted = false;

      if (x + menuWidth > window.innerWidth) {
        x = window.innerWidth - menuWidth - 8;
        adjusted = true;
      }

      if (y + menuHeight > window.innerHeight) {
        y = window.innerHeight - menuHeight - 8;
        adjusted = true;
      }

      setContextMenu({ x, y, items, adjusted });
    });
  }, []);

  // NEW: Helper to get current task by location
  const getTaskAt = useCallback((sectionId: string, cardId: string, taskIndex: number): Task | undefined => {
    const section = data.sections.find(s => s.id === sectionId);
    if (!section) return undefined;
    const card = section.cards.find(c => c.id === cardId);
    if (!card) return undefined;
    return card.tasks[taskIndex];
  }, [data]);

  // NEW: Check if details panel has unsaved changes by comparing current task to snapshot
  const isDetailsDirty = useCallback((): boolean => {
    if (!detailsPanel || !detailsSnapshot) return false;
    const currentTask = getTaskAt(detailsPanel.sectionId, detailsPanel.cardId, detailsPanel.taskIndex);
    if (!currentTask) return false;
    return JSON.stringify(currentTask) !== detailsSnapshot;
  }, [detailsPanel, detailsSnapshot, getTaskAt]);

  // NEW: Open details panel with dirty check (no onDirtyChange needed from TaskDetailsPanel)
  const openDetailsPanel = useCallback((sectionId: string, cardId: string, taskIndex: number) => {
    // If there's already a panel open with unsaved changes
    if (detailsPanel && isDetailsDirty()) {
      const keep = confirm("You have unsaved changes in the task details. Keep them and close, or discard and open new task?\n\nClick OK to keep (will close current panel).\nClick Cancel to discard and open new task.");
      if (keep) {
        setContextMenu(null);
        return;
      }
    }

    const task = getTaskAt(sectionId, cardId, taskIndex);
    setDetailsSnapshot(task ? JSON.stringify(task) : null);
    setDetailsPanel({ sectionId, cardId, taskIndex });
    setContextMenu(null);
  }, [detailsPanel, isDetailsDirty, getTaskAt]);

  const handleSectionContextMenu = (e: React.MouseEvent, sectionId: string, sectionIndex: number) => {
    const items: AddMenuItem[] = [
      { label: "Add Card", icon: FilePlus, action: () => { addCard(sectionId); setContextMenu(null); }, color: "text-github-blue" },
      { label: "Add Section Below", icon: FolderPlus, action: () => { addSection(); setContextMenu(null); }, color: "text-github-purple" },
      { label: "Move Section Up", icon: ArrowUp, action: () => { moveSectionUp(sectionIndex); setContextMenu(null); } },
      { label: "Move Section Down", icon: ArrowDown, action: () => { moveSectionDown(sectionIndex); setContextMenu(null); } },
      { label: "—", icon: () => null, action: () => {} },
      { label: "Delete Section", icon: Trash2, action: () => { deleteSection(sectionId); setContextMenu(null); }, color: "text-github-red" },
    ];
    openContextMenu(e, items);
  };

  const handleCardContextMenu = (e: React.MouseEvent, sectionId: string, cardId: string, cardIndex: number) => {
    const items: AddMenuItem[] = [
      { label: "Add Task", icon: ListPlus, action: () => { setAddingTask({ sectionId, cardId }); setContextMenu(null); }, color: "text-github-green-bright" },
      { label: "Add Card Below", icon: FilePlus, action: () => { addCard(sectionId); setContextMenu(null); }, color: "text-github-blue" },
      { label: "Move Card Up", icon: ArrowUp, action: () => { moveCardUp(sectionId, cardIndex); setContextMenu(null); } },
      { label: "Move Card Down", icon: ArrowDown, action: () => { moveCardDown(sectionId, cardIndex); setContextMenu(null); } },
      { label: "—", icon: () => null, action: () => {} },
      { label: "Delete Card", icon: Trash2, action: () => { deleteCard(sectionId, cardId); setContextMenu(null); }, color: "text-github-red" },
    ];
    openContextMenu(e, items);
  };

  const handleTaskContextMenu = (e: React.MouseEvent, sectionId: string, cardId: string, taskIndex: number) => {
    const items: AddMenuItem[] = [
      { label: "Add Task Below", icon: ListPlus, action: () => { setAddingTask({ sectionId, cardId }); setContextMenu(null); }, color: "text-github-green-bright" },
      { label: "—", icon: () => null, action: () => {} },
      { label: "Mark Complete", icon: CheckSquare, action: () => setTaskStatus(sectionId, cardId, taskIndex, "done"), color: "text-github-green-bright" },
      { label: "Set In Progress", icon: PlayCircle, action: () => setTaskStatus(sectionId, cardId, taskIndex, "inprogress"), color: "text-github-yellow" },
      { label: "Set Pending", icon: CircleDashed, action: () => setTaskStatus(sectionId, cardId, taskIndex, "pending"), color: "text-github-red" },
      { label: "Cancel Task...", icon: XCircle, action: () => { const reason = prompt("Reason for cancellation:"); if (reason) setTaskStatus(sectionId, cardId, taskIndex, "cancelled", reason); }, color: "text-github-dim" },
      { label: "—", icon: () => null, action: () => {} },
      { label: "Edit Details...", icon: Edit3, action: () => { openDetailsPanel(sectionId, cardId, taskIndex); }, color: "text-github-blue" },
      { label: "Delete Task", icon: Trash2, action: () => deleteTask(sectionId, cardId, taskIndex), color: "text-github-red" },
    ];
    openContextMenu(e, items);
  };

  // ── DATE UPDATE WRAPPERS WITH VALIDATION ──

  const updateTaskDate = (sectionId: string, cardId: string, taskIndex: number, field: keyof Task, value: string | undefined) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;

    const taskCopy = { ...card.tasks[taskIndex], [field]: value };

    if (!validateTaskDates(taskCopy)) return;

    card.tasks[taskIndex] = taskCopy;
    onUpdate(newData);
  };

  // ── EMPTY STATES ──

  const EmptySectionPlaceholder = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-github-border/20 flex items-center justify-center mb-4">
        <FolderPlus className="w-8 h-8 text-github-dim" />
      </div>
      <h3 className="text-base font-semibold text-github-fg mb-1">No Sections Yet</h3>
      <p className="text-sm text-github-dim mb-4 max-w-[200px]">Create your first section to start organizing your project.</p>
      <button onClick={addSection} className="btn-primary text-sm py-2 px-4 flex items-center gap-2">
        <Plus className="w-4 h-4" /> Add Section
      </button>
    </motion.div>
  );

  const EmptyCardPlaceholder = ({ sectionId }: { sectionId: string }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-8 px-4 text-center ml-4 border border-dashed border-github-border/50 rounded-lg mt-2">
      <div className="w-10 h-10 rounded-xl bg-github-border/10 flex items-center justify-center mb-2">
        <FilePlus className="w-5 h-5 text-github-dim" />
      </div>
      <p className="text-sm text-github-dim mb-2">No cards in this section</p>
      <button onClick={() => addCard(sectionId)} className="text-sm text-github-blue hover:text-github-blue/80 flex items-center gap-1 transition-colors">
        <Plus className="w-3 h-3" /> Add Card
      </button>
    </motion.div>
  );

  const EmptyTaskPlaceholder = ({ sectionId, cardId }: { sectionId: string; cardId: string }) => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-6 px-4 text-center ml-6 border border-dashed border-github-border/30 rounded-lg mt-1">
      <div className="w-8 h-8 rounded-lg bg-github-border/10 flex items-center justify-center mb-2">
        <ListPlus className="w-4 h-4 text-github-dim" />
      </div>
      <p className="text-sm text-github-dim mb-2">No tasks yet</p>
      <button onClick={() => setAddingTask({ sectionId, cardId })} className="text-sm text-github-green-bright hover:text-github-green-bright/80 flex items-center gap-1 transition-colors">
        <Plus className="w-3 h-3" /> Add Task
      </button>
    </motion.div>
  );

  return (
    <div className="h-full flex gap-4 p-4 overflow-hidden">
      {/* Left Panel - Tasks */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Quick Stats Pie Chart */}
        <div className="flex items-center gap-6 mb-4 shrink-0 glass-panel rounded-xl p-4">
          {/* Pie Chart */}
          <div className="relative w-[120px] h-[120px] shrink-0">
            <QuickStatsPie data={data} />
            {/* Center total */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-lg font-bold text-white">{stats.totalTasks}</span>
              <span className="text-[10px] text-github-dim uppercase tracking-wider">Total</span>
            </div>
          </div>

          {/* Legend + Counts — single column, right-aligned */}
          <div className="flex-1 flex flex-col gap-1.5 items-end text-right">
            <LegendItem
              color="#238636"
              label="Completed"
              count={stats.doneTasks}
              total={stats.totalTasks}
            />
            <LegendItem
              color="#d29922"
              label="In Progress"
              count={stats.inProgress}
              total={stats.totalTasks}
            />
            <LegendItem
              color="#f85149"
              label="Not Started"
              count={stats.pending}
              total={stats.totalTasks}
            />
            <LegendItem
              color="#8b949e"
              label="Cancelled"
              count={stats.cancelled}
              total={stats.totalTasks}
            />
          </div>
        </div>

        {/* Task Tree */}
        <div className="flex-1 glass-panel overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-github-border flex items-center justify-between shrink-0">
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-github-blue" />
              Tasks & Progress
            </h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-github-dim">{stats.totalTasks} total tasks</span>
              <button onClick={addSection} className="p-1.5 rounded-lg hover:bg-github-border/50 text-github-dim hover:text-github-blue transition-colors" title="Add Section">
                <FolderPlus className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {data.sections.length === 0 ? (
              <EmptySectionPlaceholder />
            ) : (
              data.sections.map((section, sIdx) => (
                <motion.div key={section.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: sIdx * 0.05 }}>
                  <button
                    onClick={() => toggleSection(section.id)}
                    onContextMenu={(e) => handleSectionContextMenu(e, section.id, sIdx)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-github-border/30 transition-colors text-left group"
                  >
                    {expandedSections.has(section.id) ? <ChevronDown className="w-4 h-4 text-github-dim" /> : <ChevronRight className="w-4 h-4 text-github-dim" />}
                    {editingSection === section.id ? (
                      <input
                        autoFocus
                        defaultValue={section.title}
                        onBlur={(e) => { const newData = { ...data }; const sec = newData.sections.find(s => s.id === section.id)!; sec.title = e.target.value || section.title; onUpdate(newData); setEditingSection(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditingSection(null); }}
                        className="input-field text-base py-1 flex-1"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <span className="text-base font-semibold text-github-fg cursor-pointer hover:text-github-blue" onClick={(e) => { e.stopPropagation(); setEditingSection(section.id); }}>
                        {section.title}
                      </span>
                    )}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto mr-2">
                      <button onClick={(e) => { e.stopPropagation(); moveSectionUp(sIdx); }} disabled={sIdx === 0} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg disabled:opacity-30 disabled:cursor-not-allowed" title="Move section up"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); moveSectionDown(sIdx); }} disabled={sIdx === data.sections.length - 1} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg disabled:opacity-30 disabled:cursor-not-allowed" title="Move section down"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <div className="w-px h-4 bg-github-border/50 mx-1" />
                      <button onClick={(e) => { e.stopPropagation(); addCard(section.id); }} className="p-1 rounded hover:bg-github-blue/20 text-github-dim hover:text-github-blue" title="Add card"><FilePlus className="w-3.5 h-3.5" /></button>
                      <button onClick={(e) => { e.stopPropagation(); deleteSection(section.id); }} className="p-1 rounded hover:bg-github-red/20 text-github-dim hover:text-github-red" title="Delete section"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                    <span className="text-sm text-github-dim">{section.cards.length} cards</span>
                  </button>

                  <AnimatePresence>
                    {expandedSections.has(section.id) && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="ml-4">
                        {section.cards.length === 0 ? (
                          <EmptyCardPlaceholder sectionId={section.id} />
                        ) : (
                          section.cards.map((card, cIdx) => {
                            const doneCount = card.tasks.filter(t => t.done && !t.cancelledReason).length;
                            const totalCount = card.tasks.length;
                            return (
                              <div key={card.id}>
                                <button
                                  onClick={() => toggleCard(card.id)}
                                  onContextMenu={(e) => handleCardContextMenu(e, section.id, card.id, cIdx)}
                                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-github-border/30 transition-colors text-left group"
                                >
                                  {expandedCards.has(card.id) ? <ChevronDown className="w-3.5 h-3.5 text-github-dim" /> : <ChevronRight className="w-3.5 h-3.5 text-github-dim" />}
                                  <span className="text-sm">{STATUS_EMOJI[card.status as keyof typeof STATUS_EMOJI] || "⚪"}</span>
                                  {editingCard === card.id ? (
                                    <input
                                      autoFocus
                                      defaultValue={card.name}
                                      onBlur={(e) => { const newData = { ...data }; const sec = newData.sections.find(s => s.id === section.id)!; const c = sec.cards.find(c => c.id === card.id)!; c.name = e.target.value || card.name; onUpdate(newData); setEditingCard(null); }}
                                      onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditingCard(null); }}
                                      className="input-field text-base py-0.5 flex-1"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span className="text-base font-medium text-github-fg cursor-pointer hover:text-github-blue" onClick={(e) => { e.stopPropagation(); setEditingCard(card.id); }}>
                                      {card.name}
                                    </span>
                                  )}
                                  <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 ml-auto mr-2">
                                    <button onClick={(e) => { e.stopPropagation(); moveCardUp(section.id, cIdx); }} disabled={cIdx === 0} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg disabled:opacity-30 disabled:cursor-not-allowed" title="Move card up"><ArrowUp className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); moveCardDown(section.id, cIdx); }} disabled={cIdx === section.cards.length - 1} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg disabled:opacity-30 disabled:cursor-not-allowed" title="Move card down"><ArrowDown className="w-3 h-3" /></button>
                                    <div className="w-px h-4 bg-github-border/50 mx-1" />
                                    <button onClick={(e) => { e.stopPropagation(); setAddingTask({ sectionId: section.id, cardId: card.id }); }} className="p-1 rounded hover:bg-github-green/20 text-github-dim hover:text-github-green-bright" title="Add task"><ListPlus className="w-3 h-3" /></button>
                                    <button onClick={(e) => { e.stopPropagation(); deleteCard(section.id, card.id); }} className="p-1 rounded hover:bg-github-red/20 text-github-dim hover:text-github-red" title="Delete card"><Trash2 className="w-3 h-3" /></button>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="w-20 h-1.5 bg-github-bg rounded-full overflow-hidden">
                                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${card.progress}%`, backgroundColor: STATUS_COLORS[card.status as keyof typeof STATUS_COLORS] || "#8b949e" }} />
                                    </div>
                                    <span className="text-sm text-github-dim">{doneCount}/{totalCount}</span>
                                  </div>
                                </button>

                                <AnimatePresence>
                                  {expandedCards.has(card.id) && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }} className="ml-6">
                                      {card.tasks.length === 0 ? (
                                        <EmptyTaskPlaceholder sectionId={section.id} cardId={card.id} />
                                      ) : (
                                        card.tasks.map((task, tIdx) => {
                                          const isSelected = selectedTask?.sectionId === section.id && selectedTask?.cardId === card.id && selectedTask?.taskIndex === tIdx;
                                          const isEditing = editingTask?.sectionId === section.id && editingTask?.cardId === card.id && editingTask?.taskIndex === tIdx;
                                          const taskStatus = getTaskStatus(task);
                                          const statusBg = getStatusBg(taskStatus);
                                          const statusBorder = getStatusBorder(taskStatus);

                                          return (
                                            <motion.div
                                              key={tIdx}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all group border ${isSelected ? "bg-github-blue/10 border-github-blue/30" : ""}`}
                                              style={{ backgroundColor: isSelected ? undefined : statusBg, borderColor: isSelected ? undefined : statusBorder }}
                                              onClick={() => setSelectedTask({ sectionId: section.id, cardId: card.id, taskIndex: tIdx })}
                                              onContextMenu={(e) => handleTaskContextMenu(e, section.id, card.id, tIdx)}
                                            >
                                              <button onClick={(e) => { e.stopPropagation(); toggleTask(section.id, card.id, tIdx); }} className="shrink-0">
                                                {taskStatus === "completed" ? (
                                                  <CheckSquare className="w-4 h-4 text-github-green-bright" />
                                                ) : taskStatus === "cancelled" ? (
                                                  <XCircle className="w-4 h-4 text-github-dim" />
                                                ) : taskStatus === "inprogress" ? (
                                                  <PlayCircle className="w-4 h-4 text-github-yellow" />
                                                ) : (
                                                  <Square className="w-4 h-4 text-github-dim hover:text-github-fg" />
                                                )}
                                              </button>

                                              {isEditing ? (
                                                <input
                                                  autoFocus
                                                  className="input-field text-base py-0.5"
                                                  defaultValue={task.text}
                                                  onBlur={(e) => editTaskText(section.id, card.id, tIdx, e.target.value)}
                                                  onKeyDown={(e) => { if (e.key === "Enter") editTaskText(section.id, card.id, tIdx, e.currentTarget.value); if (e.key === "Escape") setEditingTask(null); }}
                                                />
                                              ) : (
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-base font-medium truncate text-github-fg">{task.text}</div>
                                                  <div className="mt-1 grid grid-cols-4 gap-2 text-xs">
                                                    <DateInput label="est-start" value={task.estStart} onChange={(v) => updateTaskDate(section.id, card.id, tIdx, "estStart", v)} />
                                                    <DateInput label="est-end" value={task.estEnd} onChange={(v) => updateTaskDate(section.id, card.id, tIdx, "estEnd", v)} />
                                                    <DateInput label="act-start" value={task.actStart} onChange={(v) => updateTaskDate(section.id, card.id, tIdx, "actStart", v)} />
                                                    <DateInput label="act-end" value={task.actEnd} onChange={(v) => updateTaskDate(section.id, card.id, tIdx, "actEnd", v)} />
                                                  </div>
                                                </div>
                                              )}

                                              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                                <button onClick={(e) => { e.stopPropagation(); moveTaskUp(section.id, card.id, tIdx); }} disabled={tIdx === 0} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg disabled:opacity-30 disabled:cursor-not-allowed" title="Move up"><ArrowUp className="w-3 h-3" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); moveTaskDown(section.id, card.id, tIdx); }} disabled={tIdx === card.tasks.length - 1} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg disabled:opacity-30 disabled:cursor-not-allowed" title="Move down"><ArrowDown className="w-3 h-3" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); setEditingTask({ sectionId: section.id, cardId: card.id, taskIndex: tIdx, text: task.text }); }} className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg"><Edit3 className="w-3 h-3" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); deleteTask(section.id, card.id, tIdx); }} className="p-1 rounded hover:bg-github-red/20 text-github-dim hover:text-github-red"><Trash2 className="w-3 h-3" /></button>
                                              </div>
                                            </motion.div>
                                          );
                                        })
                                      )}

                                      {addingTask?.sectionId === section.id && addingTask?.cardId === card.id ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 ml-6">
                                          <Square className="w-4 h-4 text-github-dim" />
                                          <input
                                            autoFocus
                                            className="input-field text-base py-0.5 flex-1"
                                            placeholder="New task name..."
                                            value={newTaskText}
                                            onChange={(e) => setNewTaskText(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter") addTask(section.id, card.id); if (e.key === "Escape") { setAddingTask(null); setNewTaskText(""); } }}
                                            onBlur={() => { if (newTaskText.trim()) addTask(section.id, card.id); else { setAddingTask(null); setNewTaskText(""); } }}
                                          />
                                        </div>
                                      ) : (
                                        <button onClick={() => setAddingTask({ sectionId: section.id, cardId: card.id })} className="flex items-center gap-2 px-3 py-1.5 ml-6 text-sm text-github-dim hover:text-github-blue transition-colors">
                                          <Plus className="w-3.5 h-3.5" /> Add task
                                        </button>
                                      )}
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            );
                          })
                        )}
                        <button onClick={() => addCard(section.id)} className="flex items-center gap-2 px-3 py-2 ml-4 mt-1 text-sm text-github-dim hover:text-github-blue transition-colors">
                          <Plus className="w-3.5 h-3.5" /> Add card
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))
            )}
            {data.sections.length > 0 && (
              <button onClick={addSection} className="flex items-center gap-2 px-3 py-2 mt-3 text-base text-github-dim hover:text-github-blue transition-colors border border-dashed border-github-border rounded-lg hover:border-github-blue/50 w-full">
                <Plus className="w-4 h-4" /> Add section
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Context Menu - FIXED: higher z-index and boundary-aware positioning */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setContextMenu(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              className="fixed z-[70] bg-github-card border border-github-border rounded-xl shadow-2xl py-1 min-w-[180px]"
            >
              {contextMenu.items.map((item, i) => (
                item.label === "—" ? (
                  <div key={i} className="h-px bg-github-border my-1" />
                ) : (
                  <button
                    key={i}
                    onClick={item.action}
                    className={`w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors ${item.color ? `hover:bg-${item.color.replace("text-", "")}/10 ${item.color}` : "text-github-fg hover:bg-github-border/30 hover:text-github-fg"}`}
                  >
                    <item.icon className="w-4 h-4" /> {item.label}
                  </button>
                )
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Details Panel - no onDirtyChange needed, dirty check is self-contained in Dashboard */}
      <AnimatePresence>
        {detailsPanel && (
          <TaskDetailsPanel
            data={data}
            onUpdate={onUpdate}
            sectionId={detailsPanel.sectionId}
            cardId={detailsPanel.cardId}
            taskIndex={detailsPanel.taskIndex}
            onClose={() => { setDetailsPanel(null); setDetailsSnapshot(null); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── PIE CHART COMPONENT ──

function QuickStatsPie({ data }: { data: ProjectData }) {
  const slices = useMemo(() => {
    const allTasks = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks);
    const total = allTasks.length;
    if (total === 0) return [];

    const done = allTasks.filter(t => t.done && !t.cancelledReason).length;
    const inProg = allTasks.filter(t => !t.done && !t.cancelledReason && t.actStart).length;
    const cancelled = allTasks.filter(t => t.cancelledReason).length;
    const pending = total - done - inProg - cancelled;

    const sliceData = [
      { key: "completed", count: done, color: "#238636" },
      { key: "inprogress", count: inProg, color: "#d29922" },
      { key: "pending", count: pending, color: "#f85149" },
      { key: "cancelled", count: cancelled, color: "#8b949e" },
    ].filter(d => d.count > 0);

    let cumulativeAngle = 0;
    return sliceData.map(d => {
      const percentage = d.count / total;
      const angle = percentage * 360;
      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;
      cumulativeAngle += angle;

      const r = 50;
      const cx = 60;
      const cy = 60;
      const startRad = (startAngle - 90) * (Math.PI / 180);
      const endRad = (endAngle - 90) * (Math.PI / 180);
      const x1 = cx + r * Math.cos(startRad);
      const y1 = cy + r * Math.sin(startRad);
      const x2 = cx + r * Math.cos(endRad);
      const y2 = cy + r * Math.sin(endRad);
      const largeArc = angle > 180 ? 1 : 0;

      const path = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return { ...d, path, percentage: Math.round(percentage * 100) };
    });
  }, [data]);

  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" style={{ transform: "rotate(-90deg)" }}>
      {slices.map(slice => (
        <path
          key={slice.key}
          d={slice.path}
          fill={slice.color}
          stroke="#0d1117"
          strokeWidth="2"
          className="transition-opacity duration-200 hover:opacity-80 cursor-pointer"
        >
          <title>{`${slice.key}: ${slice.count} (${slice.percentage}%)`}</title>
        </path>
      ))}
      {/* Donut hole */}
      <circle cx="60" cy="60" r="32" fill="#0d1117" />
    </svg>
  );
}

// ── LEGEND ITEM ──

function LegendItem({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
      <span className="text-sm text-github-fg">{label}</span>
      <span className="text-sm font-bold text-white">{count}</span>
      <span className="text-xs text-github-dim w-8">{pct}%</span>
    </div>
  );
}
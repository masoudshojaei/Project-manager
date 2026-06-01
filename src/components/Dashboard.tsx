import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  ChevronDown, 
  CheckSquare, 
  Square, 
  CalendarDays,
  Plus,
  Trash2,
  Edit3,
  XCircle,
  ArrowRightCircle,
  CircleDashed,
  AlertCircle
} from "lucide-react";
import type { ProjectData, Task } from "../types";
import { STATUS_COLORS, STATUS_EMOJI } from "../types";
import TaskDetailsPanel from "./TaskDetailsPanel";
import DateInput from "./DateInput";

interface DashboardProps {
  data: ProjectData;
  onUpdate: (data: ProjectData) => void;
}

export default function Dashboard({ data, onUpdate }: DashboardProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(data.sections.map(s => s.id)));
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set(data.sections.flatMap(s => s.cards.map(c => c.id))));
  const [selectedTask, setSelectedTask] = useState<{ sectionId: string; cardId: string; taskIndex: number } | null>(null);
  const [detailsPanel, setDetailsPanel] = useState<{ sectionId: string; cardId: string; taskIndex: number } | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: any } | null>(null);
  const [editingTask, setEditingTask] = useState<{ sectionId: string; cardId: string; taskIndex: number; text: string } | null>(null);
  const [addingTask, setAddingTask] = useState<{ sectionId: string; cardId: string } | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"milestones" | "blockers">("milestones");

  const stats = useMemo(() => {
    const totalTasks = data.sections.reduce((sum, s) => sum + s.cards.reduce((c, card) => c + card.tasks.length, 0), 0);
    const doneTasks = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks).filter(t => t.done && !t.cancelledReason).length;
    const inProgress = data.milestones.filter(m => m.status === "inprogress").length;
    const pending = totalTasks - doneTasks - data.sections.flatMap(s => s.cards).flatMap(c => c.tasks).filter(t => t.cancelledReason).length;
    const cancelled = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks).filter(t => t.cancelledReason).length;
    return { totalTasks, doneTasks, inProgress, pending, cancelled };
  }, [data]);

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
    task.cancelledReason = undefined;

    // Recalculate card progress
    const total = card.tasks.length;
    const done = card.tasks.filter(t => t.done && !t.cancelledReason).length;
    card.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    if (card.progress === 100) card.status = "completed";
    else if (card.progress > 0) card.status = "inprogress";
    else card.status = "pending";

    onUpdate(newData);
  };

  const setTaskStatus = (sectionId: string, cardId: string, taskIndex: number, status: "done" | "inprogress" | "pending" | "cancelled", reason?: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    const task = card.tasks[taskIndex];

    if (status === "done") {
      task.done = true;
      task.cancelledReason = undefined;
    } else if (status === "pending") {
      task.done = false;
      task.cancelledReason = undefined;
    } else if (status === "cancelled") {
      task.done = false;
      task.cancelledReason = reason || "Cancelled";
    } else if (status === "inprogress") {
      task.done = false;
      task.cancelledReason = undefined;
    }

    const total = card.tasks.length;
    const done = card.tasks.filter(t => t.done && !t.cancelledReason).length;
    card.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    if (card.progress === 100) card.status = "completed";
    else if (card.progress > 0) card.status = "inprogress";
    else card.status = "pending";

    onUpdate(newData);
    setContextMenu(null);
  };

  const deleteTask = (sectionId: string, cardId: string, taskIndex: number) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    card.tasks.splice(taskIndex, 1);

    const total = card.tasks.length;
    const done = card.tasks.filter(t => t.done && !t.cancelledReason).length;
    card.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    if (card.progress === 100) card.status = "completed";
    else if (card.progress > 0) card.status = "inprogress";
    else card.status = "pending";

    onUpdate(newData);
    setContextMenu(null);
  };

  const editTaskText = (sectionId: string, cardId: string, taskIndex: number, newText: string) => {
    const newData = { ...data };
    const section = newData.sections.find(s => s.id === sectionId)!;
    const card = section.cards.find(c => c.id === cardId)!;
    card.tasks[taskIndex].text = newText;
    onUpdate(newData);
    setEditingTask(null);
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
    onUpdate(newData);
    setNewTaskText("");
    setAddingTask(null);
  };

  const setMilestoneStatus = (milestoneId: string, status: string) => {
    const newData = { ...data };
    const ms = newData.milestones.find(m => m.id === milestoneId)!;
    ms.status = status;
    ms.progress = status === "completed" ? 100 : status === "inprogress" ? 50 : 0;
    if (status === "completed") {
      ms.actEnd = new Date().toISOString().split("T")[0];
    } else {
      ms.actEnd = undefined;
    }
    onUpdate(newData);
    setSelectedMilestone(null);
  };

  const handleContextMenu = (e: React.MouseEvent, sectionId: string, cardId: string, taskIndex: number, task: Task) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, task: { sectionId, cardId, taskIndex, ...task } });
  };

  return (
    <div className="h-full flex gap-4 p-4 overflow-hidden">
      {/* Left Panel - Tasks */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3 mb-4 shrink-0">
          <StatCard label="Completed" value={stats.doneTasks} color="text-github-green-bright" bg="bg-github-green-bright/10" border="border-github-green-bright/20" icon={CheckSquare} />
          <StatCard label="In Progress" value={stats.inProgress} color="text-github-yellow" bg="bg-github-yellow/10" border="border-github-yellow/20" icon={ArrowRightCircle} />
          <StatCard label="Not Started" value={stats.pending} color="text-github-red" bg="bg-github-red/10" border="border-github-red/20" icon={CircleDashed} />
          <StatCard label="Cancelled" value={stats.cancelled} color="text-github-dim" bg="bg-github-dim/10" border="border-github-dim/20" icon={XCircle} />
        </div>

        {/* Task Tree */}
        <div className="flex-1 glass-panel overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-github-border flex items-center justify-between shrink-0">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-github-blue" />
              Tasks & Progress
            </h2>
            <span className="text-xs text-github-dim">{stats.totalTasks} total tasks</span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {data.sections.map((section, sIdx) => (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: sIdx * 0.05 }}
              >
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-github-border/30 transition-colors text-left"
                >
                  {expandedSections.has(section.id) ? <ChevronDown className="w-4 h-4 text-github-dim" /> : <ChevronRight className="w-4 h-4 text-github-dim" />}
                  {editingSection === section.id ? (
                    <input
                      autoFocus
                      defaultValue={section.title}
                      onBlur={(e) => {
                        const newData = { ...data };
                        const sec = newData.sections.find(s => s.id === section.id)!;
                        sec.title = e.target.value || section.title;
                        onUpdate(newData);
                        setEditingSection(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") e.currentTarget.blur();
                        if (e.key === "Escape") setEditingSection(null);
                      }}
                      className="input-field text-sm py-1 flex-1"
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-github-fg cursor-pointer hover:text-github-blue" onClick={(e) => { e.stopPropagation(); setEditingSection(section.id); }}>
                      {section.title}
                    </span>
                  )}
                  <span className="text-xs text-github-dim ml-auto">{section.cards.length} cards</span>
                </button>

                <AnimatePresence>
                  {expandedSections.has(section.id) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="ml-4 overflow-hidden"
                    >
                      {section.cards.map((card) => {
                        const doneCount = card.tasks.filter(t => t.done && !t.cancelledReason).length;
                        const totalCount = card.tasks.length;
                        return (
                          <div key={card.id}>
                            <button
                              onClick={() => toggleCard(card.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-github-border/30 transition-colors text-left"
                            >
                              {expandedCards.has(card.id) ? <ChevronDown className="w-3.5 h-3.5 text-github-dim" /> : <ChevronRight className="w-3.5 h-3.5 text-github-dim" />}
                              <span className="text-sm">{STATUS_EMOJI[card.status as keyof typeof STATUS_EMOJI] || "⚪"}</span>
                              {editingCard === card.id ? (
                                <input
                                  autoFocus
                                  defaultValue={card.name}
                                  onBlur={(e) => {
                                    const newData = { ...data };
                                    const sec = newData.sections.find(s => s.id === section.id)!;
                                    const c = sec.cards.find(c => c.id === card.id)!;
                                    c.name = e.target.value || card.name;
                                    onUpdate(newData);
                                    setEditingCard(null);
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") e.currentTarget.blur();
                                    if (e.key === "Escape") setEditingCard(null);
                                  }}
                                  className="input-field text-sm py-0.5 flex-1"
                                  onClick={(e) => e.stopPropagation()}
                                />
                              ) : (
                                <span className="text-sm font-medium text-github-fg cursor-pointer hover:text-github-blue" onClick={(e) => { e.stopPropagation(); setEditingCard(card.id); }}>
                                  {card.name}
                                </span>
                              )}
                              <div className="ml-auto flex items-center gap-2">
                                <div className="w-20 h-1.5 bg-github-bg rounded-full overflow-hidden">
                                  <div 
                                    className="h-full rounded-full transition-all duration-500"
                                    style={{ 
                                      width: `${card.progress}%`,
                                      backgroundColor: STATUS_COLORS[card.status as keyof typeof STATUS_COLORS] || "#8b949e"
                                    }}
                                  />
                                </div>
                                <span className="text-xs text-github-dim">{doneCount}/{totalCount}</span>
                              </div>
                            </button>

                            <AnimatePresence>
                              {expandedCards.has(card.id) && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.15 }}
                                  className="ml-6 overflow-hidden"
                                >
                                  {card.tasks.map((task, tIdx) => {
                                    const isSelected = selectedTask?.sectionId === section.id && selectedTask?.cardId === card.id && selectedTask?.taskIndex === tIdx;
                                    const isEditing = editingTask?.sectionId === section.id && editingTask?.cardId === card.id && editingTask?.taskIndex === tIdx;
                                    const taskStatus = task.done ? "completed" : task.cancelledReason ? "cancelled" : (task.actStart ? "inprogress" : "pending");
                                    const statusColor = STATUS_COLORS[taskStatus as keyof typeof STATUS_COLORS];
                                    const statusBg = `${statusColor}08`;

                                    return (
                                      <motion.div
                                        key={tIdx}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all group border
                                          ${isSelected ? "bg-github-blue/10 border-github-blue/30" : `border-transparent`}`}
                                        style={{ backgroundColor: statusBg }}
                                        onClick={() => setSelectedTask({ sectionId: section.id, cardId: card.id, taskIndex: tIdx })}
                                        onContextMenu={(e) => handleContextMenu(e, section.id, card.id, tIdx, task)}
                                      >
                                        <button
                                          onClick={(e) => { e.stopPropagation(); toggleTask(section.id, card.id, tIdx); }}
                                          className="shrink-0"
                                        >
                                          {task.done ? (
                                            <CheckSquare className="w-4 h-4 text-github-green-bright" />
                                          ) : task.cancelledReason ? (
                                            <XCircle className="w-4 h-4 text-github-dim" />
                                          ) : (
                                            <Square className="w-4 h-4 text-github-dim hover:text-github-fg" />
                                          )}
                                        </button>

                                        {isEditing ? (
                                          <input
                                            autoFocus
                                            className="input-field text-sm py-0.5"
                                            defaultValue={task.text}
                                            onBlur={(e) => editTaskText(section.id, card.id, tIdx, e.target.value)}
                                            onKeyDown={(e) => {
                                              if (e.key === "Enter") editTaskText(section.id, card.id, tIdx, e.currentTarget.value);
                                              if (e.key === "Escape") setEditingTask(null);
                                            }}
                                          />
                                        ) : (
                                          <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium truncate text-github-fg">{task.text}</div>

                                            <div className="mt-1 grid grid-cols-4 gap-2 text-xs">
                                              <DateInput
                                                label="est-start"
                                                value={task.estStart}
                                                onChange={(v) => {
                                                  const newData = { ...data };
                                                  const sec = newData.sections.find(s => s.id === section.id)!;
                                                  const c = sec.cards.find(c => c.id === card.id)!;
                                                  c.tasks[tIdx].estStart = v;
                                                  onUpdate(newData);
                                                }}
                                              />
                                              <DateInput
                                                label="est-end"
                                                value={task.estEnd}
                                                onChange={(v) => {
                                                  const newData = { ...data };
                                                  const sec = newData.sections.find(s => s.id === section.id)!;
                                                  const c = sec.cards.find(c => c.id === card.id)!;
                                                  c.tasks[tIdx].estEnd = v;
                                                  onUpdate(newData);
                                                }}
                                              />
                                              <DateInput
                                                label="act-start"
                                                value={task.actStart}
                                                onChange={(v) => {
                                                  const newData = { ...data };
                                                  const sec = newData.sections.find(s => s.id === section.id)!;
                                                  const c = sec.cards.find(c => c.id === card.id)!;
                                                  c.tasks[tIdx].actStart = v;
                                                  onUpdate(newData);
                                                }}
                                              />
                                              <DateInput
                                                label="act-end"
                                                value={task.actEnd}
                                                onChange={(v) => {
                                                  const newData = { ...data };
                                                  const sec = newData.sections.find(s => s.id === section.id)!;
                                                  const c = sec.cards.find(c => c.id === card.id)!;
                                                  c.tasks[tIdx].actEnd = v;
                                                  onUpdate(newData);
                                                }}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 shrink-0">
                                          <button
                                            onClick={(e) => { e.stopPropagation(); setEditingTask({ sectionId: section.id, cardId: card.id, taskIndex: tIdx, text: task.text }); }}
                                            className="p-1 rounded hover:bg-github-border text-github-dim hover:text-github-fg"
                                          >
                                            <Edit3 className="w-3 h-3" />
                                          </button>
                                          <button
                                            onClick={(e) => { e.stopPropagation(); deleteTask(section.id, card.id, tIdx); }}
                                            className="p-1 rounded hover:bg-github-red/20 text-github-dim hover:text-github-red"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        </div>
                                      </motion.div>
                                    );
                                  })}

                                  {/* Add Task Button */}
                                  {addingTask?.sectionId === section.id && addingTask?.cardId === card.id ? (
                                    <div className="flex items-center gap-2 px-3 py-1.5 ml-6">
                                      <Square className="w-4 h-4 text-github-dim" />
                                      <input
                                        autoFocus
                                        className="input-field text-sm py-0.5 flex-1"
                                        placeholder="New task name..."
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") addTask(section.id, card.id);
                                          if (e.key === "Escape") { setAddingTask(null); setNewTaskText(""); }
                                        }}
                                        onBlur={() => { if (newTaskText.trim()) addTask(section.id, card.id); else { setAddingTask(null); setNewTaskText(""); }}}
                                      />
                                    </div>
                                  ) : (
                                    <button
                                      onClick={() => setAddingTask({ sectionId: section.id, cardId: card.id })}
                                      className="flex items-center gap-2 px-3 py-1.5 ml-6 text-xs text-github-dim hover:text-github-blue transition-colors"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      Add task
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Milestones/Blockers */}
      <div className="w-[420px] flex flex-col gap-4 shrink-0">
        <div className="glass-panel flex-1 overflow-hidden flex flex-col">
          <div className="px-4 py-3 border-b border-github-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode(viewMode === "milestones" ? "blockers" : "milestones")}
                className="flex items-center gap-2"
              >
                {viewMode === "milestones" ? (
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-github-purple" />
                    Milestones
                  </h2>
                ) : (
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-github-red" />
                    Blockers
                  </h2>
                )}
              </button>
            </div>
            <span className="text-xs text-github-dim">
              {viewMode === "milestones" ? `${data.milestones.length} milestones` : `${data.blockers.length} blockers`}
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {viewMode === "milestones" ? (
            data.milestones.map((ms, idx) => (
              <motion.div
                key={ms.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className={`p-3 rounded-lg mb-2 cursor-pointer transition-all border
                  ${selectedMilestone === ms.id 
                    ? "bg-github-blue/10 border-github-blue/30" 
                    : "bg-github-card/50 border-github-border/50 hover:border-github-border"}`}
                onClick={() => setSelectedMilestone(selectedMilestone === ms.id ? null : ms.id)}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg shrink-0">{STATUS_EMOJI[ms.status as keyof typeof STATUS_EMOJI] || "⚪"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold text-github-fg truncate">{ms.name.replace(/[📦📐🔲📤⚡⚙️🌐🖥️🔋🧪📚🚀🏁]/g, "").trim()}</h3>
                      <span className={`status-badge text-xs shrink-0 status-${ms.status}`}>
                        {ms.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-github-dim">
                      <span>{ms.category}</span>
                      {ms.estEnd && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" /> Est: {ms.estEnd}</span>}
                      {ms.actEnd && <span className="flex items-center gap-1 text-github-green-bright"><CheckSquare className="w-3 h-3" /> Done: {ms.actEnd}</span>}
                      {ms.variance && <span className={`${ms.variance.startsWith("+") ? "text-github-red" : "text-github-green-bright"}`}>{ms.variance}</span>}
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-2">
                      <div className="w-full h-1.5 bg-github-bg rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-500"
                          style={{ 
                            width: `${ms.progress}%`,
                            backgroundColor: STATUS_COLORS[ms.status as keyof typeof STATUS_COLORS] || "#8b949e"
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Milestone Actions */}
                <AnimatePresence>
                  {selectedMilestone === ms.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-3 pt-3 border-t border-github-border overflow-hidden"
                    >
                      <div className="flex gap-2">
                        <button onClick={() => setMilestoneStatus(ms.id, "completed")} className="btn-primary text-xs py-1.5 flex-1">
                          <CheckSquare className="w-3.5 h-3.5" /> Complete
                        </button>
                        <button onClick={() => setMilestoneStatus(ms.id, "inprogress")} className="btn-secondary text-xs py-1.5 flex-1">
                          <ArrowRightCircle className="w-3.5 h-3.5" /> In Progress
                        </button>
                        <button onClick={() => setMilestoneStatus(ms.id, "pending")} className="btn-secondary text-xs py-1.5 flex-1">
                          <CircleDashed className="w-3.5 h-3.5" /> Pending
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
            ) : (
              data.blockers.map((blocker, idx) => (
                <motion.div
                  key={blocker.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  className="p-3 rounded-lg mb-2 transition-all border bg-github-card/50 border-github-border/50 hover:border-github-border"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-3 h-3 rounded-full mt-1 shrink-0"
                      style={{ backgroundColor: blocker.color || "#f85149" }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-github-fg truncate">{blocker.title}</h3>
                      <p className="text-xs text-github-dim mt-1">{blocker.description}</p>
                      {blocker.affects && (
                        <p className="text-xs text-github-dim mt-1.5"><strong>Affects:</strong> {blocker.affects}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setContextMenu(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              style={{ left: contextMenu.x, top: contextMenu.y }}
              className="fixed z-50 bg-github-card border border-github-border rounded-xl shadow-2xl py-1 min-w-[180px]"
            >
              <button
                onClick={() => setTaskStatus(contextMenu.task.sectionId, contextMenu.task.cardId, contextMenu.task.taskIndex, "done")}
                className="w-full px-4 py-2 text-left text-sm text-github-fg hover:bg-github-green/10 hover:text-github-green-bright flex items-center gap-2 transition-colors"
              >
                <CheckSquare className="w-4 h-4" /> Mark Complete
              </button>
              <button
                onClick={() => setTaskStatus(contextMenu.task.sectionId, contextMenu.task.cardId, contextMenu.task.taskIndex, "inprogress")}
                className="w-full px-4 py-2 text-left text-sm text-github-fg hover:bg-github-yellow/10 hover:text-github-yellow flex items-center gap-2 transition-colors"
              >
                <ArrowRightCircle className="w-4 h-4" /> Set In Progress
              </button>
              <button
                onClick={() => setTaskStatus(contextMenu.task.sectionId, contextMenu.task.cardId, contextMenu.task.taskIndex, "pending")}
                className="w-full px-4 py-2 text-left text-sm text-github-fg hover:bg-github-red/10 hover:text-github-red flex items-center gap-2 transition-colors"
              >
                <CircleDashed className="w-4 h-4" /> Set Pending
              </button>
              <div className="h-px bg-github-border my-1" />
              <button
                onClick={() => {
                  const reason = prompt("Reason for cancellation:");
                  if (reason) setTaskStatus(contextMenu.task.sectionId, contextMenu.task.cardId, contextMenu.task.taskIndex, "cancelled", reason);
                }}
                className="w-full px-4 py-2 text-left text-sm text-github-fg hover:bg-github-dim/10 hover:text-github-dim flex items-center gap-2 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Cancel Task...
              </button>
              <div className="h-px bg-github-border my-1" />
              <button
                onClick={() => {
                  setDetailsPanel({ sectionId: contextMenu.task.sectionId, cardId: contextMenu.task.cardId, taskIndex: contextMenu.task.taskIndex });
                  setContextMenu(null);
                }}
                className="w-full px-4 py-2 text-left text-sm text-github-fg hover:bg-github-blue/10 hover:text-github-blue flex items-center gap-2 transition-colors"
              >
                <Edit3 className="w-4 h-4" /> Edit Details...
              </button>
              <button
                onClick={() => deleteTask(contextMenu.task.sectionId, contextMenu.task.cardId, contextMenu.task.taskIndex)}
                className="w-full px-4 py-2 text-left text-sm text-github-fg hover:bg-github-red/10 hover:text-github-red flex items-center gap-2 transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Task
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Task Details Panel */}
      <AnimatePresence>
        {detailsPanel && (
          <TaskDetailsPanel
            data={data}
            onUpdate={onUpdate}
            sectionId={detailsPanel.sectionId}
            cardId={detailsPanel.cardId}
            taskIndex={detailsPanel.taskIndex}
            onClose={() => setDetailsPanel(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, color, bg, border, icon: Icon }: { label: string; value: number; color: string; bg: string; border: string; icon: React.ElementType }) {
  return (
    <motion.div 
      whileHover={{ scale: 1.02 }}
      className={`${bg} ${border} border rounded-xl p-4 flex items-center gap-3`}
    >
      <div className={`p-2 rounded-lg ${bg}`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
      <div>
        <div className={`text-2xl font-bold ${color}`}>{value}</div>
        <div className="text-xs text-github-dim">{label}</div>
      </div>
    </motion.div>
  );
}

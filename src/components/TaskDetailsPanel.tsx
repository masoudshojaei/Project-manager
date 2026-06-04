import { useState } from "react";
import { motion } from "framer-motion";
import {
  X,
  CheckSquare,
  CircleDashed,
  XCircle,
  PlayCircle,
  CalendarDays,
  StickyNote,
  AlertTriangle,
} from "lucide-react";
import type { ProjectData, Task } from "../types";
import DateInput from "./DateInput";

interface TaskDetailsPanelProps {
  data: ProjectData;
  onUpdate: (data: ProjectData) => void;
  sectionId: string;
  cardId: string;
  taskIndex: number;
  onClose: () => void;
}

function getTaskStatus(task: Task): "completed" | "cancelled" | "inprogress" | "pending" {
  if (task.done) return "completed";
  if (task.cancelledReason) return "cancelled";
  if (task.actStart) return "inprogress";
  return "pending";
}

export default function TaskDetailsPanel({
  data,
  onUpdate,
  sectionId,
  cardId,
  taskIndex,
  onClose,
}: TaskDetailsPanelProps) {
  const section = data.sections.find((s) => s.id === sectionId)!;
  const card = section.cards.find((c) => c.id === cardId)!;
  const task = card.tasks[taskIndex];

  const [note, setNote] = useState(task.note || "");
  const [blockers, setBlockers] = useState(task.blockers?.join("\n") || "");
  const [cancelReason, setCancelReason] = useState(task.cancelledReason || "");
  const [currentStatus, setCurrentStatus] = useState(getTaskStatus(task));

  const updateTask = (updates: Partial<Task>) => {
    const newData = { ...data };
    const sec = newData.sections.find((s) => s.id === sectionId)!;
    const c = sec.cards.find((c) => c.id === cardId)!;
    Object.assign(c.tasks[taskIndex], updates);

    // Recalculate card progress
    const total = c.tasks.length;
    const done = c.tasks.filter((t) => t.done && !t.cancelledReason).length;
    c.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    if (c.progress === 100) c.status = "completed";
    else if (c.progress > 0) c.status = "inprogress";
    else c.status = "pending";

    onUpdate(newData);
  };

  const handleStatusChange = (status: "completed" | "inprogress" | "pending" | "cancelled") => {
    setCurrentStatus(status);

    if (status === "completed") {
      updateTask({
        done: true,
        cancelledReason: undefined,
        actStart: task.actStart || new Date().toISOString().split("T")[0],
        actEnd: new Date().toISOString().split("T")[0],
      });
    } else if (status === "inprogress") {
      updateTask({
        done: false,
        cancelledReason: undefined,
        actStart: task.actStart || new Date().toISOString().split("T")[0],
        actEnd: undefined,
      });
    } else if (status === "pending") {
      updateTask({
        done: false,
        cancelledReason: undefined,
        actStart: undefined,
        actEnd: undefined,
      });
    } else if (status === "cancelled") {
      const reason = cancelReason || "Cancelled";
      updateTask({
        done: false,
        cancelledReason: reason,
        actEnd: undefined,
      });
    }
  };

  const statusOptions = [
    { value: "completed" as const, label: "Completed", icon: CheckSquare, color: "#238636", desc: "Task is finished" },
    { value: "inprogress" as const, label: "In Progress", icon: PlayCircle, color: "#d29922", desc: "Currently working on it" },
    { value: "pending" as const, label: "Pending", icon: CircleDashed, color: "#f85149", desc: "Not started yet" },
    { value: "cancelled" as const, label: "Cancelled", icon: XCircle, color: "#8b949e", desc: "No longer needed" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 300 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 300 }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed right-0 top-0 bottom-0 w-[420px] bg-github-card border-l border-github-border shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="px-5 py-4 border-b border-github-border flex items-center justify-between shrink-0">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <StickyNote className="w-5 h-5 text-github-blue" />
          Task Details
        </h2>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-github-border/50 text-github-dim hover:text-github-fg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Task Name */}
        <div>
          <label className="text-xs font-medium text-github-dim uppercase tracking-wider mb-2 block">
            Task Name
          </label>
          <input
            className="input-field w-full text-base"
            value={task.text}
            onChange={(e) => updateTask({ text: e.target.value })}
          />
        </div>

        {/* ── STATUS: RADIO BUTTON GROUP (mutually exclusive) ── */}
        <div>
          <label className="text-xs font-medium text-github-dim uppercase tracking-wider mb-3 block">
            Status
          </label>
          <div className="space-y-2">
            {statusOptions.map((opt) => {
              const isSelected = currentStatus === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleStatusChange(opt.value)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left
                    ${isSelected
                      ? "border-2"
                      : "border-github-border/50 hover:border-github-border bg-github-bg/30"
                    }`}
                  style={{
                    borderColor: isSelected ? opt.color : undefined,
                    backgroundColor: isSelected ? `${opt.color}15` : undefined,
                  }}
                >
                  {/* Radio circle */}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors"
                    style={{
                      borderColor: isSelected ? opt.color : "#8b949e",
                    }}
                  >
                    {isSelected && (
                      <div
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: opt.color }}
                      />
                    )}
                  </div>

                  <Icon className="w-5 h-5 shrink-0" style={{ color: opt.color }} />

                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-github-fg">{opt.label}</div>
                    <div className="text-xs text-github-dim">{opt.desc}</div>
                  </div>

                  {isSelected && (
                    <CheckSquare className="w-4 h-4 shrink-0" style={{ color: opt.color }} />
                  )}
                </button>
              );
            })}
          </div>

          {/* Cancel reason input (only when cancelled) */}
          {currentStatus === "cancelled" && (
            <div className="mt-3">
              <label className="text-xs text-github-dim mb-1 block">Cancellation Reason</label>
              <input
                className="input-field w-full text-sm"
                placeholder="Why was this task cancelled?"
                value={cancelReason}
                onChange={(e) => {
                  setCancelReason(e.target.value);
                  updateTask({ cancelledReason: e.target.value || "Cancelled" });
                }}
              />
            </div>
          )}
        </div>

        {/* Dates */}
        <div>
          <label className="text-xs font-medium text-github-dim uppercase tracking-wider mb-3 block flex items-center gap-2">
            <CalendarDays className="w-3.5 h-3.5" />
            Dates
          </label>
          <div className="grid grid-cols-2 gap-3">
            <DateInput
              label="Estimated Start"
              value={task.estStart}
              onChange={(v) => updateTask({ estStart: v })}
            />
            <DateInput
              label="Estimated End"
              value={task.estEnd}
              onChange={(v) => updateTask({ estEnd: v })}
            />
            <DateInput
              label="Actual Start"
              value={task.actStart}
              onChange={(v) => updateTask({ actStart: v })}
            />
            <DateInput
              label="Actual End"
              value={task.actEnd}
              onChange={(v) => updateTask({ actEnd: v })}
            />
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-medium text-github-dim uppercase tracking-wider mb-2 block">
            Notes
          </label>
          <textarea
            className="input-field w-full text-sm min-h-[100px] resize-y"
            placeholder="Add notes about this task..."
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              updateTask({ note: e.target.value });
            }}
          />
        </div>

        {/* Blockers */}
        <div>
          <label className="text-xs font-medium text-github-dim uppercase tracking-wider mb-2 block flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-github-yellow" />
            Blockers
          </label>
          <textarea
            className="input-field w-full text-sm min-h-[80px] resize-y"
            placeholder="What's blocking this task?"
            value={blockers}
            onChange={(e) => {
              setBlockers(e.target.value);
              updateTask({ blockers: e.target.value ? [e.target.value] : undefined });
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-github-border shrink-0">
        <button
          onClick={onClose}
          className="btn-primary w-full text-sm py-2"
        >
          Done
        </button>
      </div>
    </motion.div>
  );
}
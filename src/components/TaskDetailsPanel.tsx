import { motion } from "framer-motion";
import { X } from "lucide-react";
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

export default function TaskDetailsPanel({
  data,
  onUpdate,
  sectionId,
  cardId,
  taskIndex,
  onClose,
}: TaskDetailsPanelProps) {
  const section = data.sections.find((s) => s.id === sectionId);
  const card = section?.cards.find((c) => c.id === cardId);
  const task = card?.tasks[taskIndex];

  if (!task) return null;

  const updateField = (field: keyof Task, value: any) => {
    const newData = { ...data };
    const sec = newData.sections.find((s) => s.id === sectionId)!;
    const c = sec.cards.find((card) => card.id === cardId)!;
    (c.tasks[taskIndex] as any)[field] = value;
    onUpdate(newData);
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      className="fixed right-0 top-0 bottom-0 w-96 bg-github-card border-l border-github-border shadow-2xl z-50 overflow-y-auto"
    >
      <div className="p-6 sticky top-0 bg-github-card border-b border-github-border flex items-center justify-between">
        <h2 className="text-lg font-bold text-white">Task Details</h2>
        <button
          onClick={onClose}
          className="p-1 hover:bg-github-border rounded transition-colors"
        >
          <X className="w-5 h-5 text-github-dim" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Task Name */}
        <div>
          <label className="text-xs font-semibold text-github-dim uppercase tracking-wider block mb-2">
            Task Name
          </label>
          <input
            type="text"
            value={task.text}
            onChange={(e) => updateField("text", e.target.value)}
            className="input-field text-sm"
          />
        </div>

        {/* Status */}
        <div>
          <label className="text-xs font-semibold text-github-dim uppercase tracking-wider block mb-2">
            Status
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={task.done}
                onChange={(e) => updateField("done", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm text-github-fg">Completed</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!!task.cancelledReason}
                onChange={(e) =>
                  updateField("cancelledReason", e.target.checked ? "Cancelled" : null)
                }
                className="w-4 h-4"
              />
              <span className="text-sm text-github-fg">Cancelled</span>
            </label>
          </div>
        </div>

        {/* Dates */}
        <div className="space-y-4 border-t border-github-border pt-4">
          <h3 className="text-sm font-bold text-white">Task Timeline</h3>

          <DateInput
            label="Estimated Start"
            value={task.estStart}
            onChange={(value) => updateField("estStart", value)}
          />

          <DateInput
            label="Estimated End"
            value={task.estEnd}
            onChange={(value) => updateField("estEnd", value)}
          />

          <DateInput
            label="Actual Start"
            value={task.actStart}
            onChange={(value) => updateField("actStart", value)}
          />

          <DateInput
            label="Actual End"
            value={task.actEnd}
            onChange={(value) => updateField("actEnd", value)}
          />
        </div>

        {/* Blockers */}
        <div>
          <label className="text-xs font-semibold text-github-dim uppercase tracking-wider block mb-2">
            Blockers
          </label>
          <input
            type="text"
            value={task.blockers?.join(",") || ""}
            onChange={(e) => {
              const blockers = e.target.value
                .split(",")
                .map((b) => b.trim())
                .filter((b) => b.length > 0);
              updateField("blockers", blockers.length > 0 ? blockers : undefined);
            }}
            placeholder="blk_0,blk_1"
            className="input-field text-sm text-xs"
          />
          <p className="text-xs text-github-dim mt-2">
            Available blockers: {data.blockers.map((b) => b.id).join(", ")}
          </p>
        </div>

        {/* Notes */}
        <div>
          <label className="text-xs font-semibold text-github-dim uppercase tracking-wider block mb-2">
            Notes
          </label>
          <textarea
            value={task.note || ""}
            onChange={(e) => updateField("note", e.target.value || undefined)}
            placeholder="Add notes..."
            className="input-field text-sm p-3 resize-none h-24"
          />
        </div>

        {/* Deletion Info */}
        <div className="text-xs text-github-dim border-t border-github-border pt-4">
          <p>Click the task in the left panel to edit more details or delete it.</p>
        </div>
      </div>
    </motion.div>
  );
}

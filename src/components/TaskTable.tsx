import { useState } from "react";
import { motion } from "framer-motion";
import { Trash2 } from "lucide-react";
import type { ProjectData, Task } from "../types";
import { getTaskStatus } from "../dateUtils";
import { STATUS_COLORS } from "../types";

interface TaskTableProps {
  data: ProjectData;
  onUpdate: (data: ProjectData) => void;
  sectionId: string;
  cardId: string;
}

interface EditingCell {
  taskIndex: number;
  field: keyof Task;
}

export default function TaskTable({
  data,
  onUpdate,
  sectionId,
  cardId,
}: TaskTableProps) {
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [editValue, setEditValue] = useState("");

  const section = data.sections.find((s) => s.id === sectionId);
  const card = section?.cards.find((c) => c.id === cardId);
  const tasks = card?.tasks || [];

  const handleCellClick = (taskIndex: number, field: keyof Task) => {
    const task = tasks[taskIndex];
    const value = task[field];
    setEditingCell({ taskIndex, field });
    setEditValue(typeof value === "string" ? value : "");
  };

  const handleSaveCell = () => {
    if (!editingCell) return;
    
    const newData = { ...data };
    const sec = newData.sections.find((s) => s.id === sectionId)!;
    const c = sec.cards.find((card) => card.id === cardId)!;
    const task = c.tasks[editingCell.taskIndex];

    // Handle different field types
    if (editingCell.field === "blockers") {
      task.blockers = editValue
        .split(",")
        .map((b) => b.trim())
        .filter((b) => b.length > 0);
    } else if (editingCell.field === "done") {
      task.done = !task.done;
    } else if (
      ["estStart", "estEnd", "actStart", "actEnd"].includes(
        editingCell.field
      )
    ) {
      (task as any)[editingCell.field] =
        editValue.trim() === "" ? undefined : editValue.trim();
    } else {
      (task as any)[editingCell.field] = editValue.trim() || undefined;
    }

    onUpdate(newData);
    setEditingCell(null);
  };

  const handleDeleteTask = (taskIndex: number) => {
    const newData = { ...data };
    const sec = newData.sections.find((s) => s.id === sectionId)!;
    const c = sec.cards.find((card) => card.id === cardId)!;
    c.tasks.splice(taskIndex, 1);

    // Recalculate card progress
    const total = c.tasks.length;
    const done = c.tasks.filter((t) => t.done && !t.cancelledReason).length;
    c.progress = total > 0 ? Math.round((done / total) * 100) : 0;
    if (c.progress === 100) c.status = "completed";
    else if (c.progress > 0) c.status = "inprogress";
    else c.status = "pending";

    onUpdate(newData);
  };

  if (tasks.length === 0) {
    return <p className="text-github-dim text-sm p-4">No tasks yet</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-github-border">
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Status
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Task
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Est Start
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Est End
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Act Start
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Act End
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Blockers
            </th>
            <th className="text-left px-3 py-2 text-github-dim font-medium">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task, idx) => {
            const status = getTaskStatus(task.done, task.cancelledReason, task.actStart);
            const statusColor = STATUS_COLORS[status];

            return (
              <motion.tr
                key={idx}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="border-b border-github-border/50 hover:bg-github-border/10 transition-colors"
              >
                {/* Status cell */}
                <td
                  className="px-3 py-2 cursor-pointer"
                  onClick={() => handleCellClick(idx, "done")}
                >
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: statusColor }}
                  />
                </td>

                {/* Task text */}
                <td className="px-3 py-2">
                  {editingCell?.taskIndex === idx &&
                  editingCell?.field === "text" ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveCell}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveCell()
                      }
                      className="input-field text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-github-blue transition-colors"
                      onClick={() => handleCellClick(idx, "text")}
                    >
                      {task.text}
                    </span>
                  )}
                </td>

                {/* Est Start */}
                <td className="px-3 py-2">
                  {editingCell?.taskIndex === idx &&
                  editingCell?.field === "estStart" ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveCell}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveCell()
                      }
                      placeholder="dd/mm/yyyy"
                      className="input-field text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-github-blue transition-colors text-github-dim"
                      onClick={() => handleCellClick(idx, "estStart")}
                    >
                      {task.estStart || "-"}
                    </span>
                  )}
                </td>

                {/* Est End */}
                <td className="px-3 py-2">
                  {editingCell?.taskIndex === idx &&
                  editingCell?.field === "estEnd" ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveCell}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveCell()
                      }
                      placeholder="dd/mm/yyyy"
                      className="input-field text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-github-blue transition-colors text-github-dim"
                      onClick={() => handleCellClick(idx, "estEnd")}
                    >
                      {task.estEnd || "-"}
                    </span>
                  )}
                </td>

                {/* Act Start */}
                <td className="px-3 py-2">
                  {editingCell?.taskIndex === idx &&
                  editingCell?.field === "actStart" ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveCell}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveCell()
                      }
                      placeholder="dd/mm/yyyy"
                      className="input-field text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-github-blue transition-colors text-github-dim"
                      onClick={() => handleCellClick(idx, "actStart")}
                    >
                      {task.actStart || "-"}
                    </span>
                  )}
                </td>

                {/* Act End */}
                <td className="px-3 py-2">
                  {editingCell?.taskIndex === idx &&
                  editingCell?.field === "actEnd" ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveCell}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveCell()
                      }
                      placeholder="dd/mm/yyyy"
                      className="input-field text-xs"
                    />
                  ) : (
                    <span
                      className="cursor-pointer hover:text-github-blue transition-colors text-github-dim"
                      onClick={() => handleCellClick(idx, "actEnd")}
                    >
                      {task.actEnd || "-"}
                    </span>
                  )}
                </td>

                {/* Blockers */}
                <td className="px-3 py-2">
                  {editingCell?.taskIndex === idx &&
                  editingCell?.field === "blockers" ? (
                    <input
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={handleSaveCell}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handleSaveCell()
                      }
                      placeholder="blk_0,blk_1"
                      className="input-field text-xs"
                    />
                  ) : (
                    <div
                      className="flex flex-wrap gap-1 cursor-pointer"
                      onClick={() => handleCellClick(idx, "blockers")}
                    >
                      {task.blockers && task.blockers.length > 0 ? (
                        task.blockers.map((blk) => {
                          const blocker = data.blockers.find((b) => b.id === blk);
                          return (
                            <span
                              key={blk}
                              className="text-xs px-2 py-0.5 rounded text-white"
                              style={{
                                backgroundColor: blocker?.color || "#a371f7",
                              }}
                            >
                              {blk}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-github-dim">-</span>
                      )}
                    </div>
                  )}
                </td>

                {/* Delete action */}
                <td className="px-3 py-2">
                  <button
                    onClick={() => handleDeleteTask(idx)}
                    className="text-github-dim hover:text-github-red transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

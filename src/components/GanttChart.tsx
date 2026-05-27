import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, ZoomIn, ZoomOut, RefreshCw } from "lucide-react";
import type { ProjectData } from "../types";
import { STATUS_COLORS } from "../types";
import { format, parseISO, addDays, differenceInDays, isValid } from "date-fns";

interface GanttChartProps {
  data: ProjectData;
}

type ViewMode = "milestones" | "tasks";

interface GanttItem {
  id: string;
  name: string;
  start: Date;
  end: Date;
  status: string;
  progress: number;
  category?: string;
}

export default function GanttChart({ data }: GanttChartProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("milestones");
  const [zoom, setZoom] = useState(1);
  const [scrollX, setScrollX] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  const items = useMemo(() => {
    const result: GanttItem[] = [];

    if (viewMode === "milestones") {
      for (const ms of data.milestones) {
        if (ms.estEnd) {
          try {
            const end = parseISO(ms.estEnd);
            if (!isValid(end)) continue;
            const start = addDays(end, -30);
            const actEnd = ms.actEnd ? parseISO(ms.actEnd) : null;
            result.push({
              id: ms.id,
              name: ms.name.replace(/[📦📐🔲📤⚡⚙️🌐🖥️🔋🧪📚🚀🏁]/g, "").trim(),
              start,
              end: actEnd && isValid(actEnd) ? actEnd : end,
              status: ms.status,
              progress: ms.progress,
              category: ms.category,
            });
          } catch { /* skip invalid dates */ }
        }
      }
    } else {
      for (const sec of data.sections) {
        for (const card of sec.cards) {
          for (const task of card.tasks) {
            if (task.estEnd && !task.cancelledReason) {
              try {
                const end = parseISO(task.estEnd);
                if (!isValid(end)) continue;
                const start = addDays(end, -14);
                result.push({
                  id: `${sec.id}-${card.id}-${task.text}`,
                  name: `${sec.title.slice(0, 12)}: ${task.text.slice(0, 30)}`,
                  start,
                  end,
                  status: task.done ? "completed" : "pending",
                  progress: task.done ? 100 : 0,
                  category: sec.title,
                });
              } catch { /* skip invalid dates */ }
            }
          }
        }
      }
    }

    return result.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [data, viewMode]);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (items.length === 0) return { minDate: new Date(), maxDate: addDays(new Date(), 30), totalDays: 30 };
    const min = new Date(Math.min(...items.map(i => i.start.getTime())));
    const max = new Date(Math.max(...items.map(i => i.end.getTime())));
    const padding = 7;
    return {
      minDate: addDays(min, -padding),
      maxDate: addDays(max, padding),
      totalDays: differenceInDays(max, min) + padding * 2,
    };
  }, [items]);

  const dayWidth = (40 * zoom);
  const chartWidth = totalDays * dayWidth;
  const today = new Date();
  const todayX = differenceInDays(today, minDate) * dayWidth;

  // Mouse drag for scrolling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastX.current = e.clientX;
      container.style.cursor = "grabbing";
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = e.clientX - lastX.current;
      setScrollX(prev => {
        const newScroll = prev - delta;
        const maxScroll = chartWidth - container.clientWidth + 100;
        return Math.max(-50, Math.min(newScroll, maxScroll));
      });
      lastX.current = e.clientX;
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      container.style.cursor = "grab";
    };

    container.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      container.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [chartWidth]);

  if (items.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <CalendarDays className="w-16 h-16 text-github-dim mx-auto mb-4" />
          <p className="text-github-dim text-lg">No items with dates to display</p>
          <p className="text-github-dim/60 text-sm mt-2">Add estimated end dates to tasks or milestones</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-14 border-b border-github-border flex items-center px-6 gap-4 shrink-0">
        <div className="flex items-center gap-2 bg-github-card rounded-lg p-1 border border-github-border">
          <button
            onClick={() => setViewMode("milestones")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === "milestones" ? "bg-github-blue/20 text-github-blue" : "text-github-dim hover:text-github-fg"
            }`}
          >
            Milestones
          </button>
          <button
            onClick={() => setViewMode("tasks")}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
              viewMode === "tasks" ? "bg-github-blue/20 text-github-blue" : "text-github-dim hover:text-github-fg"
            }`}
          >
            Tasks
          </button>
        </div>

        <div className="h-6 w-px bg-github-border" />

        <div className="flex items-center gap-2">
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.2))} className="btn-secondary p-2">
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs text-github-dim w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(3, z + 0.2))} className="btn-secondary p-2">
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>

        <div className="h-6 w-px bg-github-border" />

        <button onClick={() => setScrollX(todayX - 400)} className="btn-secondary text-sm">
          <RefreshCw className="w-4 h-4" />
          Go to Today
        </button>

        <div className="ml-auto text-xs text-github-dim">
          {items.length} items • {format(minDate, "MMM d")} - {format(maxDate, "MMM d, yyyy")}
        </div>
      </div>

      {/* Chart */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative cursor-grab select-none"
        style={{ background: "linear-gradient(180deg, #0d1117 0%, #0d1117 100%)" }}
      >
        <div 
          className="absolute inset-0"
          style={{ 
            transform: `translateX(${-scrollX}px)`,
            width: chartWidth + 200,
          }}
        >
          {/* Grid Lines */}
          {Array.from({ length: totalDays + 1 }).map((_, i) => {
            const date = addDays(minDate, i);
            const isWeekend = date.getDay() === 0 || date.getDay() === 6;
            const isMonthStart = date.getDate() === 1;
            const x = i * dayWidth;

            return (
              <div key={i}>
                {/* Day line */}
                <div 
                  className="absolute top-0 bottom-0 border-l border-github-border/20"
                  style={{ left: x, height: "100%" }}
                />
                {/* Weekend highlight */}
                {isWeekend && (
                  <div 
                    className="absolute top-0 bottom-0 bg-github-red/5"
                    style={{ left: x, width: dayWidth }}
                  />
                )}
                {/* Month label */}
                {isMonthStart && (
                  <div 
                    className="absolute top-2 text-xs font-bold text-github-dim"
                    style={{ left: x + 4 }}
                  >
                    {format(date, "MMM yyyy")}
                  </div>
                )}
                {/* Day label (every 7 days or when zoomed) */}
                {(i % 7 === 0 || zoom > 1.5) && (
                  <div 
                    className="absolute top-8 text-xs text-github-dim/60"
                    style={{ left: x + 4 }}
                  >
                    {format(date, "d")}
                  </div>
                )}
              </div>
            );
          })}

          {/* Today Line */}
          <div 
            className="absolute top-0 bottom-0 border-l-2 border-github-green-bright z-20"
            style={{ left: todayX }}
          >
            <div className="absolute -top-1 -translate-x-1/2 bg-github-green-bright text-github-bg text-xs font-bold px-2 py-0.5 rounded">
              TODAY
            </div>
          </div>

          {/* Items */}
          <div className="absolute top-16 left-0 right-0">
            {items.map((item, idx) => {
              const startOffset = differenceInDays(item.start, minDate);
              const duration = Math.max(1, differenceInDays(item.end, item.start));
              const x = startOffset * dayWidth;
              const width = duration * dayWidth;
              const y = idx * 48;
              const color = STATUS_COLORS[item.status as keyof typeof STATUS_COLORS] || "#8b949e";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="absolute group"
                  style={{ left: x, top: y, width: Math.max(width, 4) }}
                >
                  {/* Background bar */}
                  <div 
                    className="h-8 rounded-lg border overflow-hidden relative"
                    style={{ 
                      backgroundColor: `${color}15`,
                      borderColor: `${color}30`,
                    }}
                  >
                    {/* Progress fill */}
                    <div 
                      className="h-full absolute left-0 top-0 transition-all duration-700"
                      style={{ 
                        width: `${item.progress}%`,
                        backgroundColor: color,
                        opacity: 0.6,
                      }}
                    />

                    {/* Label */}
                    <div className="absolute inset-0 flex items-center px-3">
                      <span className="text-xs font-semibold text-white truncate drop-shadow-md">
                        {item.name}
                      </span>
                    </div>
                  </div>

                  {/* Tooltip */}
                  <div className="absolute left-0 top-10 opacity-0 group-hover:opacity-100 transition-opacity z-30 pointer-events-none">
                    <div className="bg-github-card border border-github-border rounded-lg p-3 shadow-2xl min-w-[200px]">
                      <div className="text-sm font-semibold text-white mb-1">{item.name}</div>
                      <div className="text-xs text-github-dim space-y-1">
                        <div>Start: {format(item.start, "MMM d, yyyy")}</div>
                        <div>End: {format(item.end, "MMM d, yyyy")}</div>
                        <div className="flex items-center gap-2">
                          Status: 
                          <span className="status-badge text-xs" style={{ color, borderColor: `${color}40`, backgroundColor: `${color}15` }}>
                            {item.status}
                          </span>
                        </div>
                        <div>Progress: {item.progress}%</div>
                        {item.category && <div>Category: {item.category}</div>}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

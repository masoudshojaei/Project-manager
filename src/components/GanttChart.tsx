import { useState, useMemo, useRef } from "react";
import { ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react";
import type { ProjectData } from "../types";

interface GanttChartProps {
  data: ProjectData;
}

const BAR_HEIGHT = 28;           // height of each bar
const BAR_GAP = 44;              // vertical gap between rows (was ~32, now more space for labels)
const LABEL_OFFSET = -20;        // pixels above the bar to place the label
const MIN_DAY_WIDTH = 4;
const MAX_DAY_WIDTH = 80;

export default function GanttChart({ data }: GanttChartProps) {
  const [zoom, setZoom] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);

  // Collect all dated items (tasks with est dates)
  const items = useMemo(() => {
    const result: {
      id: string;
      name: string;
      start: Date;
      end: Date;
      type: "est" | "act";
      status: string;
      section: string;
      card: string;
    }[] = [];

    data.sections.forEach((section) => {
      section.cards.forEach((card) => {
        card.tasks.forEach((task, idx) => {
          if (task.estStart && task.estEnd) {
            result.push({
              id: `${section.id}-${card.id}-${idx}-est`,
              name: task.text,
              start: new Date(task.estStart),
              end: new Date(task.estEnd),
              type: "est",
              status: task.done
                ? "completed"
                : task.cancelledReason
                ? "cancelled"
                : task.actStart
                ? "inprogress"
                : "pending",
              section: section.title,
              card: card.name,
            });
          }
          if (task.actStart && task.actEnd) {
            result.push({
              id: `${section.id}-${card.id}-${idx}-act`,
              name: `${task.text} (actual)`,
              start: new Date(task.actStart),
              end: new Date(task.actEnd),
              type: "act",
              status: task.done
                ? "completed"
                : task.cancelledReason
                ? "cancelled"
                : "inprogress",
              section: section.title,
              card: card.name,
            });
          }
        });
      });
    });

    return result.sort((a, b) => a.start.getTime() - b.start.getTime());
  }, [data]);

  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (items.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: new Date(now.getTime() + 30 * 86400000), totalDays: 30 };
    }
    const starts = items.map((i) => i.start.getTime());
    const ends = items.map((i) => i.end.getTime());
    const min = new Date(Math.min(...starts));
    const max = new Date(Math.max(...ends));
    // Add padding
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 7);
    const days = Math.ceil((max.getTime() - min.getTime()) / 86400000);
    return { minDate: min, maxDate: max, totalDays: Math.max(days, 14) };
  }, [items]);

  const dayWidth = Math.max(MIN_DAY_WIDTH, Math.min(MAX_DAY_WIDTH, zoom));
  const chartWidth = totalDays * dayWidth;

  const getX = (date: Date) => {
    const days = (date.getTime() - minDate.getTime()) / 86400000;
    return days * dayWidth;
  };

  const getWidth = (start: Date, end: Date) => {
    const days = (end.getTime() - start.getTime()) / 86400000;
    return Math.max(dayWidth * 0.5, days * dayWidth);
  };

  const monthLabels = useMemo(() => {
    const labels: { label: string; x: number }[] = [];
    const d = new Date(minDate);
    d.setDate(1);
    while (d <= maxDate) {
      labels.push({
        label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        x: getX(new Date(d)),
      });
      d.setMonth(d.getMonth() + 1);
    }
    return labels;
  }, [minDate, maxDate, dayWidth]);

  const statusColor = (status: string, type: "est" | "act") => {
    const base: Record<string, string> = {
      completed: "#238636",
      inprogress: "#d29922",
      pending: "#f85149",
      cancelled: "#8b949e",
    };
    const c = base[status] || "#8b949e";
    return type === "act" ? c : c + "80"; // estimated = 50% opacity
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.shiftKey) {
      e.preventDefault();
      // scroll handled by overflow-x-auto
    }
  };

  if (items.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-github-dim">
        <MoveHorizontal className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">No dated tasks to display.</p>
        <p className="text-xs mt-1">Add estimated or actual dates to tasks to see them here.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 mb-3 shrink-0">
        <button
          onClick={() => setZoom((z) => Math.max(MIN_DAY_WIDTH, z - 4))}
          className="p-2 rounded-lg bg-github-border/20 hover:bg-github-border/40 text-github-fg transition-colors"
          title="Zoom out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <span className="text-xs text-github-dim w-12 text-center">{Math.round(dayWidth)}px/d</span>
        <button
          onClick={() => setZoom((z) => Math.min(MAX_DAY_WIDTH, z + 4))}
          className="p-2 rounded-lg bg-github-border/20 hover:bg-github-border/40 text-github-fg transition-colors"
          title="Zoom in"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <div className="flex-1" />
        <div className="flex items-center gap-3 text-xs text-github-dim">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#23863680" }} /> Est. Complete</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#238636" }} /> Act. Complete</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#d2992280" }} /> Est. In Progress</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#d29922" }} /> Act. In Progress</span>
        </div>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-hidden glass-panel relative"
        onWheel={handleWheel}
      >
        <div style={{ width: chartWidth, minWidth: "100%" }} className="h-full relative">
          {/* Month headers */}
          <div className="sticky top-0 h-8 border-b border-github-border bg-github-bg/80 backdrop-blur z-10 flex items-center">
            {monthLabels.map((m, i) => (
              <div key={i} className="absolute text-xs text-github-dim font-medium px-2" style={{ left: m.x }}>
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid lines */}
          <div className="absolute inset-0 pt-8 pointer-events-none">
            {Array.from({ length: totalDays + 1 }).map((_, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 border-l border-github-border/20"
                style={{ left: i * dayWidth }}
              />
            ))}
          </div>

          {/* Bars */}
          <svg className="absolute inset-0 pt-8" style={{ width: chartWidth, height: "100%" }}>
            {items.map((item, i) => {
              const x = getX(item.start);
              const w = getWidth(item.start, item.end);
              const y = i * BAR_GAP + 16; // top padding
              const color = statusColor(item.status, item.type);
              const isEst = item.type === "est";

              return (
                <g key={item.id}>
                  {/* ── LABEL ON TOP OF BAR ── */}
                  <text
                    x={x + 4}
                    y={y + LABEL_OFFSET}
                    fill="#c9d1d9"
                    fontSize="11"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="500"
                    style={{ pointerEvents: "none" }}
                  >
                    {item.name.length > 40 ? item.name.slice(0, 37) + "..." : item.name}
                  </text>

                  {/* ── BAR ── */}
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={BAR_HEIGHT}
                    rx={4}
                    fill={color}
                    stroke={isEst ? color.replace("80", "40") : color + "60"}
                    strokeWidth={1}
                    style={{ cursor: "pointer" }}
                  >
                    <title>{`${item.name}\n${item.section} › ${item.card}\n${item.start.toLocaleDateString()} → ${item.end.toLocaleDateString()}\n${item.type === "est" ? "Estimated" : "Actual"} • ${item.status}`}</title>
                  </rect>

                  {/* ── DATE RANGE INSIDE BAR ── */}
                  {w > 60 && (
                    <text
                      x={x + w / 2}
                      y={y + BAR_HEIGHT / 2 + 4}
                      fill="#fff"
                      fontSize="10"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {`${item.start.getDate()}/${item.start.getMonth() + 1}–${item.end.getDate()}/${item.end.getMonth() + 1}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
import { useState, useMemo, useRef } from "react";
import { ZoomIn, ZoomOut, MoveHorizontal } from "lucide-react";
import type { ProjectData } from "../types";
import { parseDateToObject } from "../dateUtils";

interface GanttChartProps {
  data: ProjectData;
}

const BAR_HEIGHT = 24;
const BAR_GAP = 56;
const MIN_DAY_WIDTH = 4;
const MAX_DAY_WIDTH = 80;

/** A single row in the Gantt — one task with optional est + act bars */
interface GanttRow {
  id: string;
  name: string;
  section: string;
  card: string;
  status: string;
  estStart?: Date;
  estEnd?: Date;
  actStart?: Date;
  actEnd?: Date;
}

export default function GanttChart({ data }: GanttChartProps) {
  const [zoom, setZoom] = useState(12);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Build rows: one per task, with both est and act dates ──
  const rows = useMemo<GanttRow[]>(() => {
    const result: GanttRow[] = [];
    data.sections.forEach((section) => {
      section.cards.forEach((card) => {
        card.tasks.forEach((task, idx) => {
          const estStart = task.estStart ? (parseDateToObject(task.estStart) || undefined) : undefined;
          const estEnd = task.estEnd ? (parseDateToObject(task.estEnd) || undefined) : undefined;
          const actStart = task.actStart ? (parseDateToObject(task.actStart) || undefined) : undefined;
          const actEnd = task.actEnd ? (parseDateToObject(task.actEnd) || undefined) : undefined;

          // Only include if at least one date range exists
          if ((estStart && estEnd) || (actStart && actEnd)) {
            result.push({
              id: `${section.id}-${card.id}-${idx}`,
              name: task.text,
              section: section.title,
              card: card.name,
              status: task.done
                ? "completed"
                : task.cancelledReason
                ? "cancelled"
                : task.actStart
                ? "inprogress"
                : "pending",
              estStart,
              estEnd,
              actStart,
              actEnd,
            });
          }
        });
      });
    });
    return result.sort((a, b) => {
      const aStart = a.actStart || a.estStart;
      const bStart = b.actStart || b.estStart;
      return (aStart?.getTime() || 0) - (bStart?.getTime() || 0);
    });
  }, [data]);

  // ── Compute timeline bounds ──
  const { minDate, maxDate, totalDays } = useMemo(() => {
    if (rows.length === 0) {
      const now = new Date();
      return { minDate: now, maxDate: new Date(now.getTime() + 30 * 86400000), totalDays: 30 };
    }
    const allDates: number[] = [];
    rows.forEach((r) => {
      if (r.estStart) allDates.push(r.estStart.getTime());
      if (r.estEnd) allDates.push(r.estEnd.getTime());
      if (r.actStart) allDates.push(r.actStart.getTime());
      if (r.actEnd) allDates.push(r.actEnd.getTime());
    });
    const min = new Date(Math.min(...allDates));
    const max = new Date(Math.max(...allDates));
    min.setDate(min.getDate() - 3);
    max.setDate(max.getDate() + 7);
    const days = Math.ceil((max.getTime() - min.getTime()) / 86400000);
    return { minDate: min, maxDate: max, totalDays: Math.max(days, 14) };
  }, [rows]);

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

  // ── Color mapping ──
  const statusColor = (status: string, isActual: boolean) => {
    const base: Record<string, string> = {
      completed: "#238636",
      inprogress: "#d29922",
      pending: "#f85149",
      cancelled: "#8b949e",
    };
    const c = base[status] || "#8b949e";
    return isActual ? c : c + "50"; // estimated = 50% opacity
  };

  // ── Render ──
  if (rows.length === 0) {
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
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#238636" }} /> Actual</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: "#23863650" }} /> Estimated</span>
        </div>
      </div>

      {/* Chart */}
      <div
        ref={containerRef}
        className="flex-1 overflow-x-auto overflow-y-auto glass-panel relative"
      >
        <div style={{ width: chartWidth, minWidth: "100%" }} className="relative">
          {/* Month headers */}
          <div className="sticky top-0 h-8 border-b border-github-border bg-github-bg/90 backdrop-blur z-10 flex items-center">
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

          {/* Task rows */}
          <svg className="absolute inset-0 pt-8" style={{ width: chartWidth, height: rows.length * BAR_GAP + 40 }}>
            {rows.map((row, i) => {
              const y = i * BAR_GAP + 24;
              const hasEst = row.estStart && row.estEnd;
              const hasAct = row.actStart && row.actEnd;
              const estY = y + 2;
              const actY = y + 2; // same vertical position — actual drawn on top

              return (
                <g key={row.id}>
                  {/* Row label */}
                  <text
                    x={4}
                    y={y - 6}
                    fill="#c9d1d9"
                    fontSize="11"
                    fontFamily="system-ui, sans-serif"
                    fontWeight="500"
                    style={{ pointerEvents: "none" }}
                  >
                    {row.name.length > 50 ? row.name.slice(0, 47) + "..." : row.name}
                  </text>

                  {/* Estimated bar (bottom layer, full width) */}
                  {hasEst && (
                    <rect
                      x={getX(row.estStart!)}
                      y={estY}
                      width={getWidth(row.estStart!, row.estEnd!)}
                      height={BAR_HEIGHT}
                      rx={4}
                      fill={statusColor(row.status, false)}
                      stroke={statusColor(row.status, false).replace("50", "30")}
                      strokeWidth={1}
                      style={{ cursor: "pointer" }}
                    >
                      <title>{`${row.name} (Estimated)\n${row.section} › ${row.card}\n${row.estStart!.toLocaleDateString()} → ${row.estEnd!.toLocaleDateString()}`}</title>
                    </rect>
                  )}

                  {/* Actual bar (top layer, drawn on top of estimated) */}
                  {hasAct && (
                    <rect
                      x={getX(row.actStart!)}
                      y={actY}
                      width={getWidth(row.actStart!, row.actEnd!)}
                      height={BAR_HEIGHT}
                      rx={4}
                      fill={statusColor(row.status, true)}
                      stroke={statusColor(row.status, true) + "80"}
                      strokeWidth={2}
                      style={{ cursor: "pointer" }}
                    >
                      <title>{`${row.name} (Actual)\n${row.section} › ${row.card}\n${row.actStart!.toLocaleDateString()} → ${row.actEnd!.toLocaleDateString()}`}</title>
                    </rect>
                  )}

                  {/* Date labels inside bars */}
                  {hasEst && getWidth(row.estStart!, row.estEnd!) > 80 && !hasAct && (
                    <text
                      x={getX(row.estStart!) + getWidth(row.estStart!, row.estEnd!) / 2}
                      y={estY + BAR_HEIGHT / 2 + 4}
                      fill="#fff"
                      fontSize="9"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                      style={{ pointerEvents: "none" }}
                    >
                      {`${row.estStart!.getDate()}/${row.estStart!.getMonth() + 1}–${row.estEnd!.getDate()}/${row.estEnd!.getMonth() + 1}`}
                    </text>
                  )}
                  {hasAct && getWidth(row.actStart!, row.actEnd!) > 60 && (
                    <text
                      x={getX(row.actStart!) + getWidth(row.actStart!, row.actEnd!) / 2}
                      y={actY + BAR_HEIGHT / 2 + 4}
                      fill="#fff"
                      fontSize="9"
                      fontFamily="system-ui, sans-serif"
                      textAnchor="middle"
                      fontWeight="600"
                      style={{ pointerEvents: "none" }}
                    >
                      {`${row.actStart!.getDate()}/${row.actStart!.getMonth() + 1}–${row.actEnd!.getDate()}/${row.actEnd!.getMonth() + 1}`}
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
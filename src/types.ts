export interface Task {
  text: string;
  done: boolean;
  estStart?: string;
  estEnd?: string;
  actStart?: string;
  actEnd?: string;
  note?: string;
  cancelledReason?: string;
  blockers?: string[];
}

export interface Card {
  id: string;
  name: string;
  status: "pending" | "inprogress" | "completed";
  progress: number;
  tasks: Task[];
}

export interface Section {
  id: string;
  title: string;
  cards: Card[];
}

// Backward-compatible: old saved files may have these extra fields
export interface ProjectData {
  sections: Section[];
  // Legacy fields from old format — kept for backward compatibility
  milestones?: unknown[];
  blockers?: unknown[];
  meta?: Record<string, unknown>;
  lastUpdated?: string;
}

export type TabType = "dashboard" | "gantt";

export const STATUS_COLORS = {
  completed: "#238636",
  inprogress: "#d29922",
  pending: "#f85149",
  cancelled: "#8b949e",
};

export const STATUS_EMOJI = {
  completed: "✅",
  inprogress: "🟡",
  pending: "🔴",
  cancelled: "⚪",
};
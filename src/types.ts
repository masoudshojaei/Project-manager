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
  status: "pending" | "inprogress" | "completed" | "cancelled";
  progress: number;
  tasks: Task[];
}

export interface Section {
  id: string;
  title: string;
  cards: Card[];
}

export interface ProjectData {
  sections: Section[];
}

export type TabType = "dashboard" | "gantt";

export const STATUS_COLORS = {
  pending: "#f85149",
  inprogress: "#d29922",
  completed: "#238636",
  cancelled: "#8b949e",
} as const;

export const STATUS_EMOJI = {
  pending: "🔴",
  inprogress: "🟡",
  completed: "🟢",
  cancelled: "⚪",
} as const;
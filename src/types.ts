export interface Task {
  text: string;
  done: boolean;
  estEnd?: string;
  note?: string;
  cancelledReason?: string;
}

export interface Card {
  id: string;
  name: string;
  status: string;
  progress: number;
  tasks: Task[];
}

export interface Section {
  id: string;
  title: string;
  cards: Card[];
}

export interface Milestone {
  id: string;
  name: string;
  category: string;
  status: string;
  estEnd?: string;
  actEnd?: string;
  variance?: string;
  progress: number;
}

export interface Blocker {
  id: string;
  title: string;
  description: string;
  affects?: string;
}

export interface ProjectMeta {
  title: string;
  owner: string;
  focus: string;
  mcu?: string;
  display?: string;
  ram?: string;
  power?: string;
  comm?: string;
  targetUsers?: string;
}

export interface ProjectData {
  sections: Section[];
  milestones: Milestone[];
  blockers: Blocker[];
  lastUpdated: string;
  meta: ProjectMeta;
}

export type TabType = "dashboard" | "gantt" | "blockers";

export const STATUS_COLORS = {
  pending: "#f85149",
  inprogress: "#d29922",
  completed: "#3fb950",
  missed: "#a371f7",
  cancelled: "#6e7681",
};

export const STATUS_EMOJI = {
  pending: "🔴",
  inprogress: "🟡",
  completed: "🟢",
  missed: "🟣",
  cancelled: "⚫",
};

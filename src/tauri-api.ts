import { invoke } from "@tauri-apps/api/core";
import { open, save } from "@tauri-apps/plugin-dialog";
import type { ProjectData, Section, Card, Task } from "./types";
import { formatDateDisplay } from "./dateUtils";

// ── LOAD / PARSE ──

export async function loadStatusFile(): Promise<ProjectData | null> {
  try {
    const content: string = await invoke("load_status_file");
    if (!content) return null;
    return parseMarkdown(content);
  } catch {
    return null;
  }
}

export async function loadFileAtPath(path: string): Promise<ProjectData> {
  const content: string = await invoke("read_file", { path });
  return parseMarkdown(content);
}

export async function browseForFile(): Promise<string | null> {
  const selected = await open({
    filters: [{ name: "Markdown", extensions: ["md"] }],
    multiple: false,
  });
  return selected as string | null;
}

export async function createNewFile(): Promise<string | null> {
  const path = await save({
    filters: [{ name: "Markdown", extensions: ["md"] }],
    defaultPath: "project.md",
  });
  return path;
}

export async function saveStatusFile(data: ProjectData, path?: string): Promise<string> {
  const markdown = serializeMarkdown(data);
  const savedPath: string = await invoke("save_status_file", {
    content: markdown,
    path: path || null,
  });
  return savedPath;
}

// ── MARKDOWN PARSER ──
// Reads ANY markdown file and extracts structured data. Very forgiving.

function parseMarkdown(content: string): ProjectData {
  const lines = content.split("\n");
  const sections: Section[] = [];
  let currentSection: Section | null = null;
  let currentCard: Card | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trimEnd();

    // Section header: ## Phase 1: Build & Save
    // Or: ### Italian Citizenship & Documentation 🟢 100%
    const sectionMatch = line.match(/^#{2,3}\s+(.+)$/);
    if (sectionMatch) {
      const title = sectionMatch[1].trim();
      // Check if this is a card (### under a ## section)
      if (line.startsWith("###") && currentSection) {
        // It's a card
        const cardName = title.replace(/[🟢🟡🔴⚪]\s*\d+%/, "").trim();
        const statusMatch = title.match(/([🟢🟡🔴⚪])\s*(\d+)%/);
        const card: Card = {
          id: `card-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: cardName,
          status: (statusMatch ? mapEmojiToStatus(statusMatch[1]) : "pending") as Card["status"],
          progress: statusMatch ? parseInt(statusMatch[2]) : 0,
          tasks: [],
        };
        currentSection.cards.push(card);
        currentCard = card;
      } else {
        // It's a section
        const sectionTitle = title.replace(/[🟢🟡🔴⚪]\s*\d+%/, "").trim();
        currentSection = {
          id: `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: sectionTitle,
          cards: [],
        };
        sections.push(currentSection);
        currentCard = null;
      }
      continue;
    }

    // Task line: - [x] Task name | est-start:03/06/2026 | est-end:06/06/2026 | act-start:03/06/2026 | act-end:05/06/2026 | note:some note | cancelled:reason
    const taskMatch = line.match(/^-\s*\[(.?)\]\s+(.+)$/);
    if (taskMatch && currentCard) {
      const done = taskMatch[1] === "x" || taskMatch[1] === "X";
      let rest = taskMatch[2];

      // Extract inline fields: | key:value | key:value
      const fields: Record<string, string> = {};
      const fieldRegex = /\|\s*([\w-]+):([^|]+)/g;
      let m;
      while ((m = fieldRegex.exec(rest)) !== null) {
        fields[m[1].trim()] = m[2].trim();
      }

      // Remove field annotations from task text
      const text = rest.split("|")[0].trim();

      const task: Task = {
        text,
        done,
        estStart: fields["est-start"] || undefined,
        estEnd: fields["est-end"] || undefined,
        actStart: fields["act-start"] || undefined,
        actEnd: fields["act-end"] || undefined,
        note: fields["note"] || undefined,
        cancelledReason: fields["cancelled"] || undefined,
        blockers: fields["blockers"] ? fields["blockers"].split(",").map(s => s.trim()) : undefined,
      };

      currentCard.tasks.push(task);

      // Recalculate card progress
      const total = currentCard.tasks.length;
      const doneCount = currentCard.tasks.filter(t => t.done && !t.cancelledReason).length;
      currentCard.progress = total > 0 ? Math.round((doneCount / total) * 100) : 0;
      if (currentCard.progress === 100) currentCard.status = "completed";
      else if (currentCard.progress > 0) currentCard.status = "inprogress";
      else currentCard.status = "pending";
    }
  }

  return { sections };
}

function mapEmojiToStatus(emoji: string): string {
  switch (emoji) {
    case "🟢": return "completed";
    case "🟡": return "inprogress";
    case "🔴": return "pending";
    case "⚪": return "cancelled";
    default: return "pending";
  }
}

function mapStatusToEmoji(status: string): string {
  switch (status) {
    case "completed": return "🟢";
    case "inprogress": return "🟡";
    case "pending": return "🔴";
    case "cancelled": return "⚪";
    default: return "🔴";
  }
}

// ── MARKDOWN SERIALIZER ──
// Writes clean, canonical format. All dates as dd/mm/yyyy.

function serializeMarkdown(data: ProjectData): string {
  const lines: string[] = [];
  const now = new Date();
  const dateStr = now.toISOString().split("T")[0];

  lines.push(`# Project Status`);
  lines.push(``);
  lines.push(`> **Last Updated:** ${dateStr}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Quick stats
  const allTasks = data.sections.flatMap(s => s.cards).flatMap(c => c.tasks);
  const done = allTasks.filter(t => t.done && !t.cancelledReason).length;
  const inProg = allTasks.filter(t => !t.done && !t.cancelledReason && t.actStart).length;
  const pending = allTasks.filter(t => !t.done && !t.cancelledReason && !t.actStart).length;
  const cancelled = allTasks.filter(t => t.cancelledReason).length;

  lines.push(`## Quick Stats`);
  lines.push(``);
  lines.push(`- **Completed:** ${done}`);
  lines.push(`- **In Progress:** ${inProg}`);
  lines.push(`- **Not Started:** ${pending}`);
  lines.push(`- **Cancelled:** ${cancelled}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Sections and cards
  data.sections.forEach((section) => {
    lines.push(`## ${section.title}`);
    lines.push(``);

    section.cards.forEach((card) => {
      const emoji = mapStatusToEmoji(card.status);
      lines.push(`### ${card.name} ${emoji} ${card.progress}%`);
      lines.push(``);

      card.tasks.forEach((task) => {
        const checkbox = task.done ? "[x]" : "[ ]";
        let line = `- ${checkbox} ${task.text}`;

        const parts: string[] = [];
        if (task.estStart) parts.push(`est-start:${formatDateDisplay(task.estStart)}`);
        if (task.estEnd) parts.push(`est-end:${formatDateDisplay(task.estEnd)}`);
        if (task.actStart) parts.push(`act-start:${formatDateDisplay(task.actStart)}`);
        if (task.actEnd) parts.push(`act-end:${formatDateDisplay(task.actEnd)}`);
        if (task.note) parts.push(`note:${task.note}`);
        if (task.cancelledReason) parts.push(`cancelled:${task.cancelledReason}`);
        if (task.blockers?.length) parts.push(`blockers:${task.blockers.join(", ")}`);

        if (parts.length) {
          line += " | " + parts.join(" | ");
        }

        lines.push(line);
      });

      lines.push(``);
    });
  });

  return lines.join("\n");
}
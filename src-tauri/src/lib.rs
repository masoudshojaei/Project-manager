use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use regex::Regex;
use chrono::{DateTime, Utc};

// ─────────────────────────────────────────────────────────────
//  DATA MODELS
// ─────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Task {
    pub text: String,
    pub done: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub est_start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub est_end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub act_start: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub act_end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cancelled_reason: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub blockers: Option<Vec<String>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Card {
    pub id: String,
    pub name: String,
    pub status: String,
    pub progress: i32,
    pub tasks: Vec<Task>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Section {
    pub id: String,
    pub title: String,
    pub cards: Vec<Card>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Milestone {
    pub id: String,
    pub name: String,
    pub category: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub est_end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub act_end: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variance: Option<String>,
    pub progress: i32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Blocker {
    pub id: String,
    pub title: String,
    pub description: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub affects: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectData {
    pub sections: Vec<Section>,
    pub milestones: Vec<Milestone>,
    pub blockers: Vec<Blocker>,
    pub last_updated: String,
    #[serde(default)]
    pub meta: ProjectMeta,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ProjectMeta {
    pub title: String,
    pub owner: String,
    pub focus: String,
    pub mcu: Option<String>,
    pub display: Option<String>,
    pub ram: Option<String>,
    pub power: Option<String>,
    pub comm: Option<String>,
    pub target_users: Option<String>,
}

impl Default for ProjectMeta {
    fn default() -> Self {
        ProjectMeta {
            title: "Project Status Tracker".to_string(),
            owner: "".to_string(),
            focus: "".to_string(),
            mcu: None,
            display: None,
            ram: None,
            power: None,
            comm: None,
            target_users: None,
        }
    }
}


// ─────────────────────────────────────────────────────────────
//  PARSER
// ─────────────────────────────────────────────────────────────

fn is_valid_date(date_str: &str) -> bool {
    if date_str.trim().is_empty() || date_str.trim() == "-" {
        return false;
    }
    let parts: Vec<&str> = date_str.trim().split('/').collect();
    parts.len() == 3
}

pub fn parse_status_md(content: &str) -> ProjectData {
    let mut sections: Vec<Section> = Vec::new();
    let mut milestones: Vec<Milestone> = Vec::new();
    let mut blockers: Vec<Blocker> = Vec::new();

    let emoji_status = |e: &str| -> String {
        match e {
            "🔴" => "pending".to_string(),
            "🟡" => "inprogress".to_string(),
            "🟢" => "completed".to_string(),
            "🟣" => "missed".to_string(),
            "⚫" => "cancelled".to_string(),
            _ => "pending".to_string(),
        }
    };

    let lines: Vec<&str> = content.lines().collect();
    let mut i = 0;
    let mut current_section: Option<usize> = None;
    let mut current_card: Option<(usize, usize)> = None;

    while i < lines.len() {
        let line = lines[i];

        // Section header ## (but not ## 📅)
        if let Some(caps) = Regex::new(r"^##\s+(.+)$").unwrap().captures(line) {
            let title = caps.get(1).unwrap().as_str().trim();
            if !title.starts_with("📅") && !title.starts_with("🚫") && !title.starts_with("Quick") {
                sections.push(Section {
                    id: format!("sec_{}", sections.len()),
                    title: title.to_string(),
                    cards: Vec::new(),
                });
                current_section = Some(sections.len() - 1);
                current_card = None;
            }
            i += 1;
            continue;
        }

        // Card header ###
        if let Some(caps) = Regex::new(r"^###\s+(.*?)\s+([🔴🟡🟢🟣⚫])\s*(\d*)%?$").unwrap().captures(line) {
            if let Some(sec_idx) = current_section {
                let name = caps.get(1).unwrap().as_str().trim();
                let status = emoji_status(caps.get(2).unwrap().as_str());
                let progress = caps.get(3).and_then(|m| m.as_str().parse().ok()).unwrap_or(0);
                let card_idx = sections[sec_idx].cards.len();
                sections[sec_idx].cards.push(Card {
                    id: format!("card_{}_{}", sec_idx, card_idx),
                    name: name.to_string(),
                    status,
                    progress,
                    tasks: Vec::new(),
                });
                current_card = Some((sec_idx, card_idx));
            }
            i += 1;
            continue;
        }

        // Task line - [ ] or - [x]
        if let Some(caps) = Regex::new(r"^-\s+\[([ xX])\]\s+(.*)$").unwrap().captures(line) {
            if let Some((sec_idx, card_idx)) = current_card {
                let done = caps.get(1).unwrap().as_str().to_lowercase() == "x";
                let mut task_text = caps.get(2).unwrap().as_str().trim().to_string();
                let mut est_start = None;
                let mut est_end = None;
                let mut act_start = None;
                let mut act_end = None;
                let mut note = None;
                let mut cancelled = None;
                let mut blockers = None;

                if task_text.contains("|") {
                    let parts: Vec<String> = task_text.split("|").map(|s| s.trim().to_string()).collect();
                    task_text = parts[0].clone();
                    for p in &parts[1..] {
                        let p = p.trim();
                        if p.to_lowercase().starts_with("est-start:") {
                            let val = p[10..].trim();
                            if is_valid_date(val) { est_start = Some(val.to_string()); }
                        } else if p.to_lowercase().starts_with("est-end:") {
                            let val = p[8..].trim();
                            if is_valid_date(val) { est_end = Some(val.to_string()); }
                        } else if p.to_lowercase().starts_with("act-start:") {
                            let val = p[10..].trim();
                            if is_valid_date(val) { act_start = Some(val.to_string()); }
                        } else if p.to_lowercase().starts_with("act-end:") {
                            let val = p[8..].trim();
                            if is_valid_date(val) { act_end = Some(val.to_string()); }
                        } else if p.to_lowercase().starts_with("est:") {
                            let val = p[4..].trim();
                            if is_valid_date(val) { est_end = Some(val.to_string()); }
                        } else if p.to_lowercase().starts_with("note:") {
                            note = Some(p[5..].trim().to_string());
                        } else if p.to_lowercase().starts_with("cancelled:") {
                            cancelled = Some(p[10..].trim().to_string());
                        } else if p.to_lowercase().starts_with("blockers:") {
                            let blk_str = p[9..].trim();
                            if !blk_str.is_empty() {
                                blockers = Some(blk_str.split(',').map(|s| s.trim().to_string()).collect());
                            }
                        }
                    }
                }

                sections[sec_idx].cards[card_idx].tasks.push(Task {
                    text: task_text,
                    done,
                    est_start,
                    est_end,
                    act_start,
                    act_end,
                    note,
                    cancelled_reason: cancelled,
                    blockers,
                });
            }
            i += 1;
            continue;
        }

        // Milestone table row
        if line.starts_with("| 📦") || line.starts_with("| 📐") || line.starts_with("| 🔲") ||
           line.starts_with("| 📤") || line.starts_with("| ⚡") || line.starts_with("| ⚙️") ||
           line.starts_with("| 🌐") || line.starts_with("| 🖥️") || line.starts_with("| 🔋") ||
           line.starts_with("| 🧪") || line.starts_with("| 📚") || line.starts_with("| 🚀") ||
           line.starts_with("| 🏁") {
            let parts: Vec<&str> = line.split("|").collect();
            if parts.len() >= 6 {
                let name = parts[1].trim();
                let cat = parts[2].trim();
                let status_text = parts[3].replace("🟡", "").replace("🔴", "").trim().to_lowercase();
                let status = if ["pending", "inprogress", "completed", "missed", "cancelled"].contains(&status_text.as_str()) {
                    status_text
                } else {
                    "pending".to_string()
                };
                let est_end = if parts[4].trim() == "\u{2014}" || parts[4].trim() == "-" { None } else { Some(parts[4].trim().to_string()) };
                let act_end = if parts[5].trim() == "\u{2014}" || parts[5].trim() == "-" { None } else { Some(parts[5].trim().to_string()) };
                let variance = if parts.len() > 6 && parts[6].trim() != "\u{2014}" && parts[6].trim() != "-" { Some(parts[6].trim().to_string()) } else { None };

                milestones.push(Milestone {
                    id: format!("ms_{}", milestones.len()),
                    name: name.to_string(),
                    category: cat.to_string(),
                    status,
                    est_end,
                    act_end,
                    variance,
                    progress: 0,
                });
            }
            i += 1;
            continue;
        }

        // Blocker ### 🚫
        if let Some(caps) = Regex::new(r"^###\s+🚫\s+(.*)$").unwrap().captures(line) {
            let title = caps.get(1).unwrap().as_str().to_string();
            let mut desc_lines: Vec<String> = Vec::new();
            let mut color = None;
            i += 1;
            while i < lines.len() && !lines[i].trim().is_empty() && !lines[i].starts_with("##") && !lines[i].starts_with("###") {
                let trimmed = lines[i].trim();
                if trimmed.starts_with("[color:") {
                    if let Some(end) = trimmed.find(']') {
                        color = Some(trimmed[7..end].to_string());
                    }
                } else {
                    desc_lines.push(trimmed.to_string());
                }
                i += 1;
            }
            let desc = desc_lines.join(" ");
            let mut affects = None;
            let desc_clean = if let Some(idx) = desc.find("**Affects:**") {
                affects = Some(desc[idx + 12..].trim().to_string());
                desc[..idx].trim().to_string()
            } else {
                desc
            };

            blockers.push(Blocker {
                id: format!("blk_{}", blockers.len()),
                title,
                description: desc_clean,
                affects,
                color,
            });
            continue;
        }

        i += 1;
    }

    let meta = parse_header_meta(&lines);

    ProjectData {
        sections,
        milestones,
        blockers,
        last_updated: Utc::now().format("%Y-%m-%d").to_string(),
        meta,
    }
}

fn parse_header_meta(lines: &[&str]) -> ProjectMeta {
    let mut meta = ProjectMeta::default();
    let mut in_header = true;

    for line in lines {
        let trimmed = line.trim();
        if trimmed.is_empty() {
            continue;
        }
        if trimmed.starts_with("---") {
            in_header = false;
            continue;
        }
        if !in_header && trimmed.starts_with("## ") {
            break; // Stop at first section
        }

        // Title: first h1 line
        if trimmed.starts_with("# ") && meta.title == "Project Status Tracker" {
            meta.title = trimmed[2..].trim().to_string();
        }

        // Parse > **Key:** Value  lines
        if trimmed.starts_with("> ") {
            let content = &trimmed[2..];
            if let Some(start) = content.find("**") {
                if let Some(end) = content[start+2..].find("**") {
                    let key = &content[start+2..start+2+end];
                    let rest = &content[start+2+end+2..];
                    let value = rest.trim().trim_start_matches(':').trim().trim_end_matches("  ").to_string();
                    match key {
                        "Owner" => meta.owner = value,
                        "Focus" => meta.focus = value,
                        "MCU" => meta.mcu = Some(value),
                        "Display" => meta.display = Some(value),
                        "RAM" => meta.ram = Some(value),
                        "Power" => meta.power = Some(value),
                        "Comm" => meta.comm = Some(value),
                        "Target Users" => meta.target_users = Some(value),
                        _ => {}
                    }
                }
            }
        }
    }
    meta
}

// ─────────────────────────────────────────────────────────────
//  SERIALIZER
// ─────────────────────────────────────────────────────────────

pub fn serialize_status_md(data: &ProjectData) -> String {
    let mut result = String::new();

    result.push_str(&format!("# {}\n\n", data.meta.title));
    if !data.meta.owner.is_empty() {
        result.push_str(&format!("> **Owner:** {}  \n", data.meta.owner));
    }
    if !data.meta.focus.is_empty() {
        result.push_str(&format!("> **Focus:** {}  \n", data.meta.focus));
    }
    if let Some(ref mcu) = data.meta.mcu {
        result.push_str(&format!("> **MCU:** {}  \n", mcu));
    }
    if let Some(ref display) = data.meta.display {
        result.push_str(&format!("> **Display:** {}  \n", display));
    }
    if let Some(ref ram) = data.meta.ram {
        result.push_str(&format!("> **RAM:** {}  \n", ram));
    }
    if let Some(ref power) = data.meta.power {
        result.push_str(&format!("> **Power:** {}  \n", power));
    }
    if let Some(ref comm) = data.meta.comm {
        result.push_str(&format!("> **Comm:** {}  \n", comm));
    }
    if let Some(ref target_users) = data.meta.target_users {
        result.push_str(&format!("> **Target Users:** {}  \n", target_users));
    }
    result.push_str(&format!("> **Last Updated:** {}  \n\n", data.last_updated));
    result.push_str("---\n\n");

    let total_tasks: usize = data.sections.iter()
        .map(|s| s.cards.iter().map(|c| c.tasks.len()).sum::<usize>())
        .sum();
    let done_tasks: usize = data.sections.iter()
        .flat_map(|s| s.cards.iter())
        .flat_map(|c| c.tasks.iter())
        .filter(|t| t.done && t.cancelled_reason.is_none())
        .count();
    let inprog = data.milestones.iter().filter(|m| m.status == "inprogress").count();
    let cancelled: usize = data.sections.iter()
        .flat_map(|s| s.cards.iter())
        .flat_map(|c| c.tasks.iter())
        .filter(|t| t.cancelled_reason.is_some())
        .count();
    let not_started = total_tasks.saturating_sub(done_tasks).saturating_sub(cancelled);
    let blockers = data.blockers.len();

    result.push_str("## Quick Stats\n\n");
    result.push_str(&format!("- **Completed:** {}\n", done_tasks));
    result.push_str(&format!("- **In Progress:** {}\n", inprog));
    result.push_str(&format!("- **Not Started:** {}\n", not_started));
    result.push_str(&format!("- **Active Blockers:** {}\n\n", blockers));
    result.push_str("---\n\n");

    let status_emoji = |s: &str| -> &str {
        match s {
            "pending" => "\u{1F534}",
            "inprogress" => "\u{1F7E1}",
            "completed" => "\u{1F7E2}",
            "missed" => "\u{1F7E3}",
            "cancelled" => "\u{26AB}",
            _ => "\u{26AA}",
        }
    };

    for sec in &data.sections {
        result.push_str(&format!("## {}\n\n", sec.title));
        for card in &sec.cards {
            result.push_str(&format!("### {} {} {}%\n\n", card.name, status_emoji(&card.status), card.progress));
            if card.tasks.is_empty() {
                result.push_str("- [ ] Add your first task\n");
            }
            for task in &card.tasks {
                let check = if task.done { "x" } else { " " };
                let mut extra = String::new();
                if let Some(ref est_start) = task.est_start {
                    extra.push_str(&format!(" | est-start:{}", est_start));
                }
                if let Some(ref est_end) = task.est_end {
                    extra.push_str(&format!(" | est-end:{}", est_end));
                }
                if let Some(ref act_start) = task.act_start {
                    extra.push_str(&format!(" | act-start:{}", act_start));
                }
                if let Some(ref act_end) = task.act_end {
                    extra.push_str(&format!(" | act-end:{}", act_end));
                }
                if let Some(ref note) = task.note {
                    extra.push_str(&format!(" | note:{}", note));
                }
                if let Some(ref blockers) = task.blockers {
                    extra.push_str(&format!(" | blockers:{}", blockers.join(",")));
                }
                if let Some(ref reason) = task.cancelled_reason {
                    extra.push_str(&format!(" | cancelled:{}", reason));
                }
                result.push_str(&format!("- [{}] {}{}\n", check, task.text, extra));
            }
            result.push_str("\n");
        }
        result.push_str("---\n\n");
    }

    result.push_str("## \u{1F4C5} Milestones\n\n");
    result.push_str("| Milestone | Category | Status | Est. End | Actual End | Variance |\n");
    result.push_str("|-----------|----------|--------|----------|------------|----------|\n");
    for ms in &data.milestones {
        let est = ms.est_end.as_deref().unwrap_or("-");
        let act = ms.act_end.as_deref().unwrap_or("-");
        let var = ms.variance.as_deref().unwrap_or("-");
        result.push_str(&format!("| {} | {} | {} {} | {} | {} | {} |\n",
            ms.name, ms.category, status_emoji(&ms.status), ms.status, est, act, var));
    }
    result.push_str("\n---\n\n");

    result.push_str("## \u{1F6AB} Active Blockers\n\n");
    for blk in &data.blockers {
        result.push_str(&format!("### \u{1F6AB} {}\n", blk.title));
        result.push_str(&format!("{}\n", blk.description));
        if let Some(ref affects) = blk.affects {
            result.push_str(&format!("**Affects:** {}\n", affects));
        }
        if let Some(ref color) = blk.color {
            result.push_str(&format!("[color:{}]\n", color));
        }
        result.push_str("\n");
    }

    result
}
# Project Manager

A universal desktop application for tracking project status using simple Markdown files. Works for any project — software, hardware, research, personal goals, or business ventures.

![Dashboard](https://img.shields.io/badge/Dashboard-Dark%20Theme-0d1117)
![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![License](https://img.shields.io/badge/License-MIT-green)

## Download & Run (No Build Required)

**For most users — just download and run:**

1. Go to [Releases](../../releases)
2. Download `project-manager.exe`
3. Double-click to install or run
4. Open your `STATUS.md` file — that's it

No Node.js. No Rust. No Visual Studio. No command line. Works on any Windows 10/11 PC.

---

## Features

- **Universal** — Works with any project. Just edit the Markdown file.
- **Visual Dashboard** — Interactive task tree with progress bars and status colors
- **Gantt Chart** — Timeline view with zoom, pan, and today marker
- **Blocker Tracking** — Visual cards showing what's blocking progress
- **Auto-Save** — Edits write back to your `.md` file instantly
- **Dark Theme** — Easy on the eyes, professional look
- **Zero Dependencies** — Single installer or portable `.exe`, nothing else needed

## Quick Start

### Step 1: Get the App

| Method | What to do |
|--------|-----------|
| **Easiest** | Download `Project-Manager-Setup.exe` from [Releases](../../releases) and install |
| **Portable** | Download `Project Manager.exe` from [Releases](../../releases) — runs without installing |
| **Build yourself** | Follow the "Building from Source" section below |

### Step 2: Create Your Status File

Copy the included `STATUS.md` template and customize it for your project:

```markdown
# My Awesome Project

> **Owner:** Your Name  
> **Focus:** Building a thing that does stuff  

---

## Development

### Backend API 🔴 0%
- [ ] Set up database | est:2026-06-15
- [ ] Build authentication
- [ ] Write API documentation

### Frontend UI 🟡 50%
- [x] Design mockups
- [x] Set up React project
- [ ] Build component library | est:2026-07-01

---

## 📅 Milestones

| Milestone | Category | Status | Est. End | Actual End | Variance |
|-----------|----------|--------|----------|------------|----------|
| MVP Launch | Release | 🟡 inprogress | 2026-08-01 | — | — |
| v1.0 Release | Release | 🔴 pending | 2026-10-01 | — | — |

---

## 🚫 Active Blockers

### 🚫 Waiting for API Keys
Third-party service hasn't approved our developer account yet.
**Affects:** Backend development, integration testing
```

### Step 3: Open and Track

Launch the app and open your `STATUS.md` file. Check off tasks, set dates, mark milestones done. Everything saves automatically.

---

## File Format Reference

The app reads a standard Markdown file with this structure:

### Header (Optional — any field can be omitted)

```markdown
# Project Title

> **Owner:** Name  
> **Focus:** What this project is about  
> **MCU:** Microcontroller (optional)  
> **Display:** Screen specs (optional)  
> **RAM:** Memory (optional)  
> **Power:** Battery / PSU (optional)  
> **Comm:** Communication interface (optional)  
> **Target Users:** Who this is for (optional)  
```

Only `Owner` and `Focus` are recommended. All other fields are optional and appear as chips in the header bar.

### Task Sections

```markdown
## Category Name

### Subcategory Name 🔴 0%
- [ ] Task description | est:2026-06-30
- [x] Completed task
- [ ] Task with note | note:remember to check this
- [ ] Cancelled task | cancelled:no longer needed
```

**Status emojis:**
- `🔴` — Pending (0%)
- `🟡` — In Progress
- `🟢` — Completed (100%)
- `🟣` — Missed deadline
- `⚫` — Cancelled

**Task modifiers:**
- `| est:YYYY-MM-DD` — Estimated end date
- `| note:some text` — Private note
- `| cancelled:reason` — Cancelled with reason

### Milestones Table

```markdown
## 📅 Milestones

| Milestone | Category | Status | Est. End | Actual End | Variance |
|-----------|----------|--------|----------|------------|----------|
| Name | Category | 🔴 pending | 2026-05-31 | — | — |
```

### Blockers

```markdown
## 🚫 Active Blockers

### 🚫 Blocker Title
Description of the problem.
**Affects:** What this blocks
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save file |
| `Enter` | Confirm edit / Add task |
| `Escape` | Cancel edit |
| `Right-click` | Task context menu |
| `Double-click` | Edit task text |

---

## Building from Source

> **Most users don't need this.** Download the pre-built `.exe` from [Releases](../../releases) instead.

If you want to build the executable yourself:

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- Visual Studio Build Tools ("Desktop development with C++" workload)

### Build

```bash
git clone https://github.com/yourusername/project-manager.git
cd project-manager
npm install
npm run build
cargo install tauri-cli
cargo tauri build
```

The executable will be at `src-tauri/target/release/Project Manager.exe`.

## License

MIT — free for personal and commercial use.

## Contributing

Pull requests welcome! This is a community tool — make it better for everyone.

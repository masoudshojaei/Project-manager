# Project Manager

A universal cross-platform application for tracking project status using simple Markdown files. Works on desktop and mobile — sync your `STATUS.md` anywhere and pick up where you left off. Ideal for software, hardware, research, personal goals, or business ventures.

![Dashboard](https://img.shields.io/badge/Dashboard-Dark%20Theme-0d1117)
![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux%20%7C%20Android%20%7C%20iOS-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Download & Run (No Build Required)

**For most users — just download and run:**

1. Go to [Releases](../../releases)
2. Download the build for your platform (`.exe`, `.dmg`, `.AppImage`, or mobile)
3. Install or run directly
4. Open your `STATUS.md` file — that's it

No Node.js. No Rust. No Visual Studio. No command line. Works on Windows, macOS, Linux, Android, and iOS.

---

## Features

- **Universal** — Works with any project. Just edit the Markdown file.
- **Cross-Platform Sync** — Place `STATUS.md` in shared storage (Dropbox, iCloud, Google Drive, local network) and keep phone and desktop in sync with bidirectional updates.
- **Visual Dashboard** — Interactive task tree with progress bars and status colors.
- **Live Gantt Chart** — Auto-syncs from task dates and status. Planned work shows as dashed gray; actual work as solid colored bars. Toggle between daily, weekly, monthly, and yearly views.
- **Global Blocker System** — Define blockers once, reference them anywhere by ID. Task table renders colored chips so blockers are visible at a glance.
- **Zero-Maintenance Status** — Status is auto-derived in strict precedence: cancelled → completed → in-progress → pending. No manual status updates needed.
- **Derived Progress** — Card completion percentage is calculated from underlying task checkboxes, not stored in markdown. Edit tasks, and cards update automatically.
- **Overdue Awareness** — Tasks past their estimated end date without completion or cancellation get a red border and an **OVERDUE** badge.
- **Flexible Date Entry** — Pick from a calendar or type directly in `dd/mm/yyyy`. All dates stored and displayed as date-only — no time components, no ambiguity.
- **Auto-Save** — Edits write back to your `.md` file instantly.
- **Dark Theme** — Easy on the eyes, professional look.
- **Zero Dependencies** — Single installer or portable executable, nothing else needed.

---

## How to Use

1. **Download** Project Manager for your platform below (Windows `.exe`, macOS, Linux, or mobile)
2. **Create** your own `STATUS.md` file (see the template below)
3. **Launch** the app and open your `STATUS.md`
4. **Track** — check off tasks, set estimated and actual dates, reference blockers by ID
5. **Sync** — place your `STATUS.md` in shared storage to keep phone and desktop in sync with bidirectional updates

---

## Quick Start

### Step 1: Get the App

| Method | What to do |
|--------|-----------|
| **Easiest** | Download the installer for your platform from [Releases](../../releases) and install |
| **Portable** | Download the standalone executable — runs without installing |
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
- [ ] Set up database | est_start:2026-06-01 est_end:2026-06-15
- [ ] Build authentication | est_start:2026-06-10 est_end:2026-06-20
- [ ] Write API documentation | est_start:2026-06-15 est_end:2026-06-25

### Frontend UI 🟡 50%
- [x] Design mockups | est_start:2026-05-01 est_end:2026-05-15 act_start:2026-05-01 act_end:2026-05-14
- [x] Set up React project | est_start:2026-05-10 est_end:2026-05-20 act_start:2026-05-12 act_end:2026-05-19
- [ ] Build component library | est_start:2026-06-01 est_end:2026-06-30

---

## 🚫 Active Blockers

### 🚫 Waiting for API Keys
Third-party service hasn't approved our developer account yet.
**Affects:** Backend development, integration testing
```

### Step 3: Open and Track

Launch the app and open your `STATUS.md` file. Check off tasks, set estimated and actual dates, reference blockers by ID. Everything saves automatically.

---

## File Format Reference

The app reads a standard Markdown file with this structure:

### Header (Optional — any field can be omitted)

```markdown
# Project Title

> **Owner:** Name
> **Focus:** What this project is about
```

Only `Owner` and `Focus` are recommended. All other fields are optional and appear as chips in the header bar.

### Task Sections

```markdown
## Category Name

### Subcategory Name 🔴 0%
- [ ] Task description | est_start:2026-06-01 est_end:2026-06-15
- [x] Completed task | est_start:2026-05-01 est_end:2026-05-15 act_start:2026-05-01 act_end:2026-05-14
- [ ] Task with note | est_start:2026-06-10 est_end:2026-06-20 note:remember to check this
- [ ] Cancelled task | est_start:2026-06-01 est_end:2026-06-10 cancelled:no longer needed
```

**Status emojis (auto-derived, do not edit manually):**
- `🔴` — Pending (0%)
- `🟡` — In Progress
- `🟢` — Completed (100%)
- `🟣` — Missed deadline
- `⚫` — Cancelled

**Task modifiers:**
- `| est_start:YYYY-MM-DD` — Estimated start date
- `| est_end:YYYY-MM-DD` — Estimated end date
- `| act_start:YYYY-MM-DD` — Actual start date
- `| act_end:YYYY-MM-DD` — Actual end date
- `| note:some text` — Private note
- `| cancelled:reason` — Cancelled with reason
- `| blocker:ID` — Reference a global blocker by ID

### Blockers

```markdown
## 🚫 Active Blockers

### 🚫 Blocker Title
Description of the problem.
**Affects:** What this blocks
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl + S` | Save file |
| `Enter` | Confirm edit / Add task |
| `Escape` | Cancel edit |
| `Right-click` | Task context menu |
| `Double-click` | Edit task text |

---

## System Requirements

- **Windows 10/11** (64-bit), **macOS**, **Linux**, **Android**, or **iOS**
- No other software required — single executable, fully self-contained
- Optional: cloud or shared storage (e.g., Dropbox, iCloud, Google Drive, or local network) if using cross-device sync

---

## Building from Source

> **Most users don't need this.** Download the pre-built executable from [Releases](../../releases) instead.

If you want to build the executable yourself:

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/)
- Visual Studio Build Tools ("Desktop development with C++" workload) — Windows only

### Build

```bash
git clone https://github.com/yourusername/project-manager.git
cd project-manager
npm install
npm run build
cargo install tauri-cli
cargo tauri build
```

The executable will be at `src-tauri/target/release/Project Manager.exe` (path varies by platform).

---

## License

MIT — free for personal and commercial use.

## Contributing

Pull requests welcome! This is a community tool — make it better for everyone.

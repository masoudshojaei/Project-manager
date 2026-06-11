# Project Manager

A Windows desktop app for tracking projects using a simple Markdown file.

![Platform](https://img.shields.io/badge/Platform-Windows-blue)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Download & Run

1. Go to [Releases](../../releases)
2. Download `Project-Manager.exe`
3. Double-click to run — nothing to install

---

## How to Use

When you first run the app, you have two options:

- **Open Project** — browse to an existing `.md` file
- **New Project** — create a fresh `.md` file; choose where to save it

Your project data is stored entirely in that `.md` file. The app only reads and writes to it. To continue later, open the same `.md` file again. Keep it safe — if you lose the file, you lose the project.

---

## Features

- **Tasks with dates** — estimated start/end and actual start/end for every task
- **Auto status** — status is derived automatically from dates and checkboxes (cancelled → completed → in-progress → pending)
- **Live Gantt chart** — visual timeline with daily, weekly, monthly, and yearly views
- **Derived progress** — card completion is calculated from task checkboxes
- **Overdue alerts** — tasks past their estimated end date show a red border and OVERDUE badge
- **Flexible date entry** — pick from a calendar or type directly in `dd/mm/yyyy`
- **Auto-save** — all changes write back to your `.md` file instantly
- **Dark theme**

---

## System Requirements

- Windows 10 or Windows 11 (64-bit)
- Nothing else required — single `.exe`, fully self-contained

---

## Building from Source

Run `build-exe.bat` in the project root.
After the five steps if there is no error the `build-exe.bat` file will generate `project-manager.exe`.
you can find the exectuable file in : `.\src-tauri\target\release`

---

## License

MIT — free for personal and commercial use.

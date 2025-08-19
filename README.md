# 🧠 MindMirror Alpha 1.0

> **First Public Disclosure:** 2025-08-18 (AEST) • © 2025 Daniel • See [NOTICE](./NOTICE) & [COPYRIGHT.md](./COPYRIGHT.md)

**Visual-first goal mapping with dynamic time alignment.**

MindMirror is an adaptive, visual-first productivity and life management app that lets you map out your ideas, goals, and tasks in a way that feels organic, intuitive, and future-proof.

It doesn’t just store your thoughts — it actively helps you **see**, **understand**, and **adapt** your priorities over time.

---

## 📖 Table of Contents

1. Overview
2. Core Philosophy
3. Key Benefits
4. Features
5. How It Works
6. User Workflow
7. Tech Stack
8. Installation
9. Usage
10. File System
11. Roadmap
12. Contributing
13. License
14. Author

---

## 📌 Overview

Traditional productivity tools are either too rigid (forcing your brain into lists and categories) or too chaotic (an endless digital whiteboard with no structure).

MindMirror solves this by creating **a living visual map** of your life — tasks, goals, dreams — and letting them change shape, scale, and position as your reality changes.

---

## 💡 Core Philosophy

1. **Your brain is visual** – You think in shapes, clusters, and connections.
2. **Plans should adapt** – Priorities shift; your map reflects that.
3. **Data should be yours** – Export anytime in human-readable formats.
4. **Simplicity first** – Adding an idea takes seconds.
5. **Assist, don’t dictate** – AI supports, you stay in control.

---

## 🎯 Key Benefits

- **Total life clarity** – See everything in one dynamic space.
- **Adaptive organisation** – Watch priorities reorganise as life changes.
- **Visual motivation** – Completed goals shrink/fade; urgent ones pop.
- **Long-term perspective** – Time-lapse shows your evolving focus.
- **Privacy and control** – You decide what’s visible or encrypted.

---

## ✨ Features (Baseline)

- **Mindmap View** – Node-based mapping of tasks/goals.
- **Mirror View** – Dynamic bubbles scale with time spent.
- **Timers** – Subnode time rolls up to parent nodes.
- **Alignment Score** – Updated dynamically.
- **Combined View** – Unified perspective.

> 🚨 **Non-negotiable:** These baseline features must never be deleted or altered in ways that remove functionality. Future iterations must **only add** features, not subtract.

---

## ⚙ How It Works

1. **Add nodes** (goals/tasks).
2. **Link nodes** visually (sequential, dependent, parallel).
3. **Track progress** manually or via automation.
4. **AI assistance** for clustering and next steps.
5. **Export/backup** in JSON, Markdown, PNG/SVG.

---

## 🧭 User Workflow

1. Brain Dump → 2. Organise → 3. Refine with AI →
2. Track Progress → 5. Review/Reflect → 6. Adapt

---

## 🛠 Tech Stack

- **Frontend:** React + TailwindCSS
- **State:** Zustand
- **Backend:** Node.js + Express
- **Database:** SQLite (local) / Postgres (cloud)
- **AI Engine:** Hugging Face APIs
- **Automation:** Zapier API
- **Auth/Security:** JWT + AES encryption
- **Hosting:** Vercel/Netlify (frontend), Railway/Render (backend)

---

## 📦 Installation

```bash
git clone https://github.com/Noitome/Mindmap-App.git
cd Mindmap-App
cp .env.example .env   # leave empty to use local fallback; or add DB keys
npm ci
npm run dev
# Preview: http://localhost:5173
```

---

## ▶️ Usage

- Run `npm run dev` and open [http://localhost:5173](http://localhost:5173).
- Create nodes, link them, and start timers.
- Switch between **Mindmap View**, **Mirror View**, or the **Combined View**.
- Export your map when needed (JSON/Markdown/PNG).

---

## 🗂 File System (Key Directories)

```
/src
  /components   → React UI components (mindmap, mirror, timers, toolbars)
  /data         → Data adapters (Remote + Local fallback)
  /store        → State management (nodes, timers, alignment)
  /lib          → Pure logic (math, aggregation, scoring)
  /tests        → Jest tests (logic/UI integrity)
```

---

## 🧭 Roadmap

- ✅ Hover info popups on bubbles (alignment/misalignment, time breakdown)
- ✅ Toggle to enable/disable hover info
- ⏳ Visual connections between nodes
- ⏳ Real-time sync/collaboration
- ⏳ Improved export (CSV/JSON/PDF)

---

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for AI-safe workflow and contribution rules.

Key principles:

- **Never remove baseline features.**
- **One branch per change.**
- **Update **`` with every meaningful modification.
- **Add tests** for all logic changes.

---

## 📜 License

MIT License — see [LICENSE](./LICENSE) for details.

---

## ✍️ Author

Built by **Daniel** with the vision of creating a living, adaptive map of your mind.
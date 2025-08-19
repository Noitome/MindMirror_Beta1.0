# Contributing Guidelines (Human + AI)

## Baseline: Do Not Break
The following features must remain intact: Mindmap View, Mirror View (time-scaled bubbles), Timers (subnode → parent), Alignment Score, Combined View.

## Workflow
- No direct deletions in `main`.
- One branch per feature/fix (e.g., `feature/hover-tooltips`, `fix/timer-aggregation`).
- Minimal, isolated diffs; never regenerate unrelated files.
- Update `CHANGELOG.md` with every meaningful change.
- Add tests for logic changes (timers, alignment, aggregation).

## AI Agents — Operation Rules
- Always preserve the baseline features above.
- Never regenerate the whole repo unless explicitly asked.
- Output only modified files, clearly labeled (filename + diff).
- Confirm the preview loads and tests pass before proposing further changes.

## Dev Setup (quick)
```bash
git clone https://github.com/Noitome/Mindmap-App.git
cd Mindmap-App
cp .env.example .env   # leave empty for local fallback or add remote DB keys
npm ci
npm run dev
# http://0.0.0.0:5173
```

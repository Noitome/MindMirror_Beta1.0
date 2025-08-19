
# MindMirror — Invention Disclosure & Prior Art Notice
**Author:** Daniel  
**First Public Disclosure:** 2025-08-18 (AEST)

## Problem
Existing productivity tools are either rigid list-makers or chaotic canvases lacking adaptive priority
and time-alignment feedback.

## Core Inventive Concepts
1) **Mirror View with Time-Scaled Bubbles** — node "bubbles" whose radius/area grows with elapsed time on that node.
2) **Timer Aggregation (Subnode → Parent)** — time tracked on subnodes automatically rolls up to parent totals.
3) **Dynamic Alignment Score** — a metric updating as timers run/stop to reflect alignment with stated goals.
4) **Combined View** — unified visualization that overlays/coordinates mindmap and mirror views.
5) **Hover Info Clouds (Toggleable)** — contextual overlays for alignment/misalignment and time breakdown.

## Implementation Summary
- Frontend: Vite + React; State via Zustand; React Flow for graph interactions.
- Logic: Deterministic math for time roll-ups and alignment scoring; exports in JSON/Markdown/PNG.
- Data: Local/remote adapters; offline-capable baseline.

## Distinguishing Factors
- Real-time, **visual** reinforcement through time-scaled geometry (mirror bubbles) tied to **aggregated** timer data.
- Explicit design contract: **no static numbers** without dynamic reasoning; all figures computed from actual use.

## Files & Evidence
- Source repository history (commits, tags, releases).
- Design/README, CHANGELOG, and this disclosure document.
- Release notes establishing baseline features that must not be removed.

This document records the concept and implementation details as of the disclosure date for purposes of
authorship and prior art.

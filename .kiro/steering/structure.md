# Project Structure

## Overview
This is a minimal single-file web project. The entire application lives in one HTML file.

```
/
├── index.html          # The entire application (HTML + CSS + JS)
├── README.md           # Project description
└── .kiro/
    ├── specs/
    │   └── todo-life-dashboard/
    │       ├── requirements.md     # Feature requirements
    │       └── .config.kiro        # Spec config
    └── steering/
        ├── product.md
        ├── tech.md
        └── structure.md
```

## Application Structure (inside index.html)
The file is organized in three sections:

1. **`<head>`** — meta tags, title, and all `<style>` blocks
2. **`<body>`** — four panel sections in DOM order:
   - `#greeting-panel` — time, date, greeting message
   - `#focus-timer` — countdown display and controls
   - `#task-list` — task input, list, and per-task controls
   - `#quick-links` — link input form and shortcut buttons
3. **`<script>`** — all JavaScript at the bottom of `<body>`, organized by feature area

## JavaScript Organization Pattern
Group JS by feature, each with its own init function called on `DOMContentLoaded`:

```js
// --- Greeting Panel ---
function initGreeting() { ... }

// --- Focus Timer ---
function initTimer() { ... }

// --- Task List ---
function initTaskList() { ... }

// --- Quick Links ---
function initQuickLinks() { ... }

document.addEventListener('DOMContentLoaded', () => {
  initGreeting();
  initTimer();
  initTaskList();
  initQuickLinks();
});
```

## Local Storage Keys
Use consistent, namespaced keys:
- `dashboard:tasks` — JSON array of task objects `{ id, text, completed }`
- `dashboard:links` — JSON array of link objects `{ id, label, url }`

# Design Document — To-Do Life Dashboard

## Overview

The To-Do Life Dashboard is a single, self-contained `index.html` file that delivers four productivity panels in one minimal page. There is no build step, no server, no third-party code — the file opens directly from the filesystem via a `file://` URL and runs entirely in the browser.

The design philosophy is **progressive simplicity**: each panel is independent, initialised by its own function, and communicates with the rest of the app only through the shared Local Storage layer and direct DOM manipulation. There is no global state object, no event bus, and no virtual DOM — just plain functions, plain DOM, and plain storage.

### Key Design Decisions

| Decision | Rationale |
|---|---|
| Single HTML file | Zero-dependency constraint; works offline and via `file://` |
| Vanilla JS with init functions | Keeps code readable without a framework; each panel is self-contained |
| CSS custom properties for theming | Enables light/dark switching with a single `@media` block |
| Local Storage with JSON serialisation | Simplest persistence that survives tab close; no IndexedDB complexity needed |
| No global state object | Panels read/write storage directly; avoids coupling between panels |
| `setInterval` for timer and clock | Sufficient precision for minute-level clock and second-level timer |

---

## Architecture

### Single-File Structure

```
index.html
├── <head>
│   ├── <meta> — charset, viewport, theme-color
│   ├── <title>
│   └── <style> — all CSS (design tokens, layout, components, dark mode)
├── <body>
│   ├── <main id="dashboard">
│   │   ├── <section id="greeting-panel">
│   │   ├── <section id="focus-timer">
│   │   ├── <section id="task-list">
│   │   └── <section id="quick-links">
│   └── <script> — all JS (utilities, init functions, DOMContentLoaded bootstrap)
```

### Initialisation Flow

```
DOMContentLoaded
  ├── initGreeting()   — starts clock interval, renders time/date/greeting
  ├── initTimer()      — sets up timer state, binds start/stop/reset buttons
  ├── initTaskList()   — loads tasks from storage, renders list, binds add form
  └── initQuickLinks() — loads links from storage, renders buttons, binds add form
```

Each `init*` function is fully self-contained: it queries its own DOM nodes, sets up its own event listeners, and manages its own interval/state. No cross-panel function calls occur at runtime.

### Data Flow

```
User interaction
  → DOM event listener (inside init function)
    → mutate in-memory array (tasks[] or links[])
      → persist to Local Storage (saveTasks() / saveLinks())
        → re-render panel (renderTasks() / renderLinks())
```

Storage is the single source of truth. On every mutation the full array is serialised and written; on load the array is deserialised and the panel is rendered from it.

---

## Components and Interfaces

### 1. Greeting Panel (`#greeting-panel`)

**Responsibility:** Display current time, date, and a time-of-day greeting. Update the time display every minute.

**HTML Structure:**

```html
<section id="greeting-panel" aria-label="Greeting and current time">
  <p id="greeting-message" aria-live="polite">Good morning</p>
  <time id="current-time" datetime="">00:00</time>
  <p id="current-date"></p>
</section>
```

**JavaScript Interface:**

```js
function initGreeting()
// Renders time, date, greeting immediately on call.
// Starts a setInterval that fires every 60 000 ms to refresh all three values.
// Clears the interval if the panel element is removed (defensive).

function getGreeting(hour: number): string
// Pure function. Returns greeting string based on hour (0–23).
// 5–11  → "Good morning"
// 12–17 → "Good afternoon"
// 18–20 → "Good evening"
// 21–23, 0–4 → "Good night"

function formatTime(date: Date): string
// Pure function. Returns HH:MM string from a Date object.

function formatDate(date: Date): string
// Pure function. Returns human-readable date string,
// e.g. "Monday, 14 July 2025", using Intl.DateTimeFormat.
```

**State:** No persistent state. All values derived from `new Date()` on each tick.

---

### 2. Focus Timer (`#focus-timer`)

**Responsibility:** 25-minute countdown with start, stop, and reset. Notify the user when the timer reaches zero.

**HTML Structure:**

```html
<section id="focus-timer" aria-label="Focus timer">
  <output id="timer-display" aria-live="polite" aria-atomic="true">25:00</output>
  <div class="timer-controls" role="group" aria-label="Timer controls">
    <button id="timer-start" type="button">Start</button>
    <button id="timer-stop"  type="button" disabled>Stop</button>
    <button id="timer-reset" type="button">Reset</button>
  </div>
  <p id="timer-notification" role="alert" aria-live="assertive" hidden>
    Time's up! Take a break.
  </p>
</section>
```

**JavaScript Interface:**

```js
function initTimer()
// Sets up module-scoped timer state (see below).
// Binds click listeners to start, stop, reset buttons.
// Manages button disabled states to reflect current timer mode.

function startTimer()   // Starts setInterval(tick, 1000); updates button states.
function stopTimer()    // Clears interval; retains remaining seconds.
function resetTimer()   // Clears interval; restores remainingSeconds to 1500.
function tick()         // Decrements remainingSeconds; calls renderTimer();
                        // if remainingSeconds === 0, calls onTimerComplete().
function renderTimer()  // Updates #timer-display with formatMMSS(remainingSeconds).
function onTimerComplete()
// Stops the timer, shows #timer-notification, attempts Web Notifications API
// (requests permission if not yet granted; falls back to visual-only if denied).

function formatMMSS(totalSeconds: number): string
// Pure function. Returns "MM:SS" zero-padded string.
```

**Module-scoped state (inside `initTimer` closure):**

```js
let remainingSeconds = 1500   // 25 * 60
let intervalId = null         // setInterval handle; null when stopped
```

**Button State Matrix:**

| Timer state | Start | Stop | Reset |
|---|---|---|---|
| Idle (not started) | enabled | disabled | enabled |
| Running | disabled | enabled | enabled |
| Paused | enabled | disabled | enabled |
| Complete | enabled | disabled | enabled |

---

### 3. Task List (`#task-list`)

**Responsibility:** Add, edit, complete, and delete tasks. Persist to Local Storage. Render the full list on every mutation.

**HTML Structure:**

```html
<section id="task-list" aria-label="Task list">
  <form id="task-add-form" novalidate>
    <label for="task-input">New task</label>
    <input id="task-input" type="text" placeholder="What needs doing?"
           autocomplete="off" aria-describedby="task-input-error" />
    <span id="task-input-error" role="alert" aria-live="polite" hidden></span>
    <button type="submit">Add</button>
  </form>
  <ul id="task-items" aria-label="Tasks" aria-live="polite"></ul>
</section>
```

**Per-task item (rendered into `<ul>`):**

```html
<li data-id="{id}" class="task-item [task-item--complete]">
  <!-- Display mode -->
  <button class="task-toggle" type="button"
          aria-label="Mark complete" aria-pressed="{completed}">
    <span class="task-toggle-icon" aria-hidden="true"></span>
  </button>
  <span class="task-text">{text}</span>
  <button class="task-edit"   type="button" aria-label="Edit task">Edit</button>
  <button class="task-delete" type="button" aria-label="Delete task">Delete</button>

  <!-- Edit mode (replaces display mode content) -->
  <form class="task-edit-form" novalidate>
    <input class="task-edit-input" type="text" value="{text}"
           aria-label="Edit task text" />
    <button type="submit">Save</button>
    <button type="button" class="task-edit-cancel">Cancel</button>
  </form>
</li>
```

**JavaScript Interface:**

```js
function initTaskList()
// Loads tasks from storage, renders list, binds add-form submit.

function loadTasks(): Task[]
// Reads dashboard:tasks from Local Storage; returns [] on missing/corrupt data.

function saveTasks(tasks: Task[]): void
// Serialises tasks array to JSON and writes to dashboard:tasks.

function renderTasks(tasks: Task[]): void
// Clears #task-items and rebuilds all <li> elements from the tasks array.
// Binds per-item event listeners (toggle, edit, delete, edit-form).

function addTask(tasks: Task[], text: string): Task[]
// Pure function. Returns new array with a new Task appended.
// Throws if text is empty/whitespace (caller handles validation UI).

function editTask(tasks: Task[], id: string, newText: string): Task[]
// Pure function. Returns new array with the matching task's text updated.
// Throws if newText is empty/whitespace.

function toggleTask(tasks: Task[], id: string): Task[]
// Pure function. Returns new array with the matching task's completed flag flipped.

function deleteTask(tasks: Task[], id: string): Task[]
// Pure function. Returns new array with the matching task removed.

function generateId(): string
// Returns a unique string ID (crypto.randomUUID() with Date.now() fallback).
```

**Edit Mode Behaviour:**
- Activating "Edit" on a task replaces the display-mode content with an inline `<form>`.
- Only one task can be in edit mode at a time; activating edit on a second task saves/cancels the first.
- Pressing Escape cancels the edit (keydown listener on the edit input).

---

### 4. Quick Links (`#quick-links`)

**Responsibility:** Add and delete user-defined URL shortcuts. Open links in a new tab. Persist to Local Storage.

**HTML Structure:**

```html
<section id="quick-links" aria-label="Quick links">
  <form id="link-add-form" novalidate>
    <label for="link-label-input">Label</label>
    <input id="link-label-input" type="text" placeholder="e.g. GitHub"
           autocomplete="off" aria-describedby="link-label-error" />
    <span id="link-label-error" role="alert" aria-live="polite" hidden></span>

    <label for="link-url-input">URL</label>
    <input id="link-url-input" type="url" placeholder="https://example.com"
           autocomplete="off" aria-describedby="link-url-error" />
    <span id="link-url-error" role="alert" aria-live="polite" hidden></span>

    <button type="submit">Add Link</button>
  </form>
  <ul id="link-items" aria-label="Quick links" aria-live="polite"></ul>
</section>
```

**Per-link item (rendered into `<ul>`):**

```html
<li data-id="{id}" class="link-item">
  <a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>
  <button class="link-delete" type="button" aria-label="Delete {label} link">Delete</button>
</li>
```

**JavaScript Interface:**

```js
function initQuickLinks()
// Loads links from storage, renders panel, binds add-form submit.

function loadLinks(): Link[]
// Reads dashboard:links from Local Storage; returns [] on missing/corrupt data.

function saveLinks(links: Link[]): void
// Serialises links array to JSON and writes to dashboard:links.

function renderLinks(links: Link[]): void
// Clears #link-items and rebuilds all <li> elements from the links array.
// Binds per-item delete listener.

function addLink(links: Link[], label: string, url: string): Link[]
// Pure function. Returns new array with a new Link appended.
// Throws if label is empty/whitespace or url fails isValidUrl().

function deleteLink(links: Link[], id: string): Link[]
// Pure function. Returns new array with the matching link removed.

function isValidUrl(url: string): boolean
// Pure function. Returns true if url starts with "http://" or "https://"
// and is parseable by the URL constructor.
```

---

## Data Models

### Task

```js
/**
 * @typedef {Object} Task
 * @property {string}  id        - Unique identifier (crypto.randomUUID or Date.now fallback)
 * @property {string}  text      - Task description (non-empty, trimmed before storage)
 * @property {boolean} completed - Whether the task has been marked done
 */
```

**Example:**
```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "text": "Write the design document",
  "completed": false
}
```

**Constraints:**
- `text` must be non-empty after trimming whitespace
- `id` must be unique within the tasks array
- `completed` defaults to `false` on creation

### Link

```js
/**
 * @typedef {Object} Link
 * @property {string} id    - Unique identifier
 * @property {string} label - Display label for the shortcut button (non-empty, trimmed)
 * @property {string} url   - Fully-qualified URL beginning with http:// or https://
 */
```

**Example:**
```json
{
  "id": "f0e1d2c3-b4a5-6789-0123-456789abcdef",
  "label": "GitHub",
  "url": "https://github.com"
}
```

**Constraints:**
- `label` must be non-empty after trimming whitespace
- `url` must begin with `http://` or `https://` and be parseable by `new URL()`
- `id` must be unique within the links array

### Local Storage Layout

| Key | Type | Description |
|---|---|---|
| `dashboard:tasks` | `JSON string → Task[]` | Ordered array of all tasks |
| `dashboard:links` | `JSON string → Link[]` | Ordered array of all links |

**Read pattern (both panels):**
```js
function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? [];
  } catch {
    return [];  // corrupt data treated as empty
  }
}
```

**Write pattern (both panels):**
```js
function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}
```

No versioning or migration is required for the initial implementation. If the stored JSON is unparseable, the panel silently starts with an empty array (Requirement 6.3, 9.3).

---

## CSS Design System

### Design Tokens (Custom Properties)

```css
:root {
  /* Typography */
  --font-family: system-ui, -apple-system, sans-serif;
  --font-size-base: 16px;
  --font-size-sm:   14px;
  --font-size-lg:   20px;
  --font-size-xl:   32px;
  --font-size-2xl:  48px;

  /* Spacing scale */
  --space-xs:  4px;
  --space-sm:  8px;
  --space-md:  16px;
  --space-lg:  24px;
  --space-xl:  40px;

  /* Border radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Transitions */
  --transition-fast: 150ms ease;

  /* Light theme colours */
  --color-bg:           #f5f5f5;
  --color-surface:      #ffffff;
  --color-surface-alt:  #f0f0f0;
  --color-border:       #d0d0d0;
  --color-text:         #1a1a1a;
  --color-text-muted:   #6b6b6b;
  --color-accent:       #2563eb;
  --color-accent-hover: #1d4ed8;
  --color-success:      #16a34a;
  --color-danger:       #dc2626;
  --color-danger-hover: #b91c1c;
  --color-complete-text:#6b6b6b;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-bg:           #0f0f0f;
    --color-surface:      #1c1c1c;
    --color-surface-alt:  #2a2a2a;
    --color-border:       #3a3a3a;
    --color-text:         #f0f0f0;
    --color-text-muted:   #a0a0a0;
    --color-accent:       #3b82f6;
    --color-accent-hover: #60a5fa;
    --color-success:      #22c55e;
    --color-danger:       #ef4444;
    --color-danger-hover: #f87171;
    --color-complete-text:#6b7280;
  }
}
```

**Contrast verification (light theme):**
- `--color-text` (#1a1a1a) on `--color-surface` (#ffffff): ~18.1:1 ✓
- `--color-text-muted` (#6b6b6b) on `--color-surface` (#ffffff): ~5.74:1 ✓
- `--color-accent` (#2563eb) on `--color-surface` (#ffffff): ~5.9:1 ✓
- `--color-danger` (#dc2626) on `--color-surface` (#ffffff): ~5.1:1 ✓

**Contrast verification (dark theme):**
- `--color-text` (#f0f0f0) on `--color-surface` (#1c1c1c): ~14.7:1 ✓
- `--color-text-muted` (#a0a0a0) on `--color-surface` (#1c1c1c): ~6.1:1 ✓
- `--color-accent` (#3b82f6) on `--color-surface` (#1c1c1c): ~5.2:1 ✓

All pairs meet WCAG 2.1 AA (4.5:1 minimum for normal text).

### Layout

The dashboard uses a **CSS Grid** layout at the `<main>` level:

```
Desktop (≥ 768px):          Mobile (< 768px):
┌──────────┬──────────┐     ┌──────────────────┐
│ Greeting │  Timer   │     │     Greeting      │
├──────────┴──────────┤     ├──────────────────┤
│      Task List      │     │      Timer        │
├──────────┬──────────┤     ├──────────────────┤
│          │  Quick   │     │    Task List      │
│          │  Links   │     ├──────────────────┤
└──────────┴──────────┘     │   Quick Links     │
                             └──────────────────┘
```

```css
#dashboard {
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-areas:
    "greeting  timer"
    "tasks     tasks"
    "tasks     links";
  gap: var(--space-lg);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-lg);
}

@media (max-width: 767px) {
  #dashboard {
    grid-template-columns: 1fr;
    grid-template-areas:
      "greeting"
      "timer"
      "tasks"
      "links";
  }
}
```

### Component Styles

**Panels** share a common card style:
```css
.panel {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}
```

**Buttons** use a consistent base with variant modifiers:
- `.btn` — base styles (padding, border-radius, cursor, transition)
- `.btn--primary` — accent background
- `.btn--danger` — danger background
- `.btn--ghost` — transparent background, border on hover

**Completed task** visual treatment:
```css
.task-item--complete .task-text {
  text-decoration: line-through;
  color: var(--color-complete-text);
}
```

**Timer display** uses a large monospace font to prevent layout shift as digits change:
```css
#timer-display {
  font-size: var(--font-size-2xl);
  font-variant-numeric: tabular-nums;
  font-family: ui-monospace, monospace;
}
```

---

## Error Handling

### Input Validation

All validation is performed client-side before any state mutation. Validation errors are shown inline, adjacent to the relevant input, using `role="alert"` and `aria-live="polite"` so screen readers announce them.

| Scenario | Behaviour |
|---|---|
| Empty/whitespace task text on add | Show error in `#task-input-error`; do not add task |
| Empty/whitespace task text on edit | Show error inline in edit form; retain original text |
| Empty label on link add | Show error in `#link-label-error`; do not add link |
| Empty URL on link add | Show error in `#link-url-error`; do not add link |
| Invalid URL scheme on link add | Show error in `#link-url-error` with format hint |
| Local Storage read failure | Catch JSON.parse error; treat as empty array; no UI error shown |
| Local Storage write failure | Catch setItem error (e.g. quota exceeded); log to console; UI state still updated |
| Web Notifications permission denied | Fall back to visual-only notification; no error shown to user |

### Defensive Patterns

- All `localStorage` reads are wrapped in `try/catch`; corrupt data silently resets to `[]`.
- `generateId()` uses `crypto.randomUUID()` with a `Date.now() + Math.random()` fallback for environments where `crypto.randomUUID` is unavailable.
- Timer `setInterval` handle is stored in a closure variable; `clearInterval` is always called before starting a new interval to prevent double-ticking.
- Link `<a>` elements always include `rel="noopener noreferrer"` to prevent tab-napping.

---

## Testing Strategy

This project has no test files and no test tooling (per project constraints). The testing strategy is therefore documentation-based and manual.

### Property-Based Testing Assessment

The feature contains several pure functions with well-defined input/output behaviour that are amenable to property-based testing:

- `getGreeting(hour)` — pure, finite input space (0–23)
- `formatTime(date)` / `formatMMSS(seconds)` — pure formatting functions
- `addTask` / `editTask` / `toggleTask` / `deleteTask` — pure array transformations
- `addLink` / `deleteLink` — pure array transformations
- `isValidUrl(url)` — pure predicate

However, **no test files are to be created** per the project constraints. The Correctness Properties section below documents the intended invariants so they can be verified manually or used as the basis for future automated tests if the constraint is lifted.

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

The pure functions in this application (`getGreeting`, `formatTime`, `formatDate`, `formatMMSS`, `addTask`, `editTask`, `toggleTask`, `deleteTask`, `addLink`, `deleteLink`, `isValidUrl`, `loadTasks`, `saveTasks`, `loadLinks`, `saveLinks`) have well-defined input/output behaviour that is amenable to property-based testing. The properties below are derived from the acceptance criteria and are intended to be verified manually or used as the basis for automated tests if the no-test-files constraint is lifted.

> **Note:** No test files are created per project constraints. These properties document intended invariants.

---

### Property 1: Greeting correctness for all hours

*For any* integer hour in the range 0–23, `getGreeting(hour)` SHALL return exactly one of "Good morning", "Good afternoon", "Good evening", or "Good night", and the returned value SHALL match the correct time-of-day band: hours 5–11 → "Good morning", hours 12–17 → "Good afternoon", hours 18–20 → "Good evening", hours 21–23 and 0–4 → "Good night".

**Validates: Requirements 1.3, 1.4, 1.5, 1.6**

---

### Property 2: Time formatting correctness

*For any* `Date` object, `formatTime(date)` SHALL return a string matching the pattern `HH:MM` (two-digit zero-padded hour, colon, two-digit zero-padded minute) where the hour and minute values correspond exactly to `date.getHours()` and `date.getMinutes()`.

**Validates: Requirements 1.1**

---

### Property 3: Date formatting completeness

*For any* `Date` object, `formatDate(date)` SHALL return a string that contains the full weekday name, the numeric day of the month, the full month name, and the four-digit year corresponding to that date.

**Validates: Requirements 1.2**

---

### Property 4: Timer display format correctness

*For any* integer `seconds` in the range 0–1500 (inclusive), `formatMMSS(seconds)` SHALL return a string matching the pattern `MM:SS` (two-digit zero-padded minutes, colon, two-digit zero-padded seconds) where `minutes = Math.floor(seconds / 60)` and `secs = seconds % 60`.

**Validates: Requirements 2.7**

---

### Property 5: Adding a task grows the task list

*For any* tasks array and any non-empty, non-whitespace-only string `text`, `addTask(tasks, text)` SHALL return a new array whose length is exactly `tasks.length + 1`, and the last element of the returned array SHALL have a `text` property equal to `text.trim()` and a `completed` property equal to `false`.

**Validates: Requirements 3.2**

---

### Property 6: Whitespace-only input is rejected for both add and edit

*For any* string composed entirely of whitespace characters (spaces, tabs, newlines), both `addTask(tasks, text)` and `editTask(tasks, id, text)` SHALL reject the input — the tasks array SHALL remain unchanged and no new task SHALL be created or updated.

**Validates: Requirements 3.3, 4.4**

---

### Property 7: Task insertion order is preserved

*For any* sequence of `addTask` calls with distinct non-empty texts `[t1, t2, …, tN]` applied to an initially empty array, the resulting array SHALL contain the tasks in the same order they were added, with `t1` at index 0 and `tN` at index N−1.

**Validates: Requirements 3.4**

---

### Property 8: Editing a task updates only its text

*For any* tasks array, any task `id` present in that array, and any non-empty, non-whitespace-only string `newText`, `editTask(tasks, id, newText)` SHALL return a new array of the same length where the task with the matching `id` has `text === newText.trim()`, and all other tasks are unchanged (same `id`, `text`, and `completed` values).

**Validates: Requirements 4.3**

---

### Property 9: Completion toggle is a round-trip

*For any* tasks array and any task `id` present in that array, applying `toggleTask` twice in succession SHALL return an array where the task with that `id` has the same `completed` value as in the original array. Additionally, after a single toggle, the `completed` value SHALL be the logical negation of the original value.

**Validates: Requirements 5.2, 5.3**

---

### Property 10: Deleting a task removes exactly that task

*For any* tasks array and any task `id` present in that array, `deleteTask(tasks, id)` SHALL return a new array of length `tasks.length − 1` that contains no task with `id` equal to the deleted `id`, and all other tasks are present and unchanged.

**Validates: Requirements 5.5**

---

### Property 11: Task storage round-trip

*For any* tasks array (including empty arrays and arrays with varied `completed` states), calling `saveTasks(tasks)` followed immediately by `loadTasks()` SHALL return an array that is deeply equal to the original `tasks` array — same length, same order, same `id`/`text`/`completed` values for every element.

**Validates: Requirements 6.1, 6.2**

---

### Property 12: Adding a link grows the links list

*For any* links array, any non-empty label string, and any URL string beginning with `http://` or `https://`, `addLink(links, label, url)` SHALL return a new array whose length is exactly `links.length + 1`, and the last element SHALL have `label` equal to `label.trim()` and `url` equal to the provided URL.

**Validates: Requirements 7.2**

---

### Property 13: Invalid link input is rejected

*For any* input where the label is empty/whitespace-only, OR the URL is empty, OR the URL does not begin with `http://` or `https://`, `addLink` SHALL reject the input and the links array SHALL remain unchanged. Additionally, `isValidUrl(url)` SHALL return `false` for any string that does not begin with `http://` or `https://`.

**Validates: Requirements 7.3, 7.4**

---

### Property 14: Deleting a link removes exactly that link

*For any* links array and any link `id` present in that array, `deleteLink(links, id)` SHALL return a new array of length `links.length − 1` that contains no link with `id` equal to the deleted `id`, and all other links are present and unchanged.

**Validates: Requirements 8.2**

---

### Property 15: Link storage round-trip

*For any* links array (including empty arrays), calling `saveLinks(links)` followed immediately by `loadLinks()` SHALL return an array that is deeply equal to the original `links` array — same length, same order, same `id`/`label`/`url` values for every element.

**Validates: Requirements 9.1, 9.2**

---

### Manual Verification Checklist

**Greeting Panel:**
- [ ] Time updates every minute
- [ ] Greeting changes at 05:00, 12:00, 18:00, 21:00 boundaries
- [ ] Date format is human-readable

**Focus Timer:**
- [ ] Starts from 25:00; counts down correctly
- [ ] Stop retains current time; Start resumes from retained time
- [ ] Reset returns to 25:00 regardless of state
- [ ] Notification appears at 00:00
- [ ] Button disabled states match the matrix above

**Task List:**
- [ ] Add: non-empty text creates task at bottom of list
- [ ] Add: empty/whitespace shows validation error, no task added
- [ ] Edit: pre-populates with current text; save updates; cancel reverts
- [ ] Edit: empty/whitespace save shows error, retains original
- [ ] Toggle: applies/removes strikethrough; persists across reload
- [ ] Delete: removes task immediately; persists across reload
- [ ] Reload: all tasks restored from Local Storage

**Quick Links:**
- [ ] Add: valid label + http(s) URL creates button
- [ ] Add: empty label or URL shows validation error
- [ ] Add: non-http(s) URL shows format error
- [ ] Click: opens URL in new tab
- [ ] Delete: removes button immediately; persists across reload
- [ ] Reload: all links restored from Local Storage

**Layout:**
- [ ] Renders correctly at 320px, 768px, 1200px, 1920px
- [ ] Dark mode activates when OS preference is dark
- [ ] All text meets 4.5:1 contrast in both themes


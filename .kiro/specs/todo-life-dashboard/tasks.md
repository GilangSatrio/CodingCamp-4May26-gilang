# Implementation Plan: To-Do Life Dashboard

## Overview

Build the entire application as a single `index.html` file. The file contains all HTML structure, CSS styling, and JavaScript logic — no build step, no dependencies, no external files. Implementation proceeds panel by panel, wiring everything together in the final step.

## Tasks

- [x] 1. Scaffold the HTML document and CSS design system
  - Create `index.html` with `<!DOCTYPE html>`, `<html lang="en">`, `<head>`, and `<body>` skeleton
  - Add `<meta charset="UTF-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1.0">`, and `<title>To-Do Life Dashboard</title>`
  - Define all CSS custom properties (design tokens) inside `:root` — typography scale, spacing scale, border radii, transition speed, and all light-theme colour variables
  - Add the `@media (prefers-color-scheme: dark)` block that overrides all colour tokens with dark-theme values
  - Write base reset styles (`box-sizing: border-box`, `margin: 0`, `padding: 0`, `body` background and font)
  - Write the `.panel` card component style (background, border, border-radius, padding)
  - Write the `.btn`, `.btn--primary`, `.btn--danger`, and `.btn--ghost` button variant styles
  - Add the `#dashboard` CSS Grid layout with `grid-template-areas` for desktop (≥ 768 px) and the single-column `@media (max-width: 767px)` override
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 2. Build the HTML body structure (four panel sections)
  - Add `<main id="dashboard">` containing four `<section>` elements in DOM order
  - Write `<section id="greeting-panel" aria-label="Greeting and current time">` with `<p id="greeting-message" aria-live="polite">`, `<time id="current-time" datetime="">`, and `<p id="current-date">`
  - Write `<section id="focus-timer" aria-label="Focus timer">` with `<output id="timer-display" aria-live="polite" aria-atomic="true">25:00</output>`, a `<div class="timer-controls" role="group" aria-label="Timer controls">` containing `<button id="timer-start">`, `<button id="timer-stop" disabled>`, `<button id="timer-reset">`, and `<p id="timer-notification" role="alert" aria-live="assertive" hidden>`
  - Write `<section id="task-list" aria-label="Task list">` with `<form id="task-add-form" novalidate>` (label, input `#task-input`, error span `#task-input-error` with `role="alert"`, submit button) and `<ul id="task-items" aria-label="Tasks" aria-live="polite">`
  - Write `<section id="quick-links" aria-label="Quick links">` with `<form id="link-add-form" novalidate>` (label + input `#link-label-input` + error span `#link-label-error`, label + input `#link-url-input` + error span `#link-url-error`, submit button) and `<ul id="link-items" aria-label="Quick links" aria-live="polite">`
  - Assign `grid-area` CSS values to each section so they map to the named grid areas (`greeting`, `timer`, `tasks`, `links`)
  - _Requirements: 10.1, 11.2_

- [x] 3. Implement the Greeting Panel (`initGreeting`)
  - Add a `<script>` tag at the bottom of `<body>`; all subsequent JS goes inside it
  - Write the pure helper `getGreeting(hour)` — returns "Good morning" for hours 5–11, "Good afternoon" for 12–17, "Good evening" for 18–20, "Good night" for 21–23 and 0–4
  - Write the pure helper `formatTime(date)` — returns a zero-padded `HH:MM` string using `date.getHours()` and `date.getMinutes()`
  - Write the pure helper `formatDate(date)` — returns a human-readable string (e.g. "Monday, 14 July 2025") using `Intl.DateTimeFormat` with `weekday: 'long'`, `day: 'numeric'`, `month: 'long'`, `year: 'numeric'`
  - Write `initGreeting()` — queries `#greeting-message`, `#current-time`, `#current-date`; calls a local `render()` helper immediately; starts `setInterval(render, 60000)`; the `render()` helper calls `new Date()`, sets `greeting-message` text via `getGreeting`, sets `current-time` text and `datetime` attribute via `formatTime`, sets `current-date` text via `formatDate`
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_

- [x] 4. Implement the Focus Timer (`initTimer`)
  - Write the pure helper `formatMMSS(totalSeconds)` — returns a zero-padded `MM:SS` string where `minutes = Math.floor(totalSeconds / 60)` and `secs = totalSeconds % 60`
  - Write `initTimer()` with closure-scoped `let remainingSeconds = 1500` and `let intervalId = null`
  - Inside `initTimer`, write `renderTimer()` — sets `#timer-display` text to `formatMMSS(remainingSeconds)`
  - Write `startTimer()` — guards against double-start with `if (intervalId) return`; sets `intervalId = setInterval(tick, 1000)`; updates button disabled states (start: disabled, stop: enabled, reset: enabled)
  - Write `stopTimer()` — calls `clearInterval(intervalId)`; sets `intervalId = null`; updates button disabled states (start: enabled, stop: disabled, reset: enabled)
  - Write `resetTimer()` — calls `stopTimer()`; sets `remainingSeconds = 1500`; hides `#timer-notification`; calls `renderTimer()`
  - Write `tick()` — decrements `remainingSeconds`; calls `renderTimer()`; if `remainingSeconds === 0` calls `onTimerComplete()`
  - Write `onTimerComplete()` — calls `stopTimer()`; shows `#timer-notification` by removing the `hidden` attribute; attempts `Notification.requestPermission()` and fires a Web Notification if granted, with a silent fallback if denied or API unavailable
  - Bind click listeners: `#timer-start` → `startTimer`, `#timer-stop` → `stopTimer`, `#timer-reset` → `resetTimer`
  - Call `renderTimer()` once at the end of `initTimer()` to set the initial display
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 5. Implement Task List storage and pure data functions
  - Write `generateId()` — returns `crypto.randomUUID()` with a `Date.now().toString(36) + Math.random().toString(36).slice(2)` fallback
  - Write `loadTasks()` — reads `dashboard:tasks` from `localStorage`; wraps `JSON.parse` in `try/catch`; returns `[]` on missing or corrupt data
  - Write `saveTasks(tasks)` — calls `localStorage.setItem('dashboard:tasks', JSON.stringify(tasks))`; wraps in `try/catch` and logs any quota error to `console.error`
  - Write `addTask(tasks, text)` — trims `text`; throws if empty; returns `[...tasks, { id: generateId(), text: trimmed, completed: false }]`
  - Write `editTask(tasks, id, newText)` — trims `newText`; throws if empty; returns a new array with the matching task's `text` updated; all other tasks unchanged
  - Write `toggleTask(tasks, id)` — returns a new array with the matching task's `completed` flag flipped; all other tasks unchanged
  - Write `deleteTask(tasks, id)` — returns a new array with the matching task filtered out
  - _Requirements: 3.2, 3.3, 4.3, 4.4, 5.2, 5.3, 5.5, 6.1, 6.2, 6.3_

- [x] 6. Implement Task List rendering and `initTaskList`
  - Write `renderTasks(tasks)` — clears `#task-items`; for each task builds a `<li data-id="{id}" class="task-item [task-item--complete]">` containing: a toggle `<button class="task-toggle" aria-pressed="{completed}">` with an inner `<span class="task-toggle-icon" aria-hidden="true">`, a `<span class="task-text">`, an edit `<button class="task-edit">`, and a delete `<button class="task-delete">`; appends each `<li>` to `#task-items`; binds per-item event listeners (toggle, edit, delete) using the `data-id` attribute to identify the task
  - Implement inline edit mode inside `renderTasks`: the edit button listener replaces the `<li>` content with a `<form class="task-edit-form">` containing a pre-populated `<input class="task-edit-input">`, a save `<button type="submit">`, and a cancel `<button type="button" class="task-edit-cancel">`; add a `keydown` listener on the input to cancel on Escape; only one task may be in edit mode at a time (activating edit on a second task cancels any open edit form first)
  - Write `initTaskList()` — loads tasks via `loadTasks()`; calls `renderTasks(tasks)`; binds `#task-add-form` submit: trims input, shows/hides `#task-input-error`, on valid input calls `addTask`, `saveTasks`, `renderTasks`, clears the input field
  - Add CSS for `.task-item`, `.task-item--complete .task-text` (line-through, muted colour), `.task-toggle`, `.task-edit-form`, and the edit input
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3_

- [x] 7. Checkpoint — verify task list behaviour end-to-end
  - Ensure all tasks pass, ask the user if questions arise.

- [x] 8. Implement Quick Links storage and pure data functions
  - Write `isValidUrl(url)` — returns `true` if `url` starts with `http://` or `https://` and is parseable by `new URL(url)`; returns `false` otherwise; wraps `new URL()` in `try/catch`
  - Write `loadLinks()` — reads `dashboard:links` from `localStorage`; wraps `JSON.parse` in `try/catch`; returns `[]` on missing or corrupt data
  - Write `saveLinks(links)` — calls `localStorage.setItem('dashboard:links', JSON.stringify(links))`; wraps in `try/catch` and logs any quota error to `console.error`
  - Write `addLink(links, label, url)` — trims `label`; throws if label is empty or `isValidUrl(url)` is false; returns `[...links, { id: generateId(), label: trimmedLabel, url }]`
  - Write `deleteLink(links, id)` — returns a new array with the matching link filtered out
  - _Requirements: 7.2, 7.3, 7.4, 8.2, 9.1, 9.2, 9.3_

- [x] 9. Implement Quick Links rendering and `initQuickLinks`
  - Write `renderLinks(links)` — clears `#link-items`; for each link builds a `<li data-id="{id}" class="link-item">` containing an `<a href="{url}" target="_blank" rel="noopener noreferrer">{label}</a>` and a `<button class="link-delete" aria-label="Delete {label} link">Delete</button>`; appends each `<li>` to `#link-items`; binds the delete button listener using `data-id`
  - Write `initQuickLinks()` — loads links via `loadLinks()`; calls `renderLinks(links)`; binds `#link-add-form` submit: trims label and URL inputs, shows/hides `#link-label-error` and `#link-url-error` with appropriate messages (empty label, empty URL, invalid URL scheme), on valid input calls `addLink`, `saveLinks`, `renderLinks`, clears both input fields
  - Add CSS for `.link-item`, `.link-item a` (button-like appearance using `.btn` styles), and `.link-delete`
  - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 8.1, 8.2, 9.1, 9.2, 9.3_

- [x] 10. Wire all init functions and apply final polish
  - Add the `DOMContentLoaded` bootstrap at the bottom of the `<script>` block: `document.addEventListener('DOMContentLoaded', () => { initGreeting(); initTimer(); initTaskList(); initQuickLinks(); });`
  - Add panel-specific CSS: `#greeting-panel` typography (large time display using `--font-size-2xl`, monospace `font-variant-numeric: tabular-nums` for `#timer-display`), `#focus-timer` layout (centred display, button group spacing)
  - Add focus-visible styles (`:focus-visible` outline using `--color-accent`) so keyboard navigation is clearly visible in both themes
  - Verify `grid-area` assignments match the `grid-template-areas` names defined in task 1 and that the responsive breakpoint collapses to a single column correctly
  - Ensure all `aria-label`, `aria-live`, `aria-pressed`, `aria-describedby`, `role="alert"`, and `hidden` attributes are present and correct on interactive elements as specified in the design's HTML structures
  - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 11.1, 11.2, 11.3_

- [x] 11. Final checkpoint — full application review
  - Ensure all tasks pass, ask the user if questions arise.

## Notes

- All code lives in a single `index.html` file — no separate `.css` or `.js` files
- Tasks 5–6 (task list) and 8–9 (quick links) follow the same data-then-render pattern; implement storage/pure functions before the render/init functions that depend on them
- The `generateId()` helper is shared by both task list and quick links — define it once before either panel's functions
- No test files, no terminal commands, and no build steps are part of this implementation

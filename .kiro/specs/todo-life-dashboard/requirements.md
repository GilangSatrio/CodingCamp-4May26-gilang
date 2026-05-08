# Requirements Document

## Introduction

The To-Do List Life Dashboard is a client-side web application that serves as a personal productivity hub. It combines a contextual greeting with the current time and date, a Pomodoro-style focus timer, a persistent to-do list, and a quick-access links panel — all in a single, minimal HTML/CSS/Vanilla JavaScript page. All data is stored in the browser's Local Storage; no backend server or build tooling is required.

## Glossary

- **Dashboard**: The single-page web application described in this document.
- **Greeting_Panel**: The UI section that displays the current time, date, and a time-of-day greeting message.
- **Focus_Timer**: The UI section that implements a 25-minute countdown timer with start, stop, and reset controls.
- **Task_List**: The UI section that manages the collection of user-defined tasks.
- **Task**: A single to-do item that has a text description and a completion state.
- **Quick_Links_Panel**: The UI section that displays user-defined shortcut buttons that open external URLs.
- **Link**: A user-defined shortcut consisting of a label and a URL.
- **Storage**: The browser's Local Storage API used to persist application data client-side.
- **User**: The person interacting with the Dashboard in a modern web browser.

---

## Requirements

### Requirement 1: Greeting and Current Time Display

**User Story:** As a User, I want to see the current time, date, and a personalised greeting when I open the Dashboard, so that I have immediate context about the time of day without switching to another app.

#### Acceptance Criteria

1. THE Greeting_Panel SHALL display the current time in HH:MM format, updated every minute.
2. THE Greeting_Panel SHALL display the current date in a human-readable format (e.g., "Monday, 14 July 2025").
3. WHEN the local time is between 05:00 and 11:59, THE Greeting_Panel SHALL display the message "Good morning".
4. WHEN the local time is between 12:00 and 17:59, THE Greeting_Panel SHALL display the message "Good afternoon".
5. WHEN the local time is between 18:00 and 20:59, THE Greeting_Panel SHALL display the message "Good evening".
6. WHEN the local time is between 21:00 and 04:59, THE Greeting_Panel SHALL display the message "Good night".

---

### Requirement 2: Focus Timer

**User Story:** As a User, I want a 25-minute countdown timer with start, stop, and reset controls, so that I can time focused work sessions without leaving the Dashboard.

#### Acceptance Criteria

1. THE Focus_Timer SHALL initialise with a countdown value of 25 minutes and 00 seconds (25:00) on page load.
2. WHEN the User activates the start control, THE Focus_Timer SHALL begin counting down in one-second intervals.
3. WHILE the Focus_Timer is counting down, THE Focus_Timer SHALL update the displayed time every second.
4. WHEN the User activates the stop control, THE Focus_Timer SHALL pause the countdown and retain the current remaining time.
5. WHEN the User activates the reset control, THE Focus_Timer SHALL stop any active countdown and restore the displayed time to 25:00.
6. WHEN the countdown reaches 00:00, THE Focus_Timer SHALL stop automatically and display a visual or audible notification to the User.
7. THE Focus_Timer SHALL display the remaining time in MM:SS format at all times.

---

### Requirement 3: To-Do List — Adding and Displaying Tasks

**User Story:** As a User, I want to add tasks to a list and see them displayed immediately, so that I can capture and track things I need to do.

#### Acceptance Criteria

1. THE Task_List SHALL provide an input field and a submit control for entering new task text.
2. WHEN the User submits a non-empty task description, THE Task_List SHALL add the Task to the displayed list immediately.
3. IF the User submits an empty or whitespace-only task description, THEN THE Task_List SHALL reject the submission and display an inline validation message.
4. THE Task_List SHALL display all Tasks in the order they were added, with the most recently added Task appearing at the bottom of the list.

---

### Requirement 4: To-Do List — Editing Tasks

**User Story:** As a User, I want to edit the text of an existing task, so that I can correct mistakes or update task descriptions without deleting and re-adding them.

#### Acceptance Criteria

1. THE Task_List SHALL provide an edit control for each Task in the list.
2. WHEN the User activates the edit control for a Task, THE Task_List SHALL replace the Task's display text with an editable input field pre-populated with the current task description.
3. WHEN the User confirms the edit with a non-empty value, THE Task_List SHALL update the Task's description and return to display mode.
4. IF the User confirms the edit with an empty or whitespace-only value, THEN THE Task_List SHALL reject the update and retain the original task description.
5. WHEN the User cancels the edit, THE Task_List SHALL discard any changes and return the Task to display mode with the original description.

---

### Requirement 5: To-Do List — Completing and Deleting Tasks

**User Story:** As a User, I want to mark tasks as done and delete tasks I no longer need, so that I can maintain an accurate and uncluttered task list.

#### Acceptance Criteria

1. THE Task_List SHALL provide a completion toggle control for each Task.
2. WHEN the User activates the completion toggle for an incomplete Task, THE Task_List SHALL mark the Task as complete and apply a distinct visual style (e.g., strikethrough text).
3. WHEN the User activates the completion toggle for a complete Task, THE Task_List SHALL mark the Task as incomplete and remove the completed visual style.
4. THE Task_List SHALL provide a delete control for each Task.
5. WHEN the User activates the delete control for a Task, THE Task_List SHALL remove the Task from the list immediately.

---

### Requirement 6: To-Do List — Persistence

**User Story:** As a User, I want my tasks to be saved automatically, so that my list is still available after I close and reopen the browser tab.

#### Acceptance Criteria

1. WHEN a Task is added, edited, completed, or deleted, THE Storage SHALL persist the updated Task_List to Local Storage immediately.
2. WHEN the Dashboard loads, THE Task_List SHALL read all previously saved Tasks from Local Storage and display them.
3. IF no Tasks are found in Local Storage on load, THEN THE Task_List SHALL display an empty list with no error.

---

### Requirement 7: Quick Links — Adding and Displaying Links

**User Story:** As a User, I want to add shortcut buttons for my favourite websites, so that I can open them quickly from the Dashboard.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide input fields for a link label and a URL, and a submit control for adding a new Link.
2. WHEN the User submits a Link with a non-empty label and a valid URL, THE Quick_Links_Panel SHALL add a shortcut button to the panel immediately.
3. IF the User submits a Link with an empty label or an empty URL, THEN THE Quick_Links_Panel SHALL reject the submission and display an inline validation message.
4. IF the User submits a Link with a URL that does not begin with "http://" or "https://", THEN THE Quick_Links_Panel SHALL reject the submission and display an inline validation message indicating the URL format requirement.
5. WHEN the User activates a shortcut button, THE Quick_Links_Panel SHALL open the associated URL in a new browser tab.

---

### Requirement 8: Quick Links — Deleting Links

**User Story:** As a User, I want to remove quick links I no longer need, so that the panel stays relevant and uncluttered.

#### Acceptance Criteria

1. THE Quick_Links_Panel SHALL provide a delete control for each Link.
2. WHEN the User activates the delete control for a Link, THE Quick_Links_Panel SHALL remove the Link and its shortcut button from the panel immediately.

---

### Requirement 9: Quick Links — Persistence

**User Story:** As a User, I want my quick links to be saved automatically, so that they are still available after I close and reopen the browser tab.

#### Acceptance Criteria

1. WHEN a Link is added or deleted, THE Storage SHALL persist the updated Links collection to Local Storage immediately.
2. WHEN the Dashboard loads, THE Quick_Links_Panel SHALL read all previously saved Links from Local Storage and render the corresponding shortcut buttons.
3. IF no Links are found in Local Storage on load, THEN THE Quick_Links_Panel SHALL display an empty panel with no error.

---

### Requirement 10: Layout and Visual Design

**User Story:** As a User, I want a clean, readable, and visually organised interface, so that I can use the Dashboard comfortably without distraction.

#### Acceptance Criteria

1. THE Dashboard SHALL render all four panels (Greeting_Panel, Focus_Timer, Task_List, Quick_Links_Panel) on a single page without requiring navigation between pages.
2. THE Dashboard SHALL apply a consistent typographic scale with a minimum body font size of 14px.
3. THE Dashboard SHALL provide sufficient colour contrast between text and background colours to meet WCAG 2.1 AA contrast ratio requirements (minimum 4.5:1 for normal text).
4. THE Dashboard SHALL be responsive and remain usable at viewport widths from 320px to 1920px.
5. WHERE the User's operating system reports a preference for dark colour scheme, THE Dashboard SHALL apply a dark theme automatically.

---

### Requirement 11: Browser Compatibility and Standalone Use

**User Story:** As a User, I want the Dashboard to work in any modern browser without installation or a server, so that I can use it immediately by opening the HTML file.

#### Acceptance Criteria

1. THE Dashboard SHALL function correctly in the current stable releases of Chrome, Firefox, Edge, and Safari without requiring any browser extensions or plugins.
2. THE Dashboard SHALL operate as a standalone file that can be opened directly from the local filesystem (using a `file://` URL) without requiring a web server.
3. THE Dashboard SHALL use only standard Web APIs available in modern browsers and SHALL NOT depend on any third-party libraries or frameworks.

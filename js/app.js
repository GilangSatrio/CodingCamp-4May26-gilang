// =============================================================
// To-Do Life Dashboard — app.js
// =============================================================

// =============================================================
// Storage Keys
// =============================================================

const STORAGE = {
  name:    'dashboard:name',
  theme:   'dashboard:theme',
  timer:   'dashboard:timer-minutes',
  tasks:   'dashboard:tasks',
  links:   'dashboard:links',
};

// =============================================================
// Greeting Panel
// =============================================================

/**
 * Returns a time-of-day greeting based on the given hour (0–23).
 * @param {number} hour
 * @returns {string}
 */
function getGreeting(hour) {
  if (hour >= 5  && hour <= 11) return 'Good morning';
  if (hour >= 12 && hour <= 17) return 'Good afternoon';
  if (hour >= 18 && hour <= 20) return 'Good evening';
  return 'Good night'; // 21–23 and 0–4
}

/**
 * Formats a Date as a zero-padded HH:MM string.
 * @param {Date} date
 * @returns {string}
 */
function formatTime(date) {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

/**
 * Formats a Date as a human-readable string, e.g. "Monday, 14 July 2025".
 * @param {Date} date
 * @returns {string}
 */
function formatDate(date) {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Initialises the greeting panel.
 * Renders immediately and refreshes every 60 seconds.
 * Supports a custom user name stored in localStorage.
 */
function initGreeting() {
  const greetingEl  = document.querySelector('#greeting-message');
  const timeEl      = document.querySelector('#current-time');
  const dateEl      = document.querySelector('#current-date');
  const nameTextEl  = document.querySelector('#name-text');
  const nameEditBtn = document.querySelector('#name-edit-btn');
  const nameForm    = document.querySelector('#name-edit-form');
  const nameInput   = document.querySelector('#name-input');
  const nameCancelBtn = document.querySelector('#name-cancel-btn');

  function loadName() {
    return localStorage.getItem(STORAGE.name) || '';
  }

  function saveName(name) {
    localStorage.setItem(STORAGE.name, name);
  }

  function renderName(name) {
    if (name) {
      nameTextEl.textContent = name;
      nameEditBtn.setAttribute('aria-label', 'Edit your name');
    } else {
      nameTextEl.textContent = 'Set your name';
      nameEditBtn.setAttribute('aria-label', 'Set your name');
    }
  }

  function render() {
    const now  = new Date();
    const name = loadName();
    const greeting = getGreeting(now.getHours());
    greetingEl.textContent = name ? `${greeting}, ${name} 👋` : greeting;
    timeEl.textContent     = formatTime(now);
    timeEl.setAttribute('datetime', now.toISOString());
    dateEl.textContent     = formatDate(now);
  }

  function openEdit() {
    nameInput.value = loadName();
    nameForm.removeAttribute('hidden');
    nameEditBtn.setAttribute('hidden', '');
    nameInput.focus();
    nameInput.select();
  }

  function closeEdit() {
    nameForm.setAttribute('hidden', '');
    nameEditBtn.removeAttribute('hidden');
  }

  // Bind name edit controls
  nameEditBtn.addEventListener('click', openEdit);

  nameCancelBtn.addEventListener('click', closeEdit);

  nameInput.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeEdit();
  });

  nameForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const name = nameInput.value.trim();
    saveName(name);
    renderName(name);
    closeEdit();
    render(); // refresh greeting with new name immediately
  });

  // Initial render
  renderName(loadName());
  render();
  setInterval(render, 60000);
}

// =============================================================
// Focus Timer
// =============================================================

/**
 * Formats a total number of seconds as a zero-padded MM:SS string.
 * @param {number} totalSeconds
 * @returns {string}
 */
function formatMMSS(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const secs    = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Initialises the focus timer panel.
 * Supports preset and custom durations, persisted to localStorage.
 */
function initTimer() {
  const DEFAULT_MINS   = 25;

  const displayEl      = document.querySelector('#timer-display');
  const startBtn       = document.querySelector('#timer-start');
  const stopBtn        = document.querySelector('#timer-stop');
  const resetBtn       = document.querySelector('#timer-reset');
  const notificationEl = document.querySelector('#timer-notification');
  const presetBtns     = document.querySelectorAll('.timer-preset');
  const customInput    = document.querySelector('#timer-custom-input');
  const customSetBtn   = document.querySelector('#timer-custom-set');

  // Load saved duration or fall back to default
  function loadMinutes() {
    const saved = parseInt(localStorage.getItem(STORAGE.timer), 10);
    return (saved > 0 && saved <= 999) ? saved : DEFAULT_MINS;
  }

  function saveMinutes(mins) {
    localStorage.setItem(STORAGE.timer, String(mins));
  }

  let totalSeconds     = loadMinutes() * 60;
  let remainingSeconds = totalSeconds;
  let intervalId       = null;

  function renderTimer() {
    displayEl.textContent = formatMMSS(remainingSeconds);
  }

  function updateButtons(running) {
    startBtn.disabled = running;
    stopBtn.disabled  = !running;
    resetBtn.disabled = false;
  }

  // Highlight the active preset button (or none if custom)
  function updatePresetHighlight(activeMins) {
    presetBtns.forEach(function (btn) {
      const mins = parseInt(btn.dataset.minutes, 10);
      if (mins === activeMins) {
        btn.classList.replace('btn--ghost', 'btn--primary');
      } else {
        btn.classList.replace('btn--primary', 'btn--ghost');
      }
    });
  }

  // Apply a new duration (only allowed when timer is not running)
  function setDuration(mins) {
    if (intervalId) return; // ignore while running
    const clamped    = Math.max(1, Math.min(999, mins));
    totalSeconds     = clamped * 60;
    remainingSeconds = totalSeconds;
    saveMinutes(clamped);
    updatePresetHighlight(clamped);
    notificationEl.setAttribute('hidden', '');
    renderTimer();
  }

  function startTimer() {
    if (intervalId) return;
    intervalId = setInterval(tick, 1000);
    updateButtons(true);
  }

  function stopTimer() {
    clearInterval(intervalId);
    intervalId = null;
    updateButtons(false);
  }

  function resetTimer() {
    stopTimer();
    remainingSeconds = totalSeconds;
    notificationEl.setAttribute('hidden', '');
    renderTimer();
  }

  function tick() {
    remainingSeconds -= 1;
    renderTimer();
    if (remainingSeconds === 0) onTimerComplete();
  }

  function onTimerComplete() {
    stopTimer();
    notificationEl.removeAttribute('hidden');

    try {
      if ('Notification' in window) {
        Notification.requestPermission().then(function (permission) {
          if (permission === 'granted') {
            try {
              new Notification('Focus session complete', {
                body: "Time's up! Take a break.",
                silent: true,
              });
            } catch (e) { /* visual fallback already shown */ }
          }
        }).catch(function () { /* visual fallback already shown */ });
      }
    } catch (e) { /* Notifications API unavailable */ }
  }

  // Preset buttons
  presetBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      setDuration(parseInt(btn.dataset.minutes, 10));
    });
  });

  // Custom input — Set button
  customSetBtn.addEventListener('click', function () {
    const val = parseInt(customInput.value, 10);
    if (val > 0 && val <= 999) {
      setDuration(val);
      customInput.value = '';
    } else {
      customInput.focus();
    }
  });

  // Custom input — Enter key
  customInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') customSetBtn.click();
  });

  startBtn.addEventListener('click', startTimer);
  stopBtn.addEventListener('click', stopTimer);
  resetBtn.addEventListener('click', resetTimer);

  // Initial render
  updatePresetHighlight(loadMinutes());
  renderTimer();
}

// =============================================================
// Shared Utilities
// =============================================================

/**
 * Generates a unique string ID.
 * Uses crypto.randomUUID() with a Date.now() + Math.random() fallback.
 * @returns {string}
 */
function generateId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// =============================================================
// Task List — Storage & Pure Data Functions
// =============================================================

/**
 * Loads the tasks array from Local Storage.
 * Returns [] on missing or corrupt data.
 * @returns {Array<{id: string, text: string, completed: boolean}>}
 */
function loadTasks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.tasks)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Persists the tasks array to Local Storage.
 * @param {Array<{id: string, text: string, completed: boolean}>} tasks
 */
function saveTasks(tasks) {
  try {
    localStorage.setItem(STORAGE.tasks, JSON.stringify(tasks));
  } catch (e) {
    console.error('saveTasks: failed to write to localStorage', e);
  }
}

/**
 * Pure. Returns a new array with a new task appended.
 * Throws if text is empty/whitespace or already exists (case-insensitive).
 * @param {Array} tasks
 * @param {string} text
 * @returns {Array}
 */
function addTask(tasks, text) {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Task text must not be empty.');
  const duplicate = tasks.some(t => t.text.toLowerCase() === trimmed.toLowerCase());
  if (duplicate) throw new Error('duplicate');
  return [...tasks, { id: generateId(), text: trimmed, completed: false }];
}

/**
 * Pure. Returns a new array with the matching task's text updated.
 * Throws if newText is empty/whitespace.
 * @param {Array} tasks
 * @param {string} id
 * @param {string} newText
 * @returns {Array}
 */
function editTask(tasks, id, newText) {
  const trimmed = newText.trim();
  if (!trimmed) throw new Error('Task text must not be empty.');
  return tasks.map(task => task.id === id ? { ...task, text: trimmed } : task);
}

/**
 * Pure. Returns a new array with the matching task's completed flag flipped.
 * @param {Array} tasks
 * @param {string} id
 * @returns {Array}
 */
function toggleTask(tasks, id) {
  return tasks.map(task => task.id === id ? { ...task, completed: !task.completed } : task);
}

/**
 * Pure. Returns a new array with the matching task removed.
 * @param {Array} tasks
 * @param {string} id
 * @returns {Array}
 */
function deleteTask(tasks, id) {
  return tasks.filter(task => task.id !== id);
}

// =============================================================
// Task List — Rendering & Init
// =============================================================

/** ID of the task currently in edit mode, or null. */
let activeEditId = null;

/**
 * Builds the toggle button for a task item.
 * @param {{id: string, completed: boolean}} task
 * @returns {HTMLButtonElement}
 */
function buildToggleBtn(task) {
  const btn = document.createElement('button');
  btn.type      = 'button';
  btn.className = 'task-toggle btn btn--ghost';
  btn.setAttribute('aria-label', task.completed ? 'Mark incomplete' : 'Mark complete');
  btn.setAttribute('aria-pressed', String(task.completed));

  const icon = document.createElement('span');
  icon.className   = 'task-toggle-icon';
  icon.setAttribute('aria-hidden', 'true');
  icon.textContent = task.completed ? '✓' : '○';
  btn.appendChild(icon);

  btn.addEventListener('click', function () {
    let tasks = loadTasks();
    tasks = toggleTask(tasks, task.id);
    saveTasks(tasks);
    renderTasks(tasks);
  });

  return btn;
}

/**
 * Builds the inline edit form for a task item.
 * Replaces the <li> content when activated.
 * @param {HTMLLIElement} li
 * @param {{id: string, text: string}} task
 */
function buildEditForm(li, task) {
  li.innerHTML = '';

  const form = document.createElement('form');
  form.className = 'task-edit-form';
  form.setAttribute('novalidate', '');

  const input = document.createElement('input');
  input.type      = 'text';
  input.className = 'task-edit-input';
  input.value     = task.text;
  input.setAttribute('aria-label', 'Edit task text');

  const saveBtn = document.createElement('button');
  saveBtn.type        = 'submit';
  saveBtn.className   = 'btn btn--primary';
  saveBtn.textContent = 'Save';

  const cancelBtn = document.createElement('button');
  cancelBtn.type        = 'button';
  cancelBtn.className   = 'task-edit-cancel btn btn--ghost';
  cancelBtn.textContent = 'Cancel';

  form.appendChild(input);
  form.appendChild(saveBtn);
  form.appendChild(cancelBtn);
  li.appendChild(form);
  input.focus();

  function cancelEdit() {
    activeEditId = null;
    renderTasks(loadTasks());
  }

  input.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') cancelEdit();
  });

  cancelBtn.addEventListener('click', cancelEdit);

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const newText = input.value.trim();

    if (!newText) {
      let errorEl = form.querySelector('.task-edit-error');
      if (!errorEl) {
        errorEl = document.createElement('span');
        errorEl.className = 'task-edit-error';
        errorEl.setAttribute('role', 'alert');
        input.insertAdjacentElement('afterend', errorEl);
      }
      errorEl.textContent = 'Task cannot be empty.';
      input.focus();
      return;
    }

    activeEditId = null;
    let tasks = loadTasks();
    tasks = editTask(tasks, task.id, newText);
    saveTasks(tasks);
    renderTasks(tasks);
  });
}

/**
 * Builds a single task <li> element with all controls and listeners.
 * @param {{id: string, text: string, completed: boolean}} task
 * @returns {HTMLLIElement}
 */
function buildTaskItem(task) {
  const li = document.createElement('li');
  li.dataset.id = task.id;
  li.className  = 'task-item' + (task.completed ? ' task-item--complete' : '');

  const textSpan = document.createElement('span');
  textSpan.className   = 'task-text';
  textSpan.textContent = task.text;

  const editBtn = document.createElement('button');
  editBtn.type        = 'button';
  editBtn.className   = 'task-edit btn btn--ghost';
  editBtn.setAttribute('aria-label', 'Edit task');
  editBtn.textContent = 'Edit';

  const deleteBtn = document.createElement('button');
  deleteBtn.type        = 'button';
  deleteBtn.className   = 'task-delete btn btn--danger';
  deleteBtn.setAttribute('aria-label', 'Delete task');
  deleteBtn.textContent = 'Delete';

  li.appendChild(buildToggleBtn(task));
  li.appendChild(textSpan);
  li.appendChild(editBtn);
  li.appendChild(deleteBtn);

  deleteBtn.addEventListener('click', function () {
    let tasks = loadTasks();
    tasks = deleteTask(tasks, task.id);
    saveTasks(tasks);
    renderTasks(tasks);
  });

  editBtn.addEventListener('click', function () {
    if (activeEditId !== null && activeEditId !== task.id) {
      renderTasks(loadTasks()); // cancel any open edit first
    }
    activeEditId = task.id;
    buildEditForm(li, task);
  });

  return li;
}

/**
 * Clears and rebuilds #task-items from the tasks array.
 * @param {Array<{id: string, text: string, completed: boolean}>} tasks
 */
function renderTasks(tasks) {
  const listEl = document.querySelector('#task-items');
  listEl.innerHTML = '';
  tasks.forEach(function (task) {
    listEl.appendChild(buildTaskItem(task));
  });
}

/**
 * Initialises the Task List panel.
 */
function initTaskList() {
  let tasks = loadTasks();
  renderTasks(tasks);

  const form      = document.querySelector('#task-add-form');
  const input     = document.querySelector('#task-input');
  const errorSpan = document.querySelector('#task-input-error');

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    const text = input.value.trim();

    if (!text) {
      errorSpan.textContent = 'Task cannot be empty';
      errorSpan.removeAttribute('hidden');
      input.focus();
      return;
    }

    errorSpan.textContent = '';
    errorSpan.setAttribute('hidden', '');

    tasks = loadTasks();
    try {
      tasks = addTask(tasks, text);
    } catch (e) {
      const msg = e.message === 'duplicate'
        ? 'This task already exists.'
        : 'Task cannot be empty.';
      errorSpan.textContent = msg;
      errorSpan.removeAttribute('hidden');
      input.focus();
      return;
    }
    saveTasks(tasks);
    renderTasks(tasks);
    input.value = '';
  });
}

// =============================================================
// Quick Links — Storage & Pure Data Functions
// =============================================================

/**
 * Returns true if url starts with http:// or https:// and is parseable.
 * @param {string} url
 * @returns {boolean}
 */
function isValidUrl(url) {
  if (typeof url !== 'string') return false;
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Loads the links array from Local Storage.
 * Returns [] on missing or corrupt data.
 * @returns {Array<{id: string, label: string, url: string}>}
 */
function loadLinks() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE.links)) ?? [];
  } catch {
    return [];
  }
}

/**
 * Persists the links array to Local Storage.
 * @param {Array<{id: string, label: string, url: string}>} links
 */
function saveLinks(links) {
  try {
    localStorage.setItem(STORAGE.links, JSON.stringify(links));
  } catch (e) {
    console.error('saveLinks: failed to write to localStorage', e);
  }
}

/**
 * Pure. Returns a new array with a new link appended.
 * Throws if label is empty or url is invalid.
 * @param {Array} links
 * @param {string} label
 * @param {string} url
 * @returns {Array}
 */
function addLink(links, label, url) {
  const trimmedLabel = label.trim();
  if (!trimmedLabel) throw new Error('Link label must not be empty.');
  if (!isValidUrl(url)) throw new Error('Link URL must begin with http:// or https://.');
  return [...links, { id: generateId(), label: trimmedLabel, url }];
}

/**
 * Pure. Returns a new array with the matching link removed.
 * @param {Array} links
 * @param {string} id
 * @returns {Array}
 */
function deleteLink(links, id) {
  return links.filter(link => link.id !== id);
}

// =============================================================
// Quick Links — Rendering & Init
// =============================================================

/**
 * Clears and rebuilds #link-items from the links array.
 * Binds per-item delete listener.
 * @param {Array<{id: string, label: string, url: string}>} links
 */
function renderLinks(links) {
  const listEl = document.querySelector('#link-items');
  listEl.innerHTML = '';

  links.forEach(function (link) {
    const li = document.createElement('li');
    li.dataset.id = link.id;
    li.className  = 'link-item';

    const anchor = document.createElement('a');
    anchor.href      = link.url;
    anchor.target    = '_blank';
    anchor.rel       = 'noopener noreferrer';
    anchor.className = 'btn btn--primary';
    anchor.textContent = link.label;

    const deleteBtn = document.createElement('button');
    deleteBtn.type      = 'button';
    deleteBtn.className = 'link-delete btn btn--ghost';
    deleteBtn.setAttribute('aria-label', 'Delete ' + link.label + ' link');
    deleteBtn.textContent = 'Delete';

    li.appendChild(anchor);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);

    deleteBtn.addEventListener('click', function () {
      let links = loadLinks();
      links = deleteLink(links, link.id);
      saveLinks(links);
      renderLinks(links);
    });
  });
}

/**
 * Initialises the Quick Links panel.
 */
function initQuickLinks() {
  let links = loadLinks();
  renderLinks(links);

  const form       = document.querySelector('#link-add-form');
  const labelInput = document.querySelector('#link-label-input');
  const urlInput   = document.querySelector('#link-url-input');
  const labelError = document.querySelector('#link-label-error');
  const urlError   = document.querySelector('#link-url-error');

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    const label = labelInput.value.trim();
    const url   = urlInput.value.trim();
    let hasError = false;

    if (!label) {
      labelError.textContent = 'Label cannot be empty';
      labelError.removeAttribute('hidden');
      hasError = true;
    } else {
      labelError.textContent = '';
      labelError.setAttribute('hidden', '');
    }

    if (!url) {
      urlError.textContent = 'URL cannot be empty';
      urlError.removeAttribute('hidden');
      hasError = true;
    } else if (!isValidUrl(url)) {
      urlError.textContent = 'URL must start with http:// or https://';
      urlError.removeAttribute('hidden');
      hasError = true;
    } else {
      urlError.textContent = '';
      urlError.setAttribute('hidden', '');
    }

    if (hasError) return;

    links = loadLinks();
    links = addLink(links, label, url);
    saveLinks(links);
    renderLinks(links);

    labelInput.value = '';
    urlInput.value   = '';
  });
}

// =============================================================
// Theme Toggle
// =============================================================

/**
 * Initialises the light/dark theme toggle.
 * Priority: localStorage override → OS preference.
 * Persists the user's manual choice to localStorage.
 */
function initTheme() {
  const root       = document.documentElement;
  const toggleBtn  = document.querySelector('#theme-toggle');
  const iconEl     = document.querySelector('#theme-icon');

  function getActiveTheme() {
    const stored = root.getAttribute('data-theme');
    if (stored === 'light' || stored === 'dark') return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    iconEl.textContent = theme === 'dark' ? '☀️' : '🌙';
    toggleBtn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    toggleBtn.setAttribute('title',      theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
  }

  // Apply saved preference, or fall back to OS preference
  const saved = localStorage.getItem(STORAGE.theme);
  applyTheme(saved === 'light' || saved === 'dark' ? saved : getActiveTheme());

  toggleBtn.addEventListener('click', function () {
    const next = getActiveTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    localStorage.setItem(STORAGE.theme, next);
  });
}

// =============================================================
// Bootstrap
// =============================================================

document.addEventListener('DOMContentLoaded', function () {
  initTheme();
  initGreeting();
  initTimer();
  initTaskList();
  initQuickLinks();
});

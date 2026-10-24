/* ============================================================
   Life Dashboard – script.js
   Features: Clock/Date/Greeting | Focus Timer | To-Do List
             Quick Links | Light/Dark Mode | Custom Name
             Duplicate Prevention | LocalStorage persistence
   ============================================================ */

'use strict';

/* ──────────────────────────────────────────────
   1. THEME (Light / Dark)
   ────────────────────────────────────────────── */
const themeToggle = document.getElementById('theme-toggle');
const root        = document.documentElement;

function applyTheme(dark) {
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  themeToggle.innerHTML = dark
    ? '<span>☀️</span> Light Mode'
    : '<span>🌙</span> Dark Mode';
  localStorage.setItem('dashboard-theme', dark ? 'dark' : 'light');
}

themeToggle.addEventListener('click', () => {
  applyTheme(root.getAttribute('data-theme') !== 'dark');
});

// Restore saved theme
applyTheme(localStorage.getItem('dashboard-theme') === 'dark');


/* ──────────────────────────────────────────────
   2. CUSTOM NAME
   ────────────────────────────────────────────── */
const nameInput = document.getElementById('user-name-input');

function loadName() {
  const saved = localStorage.getItem('dashboard-name') || '';
  nameInput.value = saved;
  return saved;
}

nameInput.addEventListener('input', () => {
  localStorage.setItem('dashboard-name', nameInput.value.trim());
  updateGreeting();
});

loadName();


/* ──────────────────────────────────────────────
   3. CLOCK, DATE & GREETING
   ────────────────────────────────────────────── */
const clockEl    = document.getElementById('clock');
const dateEl     = document.getElementById('date-display');
const greetingEl = document.getElementById('greeting');

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function pad(n) { return String(n).padStart(2, '0'); }

function getGreetingText(hour) {
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

function updateGreeting() {
  const name = (localStorage.getItem('dashboard-name') || '').trim();
  const hour = new Date().getHours();
  const text = getGreetingText(hour);
  greetingEl.innerHTML = name
    ? `${text}, <span>${name}</span>! 👋`
    : `${text}! 👋`;
}

function tickClock() {
  const now = new Date();
  const h   = pad(now.getHours());
  const m   = pad(now.getMinutes());
  const s   = pad(now.getSeconds());
  clockEl.textContent = `${h}:${m}:${s}`;

  dateEl.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  updateGreeting();
}

tickClock();
setInterval(tickClock, 1000);


/* ──────────────────────────────────────────────
   4. FOCUS TIMER
   ────────────────────────────────────────────── */
const TIMER_MINUTES   = 25;
const TOTAL_SECONDS   = TIMER_MINUTES * 60;
const RADIUS          = 80;                         // must match SVG r attribute
const CIRCUMFERENCE   = 2 * Math.PI * RADIUS;

const timerTimeEl   = document.getElementById('timer-time');
const timerLabelEl  = document.getElementById('timer-label');
const timerProgress = document.getElementById('timer-ring-progress');
const btnStart      = document.getElementById('btn-start');
const btnStop       = document.getElementById('btn-stop');
const btnReset      = document.getElementById('btn-reset');

// Initialise the ring
timerProgress.style.strokeDasharray  = CIRCUMFERENCE;
timerProgress.style.strokeDashoffset = 0;

let secondsLeft = TOTAL_SECONDS;
let timerInterval = null;
let running = false;

function formatTimer(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${pad(m)}:${pad(sec)}`;
}

function updateTimerUI() {
  timerTimeEl.textContent = formatTimer(secondsLeft);
  const progress = secondsLeft / TOTAL_SECONDS;
  timerProgress.style.strokeDashoffset = CIRCUMFERENCE * (1 - progress);
}

function startTimer() {
  if (running) return;
  running = true;
  btnStart.disabled = true;
  btnStop.disabled  = false;
  timerLabelEl.textContent = 'Focus';

  timerInterval = setInterval(() => {
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      running = false;
      timerLabelEl.textContent = 'Done! 🎉';
      showToast('⏰ Focus session complete! Take a break.');
      btnStart.disabled = false;
      btnStop.disabled  = true;
      return;
    }
    secondsLeft--;
    updateTimerUI();
  }, 1000);
}

function stopTimer() {
  if (!running) return;
  clearInterval(timerInterval);
  running = false;
  btnStart.disabled = false;
  btnStop.disabled  = true;
  timerLabelEl.textContent = 'Paused';
}

function resetTimer() {
  stopTimer();
  secondsLeft = TOTAL_SECONDS;
  timerLabelEl.textContent = 'Ready';
  btnStop.disabled = true;
  updateTimerUI();
}

btnStart.addEventListener('click', startTimer);
btnStop.addEventListener('click',  stopTimer);
btnReset.addEventListener('click', resetTimer);

// Init
updateTimerUI();
btnStop.disabled = true;


/* ──────────────────────────────────────────────
   5. TO-DO LIST
   ────────────────────────────────────────────── */
const todoInput  = document.getElementById('todo-input');
const todoAddBtn = document.getElementById('todo-add-btn');
const todoList   = document.getElementById('todo-list');

let tasks = [];

/* --- Persistence --- */
function saveTasks() {
  localStorage.setItem('dashboard-tasks', JSON.stringify(tasks));
}

function loadTasks() {
  try {
    tasks = JSON.parse(localStorage.getItem('dashboard-tasks')) || [];
  } catch {
    tasks = [];
  }
}

/* --- Duplicate check (case-insensitive trim) --- */
function isDuplicate(text, excludeId = null) {
  const normalized = text.trim().toLowerCase();
  return tasks.some(t => t.id !== excludeId && t.text.trim().toLowerCase() === normalized);
}

/* --- Render --- */
function renderTasks() {
  todoList.innerHTML = '';

  if (tasks.length === 0) {
    todoList.innerHTML = '<li class="todo-empty">No tasks yet – add one above! ✨</li>';
    return;
  }

  tasks.forEach(task => {
    const li = document.createElement('li');
    li.className = `todo-item${task.completed ? ' completed' : ''}`;
    li.dataset.id = task.id;

    // Checkbox
    const cb = document.createElement('input');
    cb.type    = 'checkbox';
    cb.checked = task.completed;
    cb.setAttribute('aria-label', `Mark "${task.text}" as complete`);
    cb.addEventListener('change', () => toggleTask(task.id));

    // Text span
    const span = document.createElement('span');
    span.className   = 'todo-text';
    span.textContent = task.text;

    // Actions wrapper
    const actions = document.createElement('div');
    actions.className = 'todo-actions';

    // Edit button
    const editBtn = document.createElement('button');
    editBtn.className   = 'btn btn-secondary btn-sm';
    editBtn.textContent = '✏️';
    editBtn.setAttribute('aria-label', `Edit task "${task.text}"`);
    editBtn.addEventListener('click', () => startEdit(task.id, li, span));

    // Delete button
    const delBtn = document.createElement('button');
    delBtn.className   = 'btn btn-danger btn-sm';
    delBtn.textContent = '🗑️';
    delBtn.setAttribute('aria-label', `Delete task "${task.text}"`);
    delBtn.addEventListener('click', () => deleteTask(task.id));

    actions.append(editBtn, delBtn);
    li.append(cb, span, actions);
    todoList.appendChild(li);
  });
}

/* --- Add --- */
function addTask() {
  const text = todoInput.value.trim();
  if (!text) {
    shakeInput(todoInput);
    showToast('⚠️ Please enter a task name.');
    return;
  }

  if (isDuplicate(text)) {
    shakeInput(todoInput);
    showToast('⚠️ That task already exists!');
    return;
  }

  tasks.push({ id: Date.now(), text, completed: false });
  saveTasks();
  renderTasks();
  todoInput.value = '';
  todoInput.focus();
  showToast('✅ Task added!');
}

/* --- Toggle complete --- */
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    renderTasks();
  }
}

/* --- Inline Edit --- */
function startEdit(id, li, span) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  // Replace text span with input
  const editInput = document.createElement('input');
  editInput.type      = 'text';
  editInput.className = 'todo-edit-input';
  editInput.value     = task.text;
  editInput.setAttribute('aria-label', 'Edit task text');
  li.replaceChild(editInput, span);
  editInput.focus();
  editInput.select();

  // Replace action buttons with Save/Cancel
  const actions = li.querySelector('.todo-actions');
  actions.innerHTML = '';

  const saveBtn = document.createElement('button');
  saveBtn.className   = 'btn btn-primary btn-sm';
  saveBtn.textContent = '💾';
  saveBtn.setAttribute('aria-label', 'Save edit');

  const cancelBtn = document.createElement('button');
  cancelBtn.className   = 'btn btn-secondary btn-sm';
  cancelBtn.textContent = '✖️';
  cancelBtn.setAttribute('aria-label', 'Cancel edit');

  const commit = () => {
    const newText = editInput.value.trim();
    if (!newText) {
      shakeInput(editInput);
      showToast('⚠️ Task name cannot be empty.');
      return;
    }
    if (isDuplicate(newText, id)) {
      shakeInput(editInput);
      showToast('⚠️ A task with that name already exists!');
      return;
    }
    task.text = newText;
    saveTasks();
    renderTasks();
    showToast('✏️ Task updated!');
  };

  saveBtn.addEventListener('click', commit);
  cancelBtn.addEventListener('click', () => renderTasks());
  editInput.addEventListener('keydown', e => {
    if (e.key === 'Enter')  commit();
    if (e.key === 'Escape') renderTasks();
  });

  actions.append(saveBtn, cancelBtn);
}

/* --- Delete --- */
function deleteTask(id) {
  tasks = tasks.filter(t => t.id !== id);
  saveTasks();
  renderTasks();
  showToast('🗑️ Task deleted.');
}

/* --- Enter key on input --- */
todoInput.addEventListener('keydown', e => { if (e.key === 'Enter') addTask(); });
todoAddBtn.addEventListener('click', addTask);

// Init
loadTasks();
renderTasks();


/* ──────────────────────────────────────────────
   6. QUICK LINKS
   ────────────────────────────────────────────── */
const linkNameInput = document.getElementById('link-name-input');
const linkUrlInput  = document.getElementById('link-url-input');
const linkAddBtn    = document.getElementById('link-add-btn');
const linksList     = document.getElementById('links-list');

let links = [];

/* --- Persistence --- */
function saveLinks() {
  localStorage.setItem('dashboard-links', JSON.stringify(links));
}

function loadLinks() {
  try {
    links = JSON.parse(localStorage.getItem('dashboard-links')) || [];
  } catch {
    links = [];
  }
}

/* --- Render --- */
function renderLinks() {
  linksList.innerHTML = '';

  if (links.length === 0) {
    linksList.innerHTML = '<span class="links-empty">No quick links yet – add one above! 🔗</span>';
    return;
  }

  links.forEach(link => {
    const chip = document.createElement('div');
    chip.className = 'link-chip-wrap';
    chip.style.cssText = 'display:inline-flex;align-items:center;gap:0;';

    const a = document.createElement('a');
    // Ensure the URL has a protocol
    const href = /^https?:\/\//i.test(link.url) ? link.url : 'https://' + link.url;
    a.href      = href;
    a.target    = '_blank';
    a.rel       = 'noopener noreferrer';
    a.className = 'link-chip';
    a.textContent = link.name;

    const delBtn = document.createElement('button');
    delBtn.className = 'link-chip-del';
    delBtn.innerHTML = '✕';
    delBtn.setAttribute('aria-label', `Delete link "${link.name}"`);
    delBtn.addEventListener('click', () => deleteLink(link.id));

    a.appendChild(delBtn);
    linksList.appendChild(a);
  });
}

/* --- Add --- */
function addLink() {
  const name = linkNameInput.value.trim();
  const url  = linkUrlInput.value.trim();

  if (!name) {
    shakeInput(linkNameInput);
    showToast('⚠️ Please enter a link name.');
    return;
  }
  if (!url) {
    shakeInput(linkUrlInput);
    showToast('⚠️ Please enter a URL.');
    return;
  }

  links.push({ id: Date.now(), name, url });
  saveLinks();
  renderLinks();
  linkNameInput.value = '';
  linkUrlInput.value  = '';
  linkNameInput.focus();
  showToast('🔗 Quick link added!');
}

/* --- Delete --- */
function deleteLink(id) {
  links = links.filter(l => l.id !== id);
  saveLinks();
  renderLinks();
  showToast('🗑️ Link removed.');
}

linkAddBtn.addEventListener('click', addLink);
linkNameInput.addEventListener('keydown', e => { if (e.key === 'Enter') addLink(); });
linkUrlInput.addEventListener('keydown',  e => { if (e.key === 'Enter') addLink(); });

// Init
loadLinks();
renderLinks();


/* ──────────────────────────────────────────────
   7. UTILITIES
   ────────────────────────────────────────────── */

/* Toast */
const toastEl = document.getElementById('toast');
let toastTimeout;

function showToast(message) {
  clearTimeout(toastTimeout);
  toastEl.textContent = message;
  toastEl.classList.add('show');
  toastTimeout = setTimeout(() => toastEl.classList.remove('show'), 3000);
}

/* Shake animation helper */
function shakeInput(el) {
  el.classList.remove('shake');
  void el.offsetWidth;            // reflow to restart animation
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

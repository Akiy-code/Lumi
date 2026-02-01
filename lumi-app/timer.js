// timer.js - Timer logic & UI interactions for Lumi
const { ipcRenderer } = require('electron');

// ----- STATE VARIABLES -----
let focusDuration = 25 * 60;
let breakDuration = 5 * 60;
let currentTime = focusDuration;
let totalTime = focusDuration;
let isRunning = false;
let interval = null;
let mode = "focus";

// Settings
let autoStartBreak = false;
let autoStartFocus = false;

// Hidden Mode State
let isHidden = false;
let isPinned = true; // App starts pinned (visible), set to false when hide mode activated

// ----- DOM ELEMENTS -----
const timerDisplay = document.getElementById("timer");
const startBtn = document.getElementById("startBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const progressRing = document.getElementById("progressRing");
const card = document.getElementById("container");
const eyesContainer = document.querySelector('.eyes');
const hiddenProgressFill = document.getElementById("hiddenProgressFill");

// Constants
const CIRCUMFERENCE = 2 * Math.PI * 44; // r=44

// ----- HELPER FUNCTIONS -----

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
}

function updateProgress() {
  const progress = currentTime / totalTime;
  const offset = CIRCUMFERENCE * (1 - progress);
  progressRing.style.strokeDashoffset = offset;
  
  // Update hidden mode indicator
  if (hiddenProgressFill) {
    hiddenProgressFill.style.height = `${progress * 100}%`;
  }
}

function updateDisplay() {
  timerDisplay.textContent = formatTime(currentTime);

  // Update play/pause icons
  if (isRunning) {
    playIcon.classList.add("hidden");
    pauseIcon.classList.remove("hidden");
  } else {
    playIcon.classList.remove("hidden");
    pauseIcon.classList.add("hidden");
  }

  updateProgress();

  if (mode === "break") {
    card.classList.add("break-mode");
  } else {
    card.classList.remove("break-mode");
  }
}

// ----- TIMER LOGIC -----

function tick() {
  if (currentTime > 0) {
    currentTime--;
    updateDisplay();
  } else {
    timeUp();
  }
}

function timeUp() {
  pause();

  if (mode === "focus") {
    mode = "break";
    currentTime = breakDuration;
    totalTime = breakDuration;
    
    if (autoStartBreak) setTimeout(() => start(), 1000);
  } else {
    mode = "focus";
    currentTime = focusDuration;
    totalTime = focusDuration;

    if (autoStartFocus) setTimeout(() => start(), 1000);
  }

  updateDisplay();
}

function start() {
  if (!isRunning) {
    isRunning = true;
    interval = setInterval(tick, 1000);
    updateDisplay();
  }
}

function pause() {
  if (isRunning) {
    isRunning = false;
    clearInterval(interval);
    updateDisplay();
  }
}

function toggleTimer() {
  if (isRunning) pause();
  else start();
}

function skipMode() {
  pause();
  if (mode === "focus") {
    mode = "break";
    currentTime = breakDuration;
    totalTime = breakDuration;
  } else {
    mode = "focus";
    currentTime = focusDuration;
    totalTime = focusDuration;
  }
  updateDisplay();
}

// ----- SETTINGS LOGIC -----

function toggleSettings() {
  const settings = document.getElementById("settings");
  settings.classList.toggle("active");
}

function adjustTime(type, delta) {
  const input = document.getElementById(type === 'focus' ? 'focusInput' : 'breakInput');
  const display = document.getElementById(type === 'focus' ? 'focusValue' : 'breakValue');
  
  let value = parseInt(input.value) + delta;
  
  // Clamp values
  if (type === 'focus') {
    value = Math.max(1, Math.min(120, value));
  } else {
    value = Math.max(1, Math.min(60, value));
  }
  
  input.value = value;
  display.textContent = value + 'm';
}

function enableEdit(type) {
  const input = document.getElementById(type === 'focus' ? 'focusInput' : 'breakInput');
  const display = document.getElementById(type === 'focus' ? 'focusValue' : 'breakValue');
  
  display.classList.add('hidden');
  input.classList.add('active');
  input.focus();
  input.select();
}

function finishEdit(type) {
  const input = document.getElementById(type === 'focus' ? 'focusInput' : 'breakInput');
  const display = document.getElementById(type === 'focus' ? 'focusValue' : 'breakValue');
  
  let value = parseInt(input.value) || 1;
  
  // Clamp values
  if (type === 'focus') {
    value = Math.max(1, Math.min(120, value));
  } else {
    value = Math.max(1, Math.min(60, value));
  }
  
  input.value = value;
  display.textContent = value + 'm';
  
  display.classList.remove('hidden');
  input.classList.remove('active');
}

function handleEditKey(event, type) {
  if (event.key === 'Enter') {
    finishEdit(type);
  } else if (event.key === 'Escape') {
    // Restore original value
    const input = document.getElementById(type === 'focus' ? 'focusInput' : 'breakInput');
    const display = document.getElementById(type === 'focus' ? 'focusValue' : 'breakValue');
    input.value = parseInt(display.textContent);
    display.classList.remove('hidden');
    input.classList.remove('active');
  }
}

// ----- STORAGE LOGIC -----

function loadSettings() {
  const savedFocus = localStorage.getItem('lumi_focusDuration');
  const savedBreak = localStorage.getItem('lumi_breakDuration');
  const savedAutoFocus = localStorage.getItem('lumi_autoStartFocus');
  const savedAutoBreak = localStorage.getItem('lumi_autoStartBreak');

  if (savedFocus) {
    focusDuration = parseInt(savedFocus);
    // Update input and stepper display
    const focusInput = document.getElementById("focusInput");
    if(focusInput) {
        focusInput.value = focusDuration / 60;
        document.getElementById("focusValue").textContent = (focusDuration / 60) + 'm';
    }
  }

  if (savedBreak) {
    breakDuration = parseInt(savedBreak);
    const breakInput = document.getElementById("breakInput");
    if(breakInput) {
        breakInput.value = breakDuration / 60;
        document.getElementById("breakValue").textContent = (breakDuration / 60) + 'm';
    }
  }

  if (savedAutoFocus !== null) {
    autoStartFocus = (savedAutoFocus === 'true');
    const autoFocusEl = document.getElementById("autoStartFocus");
    if(autoFocusEl) autoFocusEl.checked = autoStartFocus;
  }

  if (savedAutoBreak !== null) {
    autoStartBreak = (savedAutoBreak === 'true');
    const autoBreakEl = document.getElementById("autoStartBreak");
    if(autoBreakEl) autoBreakEl.checked = autoStartBreak;
  }

  // Reset current time to new focus duration if we are fresh
  if (!isRunning && mode === 'focus') {
    currentTime = focusDuration;
    totalTime = focusDuration;
  }
}

function saveSettings() {
  const focusMin = parseInt(document.getElementById("focusInput").value);
  const breakMin = parseInt(document.getElementById("breakInput").value);

  focusDuration = focusMin * 60;
  breakDuration = breakMin * 60;

  // Save to LocalStorage
  localStorage.setItem('lumi_focusDuration', focusDuration);
  localStorage.setItem('lumi_breakDuration', breakDuration);
  
  autoStartBreak = document.getElementById("autoStartBreak").checked;
  autoStartFocus = document.getElementById("autoStartFocus").checked;
  
  localStorage.setItem('lumi_autoStartBreak', autoStartBreak);
  localStorage.setItem('lumi_autoStartFocus', autoStartFocus);

  if (!isRunning) {
    if (mode === "focus") {
      currentTime = focusDuration;
      totalTime = focusDuration;
    } else {
      currentTime = breakDuration;
      totalTime = breakDuration;
    }
  }

  updateDisplay();
  toggleSettings();
}

// ----- EYE TRACKING LOGIC (Global - follows cursor anywhere on screen) -----

// Listen for global mouse position from main process
ipcRenderer.on('global-mouse-move', (event, data) => {
  if (!eyesContainer) return;
  
  const { mouseX, mouseY, winX, winY, winWidth, winHeight } = data;
  
  // Get eyes center in screen coordinates
  const rect = eyesContainer.getBoundingClientRect();
  const eyeCenterX = winX + rect.left + rect.width / 2;
  const eyeCenterY = winY + rect.top + rect.height / 2;

  // Vector from eyes to mouse
  const dx = mouseX - eyeCenterX;
  const dy = mouseY - eyeCenterY;

  const angle = Math.atan2(dy, dx);
  // Smooth movement with distance falloff
  const rawDistance = Math.hypot(dx, dy);
  const distance = Math.min(10, rawDistance / 40);

  const moveX = Math.cos(angle) * distance;
  const moveY = Math.sin(angle) * distance;

  eyesContainer.style.transform = `translate(calc(-50% + ${moveX}px), calc(-50% + ${moveY}px))`;
});

// ----- HIDE/SHOW MODE LOGIC -----

function showApp() {
  isHidden = false;
  card.classList.remove('hidden-mode');
  ipcRenderer.send('show-window');
}

function hideApp() {
  isHidden = true;
  card.classList.add('hidden-mode');
  ipcRenderer.send('hide-window');
}

function toggleHideMode() {
  if (isHidden) {
    // If hidden, show but keep unpinned (so it auto-hides when cursor leaves)
    showApp();
  } else {
    // If visible, hide and unpin
    isPinned = false;
    hideApp();
  }
}

function pinApp() {
  isPinned = true;
  showApp();
}

// ----- GLOBAL MOUSE-BASED HIDE/SHOW -----
let isAnimating = false;
let showHideDebounce = null;

ipcRenderer.on('global-mouse-move', (event, data) => {
  if (isPinned) return;
  
  const { mouseX, mouseY, screenWidth, indicatorY, indicatorHeight, winX, winY, winWidth, winHeight } = data;
  
  // Indicator zone: right 50px of screen, at the app's Y position
  const isInIndicatorZone = 
    mouseX >= screenWidth - 50 &&
    mouseY >= indicatorY - 30 &&
    mouseY <= indicatorY + indicatorHeight + 30;
  
  // Is mouse over the actual app window? (with some padding)
  const isOverApp = 
    mouseX >= winX - 20 &&
    mouseX <= winX + winWidth + 20 &&
    mouseY >= winY - 20 &&
    mouseY <= winY + winHeight + 20;
  
  // Clear pending debounce ONLY if we're back over the app (cancel hide)
  if (isOverApp || isInIndicatorZone) {
    if (showHideDebounce) {
      clearTimeout(showHideDebounce);
      showHideDebounce = null;
    }
  }
  
  if (isHidden && !isAnimating) {
    // SHOW: when cursor enters indicator zone
    if (isInIndicatorZone) {
      isAnimating = true;
      showApp();
      setTimeout(() => { isAnimating = false; }, 500);
    }
  } else if (!isHidden && !isAnimating) {
    // HIDE: when cursor leaves app AND is not in indicator zone
    // Only set debounce if not already pending
    if (!isOverApp && !isInIndicatorZone && !showHideDebounce) {
      showHideDebounce = setTimeout(() => {
        showHideDebounce = null;
        if (!isPinned && !isHidden && !isAnimating) {
          isAnimating = true;
          hideApp();
          setTimeout(() => { isAnimating = false; }, 500);
        }
      }, 300);
    }
  }
});

// Click on interactive elements to pin (not the whole card)
// Only pin when interacting with actual controls
document.querySelectorAll('.dock-btn, .stepper button, .switch input, #startBtn, #skipBtn').forEach(btn => {
  btn.addEventListener('click', () => {
    // Don't pin if clicking hide button
    const hideBtn = document.getElementById('hideBtn');
    if (btn === hideBtn || btn.closest('#hideBtn')) {
      return;
    }
    if (!isPinned) {
      pinApp();
    }
  });
});

// ----- INITIALIZE -----
loadSettings(); 
updateDisplay();


// main.js - Creates the Electron window for Lumi

const { app, BrowserWindow, screen, ipcMain } = require("electron");

let win = null;
let mouseInterval = null;

// Store positions and dimensions
let normalX, normalY, hiddenX, hiddenY;
let winWidth, winHeight;
let isWindowHidden = false;
let animationTimer = null;
let currentAnimationTarget = null;

// Smooth animation function - uses setBounds to keep size fixed
function animateWindow(targetX, targetY, duration = 280) {
  // If already animating to this target, skip
  if (currentAnimationTarget && currentAnimationTarget.x === targetX && currentAnimationTarget.y === targetY) {
    return;
  }
  
  // Cancel any ongoing animation
  if (animationTimer) {
    clearTimeout(animationTimer);
    animationTimer = null;
  }
  
  currentAnimationTarget = { x: targetX, y: targetY };
  
  const startBounds = win.getBounds();
  const startX = startBounds.x;
  const startY = startBounds.y;
  const startTime = Date.now();
  
  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }
  
  function step() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easeOutCubic(progress);
    
    const currentX = Math.round(startX + (targetX - startX) * easedProgress);
    const currentY = Math.round(startY + (targetY - startY) * easedProgress);
    
    // Use setBounds to ensure size stays fixed
    win.setBounds({ x: currentX, y: currentY, width: winWidth, height: winHeight });
    
    if (progress < 1) {
      animationTimer = setTimeout(step, 16);
    } else {
      // Animation complete - ensure exact final position and size
      win.setBounds({ x: targetX, y: targetY, width: winWidth, height: winHeight });
      animationTimer = null;
      currentAnimationTarget = null;
    }
  }
  
  step();
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  
  // Window dimensions
  winWidth = 320;
  winHeight = 180;
  
  const padding = 32;
  const indicatorWidth = 24; // Width of the visible progress bar when hidden
  
  // Normal position (with padding from edge)
  normalX = width - winWidth - padding;
  normalY = height - winHeight - padding;
  
  // Hidden position (indicator at screen edge)
  hiddenX = width - indicatorWidth;
  hiddenY = normalY;

  win = new BrowserWindow({
    width: winWidth,
    height: winHeight,
    x: normalX,
    y: normalY,
    alwaysOnTop: true,
    frame: false,
    transparent: true,
    resizable: false,
    movable: false,
    minimizable: false,
    maximizable: false,
    skipTaskbar: false,
    useContentSize: true, // Ensure content size stays fixed
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  win.loadFile("index.html");

  // IPC handlers for hide/show with smooth animation
  ipcMain.on('hide-window', () => {
    isWindowHidden = true;
    animateWindow(hiddenX, hiddenY, 280);
  });

  ipcMain.on('show-window', () => {
    isWindowHidden = false;
    animateWindow(normalX, normalY, 280);
  });

  // Global mouse tracking for eyes - follows cursor across entire screen
  mouseInterval = setInterval(() => {
    const mousePos = screen.getCursorScreenPoint();
    const winBounds = win.getBounds();
    const display = screen.getPrimaryDisplay();
    
    // Send global mouse position to renderer
    win.webContents.send('global-mouse-move', {
      mouseX: mousePos.x,
      mouseY: mousePos.y,
      winX: winBounds.x,
      winY: winBounds.y,
      winWidth: winBounds.width,
      winHeight: winBounds.height,
      screenWidth: display.workAreaSize.width,
      screenHeight: display.workAreaSize.height,
      indicatorY: normalY,
      indicatorHeight: winHeight
    });
  }, 33); // ~30fps (better performance)
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Clear the mouse tracking interval
  if (mouseInterval) {
    clearInterval(mouseInterval);
    mouseInterval = null;
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

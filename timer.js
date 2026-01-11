// ===== POMODORO TIMER - BEGINNER FRIENDLY =====

// ----- STATE VARIABLES -----
// These variables store the current state of our timer

// Default times (in seconds)
let focusDuration = 25 * 60;  // 25 minutes = 1500 seconds
let breakDuration = 5 * 60;   // 5 minutes = 300 seconds

// Current timer state
let currentTime = focusDuration;  // How many seconds left right now
let isRunning = false;            // Is the timer counting down?
let interval = null;              // Stores the setInterval ID (we'll use this to stop the timer)
let mode = 'focus';               // Current mode: 'focus' or 'break'

// ----- HELPER FUNCTIONS -----

/**
 * Converts seconds into hours:minutes:seconds format
 * Example: 3665 seconds → "1:01:05"
 */
function formatTime(totalSeconds) {
  // Math.floor removes decimals (3.9 becomes 3)
  const hours = Math.floor(totalSeconds / 3600);    // 3600 seconds = 1 hour
  const minutes = Math.floor((totalSeconds % 3600) / 60);  // % gives remainder
  const seconds = totalSeconds % 60;                // Leftover seconds
  
  // padStart(2, '0') means "make it 2 characters, add 0 if needed"
  // So 5 becomes "05", but 15 stays "15"
  const h = hours.toString().padStart(2, '0');
  const m = minutes.toString().padStart(2, '0');
  const s = seconds.toString().padStart(2, '0');
  
  return `${h}:${m}:${s}`;
}

/**
 * Displays the current timer state in the terminal
 */
function displayTimer() {
  // console.clear() wipes the screen (like clearing a whiteboard)
  console.clear();
  
  // Show what mode we're in
  if (mode === 'focus') {
    console.log('🎯 === FOCUS MODE ===');
  } else {
    console.log('☕ === BREAK MODE ===');
  }
  
  // Show the time
  console.log(`Time: ${formatTime(currentTime)}`);
  console.log(''); // Empty line for spacing
  
  // Show available controls based on state
  if (isRunning) {
    console.log('Commands: (p) Pause | (k) Skip to next');
  } else {
    console.log('Commands: (r) Resume | (k) Skip to next');
  }
  
  console.log('Press Ctrl+C to quit');
}

// ----- CORE TIMER FUNCTIONS -----

/**
 * This runs every second when the timer is active
 * It counts down and checks if time is up
 */
function tick() {
  // Only count down if we have time left
  if (currentTime > 0) {
    currentTime--;        // Subtract 1 second
    displayTimer();       // Update the display
  } else {
    // Time's up! Switch modes
    timeUp();
  }
}

/**
 * Called when timer hits 0
 * Switches between focus and break
 */
function timeUp() {
  // Stop the current timer
  pause();
  
  // Switch modes
  if (mode === 'focus') {
    mode = 'break';
    currentTime = breakDuration;
    console.log('\n🎉 Focus complete! Time for a break.\n');
  } else {
    mode = 'focus';
    currentTime = focusDuration;
    console.log('\n💪 Break over! Back to focus.\n');
  }
  
  displayTimer();
}

/**
 * Starts or resumes the timer
 */
function start() {
  // Only start if not already running
  if (!isRunning) {
    isRunning = true;
    
    // setInterval runs a function repeatedly every X milliseconds
    // 1000 milliseconds = 1 second
    // We save the interval ID so we can stop it later
    interval = setInterval(tick, 1000);
    
    displayTimer();
  }
}

/**
 * Pauses the timer
 */
function pause() {
  if (isRunning) {
    isRunning = false;
    
    // clearInterval stops the repeating function
    // We use the ID we saved earlier
    clearInterval(interval);
    
    displayTimer();
  }
}

/**
 * Skips to the next mode (focus → break or break → focus)
 */
function skip() {
  // Stop current timer
  pause();
  
  // Switch modes and reset time
  if (mode === 'focus') {
    mode = 'break';
    currentTime = breakDuration;
  } else {
    mode = 'focus';
    currentTime = focusDuration;
  }
  
  displayTimer();
}

// ----- KEYBOARD INPUT HANDLING -----

// This makes the terminal read each keypress immediately
// Without this, you'd have to press Enter after each command
process.stdin.setRawMode(true);

// Start listening for keyboard input
process.stdin.resume();

// This function runs every time you press a key
process.stdin.on('data', (key) => {
  // Convert the key to a string we can check
  const input = key.toString();
  
  // Check which key was pressed
  if (input === 'r') {
    start();  // Resume/start timer
  }
  
  if (input === 'p') {
    pause();  // Pause timer
  }
  
  if (input === 'k') {
    skip();   // Skip to next mode
  }
  
  // '\u0003' is the code for Ctrl+C
  if (input === '\u0003') {
    console.log('\nGoodbye! 👋');
    process.exit();  // Quit the program
  }
});

// ----- START THE APP -----

// Show initial state when program starts
displayTimer();
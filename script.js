const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timerDisplay');
const minuteValueSpan = document.getElementById('minuteValue');
const actionBtn = document.getElementById('actionBtn');

// Set actual canvas size to handle high DPI screens better
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);

let settingsSeconds = 60; // Default to 60 seconds
let totalSeconds = 0;
let remainingSeconds = 0;
let intervalId = null;
let isRunning = false;
let fusePath = []; // Array of points {x, y}

// --- Logic to Generate Messy Fuse ---
function generateMessyFuse() {
    fusePath = [];
    
    // Bomb center
    const centerX = rect.width / 2;
    const centerY = rect.height / 2 + 50;
    
    // Start at top of bomb
    let currX = centerX;
    let currY = centerY - 60; // Top of bomb body
    
    fusePath.push({x: currX, y: currY});
    
    // Move up a bit first
    currY -= 30;
    fusePath.push({x: currX, y: currY});

    // Generate random messy chaos
    // We want a long winding line that fills the upper area
    const pointsCount = 150; 
    let angle = -Math.PI / 2; // Start pointing up
    
    for (let i = 0; i < pointsCount; i++) {
        // Randomly veer direction
        angle += (Math.random() - 0.5) * 2.5; 
        
        // Move a small distance
        const stepSize = 10 + Math.random() * 15;
        currX += Math.cos(angle) * stepSize;
        currY += Math.sin(angle) * stepSize;
        
        // Keep within bounds (don't go off screen or too low into bomb)
        // Soft boundaries
        if (currX < 50) angle = 0; 
        if (currX > rect.width - 50) angle = Math.PI;
        if (currY < 50) angle = Math.PI / 2;
        if (currY > rect.height - 100) angle = -Math.PI / 2;

        fusePath.push({x: currX, y: currY});
    }
}

// --- Adjust Time ---
window.adjustTime = function(amount) {
    if (isRunning) return;
    settingsSeconds += amount;
    if (settingsSeconds < 10) settingsSeconds = 10;
    if (settingsSeconds > 120) settingsSeconds = 120;
    
    minuteValueSpan.textContent = settingsSeconds;
    
    // Update display immediately
    const m = Math.floor(settingsSeconds / 60);
    const s = settingsSeconds % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// --- Start/Stop ---
actionBtn.addEventListener('click', () => {
    if (isRunning) {
        // Stop/Reset
        stopTimer();
    } else {
        // Start
        startTimer();
    }
});

function startTimer() {
    isRunning = true;
    remainingSeconds = settingsSeconds;
    totalSeconds = remainingSeconds;
    
    actionBtn.textContent = "STOP";
    actionBtn.classList.add('running');
    
    generateMessyFuse(); // Regenerate a fresh mess every time
    
    // Update immediately so we don't wait 1s for the first tick
    updateDisplay();
    
    intervalId = setInterval(() => {
        remainingSeconds--;
        updateDisplay();
        if (remainingSeconds <= 0) {
            boom();
        }
    }, 1000);
    
    animate();
}

function stopTimer() {
    isRunning = false;
    clearInterval(intervalId);
    actionBtn.textContent = "START!";
    actionBtn.classList.remove('running');
    updateDisplay(); // Reset display text if needed
}

function updateDisplay() {
    if (remainingSeconds < 0) return;
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function boom() {
    stopTimer();
    timerDisplay.textContent = "BOOM!";
    // Draw explosion
    ctx.fillStyle = "#FF0000";
    ctx.fillRect(0,0, rect.width, rect.height);
}

// --- Drawing ---

function drawBomb() {
    const cx = rect.width / 2;
    const cy = rect.height / 2 + 50;
    const r = 60;

    // Bomb Body
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#2C3E50"; // Dark blue-ish grey
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.stroke();

    // Shine on bomb
    ctx.beginPath();
    ctx.arc(cx - 20, cy - 20, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();

    // Bomb Cap
    ctx.fillStyle = "#95A5A6";
    ctx.fillRect(cx - 20, cy - r - 15, 40, 20);
    ctx.strokeRect(cx - 20, cy - r - 15, 40, 20);
}

function drawFuse() {
    if (fusePath.length < 2) return;

    // Calculate how much fuse to draw based on time
    // 100% time left = 100% fuse length
    // 0% time left = 0% fuse length (it burned down to the bomb)
    
    // We want the fuse to disappear as it burns.
    // Index 0 is the BOMB. Index MAX is the TIP.
    // Burning moves from TIP to BOMB.
    
    const percentage = isRunning ? (remainingSeconds / totalSeconds) : 1;
    
    // How many points to draw?
    const pointsToDraw = Math.floor(fusePath.length * percentage);
    
    if (pointsToDraw < 1) return;

    ctx.beginPath();
    ctx.moveTo(fusePath[0].x, fusePath[0].y);
    
    // Draw using spline/curves for smoother look
    for (let i = 1; i < pointsToDraw; i++) {
        // Simple line connection for the "scribble" look
        ctx.lineTo(fusePath[i].x, fusePath[i].y);
    }
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#5D4037"; // Rope color
    ctx.stroke();
    
    // Texture on fuse (dashed lighter line)
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8D6E63";
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Spark at the tip
    if (isRunning && pointsToDraw > 0 && remainingSeconds > 0) {
        const tip = fusePath[pointsToDraw - 1];
        drawSpark(tip.x, tip.y);
    }
}

function drawSpark(x, y) {
    const time = Date.now() / 100;
    const size = 15 + Math.sin(time) * 5;
    
    ctx.save();
    ctx.translate(x, y);
    
    // Core
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI*2);
    ctx.fillStyle = "#FFF";
    ctx.fill();
    
    // Outer glow
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255, 200, 0, 0.7)";
    ctx.fill();
    
    // Sparks particles
    for(let i=0; i<8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + time;
        const dist = size * 1.5;
        const px = Math.cos(angle) * dist;
        const py = Math.sin(angle) * dist;
        
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI*2);
        ctx.fillStyle = "#FF4500";
        ctx.fill();
    }
    
    ctx.restore();
}

function animate() {
    ctx.clearRect(0, 0, rect.width, rect.height);
    
    drawBomb();
    drawFuse();
    
    if (isRunning) {
        requestAnimationFrame(animate);
    } else {
        // Ensure static draw
        drawBomb();
        drawFuse();
    }
}

// Initial draw
generateMessyFuse();
animate();

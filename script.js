const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timerDisplay');
const minuteValueSpan = document.getElementById('minuteValue');
const actionBtn = document.getElementById('actionBtn');

// Handle High DPI
const dpr = window.devicePixelRatio || 1;
const rect = canvas.getBoundingClientRect();
canvas.width = rect.width * dpr;
canvas.height = rect.height * dpr;
ctx.scale(dpr, dpr);

// State
let settingsSeconds = 60;
let startTime = 0;
let endTime = 0;
let isRunning = false;
let isExploding = false;
let fusePath = [];
let particles = [];

// --- Fuse Generation ---
function generateMessyFuse() {
    fusePath = [];
    const centerX = rect.width / 2;
    const centerY = rect.height / 2 + 50;
    
    let currX = centerX;
    let currY = centerY - 60; // Top of bomb
    
    fusePath.push({x: currX, y: currY});
    currY -= 30;
    fusePath.push({x: currX, y: currY});

    const pointsCount = 150; 
    let angle = -Math.PI / 2;
    
    for (let i = 0; i < pointsCount; i++) {
        angle += (Math.random() - 0.5) * 2.5;
        const stepSize = 10 + Math.random() * 15;
        currX += Math.cos(angle) * stepSize;
        currY += Math.sin(angle) * stepSize;
        
        if (currX < 50) angle = 0; 
        if (currX > rect.width - 50) angle = Math.PI;
        if (currY < 50) angle = Math.PI / 2;
        if (currY > rect.height - 100) angle = -Math.PI / 2;

        fusePath.push({x: currX, y: currY});
    }
}

// --- Interaction ---
window.adjustTime = function(amount) {
    if (isRunning) return;
    settingsSeconds += amount;
    if (settingsSeconds < 10) settingsSeconds = 10;
    if (settingsSeconds > 120) settingsSeconds = 120;
    
    minuteValueSpan.textContent = settingsSeconds;
    
    const m = Math.floor(settingsSeconds / 60);
    const s = settingsSeconds % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

actionBtn.addEventListener('click', () => {
    if (isRunning || isExploding) {
        reset();
    } else {
        start();
    }
});

function start() {
    isRunning = true;
    isExploding = false;
    startTime = Date.now();
    endTime = startTime + (settingsSeconds * 1000);
    
    actionBtn.textContent = "STOP";
    actionBtn.classList.add('running');
    
    generateMessyFuse();
    requestAnimationFrame(loop);
}

function reset() {
    isRunning = false;
    isExploding = false;
    particles = [];
    actionBtn.textContent = "START!";
    actionBtn.classList.remove('running');
    window.adjustTime(0); // Reset display
}

function boom() {
    isRunning = false;
    isExploding = true;
    timerDisplay.textContent = "BOOM!";
    createExplosion();
}

// --- Explosion Logic ---
function createExplosion() {
    const cx = rect.width / 2;
    const cy = rect.height / 2 + 50;
    
    for (let i = 0; i < 100; i++) {
        particles.push({
            x: cx,
            y: cy,
            vx: (Math.random() - 0.5) * 15,
            vy: (Math.random() - 0.5) * 15,
            radius: Math.random() * 10 + 5,
            color: `hsl(${Math.random() * 60}, 100%, 50%)`, // Red/Orange/Yellow
            alpha: 1,
            decay: Math.random() * 0.02 + 0.01
        });
    }
}

function updateAndDrawExplosion() {
    // Fill background slightly for trail effect
    ctx.fillStyle = 'rgba(78, 205, 196, 0.3)'; // Match bg color with transparency
    ctx.fillRect(0, 0, rect.width, rect.height);

    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;
        p.radius *= 0.96; // Shrink

        if (p.alpha <= 0) {
            particles.splice(i, 1);
            continue;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${parseFloat(p.color.split(',')[0].split('(')[1])}, 100%, 50%, ${p.alpha})`;
        ctx.fill();
    }
    
    if (particles.length === 0) {
        isExploding = false;
        reset();
    }
}

// --- Main Loop ---
function loop() {
    if (!isRunning && !isExploding) return;

    ctx.clearRect(0, 0, rect.width, rect.height);

    if (isExploding) {
        updateAndDrawExplosion();
        requestAnimationFrame(loop);
        return;
    }

    const now = Date.now();
    const timeLeftMs = Math.max(0, endTime - now);
    
    // Update Display
    const totalSecsLeft = Math.ceil(timeLeftMs / 1000);
    const m = Math.floor(totalSecsLeft / 60);
    const s = totalSecsLeft % 60;
    timerDisplay.textContent = `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;

    if (timeLeftMs <= 0) {
        boom();
        requestAnimationFrame(loop);
        return;
    }

    drawBomb();
    drawFuse(timeLeftMs / (settingsSeconds * 1000));
    
    requestAnimationFrame(loop);
}

// --- Drawing ---
function drawBomb() {
    const cx = rect.width / 2;
    const cy = rect.height / 2 + 50;
    const r = 60;

    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = "#2C3E50"; 
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = "#000";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(cx - 20, cy - 20, 15, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.2)";
    ctx.fill();

    ctx.fillStyle = "#95A5A6";
    ctx.fillRect(cx - 20, cy - r - 15, 40, 20);
    ctx.strokeRect(cx - 20, cy - r - 15, 40, 20);
}

function drawFuse(percentage) {
    if (fusePath.length < 2) return;

    // Smooth float index calculation
    const fullIndex = (fusePath.length - 1) * percentage;
    const maxIndex = Math.floor(fullIndex);
    const remainder = fullIndex - maxIndex;
    
    if (maxIndex < 0) return;

    ctx.beginPath();
    ctx.moveTo(fusePath[0].x, fusePath[0].y);
    
    for (let i = 1; i <= maxIndex; i++) {
        ctx.lineTo(fusePath[i].x, fusePath[i].y);
    }

    // Partial segment for ultra-smooth burning
    if (maxIndex < fusePath.length - 1) {
        const p1 = fusePath[maxIndex];
        const p2 = fusePath[maxIndex + 1];
        const partialX = p1.x + (p2.x - p1.x) * remainder;
        const partialY = p1.y + (p2.y - p1.y) * remainder;
        ctx.lineTo(partialX, partialY);
        
        // Draw spark at tip
        drawSpark(partialX, partialY);
    } else {
        // Full fuse (at start)
        const tip = fusePath[fusePath.length-1];
        drawSpark(tip.x, tip.y);
    }
    
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#5D4037";
    ctx.stroke();
    
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#8D6E63";
    ctx.stroke();
    ctx.setLineDash([]);
}

function drawSpark(x, y) {
    const time = Date.now() / 50; // Faster flicker
    const size = 15 + Math.sin(time) * 5;
    
    ctx.save();
    ctx.translate(x, y);
    
    ctx.beginPath();
    ctx.arc(0, 0, size/2, 0, Math.PI*2);
    ctx.fillStyle = "#FFF";
    ctx.fill();
    
    ctx.beginPath();
    ctx.arc(0, 0, size, 0, Math.PI*2);
    ctx.fillStyle = "rgba(255, 200, 0, 0.7)";
    ctx.fill();
    
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

generateMessyFuse();
drawBomb();
drawFuse(1); // Show full fuse initially

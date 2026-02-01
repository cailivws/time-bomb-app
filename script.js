const canvas = document.getElementById('bombCanvas');
const ctx = canvas.getContext('2d');
const minutesInput = document.getElementById('minutes');
const startBtn = document.getElementById('startBtn');
const timerDisplay = document.getElementById('timerDisplay');

let timeLeft = 0;
let totalTime = 0;
let timerId = null;
let animationId = null;

function getBezierPoint(t, p0, p1, p2, p3) {
    const cx = 3 * (p1.x - p0.x);
    const bx = 3 * (p2.x - p1.x) - cx;
    const ax = p3.x - p0.x - cx - bx;

    const cy = 3 * (p1.y - p0.y);
    const by = 3 * (p2.y - p1.y) - cy;
    const ay = p3.y - p0.y - cy - by;

    const x = (ax * Math.pow(t, 3)) + (bx * Math.pow(t, 2)) + (cx * t) + p0.x;
    const y = (ay * Math.pow(t, 3)) + (by * Math.pow(t, 2)) + (cy * t) + p0.y;

    return { x, y };
}

function drawBomb(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 30;
    const radius = 80;

    // Define Fuse Path Points
    const p0 = { x: centerX, y: centerY - radius - 15 };
    const p1 = { x: centerX, y: centerY - radius - 80 };
    const p2 = { x: centerX + 100, y: centerY - radius - 80 };
    const p3 = { x: centerX + 100, y: centerY - radius - 20 };

    // Draw Bomb Body
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#000';
    ctx.fill();
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 5;
    ctx.stroke();

    // Draw Bomb Top
    ctx.fillStyle = '#222';
    ctx.fillRect(centerX - 20, centerY - radius - 15, 40, 20);

    // Draw Remaining Fuse (Tinder)
    // We only draw the segment from start (p0) to where the spark is (progress)
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    
    // To draw a partial bezier, we approximate with small steps
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    ctx.setLineDash([5, 3]);

    for (let t = 0; t <= progress; t += 0.01) {
        const pt = getBezierPoint(t, p0, p1, p2, p3);
        ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Spark at the current progress point
    if (progress > 0) {
        const sparkPt = getBezierPoint(progress, p0, p1, p2, p3);
        drawSpark(sparkPt.x, sparkPt.y);
    }
}

function drawSpark(x, y) {
    const particles = 8;
    ctx.fillStyle = '#ff0';
    for(let i=0; i<particles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const dist = Math.random() * 15;
        ctx.beginPath();
        ctx.arc(x + Math.cos(angle)*dist, y + Math.sin(angle)*dist, 2, 0, Math.PI*2);
        ctx.fill();
    }
    ctx.fillStyle = '#f90';
    ctx.beginPath();
    ctx.arc(x, y, 5 + Math.random()*5, 0, Math.PI*2);
    ctx.fill();
}

function updateTimer() {
    if (timeLeft <= 0) {
        clearInterval(timerId);
        timerDisplay.textContent = "BOOM!";
        timerDisplay.style.fontSize = "5rem";
        return;
    }

    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    
    const progress = timeLeft / totalTime;
    drawBomb(progress);
    
    timeLeft--;
}

startBtn.addEventListener('click', () => {
    clearInterval(timerId);
    const mins = parseInt(minutesInput.value);
    if (isNaN(mins) || mins < 1 || mins > 60) return;

    timeLeft = mins * 60;
    totalTime = timeLeft;
    timerDisplay.style.fontSize = "3rem";
    
    timerId = setInterval(updateTimer, 1000);
    updateTimer();

    // Start sparkle animation
    function animate() {
        if (timeLeft > 0) {
            drawBomb(timeLeft / totalTime);
            animationId = requestAnimationFrame(animate);
        }
    }
    cancelAnimationFrame(animationId);
    animate();
});

drawBomb(0);

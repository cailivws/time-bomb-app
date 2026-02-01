const canvas = document.getElementById('bombCanvas');
const ctx = canvas.getContext('2d');
const minutesInput = document.getElementById('minutes');
const startBtn = document.getElementById('startBtn');
const timerDisplay = document.getElementById('timerDisplay');

let timeLeft = 0;
let totalTime = 0;
let timerId = null;
let animationId = null;

function drawBomb(progress) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 + 30;
    const radius = 80;

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

    // Draw Fuse (Tinder)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 15);
    
    // Curved fuse path
    const fuseLength = 100;
    const currentFuseLength = fuseLength * progress;
    
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#8B4513';
    ctx.lineWidth = 4;
    
    ctx.bezierCurveTo(
        centerX, centerY - radius - 80,
        centerX + 100, centerY - radius - 80,
        centerX + 100, centerY - radius - 20
    );
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Spark
    if (progress > 0) {
        // Calculate point on path (simplified for demo)
        // For a real burn effect, we'd calculate the exact point on the bezier
        const sparkX = centerX + (100 * (1-progress)); // Dummy calculation
        const sparkY = centerY - radius - 80;

        drawSpark(centerX + 50, centerY - radius - 70);
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

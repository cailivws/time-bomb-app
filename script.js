window.onload = function() {
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    const timerDisplay = document.getElementById('timerDisplay');
    const startBtn = document.getElementById('startBtn');

    // Logical resolution (fixed)
    const WIDTH = 800;
    const HEIGHT = 800;
    
    // Game State
    let durationSec = 60;
    let endTime = 0;
    let isRunning = false;
    let exploded = false;
    let fusePoints = [];
    let particles = [];

    // --- Generate Fuse (Deterministic) ---
    function initFuse() {
        fusePoints = [];
        // Bomb center is approx (400, 600)
        let cx = 400;
        let cy = 550;
        
        // Start at top of bomb
        fusePoints.push({x: cx, y: cy - 70});
        fusePoints.push({x: cx, y: cy - 120}); // Straight up stem

        // Winding chaos
        let currX = cx;
        let currY = cy - 120;
        let angle = -Math.PI / 2;

        for(let i=0; i<200; i++) {
            angle += (Math.random() - 0.5) * 2.0;
            let step = 15;
            currX += Math.cos(angle) * step;
            currY += Math.sin(angle) * step;

            // Soft boundaries (keep inside 50-750)
            if(currX < 50) angle = 0;
            if(currX > 750) angle = Math.PI;
            if(currY < 50) angle = Math.PI/2;
            if(currY > 500) angle = -Math.PI/2;

            fusePoints.push({x: currX, y: currY});
        }
    }

    // --- Drawing ---
    function draw() {
        ctx.clearRect(0, 0, WIDTH, HEIGHT);

        // 1. Draw Bomb (Only if not exploded)
        const cx = 400;
        const cy = 550;
        
        if (!exploded) {
            // Cap
            ctx.fillStyle = "#95a5a6";
            ctx.fillRect(cx - 40, cy - 100, 80, 40);
            ctx.strokeStyle = "#2c3e50";
            ctx.lineWidth = 5;
            ctx.strokeRect(cx - 40, cy - 100, 80, 40);

            // Body
            ctx.beginPath();
            ctx.arc(cx, cy, 120, 0, Math.PI * 2);
            ctx.fillStyle = "#2c3e50";
            ctx.fill();
            ctx.stroke();

            // Shine
            ctx.beginPath();
            ctx.arc(cx - 40, cy - 40, 30, 0, Math.PI * 2);
            ctx.fillStyle = "rgba(255,255,255,0.2)";
            ctx.fill();
        }

        // 2. Draw Fuse
        if (fusePoints.length > 0 && !exploded) {
            let limit = fusePoints.length;
            if (isRunning) {
                const timeLeft = Math.max(0, endTime - Date.now());
                const totalTime = durationSec * 1000;
                const progress = timeLeft / totalTime; // 1.0 -> 0.0
                limit = Math.floor(fusePoints.length * progress);
            }

            if (limit > 1) {
                ctx.beginPath();
                ctx.moveTo(fusePoints[0].x, fusePoints[0].y);
                for(let i=1; i<limit; i++) {
                    ctx.lineTo(fusePoints[i].x, fusePoints[i].y);
                }
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                
                // Rope Color
                ctx.lineWidth = 12;
                ctx.strokeStyle = "#8d6e63"; // Brown
                ctx.stroke();
                
                // Texture (Dots)
                ctx.lineWidth = 4;
                ctx.strokeStyle = "#d7ccc8"; // Light Tan
                ctx.setLineDash([5, 15]);
                ctx.stroke();
                ctx.setLineDash([]);

                // 3. Spark at tip
                const tip = fusePoints[limit-1];
                drawSpark(tip.x, tip.y);
            }
        }

        // 4. Explosion
        if (exploded) {
            updateExplosion();
        }

        requestAnimationFrame(draw);
    }

    function drawSpark(x, y) {
        const t = Date.now() / 50;
        const size = 20 + Math.sin(t) * 5;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Glow
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI*2);
        ctx.fillStyle = "rgba(255, 204, 0, 0.6)";
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(0, 0, size/2, 0, Math.PI*2);
        ctx.fillStyle = "#fff";
        ctx.fill();

        ctx.restore();
    }

    // --- Explosion Particles ---
    function triggerExplosion() {
        exploded = true;
        isRunning = false;
        timerDisplay.textContent = "BOOM!";
        timerDisplay.style.color = "#e74c3c";
        
        particles = [];
        // HUGE explosion: more particles, faster speed
        for(let i=0; i<400; i++) {
            particles.push({
                x: 400,
                y: 550,
                vx: (Math.random() - 0.5) * 50, // Faster
                vy: (Math.random() - 0.5) * 50,
                life: 1.0 + Math.random() * 0.5, // Longer life
                size: Math.random() * 15 + 5,
                color: `hsl(${Math.random()*60}, 100%, 60%)` // Bright fire colors
            });
        }
    }

    function updateExplosion() {
        // Flash background
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, particles[0]?.life - 0.8)})`;
        ctx.fillRect(0,0, WIDTH, HEIGHT);

        for(let p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.015; // Slow fade
            p.vy += 0.2; // Gravity

            if(p.life > 0) {
                ctx.globalAlpha = Math.min(1, p.life);
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
                ctx.fillStyle = p.color;
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    }

    // --- Timer Logic ---
    function updateTimer() {
        if (!isRunning) return;
        
        const now = Date.now();
        const left = Math.max(0, endTime - now);
        
        const sec = Math.ceil(left / 1000);
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;

        if (left <= 0) {
            triggerExplosion();
        } else {
            setTimeout(updateTimer, 50);
        }
    }

    // --- Controls ---
    window.changeTime = function(delta) {
        if (isRunning) return;
        durationSec += delta;
        if (durationSec < 10) durationSec = 10;
        if (durationSec > 300) durationSec = 300;
        
        const m = Math.floor(durationSec / 60).toString().padStart(2, '0');
        const s = (durationSec % 60).toString().padStart(2, '0');
        timerDisplay.textContent = `${m}:${s}`;
    }

    startBtn.onclick = function() {
        if (isRunning) {
            // Stop/Reset
            isRunning = false;
            exploded = false;
            initFuse();
            startBtn.textContent = "START";
            startBtn.style.background = "";
            window.changeTime(0); // reset text
        } else {
            // Start
            isRunning = true;
            exploded = false;
            initFuse(); // Fresh fuse
            endTime = Date.now() + durationSec * 1000;
            startBtn.textContent = "STOP";
            startBtn.style.background = "#e74c3c";
            updateTimer();
        }
    }

    // Init
    initFuse();
    draw();
};

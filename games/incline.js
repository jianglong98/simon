
// TODO: Implement game logic for Incline
// The game should feature a ball rolling down an endless incline with obstacles.
// Players must navigate the ball to avoid the obstacles.

// Incline game: ball rolls down an endless incline with obstacles
// Controls: Left/Right arrow keys to steer
// Ball speeds up over time; obstacles move up to simulate downhill motion

(function() {
	const CANVAS_ID = 'inclineCanvas';
	const START_BTN_ID = 'inclineStartBtn';
	const SCORE_ID = 'inclineScore';
	const HIGH_SCORE_ID = 'inclineHighScore';
	const STORAGE_KEY = 'inclineHighScore';

	let canvas, ctx;
	let width, height;
	let animationId = null;
	let spawnTimer = null;

	// Game state
	let running = false;
	let score = 0;
	let highScore = 0;

	// Ball
	const ball = {
		x: 0,
		y: 0,
		r: 12,
		speedX: 0,
		lateralAccel: 0.0025,
		maxSpeedX: 6,
	};

	// Obstacles (rectangles)
	let obstacles = [];

	// Speed that simulates downhill motion (pixels per second)
	let downhillSpeed = 160; // initial pixels/sec
	const SPEED_INCREASE_PER_SECOND = 6; // increase per second
	const MAX_DOWNHILL_SPEED = 900;

	// Background offset for moving-diagonal effect
	let bgOffset = 0;

	// track the current spawn interval assigned to the timer
	let currentSpawnInterval = 0;

	// Spawn config
	let spawnInterval = 900; // ms; will tighten as speed increases (faster start)

	// Timing
	let lastTime = 0;

	function initCanvas() {
		canvas = document.getElementById(CANVAS_ID);
		if (!canvas) return false;
		ctx = canvas.getContext('2d');
		resizeCanvas();
		window.addEventListener('resize', resizeCanvas);
		return true;
	}

	function resizeCanvas() {
		if (!canvas) return;
		width = canvas.width = canvas.clientWidth || canvas.width;
		height = canvas.height = canvas.clientHeight || canvas.height;
		ball.x = width / 2;
		// place ball near top so player has more time to react
		ball.y = Math.max(40, Math.floor(height * 0.18));
	}

	function resetGame() {
		obstacles = [];
		score = 0;
		downhillSpeed = 160;
		// make spawn a bit faster at start so obstacles appear sooner
		spawnInterval = 600;
		ball.x = width / 2;
		ball.y = Math.max(40, Math.floor(height * 0.18));
		ball.speedX = 0;
		lastTime = performance.now();
		updateScoreDisplay();

		// create a few visible obstacles immediately for debugging/visibility
		for (let i = 0; i < 3; ++i) {
			spawnObstacle();
			const o = obstacles[obstacles.length - 1];
			if (o) {
				// place them within visible area so player can see them
				o.y = randRange(40, Math.max(80, Math.floor(height * 0.35)));
			}
		}
	}

	function startGame() {
		if (!canvas) return;
		if (running) return;
		running = true;
		resetGame();
		clearInterval(spawnTimer);
		currentSpawnInterval = Math.max(180, Math.floor(spawnInterval));
		spawnTimer = setInterval(spawnObstacle, currentSpawnInterval);
		lastTime = performance.now();
		loop(lastTime);
	}

	function stopGame() {
		running = false;
		if (animationId) cancelAnimationFrame(animationId);
		animationId = null;
		clearInterval(spawnTimer);
		spawnTimer = null;
		if (score > highScore) {
			highScore = Math.floor(score);
			try { localStorage.setItem(STORAGE_KEY, String(highScore)); } catch (e) {}
		}
		updateScoreDisplay();
		ctx.fillStyle = 'rgba(0,0,0,0.6)';
		ctx.fillRect(0, 0, width, height);
		ctx.fillStyle = '#fff';
		ctx.textAlign = 'center';
		ctx.font = '28px Arial';
		ctx.fillText('Game Over', width/2, height/2 - 10);
		ctx.font = '18px Arial';
		ctx.fillText('Press Start to play again', width/2, height/2 + 20);
	}

	function spawnObstacle() {
		// varied obstacle types: static, moving, narrow, wide
		const rnd = Math.random();
		let type = 'static';
		if (rnd < 0.22) type = 'moving';
		else if (rnd < 0.40) type = 'narrow';
		else if (rnd < 0.55) type = 'wide';

		let w, h;
		if (type === 'narrow') {
			w = randRange(30, 60);
			h = randRange(14, 26);
		} else if (type === 'wide') {
			w = randRange(Math.floor(width*0.28), Math.floor(width*0.6));
			h = randRange(18, 34);
		} else {
			w = randRange(40, 140);
			h = randRange(14, 30);
		}

		const x = randRange(12, Math.max(12, width - 12 - w));
		// spawn above the canvas so obstacles fall downward
		const y = -h - randRange(20, 260);

		const colorVariants = ['#b33', '#2b8fbd', '#7a3fb2', '#e07a5f'];
		const color = colorVariants[Math.floor(Math.random() * colorVariants.length)];

		const obs = { x, y, w, h, color, type };
		if (type === 'moving') {
			obs.originX = x;
			obs.oscAmp = randRange(30, Math.max(40, Math.floor(width * 0.2)));
			obs.oscSpeed = (randRange(10, 40) / 10) * 0.8;
			obs.oscPhase = Math.random() * Math.PI * 2;
		}

		obstacles.push(obs);
	}

	function loop(now) {
		if (!running) return;
		const dt = Math.min(50, now - lastTime) / 1000;
		lastTime = now;

		downhillSpeed = Math.min(MAX_DOWNHILL_SPEED, downhillSpeed + SPEED_INCREASE_PER_SECOND * dt);
		// tighten spawn interval as speed increases
		spawnInterval = Math.max(180, 900 - (downhillSpeed - 160) * 1.0);
		const newInterval = Math.max(180, Math.floor(spawnInterval));
		if (spawnTimer && Math.abs(newInterval - currentSpawnInterval) > 120) {
			clearInterval(spawnTimer);
			spawnTimer = setInterval(spawnObstacle, newInterval);
			currentSpawnInterval = newInterval;
		}

		// update background offset to make diagonal lines appear moving
		bgOffset += downhillSpeed * dt * 0.6;

		update(dt);
		draw();

		animationId = requestAnimationFrame(loop);
	}

	function update(dt) {
		ball.speedX *= 0.98;
		ball.x += ball.speedX * dt * 60;
		ball.x = Math.max(ball.r + 6, Math.min(width - ball.r - 6, ball.x));

		for (let i = obstacles.length - 1; i >= 0; --i) {
			const o = obstacles[i];
			// move obstacles downward to simulate falling from top to bottom
			o.y += downhillSpeed * dt;
			if (o.type === 'moving') {
				o.oscPhase += dt * o.oscSpeed;
				o.x = o.originX + Math.sin(o.oscPhase) * o.oscAmp;
				o.x = clamp(o.x, 8, width - o.w - 8);
			}
			// remove obstacles that have passed below the canvas
			if (o.y > height + 50) obstacles.splice(i, 1);
		}

		score += downhillSpeed * dt * 0.02;
		updateScoreDisplay();

		if (checkCollisions()) {
			stopGame();
		}
	}

	function checkCollisions() {
		for (const o of obstacles) {
			if (circleRectCollision(ball.x, ball.y, ball.r, o.x, o.y, o.w, o.h)) return true;
		}
		return false;
	}

	function circleRectCollision(cx, cy, r, rx, ry, rw, rh) {
		const closestX = clamp(cx, rx, rx + rw);
		const closestY = clamp(cy, ry, ry + rh);
		const dx = cx - closestX;
		const dy = cy - closestY;
		return (dx * dx + dy * dy) <= (r * r);
	}

	function updateScoreDisplay() {
		const el = document.getElementById(SCORE_ID);
		if (el) el.innerText = Math.floor(score);
		const hs = document.getElementById(HIGH_SCORE_ID);
		if (hs) hs.innerText = highScore || 0;
	}

	function drawSlopeBackground() {
		ctx.fillStyle = '#e7f2ff';
		ctx.fillRect(0, 0, width, height);

		ctx.strokeStyle = 'rgba(0,0,0,0.06)';
		ctx.lineWidth = 1;
		const spacing = 36;
		// offset lines by bgOffset so they move upwards
		const offset = bgOffset % spacing;
		ctx.beginPath();
		for (let x = -height + offset; x < width + height; x += spacing) {
			ctx.moveTo(x, height);
			ctx.lineTo(x + height, 0);
		}
		ctx.stroke();

		// subtle gradient overlay for depth
		const grad = ctx.createLinearGradient(0, 0, 0, height);
		grad.addColorStop(0, 'rgba(255,255,255,0.02)');
		grad.addColorStop(1, 'rgba(0,0,0,0.02)');
		ctx.fillStyle = grad;
		ctx.fillRect(0, 0, width, height);
	}

	function draw() {
		drawSlopeBackground();

		// ensure drawing state is reset so obstacles are visible
		ctx.save();
		ctx.globalAlpha = 1;
		ctx.globalCompositeOperation = 'source-over';
		ctx.lineWidth = 1;
		for (const o of obstacles) {
			ctx.fillStyle = o.color;
			roundRect(ctx, o.x, o.y, o.w, o.h, 4, true, false);
		}
		ctx.restore();

		ctx.save();
		const shadowOffset = Math.min(14, downhillSpeed / 80);
		ctx.fillStyle = 'rgba(0,0,0,0.18)';
		ctx.beginPath();
		ctx.ellipse(ball.x + shadowOffset, ball.y + ball.r + 6, ball.r * 0.9, ball.r * 0.45, 0, 0, Math.PI * 2);
		ctx.fill();
		ctx.restore();

		ctx.fillStyle = '#ffd166';
		ctx.beginPath();
		ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = 'rgba(255,255,255,0.7)';
		ctx.beginPath();
		ctx.arc(ball.x - ball.r*0.3, ball.y - ball.r*0.35, ball.r*0.35, 0, Math.PI * 2);
		ctx.fill();

		ctx.fillStyle = '#333';
		ctx.font = '14px Arial';
		ctx.textAlign = 'left';
		ctx.fillText(`Speed: ${Math.floor(downhillSpeed)} px/s`, 12, 20);
	}

	function randRange(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
	function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

	function roundRect(ctx, x, y, w, h, r, fill, stroke) {
		if (typeof stroke === 'undefined') stroke = true;
		if (typeof r === 'undefined') r = 5;
		ctx.beginPath();
		ctx.moveTo(x + r, y);
		ctx.arcTo(x + w, y, x + w, y + h, r);
		ctx.arcTo(x + w, y + h, x, y + h, r);
		ctx.arcTo(x, y + h, x, y, r);
		ctx.arcTo(x, y, x + w, y, r);
		ctx.closePath();
		if (fill) ctx.fill();
		if (stroke) ctx.stroke();
	}

	// Input handling
	const keys = { left: false, right: false };
	function onKeyDown(e) {
		if (['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
		if (e.key === 'ArrowLeft') keys.left = true;
		if (e.key === 'ArrowRight') keys.right = true;
		applyInputToBall();
	}
	function onKeyUp(e) {
		if (['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
		if (e.key === 'ArrowLeft') keys.left = false;
		if (e.key === 'ArrowRight') keys.right = false;
		applyInputToBall();
	}

	function applyInputToBall() {
		const target = (keys.right ? 1 : 0) - (keys.left ? 1 : 0);
		if (target === 0) {
			ball.speedX *= 0.86;
		} else {
			ball.speedX += target * 1.6;
			ball.speedX = clamp(ball.speedX, -ball.maxSpeedX, ball.maxSpeedX);
		}
	}

	function loadHighScore() {
		try { highScore = parseInt(localStorage.getItem(STORAGE_KEY)) || 0; } catch (e) { highScore = 0; }
	}

	document.addEventListener('DOMContentLoaded', () => {
		if (!initCanvas()) return;
		loadHighScore();
		updateScoreDisplay();

		const startBtn = document.getElementById(START_BTN_ID);
		if (startBtn) startBtn.addEventListener('click', startGame);

		window.addEventListener('keydown', (e) => {
			if(['ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
		});

		window.addEventListener('keydown', onKeyDown);
		window.addEventListener('keyup', onKeyUp);

		draw();
	});
})();



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

	// Spawn config
	let spawnInterval = 1200; // ms; will tighten as speed increases

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
		ball.y = height - 60;
	}

	function resetGame() {
		obstacles = [];
		score = 0;
		downhillSpeed = 160;
		spawnInterval = 1200;
		ball.x = width / 2;
		ball.y = height - 60;
		ball.speedX = 0;
		lastTime = performance.now();
		updateScoreDisplay();
	}

	function startGame() {
		if (!canvas) return;
		if (running) return;
		running = true;
		resetGame();
		clearInterval(spawnTimer);
		spawnTimer = setInterval(spawnObstacle, Math.max(250, spawnInterval));
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
		const w = randRange(40, 140);
		const h = randRange(14, 30);
		const x = randRange(20, width - 20 - w);
		const y = height + h + randRange(0, 120);
		obstacles.push({ x, y, w, h, color: '#b33' });
	}

	function loop(now) {
		if (!running) return;
		const dt = Math.min(50, now - lastTime) / 1000;
		lastTime = now;

		downhillSpeed = Math.min(MAX_DOWNHILL_SPEED, downhillSpeed + SPEED_INCREASE_PER_SECOND * dt);
		spawnInterval = Math.max(300, 1200 - (downhillSpeed - 160) * 1.1);
		if (spawnTimer) {
			clearInterval(spawnTimer);
			spawnTimer = setInterval(spawnObstacle, Math.max(250, spawnInterval));
		}

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
			o.y -= downhillSpeed * dt;
			if (o.y + o.h < -50) obstacles.splice(i, 1);
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
		ctx.beginPath();
		for (let x = -height; x < width + height; x += spacing) {
			ctx.moveTo(x, height);
			ctx.lineTo(x + height, 0);
		}
		ctx.stroke();
	}

	function draw() {
		drawSlopeBackground();

		for (const o of obstacles) {
			ctx.fillStyle = o.color;
			roundRect(ctx, o.x, o.y, o.w, o.h, 4, true, false);
		}

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

alert("Incline game is not yet implemented.");

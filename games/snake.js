// Initialize game variables
let canvas, ctx;
let snake, food, direction, nextDirection, gameLoop, score, gameStarted;

// Constants
const GRID_SIZE = 20;
const SNAKE_COLOR = '#4CAF50';
const GAME_SPEED = 200;

function getRandomFruit() {
    const rand = Math.random();
    let cumulative = 0;
    
    for (const fruit in FRUITS) {
        cumulative += FRUITS[fruit].probability;
        if (rand <= cumulative) {
            return {
                type: fruit,
                ...FRUITS[fruit]
            };
        }
    }
    return {
        type: 'apple',
        ...FRUITS.apple
    };
}

function generateFood() {
    let newFood;
    do {
        newFood = {
            x: Math.floor(Math.random() * (canvas.width / GRID_SIZE)),
            y: Math.floor(Math.random() * (canvas.height / GRID_SIZE)),
            fruit: getRandomFruit()
        };
    } while (snake.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
}

function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
}

function drawFruit(x, y, emoji) {
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x * GRID_SIZE + GRID_SIZE/2, y * GRID_SIZE + GRID_SIZE/2);
}

function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background aligned to GRID_SIZE
    ctx.strokeStyle = 'rgba(0,0,0,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= canvas.width; x += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(x + 0.5, 0);
        ctx.lineTo(x + 0.5, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y <= canvas.height; y += GRID_SIZE) {
        ctx.beginPath();
        ctx.moveTo(0, y + 0.5);
        ctx.lineTo(canvas.width, y + 0.5);
        ctx.stroke();
    }
    
    // Draw snake
    snake.forEach(segment => {
        drawSquare(segment.x, segment.y, SNAKE_COLOR);
    });
    
    // Draw food
    drawFruit(food.x, food.y, food.fruit.emoji);
    
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);

    // Draw current fruit info
    ctx.fillStyle = '#666';
    ctx.font = '16px Arial';
    ctx.fillText(`${food.fruit.emoji} = ${food.fruit.points} points`, 10, 60);

    // Draw instructions if game hasn't started
    if (!gameStarted) {
        ctx.fillStyle = '#000';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Press Space to Start', canvas.width/2, canvas.height/2);
    }
}

function moveSnake() {
    // Apply only one queued direction change per tick to avoid instant reversals
    if (nextDirection) {
        direction = nextDirection;
        nextDirection = null;
    }

    const head = { ...snake[0] };
    
    switch(direction) {
        case 'up': head.y--; break;
        case 'down': head.y++; break;
        case 'left': head.x--; break;
        case 'right': head.x++; break;
    }
    
    // Check for collisions
    if (head.x < 0 || head.x >= canvas.width / GRID_SIZE ||
        head.y < 0 || head.y >= canvas.height / GRID_SIZE ||
        snake.some(segment => segment.x === head.x && segment.y === head.y)) {
        gameOver();
        return;
    }
    
    snake.unshift(head);
    
    // Check if snake ate food
    if (head.x === food.x && head.y === food.y) {
        score += food.fruit.points;
        food = generateFood();
    } else {
        snake.pop();
    }
}

function gameOver() {
    gameStarted = false;
    clearInterval(gameLoop);
    ctx.fillStyle = '#000';
    ctx.font = '40px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width/2, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText('Press Space to restart', canvas.width/2, canvas.height/2 + 40);
    ctx.fillText(`Final Score: ${score}`, canvas.width/2, canvas.height/2 + 80);
}

window.startGame = function() {
    // Start snake roughly at canvas center
    const cols = Math.floor(canvas.width / GRID_SIZE);
    const rows = Math.floor(canvas.height / GRID_SIZE);
    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
    food = generateFood();
    direction = 'right';
    nextDirection = null;
    score = 0;
    gameStarted = true;
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        moveSnake();
        drawGame();
    }, GAME_SPEED);
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('snakeCanvas');
    ctx = canvas.getContext('2d');

    const startButton = document.getElementById('startGameBtn');
    startButton.addEventListener('click', startGame);

    // Initialize game state
    const cols = Math.floor(canvas.width / GRID_SIZE);
    const rows = Math.floor(canvas.height / GRID_SIZE);
    snake = [{ x: Math.floor(cols / 2), y: Math.floor(rows / 2) }];
    direction = 'right';
    nextDirection = null;
    score = 0;
    gameStarted = false;
    food = generateFood();

    // Initial draw
    drawGame();

    // Prevent arrow keys from scrolling
    window.addEventListener('keydown', (event) => {
        if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) {
            event.preventDefault();
        }
    });

    document.addEventListener('keydown', (event) => {
        if (!gameStarted && event.key !== ' ') return;

        // Map arrow keys to directions
        const keyToDir = {
            'ArrowUp': 'up',
            'ArrowDown': 'down',
            'ArrowLeft': 'left',
            'ArrowRight': 'right'
        };

        if (event.key === ' ') {
            startGame();
            return;
        }

        const desired = keyToDir[event.key];
        if (!desired) return;

        // Prevent reversing: check against current direction
        const opposites = { up: 'down', down: 'up', left: 'right', right: 'left' };
        if (opposites[desired] === direction) return;

        // Queue the direction change so only one change happens per tick
        if (!nextDirection) nextDirection = desired;
    });
});

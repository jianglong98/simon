const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const SNAKE_COLOR = '#4CAF50';
const GAME_SPEED = 200;

// Fruit types and their properties
const FRUITS = {
    apple: {
        emoji: '🍎',
        points: 10,
        probability: 0.5  // 50% chance of spawning
    },
    banana: {
        emoji: '🍌',
        points: 15,
        probability: 0.3  // 30% chance of spawning
    },
    orange: {
        emoji: '🍊',
        points: 5,
        probability: 0.2  // 20% chance of spawning
    }
};

let snake = [
    { x: 10, y: 10 }
];
let food = generateFood();
let direction = 'right';
let gameLoop;
let score = 0;
let gameStarted = false;

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
    return {
        x: Math.floor(Math.random() * (canvas.width / GRID_SIZE)),
        y: Math.floor(Math.random() * (canvas.height / GRID_SIZE)),
        fruit: getRandomFruit()
    };
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

function startGame() {
    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    direction = 'right';
    score = 0;
    gameStarted = true;
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        moveSnake();
        drawGame();
    }, GAME_SPEED);
}

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
    
    switch(event.key) {
        case 'ArrowUp':
            if (direction !== 'down') direction = 'up';
            break;
        case 'ArrowDown':
            if (direction !== 'up') direction = 'down';
            break;
        case 'ArrowLeft':
            if (direction !== 'right') direction = 'left';
            break;
        case 'ArrowRight':
            if (direction !== 'left') direction = 'right';
            break;
        case ' ':
            startGame();
            break;
    }
});

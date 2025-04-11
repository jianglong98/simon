const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');

const GRID_SIZE = 20;
const SNAKE_COLOR = '#4CAF50';
const FOOD_COLOR = '#FF5252';
const GAME_SPEED = 100;

let snake = [
    { x: 10, y: 10 }
];
let food = generateFood();
let direction = 'right';
let gameLoop;
let score = 0;

function generateFood() {
    return {
        x: Math.floor(Math.random() * (canvas.width / GRID_SIZE)),
        y: Math.floor(Math.random() * (canvas.height / GRID_SIZE))
    };
}

function drawSquare(x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x * GRID_SIZE, y * GRID_SIZE, GRID_SIZE - 2, GRID_SIZE - 2);
}

function drawGame() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw snake
    snake.forEach(segment => {
        drawSquare(segment.x, segment.y, SNAKE_COLOR);
    });
    
    // Draw food
    drawSquare(food.x, food.y, FOOD_COLOR);
    
    // Draw score
    ctx.fillStyle = '#000';
    ctx.font = '20px Arial';
    ctx.fillText(`Score: ${score}`, 10, 30);
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
        score += 10;
        food = generateFood();
    } else {
        snake.pop();
    }
}

function gameOver() {
    clearInterval(gameLoop);
    ctx.fillStyle = '#000';
    ctx.font = '40px Arial';
    ctx.fillText('Game Over!', canvas.width/2 - 100, canvas.height/2);
    ctx.font = '20px Arial';
    ctx.fillText('Press Space to restart', canvas.width/2 - 100, canvas.height/2 + 40);
}

function startGame() {
    snake = [{ x: 10, y: 10 }];
    food = generateFood();
    direction = 'right';
    score = 0;
    clearInterval(gameLoop);
    gameLoop = setInterval(() => {
        moveSnake();
        drawGame();
    }, GAME_SPEED);
}

document.addEventListener('keydown', (event) => {
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

const size = 20;
const winLength = 5;

function generateWinningCombinations(size, winLength) {
    const combos = [];
    // Rows
    for (let row = 0; row < size; row++) {
        for (let col = 0; col <= size - winLength; col++) {
            const combo = [];
            for (let i = 0; i < winLength; i++) {
                combo.push(row * size + col + i);
            }
            combos.push(combo);
        }
    }
    // Columns
    for (let col = 0; col < size; col++) {
        for (let row = 0; row <= size - winLength; row++) {
            const combo = [];
            for (let i = 0; i < winLength; i++) {
                combo.push((row + i) * size + col);
            }
            combos.push(combo);
        }
    }
    // Main diagonals (top-left to bottom-right)
    for (let row = 0; row <= size - winLength; row++) {
        for (let col = 0; col <= size - winLength; col++) {
            const combo = [];
            for (let i = 0; i < winLength; i++) {
                combo.push((row + i) * size + (col + i));
            }
            combos.push(combo);
        }
    }
    // Anti-diagonals (top-right to bottom-left)
    for (let row = 0; row <= size - winLength; row++) {
        for (let col = winLength - 1; col < size; col++) {
            const combo = [];
            for (let i = 0; i < winLength; i++) {
                combo.push((row + i) * size + (col - i));
            }
            combos.push(combo);
        }
    }
    return combos;
}

const winningCombinations = generateWinningCombinations(size, winLength);

let tttBoardState = Array(size * size).fill('');
let tttCurrentPlayer = 'X';
let tttIsActive = true;
let tttCells = [];
let tttStatusElement;
let tttResetButton;

function updateTttStatus(message) {
    if (tttStatusElement) tttStatusElement.textContent = message;
}

function checkTttWinner() {
    for (const combo of winningCombinations) {
        const [a, b, c] = combo;
        if (
            tttBoardState[a] &&
            tttBoardState[a] === tttBoardState[b] &&
            tttBoardState[a] === tttBoardState[c]
        ) {
            return tttBoardState[a];
        }
    }

    if (tttBoardState.every(cell => cell !== '')) {
        return 'Tie';
    }

    return null;
}

function renderTttBoard() {
    tttBoardState.forEach((mark, index) => {
        const cell = tttCells[index];
        if (!cell) return;
        cell.textContent = mark;
        cell.classList.toggle('taken', mark !== '');
    });
}

function handleTttCellClick(index) {
    if (!tttIsActive || tttBoardState[index] !== '') return;

    tttBoardState[index] = tttCurrentPlayer;
    renderTttBoard();

    const winner = checkTttWinner();
    if (winner) {
        tttIsActive = false;
        if (winner === 'Tie') {
            updateTttStatus('Tie game!');
        } else {
            updateTttStatus(`${winner} wins!`);
        }
        return;
    }

    tttCurrentPlayer = tttCurrentPlayer === 'X' ? 'O' : 'X';
    updateTttStatus(`${tttCurrentPlayer}'s turn`);
}

function resetTttGame() {
    tttBoardState = Array(size * size).fill('');
    tttCurrentPlayer = 'X';
    tttIsActive = true;
    renderTttBoard();
    updateTttStatus(`${tttCurrentPlayer}'s turn`);
}

function initializeTttGame() {
    const boardElement = document.getElementById('tttBoard');
    tttStatusElement = document.getElementById('tttStatus');
    tttResetButton = document.getElementById('tttResetBtn');

    if (!boardElement || !tttStatusElement || !tttResetButton) return;

    boardElement.innerHTML = '';
    tttCells = [];

    for (let index = 0; index < size * size; index++) {
        const cell = document.createElement('div');
        cell.className = 'ttt-cell';
        cell.addEventListener('click', () => handleTttCellClick(index));
        boardElement.appendChild(cell);
        tttCells.push(cell);
    }

    tttResetButton.addEventListener('click', resetTttGame);
    resetTttGame();
}

document.addEventListener('DOMContentLoaded', initializeTttGame);

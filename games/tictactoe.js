const winningCombinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let tttBoardState = Array(9).fill('');
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
    tttBoardState = Array(9).fill('');
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

    for (let index = 0; index < 9; index++) {
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

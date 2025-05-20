// Elements
const board = document.getElementById('board');
const statusDiv = document.getElementById('status');
const modeSelect = document.getElementById('mode-select');
const newGameBtn = document.getElementById('new-game-btn');
const newGameBtnWinner = document.getElementById('new-game-btn-winner');
const winnerScreen = document.getElementById('winner-screen');
const winnerMessage = document.getElementById('winner-message');
const xWinsSpan = document.getElementById('x-wins');
const oWinsSpan = document.getElementById('o-wins');
const drawsSpan = document.getElementById('draws');
const themeToggleBtn = document.getElementById('theme-toggle');

let mode = modeSelect.value; // pvp, easy, hard
let currentPlayer = 'X';
let gameState = Array(9).fill('');
let gameActive = true;

const scores = { X: 0, O: 0, draws: 0 };

const winPatterns = [
  [0,1,2], [3,4,5], [6,7,8],  // rows
  [0,3,6], [1,4,7], [2,5,8],  // cols
  [0,4,8], [2,4,6]            // diagonals
];

// Create and add cells dynamically
function renderBoard() {
  board.innerHTML = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('div');
    cell.classList.add('cell');
    cell.dataset.index = i;
    cell.textContent = gameState[i];
    cell.addEventListener('click', () => handleCellClick(i));
    board.appendChild(cell);
  }
}

// Sound effects
const moveSound = new Audio('https://actions.google.com/sounds/v1/cartoon/clang_and_wobble.ogg');
const winSound = new Audio('https://actions.google.com/sounds/v1/cartoon/concussive_hit_guitar_boing.ogg');
const drawSound = new Audio('https://actions.google.com/sounds/v1/cartoon/wood_plank_flicks.ogg');

function playSound(sound) {
  if (!sound) return;
  sound.currentTime = 0;
  sound.play();
}

// Handle clicks on cells
function handleCellClick(index) {
  if (!gameActive || gameState[index] !== '') return;

  gameState[index] = currentPlayer;
  playSound(moveSound);
  renderBoard();

  if (checkEnd()) return;

  // Switch player
  currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
  statusDiv.textContent = `Player ${currentPlayer}'s Turn`;

  // If AI turn
  if (mode !== 'pvp' && currentPlayer === 'O') {
    setTimeout(() => aiMove(mode), 600);
  }
}

// Check for win or draw
function checkWin(state) {
  for (const pattern of winPatterns) {
    const [a, b, c] = pattern;
    if (state[a] && state[a] === state[b] && state[b] === state[c]) {
      return pattern;
    }
  }
  return null;
}

function checkEnd() {
  const winPattern = checkWin(gameState);
  if (winPattern) {
    gameActive = false;
    showWinner(`Player ${gameState[winPattern[0]]} Wins! 🎉`);
    drawWinningLine(winPattern);
    updateScores(gameState[winPattern[0]]);
    playSound(winSound);
    return true;
  }

  if (!gameState.includes('')) {
    gameActive = false;
    showWinner("It's a Draw 🤝");
    updateScores('draws');
    playSound(drawSound);
    return true;
  }

  return false;
}

// Show winner overlay
function showWinner(message) {
  winnerMessage.textContent = message;
  winnerScreen.classList.remove('hidden');
}

// Restart game logic
function restartGame() {
  currentPlayer = 'X';
  gameState = Array(9).fill('');
  gameActive = true;
  statusDiv.textContent = `Player ${currentPlayer}'s Turn`;
  winnerScreen.classList.add('hidden');
  clearWinningLine();
  renderBoard();

  // If AI goes first (unlikely here, but for completeness)
  if (mode !== 'pvp' && currentPlayer === 'O') {
    setTimeout(() => aiMove(mode), 600);
  }
}

// Update scoreboard display
function updateScores(winner) {
  if (winner === 'X' || winner === 'O') {
    scores[winner]++;
  } else {
    scores.draws++;
  }
  xWinsSpan.textContent = scores.X;
  oWinsSpan.textContent = scores.O;
  drawsSpan.textContent = scores.draws;
}

// AI move
function aiMove(difficulty) {
  if (!gameActive) return;

  let move;
  if (difficulty === 'easy') {
    move = getRandomMove();
  } else {
    move = getBestMove(gameState, 'O').index;
  }

  if (move != null) {
    gameState[move] = 'O';
    playSound(moveSound);
    renderBoard();
    if (checkEnd()) return;
    currentPlayer = 'X';
    statusDiv.textContent = `Player ${currentPlayer}'s Turn`;
  }
}

function getRandomMove() {
  const emptyIndices = gameState
    .map((v, i) => v === '' ? i : null)
    .filter(i => i !== null);
  if (emptyIndices.length === 0) return null;
  return emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
}

// Minimax algorithm for hard AI
function getBestMove(state, player) {
  const opponent = player === 'O' ? 'X' : 'O';
  const emptyIndices = state
    .map((v, i) => v === '' ? i : null)
    .filter(i => i !== null);

  const winnerPattern = checkWin(state);
  if (winnerPattern) {
    if (state[winnerPattern[0]] === 'O') return { score: 10 };
    if (state[winnerPattern[0]] === 'X') return { score: -10 };
  }

  if (emptyIndices.length === 0) return { score: 0 };

  const moves = [];

  for (let i of emptyIndices) {
    const newState = [...state];
    newState[i] = player;

    const result = getBestMove(newState, opponent);
    moves.push({ index: i, score: result.score });
  }

  if (player === 'O') {
    // Maximize
    return moves.reduce((a, b) => (a.score > b.score ? a : b));
  } else {
    // Minimize
    return moves.reduce((a, b) => (a.score < b.score ? a : b));
  }
}

// Winning line element (create it dynamically)
let winningLine = document.getElementById('winning-line');
if (!winningLine) {
  winningLine = document.createElement('div');
  winningLine.id = 'winning-line';
  document.body.appendChild(winningLine);
}

function drawWinningLine([a, , c]) {
  const cells = board.querySelectorAll('.cell');
  const boardRect = board.getBoundingClientRect();

  const startCell = cells[a].getBoundingClientRect();
  const endCell = cells[c].getBoundingClientRect();

  const startX = startCell.left + startCell.width / 2 - boardRect.left;
  const startY = startCell.top + startCell.height / 2 - boardRect.top;
  const endX = endCell.left + endCell.width / 2 - boardRect.left;
  const endY = endCell.top + endCell.height / 2 - boardRect.top;

  const length = Math.hypot(endX - startX, endY - startY);
  const angle = Math.atan2(endY - startY, endX - startX) * (180 / Math.PI);

  winningLine.style.width = length + 'px';
  winningLine.style.transform = `translate(${startX}px, ${startY}px) rotate(${angle}deg)`;
  winningLine.style.opacity = 1;

  // Hide line after 3 seconds
  setTimeout(() => {
    winningLine.style.opacity = 0;
  }, 3000);
}

function clearWinningLine() {
  winningLine.style.opacity = 0;
}

// Event Listeners
newGameBtn.addEventListener('click', restartGame);
newGameBtnWinner.addEventListener('click', restartGame);

modeSelect.addEventListener('change', () => {
  mode = modeSelect.value;
  restartGame();
});

themeToggleBtn.addEventListener('click', () => {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  themeToggleBtn.textContent = isLight ? 'Dark' : 'Light';
});

// Initial render and setup
restartGame();

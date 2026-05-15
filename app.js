let turnX = true; // X selalu mulai duluan
let count = 0;
let isVSComputer = false;
let boardSize = 3;
let playerSymbol = "X";
let cpuSymbol = "O";
let gameActive = true;
let boardState = [];
let winPatterns = [];

// --- SISTEM SKOR & DATA ---
const loadData = () => {
    const sL = localStorage.getItem("score-lucas") || 0;
    const sP = localStorage.getItem("score-player") || 0;
    const xp = localStorage.getItem("xp") || 0;
    document.getElementById("score-lucas").innerText = sL;
    document.getElementById("score-player").innerText = sP;
    document.getElementById("lb-lucas").innerText = sL;
    document.getElementById("lb-player").innerText = sP;
    document.getElementById("xp-count").innerText = `XP ${xp}`;
};

const saveWin = (sym) => {
    let key = (sym === playerSymbol) ? "score-player" : "score-lucas";
    localStorage.setItem(key, parseInt(localStorage.getItem(key) || 0) + 1);
    localStorage.setItem("xp", parseInt(localStorage.getItem("xp") || 0) + 50);
    loadData();
};

const resetAllData = () => {
    if(confirm("Hapus semua progress?")) { localStorage.clear(); location.reload(); }
};

// --- NAVIGASI ---
function showScene(id) {
    document.querySelectorAll('.scene').forEach(s => s.classList.add('hide'));
    document.getElementById(id).classList.remove('hide');
}

function toggleOverlay(id) { document.getElementById(id).classList.toggle('hide'); }

function prepareGame(vsCPU) {
    isVSComputer = vsCPU;
    showScene('setup-menu');
}

function pickSymbol(s) {
    playerSymbol = s;
    cpuSymbol = (s === "X") ? "O" : "X";
    document.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('active'));
    document.getElementById('pick' + s).classList.add('active');
}

// --- GAME LOGIC ---
document.querySelectorAll('.size-opt').forEach(btn => {
    btn.onclick = () => {
        document.querySelectorAll('.size-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        boardSize = parseInt(btn.dataset.size);
    };
});

document.getElementById('start-game-btn').onclick = () => {
    showScene('game-scene');
    resetGame();
};

const resetGame = () => {
    turnX = true;
    count = 0;
    gameActive = true;
    boardState = Array(boardSize * boardSize).fill("");
    document.getElementById('win-overlay').classList.add('hide');
    generateBoard();
    updateUI();
    if(isVSComputer && cpuSymbol === "X") setTimeout(computerMove, 600);
};

const generateBoard = () => {
    const board = document.getElementById('game-board');
    board.innerHTML = '';
    board.style.gridTemplateColumns = `repeat(${boardSize}, 1fr)`;
    for (let i = 0; i < boardSize * boardSize; i++) {
        let b = document.createElement("div");
        b.className = "box";
        b.dataset.index = i;
        b.onclick = () => handleMove(i, b);
        board.appendChild(b);
    }
    calcWinPatterns();
};

const handleMove = (idx, el) => {
    if (boardState[idx] !== "" || !gameActive) return;
    let sym = turnX ? "X" : "O";
    boardState[idx] = sym;
    el.innerText = sym;
    el.style.color = (sym === "X") ? "var(--accent-blue)" : "#f97316";
    el.classList.add("disabled");
    count++;

    if (!checkWinner()) {
        turnX = !turnX;
        updateUI();
        if (isVSComputer && ((turnX && cpuSymbol === "X") || (!turnX && cpuSymbol === "O"))) {
            setTimeout(computerMove, 600);
        }
    }
};

// --- AI CERDAS (MINIMAX) ---
const computerMove = () => {
    if(!gameActive) return;
    let bestIdx = (boardSize === 3) ? getBestMove(boardState) : getRandomMove();
    let btn = document.querySelector(`[data-index='${bestIdx}']`);
    handleMove(bestIdx, btn);
};

function getBestMove(board) {
    let bestScore = -Infinity;
    let move = null;
    for (let i = 0; i < board.length; i++) {
        if (board[i] === "") {
            board[i] = cpuSymbol;
            let score = minimax(board, 0, false);
            board[i] = "";
            if (score > bestScore) { bestScore = score; move = i; }
        }
    }
    return move;
}

function minimax(board, depth, isMax) {
    let res = checkStatic(board);
    if (res === cpuSymbol) return 10 - depth;
    if (res === playerSymbol) return depth - 10;
    if (res === "Draw") return 0;

    if (isMax) {
        let best = -Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = cpuSymbol;
                best = Math.max(best, minimax(board, depth + 1, false));
                board[i] = "";
            }
        }
        return best;
    } else {
        let best = Infinity;
        for (let i = 0; i < board.length; i++) {
            if (board[i] === "") {
                board[i] = playerSymbol;
                best = Math.min(best, minimax(board, depth + 1, true));
                board[i] = "";
            }
        }
        return best;
    }
}

function checkStatic(b) {
    for (let p of winPatterns) {
        let vals = p.map(i => b[i]);
        if (vals[0] !== "" && vals.every(v => v === vals[0])) return vals[0];
    }
    return b.includes("") ? null : "Draw";
}

function getRandomMove() {
    let avail = boardState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    return avail[Math.floor(Math.random() * avail.length)];
}

// --- UTILS ---
const checkWinner = () => {
    let res = checkStatic(boardState);
    if (res) {
        gameActive = false;
        document.getElementById('win-overlay').classList.remove('hide');
        document.getElementById('win-text').innerText = res === "Draw" ? "SERI!" : (res === playerSymbol ? "YOU WIN!" : "CPU WINS!");
        if (res !== "Draw") saveWin(res);
        return true;
    }
    return false;
};

const updateUI = () => {
    let isUserTurn = (turnX && playerSymbol === "X") || (!turnX && playerSymbol === "O");
    document.getElementById('turn-info').innerText = isUserTurn ? "GILIRAN KAMU" : "GILIRAN CPU";
    document.getElementById('panel-P').classList.toggle('active', isUserTurn);
    document.getElementById('panel-L').classList.toggle('active', !isUserTurn);
};

const calcWinPatterns = () => {
    winPatterns = [];
    let s = boardSize;
    for (let i = 0; i < s; i++) {
        let r = [], c = [];
        for (let j = 0; j < s; j++) { r.push(i * s + j); c.push(j * s + i); }
        winPatterns.push(r, c);
    }
    let d1 = [], d2 = [];
    for (let i = 0; i < s; i++) { d1.push(i * (s + 1)); d2.push((i + 1) * (s - 1)); }
    winPatterns.push(d1, d2);
};

loadData();
showScene('main-menu');
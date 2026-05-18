let turnX = true; 
let count = 0;
let isVSComputer = false;
let boardSize = 3;
let playerSymbol = "X";
let cpuSymbol = "O";
let gameActive = true;
let boardState = [];
let winPatterns = [];

// ==========================================
// --- WEB AUDIO SYSTEM (TANPA FILE MP3) ---
// ==========================================
let audioCtx = null;
let bgmNode = null;
let audioEnabled = false;

function initAudio() {
    if (audioCtx) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    audioEnabled = true;
    startBGM();
}

// Efek Suara Synth Elektrik
function playSound(type) {
    if (!audioEnabled || !audioCtx) return;
    
    // Aktifkan AudioContext jika tertidur karena kebijakan browser
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.setValueAtTime(600, now + 0.1);
        osc.frequency.setValueAtTime(900, now + 0.2);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } else if (type === 'draw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(250, now);
        osc.frequency.linearRampToValueAtTime(180, now + 0.2);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
    }
}

// Background Music Looping Otomatis (Ambience Cyberpunk)
function startBGM() {
    if (!audioEnabled || !audioCtx) return;
    try {
        // Melodi Synth Looper Sederhana
        bgmNode = audioCtx.createOscillator();
        const bgmGain = audioCtx.createGain();
        
        bgmNode.type = 'sine';
        bgmNode.frequency.setValueAtTime(110, audioCtx.currentTime); // Nada Bass A
        
        bgmGain.gain.setValueAtTime(0.04, audioCtx.currentTime); // Volume Background sangat kecil agar nyaman
        
        bgmNode.connect(bgmGain);
        bgmGain.connect(audioCtx.destination);
        bgmNode.start();
        
        // Modulasi frekuensi berkala agar berirama sci-fi
        setInterval(() => {
            if (audioEnabled && bgmNode && audioCtx) {
                const notes = [110, 130, 146, 165];
                const randomNote = notes[Math.floor(Math.random() * notes.length)];
                bgmNode.frequency.exponentialRampToValueAtTime(randomNote, audioCtx.currentTime + 1);
            }
        }, 2000);
    } catch(e) { console.log("BGM Init blocked"); }
}

function toggleAudio() {
    if (!audioCtx) {
        initAudio();
        document.getElementById('audio-toggle-btn').innerHTML = '<i class="fas fa-volume-up"></i>';
        return;
    }
    
    audioEnabled = !audioEnabled;
    const btn = document.getElementById('audio-toggle-btn');
    
    if (audioEnabled) {
        btn.innerHTML = '<i class="fas fa-volume-up"></i>';
        if (audioCtx.state === 'suspended') audioCtx.resume();
        if (!bgmNode) startBGM();
    } else {
        btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        if (audioCtx.state === 'running') audioCtx.resume(); 
    }
}

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
    playSound('click');
    if(confirm("Hapus semua progress?")) { localStorage.clear(); location.reload(); }
};

// --- NAVIGASI ---
function showScene(id) {
    initAudio(); // Memicu inisialisasi audio dari gestur pengguna pertama
    playSound('click');
    document.querySelectorAll('.scene').forEach(s => s.classList.add('hide'));
    document.getElementById(id).classList.remove('hide');
}

function toggleOverlay(id) { 
    playSound('click');
    document.getElementById(id).classList.toggle('hide'); 
}

function prepareGame(vsCPU) {
    isVSComputer = vsCPU;
    showScene('setup-menu');
}

function pickSymbol(s) {
    playSound('click');
    playerSymbol = s;
    cpuSymbol = (s === "X") ? "O" : "X";
    document.querySelectorAll('.mode-opt').forEach(b => b.classList.remove('active'));
    document.getElementById('pick' + s).add;
    document.getElementById('pick' + s).classList.add('active');
}

// --- GAME LOGIC ---
document.querySelectorAll('.size-opt').forEach(btn => {
    btn.onclick = () => {
        playSound('click');
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
    playSound('click');
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
    
    playSound('click'); // Mainkan efek klik pion ditaruh
    let sym = turnX ? "X" : "O";
    boardState[idx] = sym;
    el.innerText = sym;
    el.style.color = (sym === "X") ? "var(--accent-blue)" : "var(--accent-orange)";
    el.classList.add("disabled");
    count++;

    if (!checkWinner()) {
        turnX = !turnX;
        updateUI();
        if (isVSComputer && ((turnX && cpuSymbol === "X") || (!turnX && cpuSymbol === "O"))) {
            setTimeout(computerMove, 500);
        }
    }
};

// --- AI CERDAS ---
const computerMove = () => {
    if(!gameActive) return;
    let bestIdx = (boardSize === 3) ? getBestMove(boardState) : getRandomMove();
    let btn = document.querySelector(`[data-index='${bestIdx}']`);
    if(btn) handleMove(bestIdx, btn);
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
    return move !== null ? move : getRandomMove();
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
        
        if (res === "Draw") {
            playSound('draw');
            document.getElementById('win-text').innerText = "SERI!";
        } else {
            playSound('win');
            document.getElementById('win-text').innerText = res === playerSymbol ? "YOU WIN!" : "CPU WINS!";
            saveWin(res);
        }
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

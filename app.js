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
// ---      SISTEM AUDIO INTEGRASI        ---
// ==========================================
let audioCtx = null;
let bgmAudio = null; 
let audioEnabled = false;

function initAudio() {
    if (audioCtx) return;
    
    // 1. Inisialisasi AudioContext untuk Efek Suara SFX
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    
    // 2. Inisialisasi Musik Latar (.mp3)
    bgmAudio = new Audio('music.mp3');
    bgmAudio.loop = true; 
    bgmAudio.volume = 0.05; // VOLUME DIALIHKAN JADI LEBIH PELAN (5%) AGAR NYAMAN DI TELINGA
    
    audioEnabled = true;
    startBGM();
}

// Efek Suara SFX Sintetis
function playSound(type) {
    if (!audioEnabled || !audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'click') {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(280, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.08);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.08);
        osc.start(now);
        osc.stop(now + 0.08);
    } else if (type === 'win') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.setValueAtTime(554, now + 0.1);
        osc.frequency.setValueAtTime(659, now + 0.2);
        osc.frequency.setValueAtTime(880, now + 0.3);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.5);
        osc.start(now);
        osc.stop(now + 0.5);
    } else if (type === 'draw') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.25);
        gain.gain.setValueAtTime(0.1, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
    }
}

function startBGM() {
    if (!audioEnabled || !bgmAudio) return;
    bgmAudio.play().catch(error => {
        console.log("Autoplay musik latar tertahan privasi browser.");
    });
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
        if (bgmAudio) bgmAudio.play().catch(() => {});
    } else {
        btn.innerHTML = '<i class="fas fa-volume-mute"></i>';
        if (bgmAudio) bgmAudio.pause();
    }
}

// ==========================================
// ---      ANIMASI CLICK RIPPLE          ---
// ==========================================
function createRipple(event) {
    const button = event.currentTarget;
    
    // Membuat elemen lingkaran untuk riak air
    const circle = document.createElement("span");
    const diameter = Math.max(button.clientWidth, button.clientHeight);
    const radius = diameter / 2;

    // Mendapatkan posisi klik relatif terhadap tombol
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - radius;
    const y = event.clientY - rect.top - radius;

    circle.style.width = circle.style.height = `${diameter}px`;
    circle.style.left = `${x}px`;
    circle.style.top = `${y}px`;
    circle.style.position = "absolute";
    circle.style.borderRadius = "50%";
    circle.style.transform = "scale(0)";
    circle.style.background = "rgba(0, 210, 255, 0.4)";
    circle.style.pointerEvents = "none";
    circle.style.animation = "rippleEffect 0.5s linear";

    // CSS Animation Injector darurat (jika belum dimasukkan di style.css)
    if (!document.getElementById("ripple-style")) {
        const style = document.createElement("style");
        style.id = "ripple-style";
        style.innerHTML = `
            @keyframes rippleEffect {
                to { transform: scale(2.5); opacity: 0; }
            }
            .btn, .box, .icon-btn, .size-opt, .mode-opt { position: relative; overflow: hidden; }
        `;
        document.head.appendChild(style);
    }

    button.appendChild(circle);

    // Hapus elemen setelah animasi selesai agar memori bersih
    setTimeout(() => circle.remove(), 500);
}

// Memasang trigger riak ke seluruh elemen interaktif yang ada di HTML statis
function bindRippleEvents() {
    const targets = document.querySelectorAll('.btn, .icon-btn, .size-opt, .mode-opt');
    targets.forEach(element => {
        element.addEventListener('click', createRipple);
    });
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
    initAudio(); 
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
    document.getElementById('pick' + s).classList.add('active');
}

// --- GAME LOGIC ---
document.querySelectorAll('.size-opt').forEach(btn => {
    btn.onclick = (e) => {
        createRipple(e);
        playSound('click');
        document.querySelectorAll('.size-opt').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        boardSize = parseInt(btn.dataset.size);
    };
});

document.getElementById('start-game-btn').onclick = (e) => {
    createRipple(e);
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
        b.onclick = (e) => {
            createRipple(e); // Beri efek riak pada kotak papan saat bertarung
            handleMove(i, b);
        };
        board.appendChild(b);
    }
    calcWinPatterns();
};

const handleMove = (idx, el) => {
    if (boardState[idx] !== "" || !gameActive) return;
    
    playSound('click'); 
    let sym = turnX ? "X" : "O";
    boardState[idx] = sym;
    el.innerText = sym;
    
    // Beri warna neon transisi fiksi yang keren saat simbol muncul
    el.style.color = (sym === "X") ? "var(--accent-blue)" : "var(--accent-orange)";
    el.style.textShadow = (sym === "X") ? "0 0 10px rgba(0, 210, 255, 0.6)" : "0 0 10px rgba(249, 115, 22, 0.6)";
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

// --- GAME AI SYSTEM ---
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

// --- PEMENANG UTILS ---
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

// Inisialisasi awal
loadData();
bindRippleEvents();
showScene('main-menu');

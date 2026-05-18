 

let turnX = true; 
let count = 0;
let isVSComputer = false;
let boardSize = 3;
let playerSymbol = "X";
let cpuSymbol = "O";
let gameActive = true;
let boardState = [];
let winPatterns = [];
 

// Mengambil parameter URL dari Telegram
const params = new URLSearchParams(window.location.search);

// Nama Telegram
const telegramName = params.get('name');

// Username Telegram
const telegramUsername = params.get('username');
 

let audioCtx = null;
let bgmAudio = null; 
let audioEnabled = false;

function initAudio() {

    if (audioCtx) return;

    audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    bgmAudio = new Audio('music.mp3');

    bgmAudio.loop = true;

    bgmAudio.volume = 0.05;

    audioEnabled = true;

    startBGM();
}

function playSound(type) {

    if (!audioEnabled || !audioCtx) return;

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

    bgmAudio.play().catch(() => {});
}

function toggleAudio() {

    if (!audioCtx) {

        initAudio();

        document.getElementById('audio-toggle-btn').innerHTML =
            '<i class="fas fa-volume-up"></i>';

        return;
    }

    audioEnabled = !audioEnabled;

    const btn = document.getElementById('audio-toggle-btn');

    if (audioEnabled) {

        btn.innerHTML = '<i class="fas fa-volume-up"></i>';

        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }

        if (bgmAudio) {
            bgmAudio.play().catch(() => {});
        }

    } else {

        btn.innerHTML = '<i class="fas fa-volume-mute"></i>';

        if (bgmAudio) {
            bgmAudio.pause();
        }
    }
}
 

function createRipple(event) {

    const button = event.currentTarget;

    const circle = document.createElement("span");

    const diameter = Math.max(button.clientWidth, button.clientHeight);

    const radius = diameter / 2;

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

    if (!document.getElementById("ripple-style")) {

        const style = document.createElement("style");

        style.id = "ripple-style";

        style.innerHTML = `
            @keyframes rippleEffect {
                to {
                    transform: scale(2.5);
                    opacity: 0;
                }
            }

            .btn,
            .box,
            .icon-btn,
            .size-opt,
            .mode-opt {
                position: relative;
                overflow: hidden;
            }
        `;

        document.head.appendChild(style);
    }

    button.appendChild(circle);

    setTimeout(() => circle.remove(), 500);
}

function bindRippleEvents() {

    const targets = document.querySelectorAll(
        '.btn, .icon-btn, .size-opt, .mode-opt'
    );

    targets.forEach(element => {
        element.addEventListener('click', createRipple);
    });
}
 

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

    let key =
        (sym === playerSymbol)
            ? "score-player"
            : "score-lucas";

    localStorage.setItem(
        key,
        parseInt(localStorage.getItem(key) || 0) + 1
    );

    localStorage.setItem(
        "xp",
        parseInt(localStorage.getItem("xp") || 0) + 50
    );

    loadData();
};

const resetAllData = () => {

    playSound('click');

    if (confirm("Hapus semua progress?")) {

        localStorage.clear();

        location.reload();
    }
};
 

function showScene(id) {

    initAudio();

    playSound('click');

    document
        .querySelectorAll('.scene')
        .forEach(s => s.classList.add('hide'));

    document
        .getElementById(id)
        .classList.remove('hide');
}

function toggleOverlay(id) {

    playSound('click');

    document
        .getElementById(id)
        .classList.toggle('hide');
}

function prepareGame(vsCPU) {

    isVSComputer = vsCPU;

    showScene('setup-menu');
}

function pickSymbol(s) {

    playSound('click');

    playerSymbol = s;

    cpuSymbol = (s === "X") ? "O" : "X";

    document
        .querySelectorAll('.mode-opt')
        .forEach(b => b.classList.remove('active'));

    document
        .getElementById('pick' + s)
        .classList.add('active');
}
 

document.querySelectorAll('.size-opt').forEach(btn => {

    btn.onclick = (e) => {

        createRipple(e);

        playSound('click');

        document
            .querySelectorAll('.size-opt')
            .forEach(b => b.classList.remove('active'));

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

    document
        .getElementById('win-overlay')
        .classList.add('hide');

    generateBoard();

    updateUI();

    if (isVSComputer && cpuSymbol === "X") {
        setTimeout(computerMove, 600);
    }
};

const generateBoard = () => {

    const board = document.getElementById('game-board');

    board.innerHTML = '';

    board.style.gridTemplateColumns =
        `repeat(${boardSize}, 1fr)`;

    for (let i = 0; i < boardSize * boardSize; i++) {

        let b = document.createElement("div");

        b.className = "box";

        b.dataset.index = i;

        b.onclick = (e) => {

            createRipple(e);

            handleMove(i, b);
        };

        board.appendChild(b);
    }

    calcWinPatterns();
};
 

function setupTelegramPlayer() {

    if (telegramName) {

        document.getElementById('user-display').innerText =
            telegramName;

        const avatarPlayer =
            document.querySelector('#panel-P .avatar');

        if (avatarPlayer) {

            avatarPlayer.innerText =
                telegramName.charAt(0).toUpperCase();
        }

        const usernameElement =
            document.getElementById('telegram-username');

        if (usernameElement && telegramUsername) {

            usernameElement.innerText =
                '@' + telegramUsername;
        }

        console.log("Nama Telegram:", telegramName);

        console.log("Username Telegram:", telegramUsername);
    }
}
 

setupTelegramPlayer();

loadData();

bindRippleEvents();

showScene('main-menu');
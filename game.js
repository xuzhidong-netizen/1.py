const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreEl = document.getElementById("score");
const livesEl = document.getElementById("lives");
const timeEl = document.getElementById("time");
const bestScoreEl = document.getElementById("bestScore");
const messageEl = document.getElementById("message");
const startBtn = document.getElementById("startBtn");
const soundBtn = document.getElementById("soundBtn");
const leftBtn = document.getElementById("leftBtn");
const rightBtn = document.getElementById("rightBtn");
const overlayEl = document.getElementById("overlay");
const overlayTitleEl = document.getElementById("overlayTitle");
const overlayTextEl = document.getElementById("overlayText");
const overlayBtn = document.getElementById("overlayBtn");

const BEST_SCORE_KEY = "star-catcher-best-score";
const audioState = {
  enabled: true,
  context: null,
};

const bestScore = {
  value: Number(localStorage.getItem(BEST_SCORE_KEY) || 0),
};

const game = {
  width: canvas.width,
  height: canvas.height,
  running: false,
  score: 0,
  lives: 3,
  timeLeft: 60,
  spawnTimer: 0,
  spawnInterval: 650,
  secondTimer: 0,
  lastFrame: 0,
  items: [],
  player: {
    width: 92,
    height: 22,
    x: canvas.width / 2 - 46,
    y: canvas.height - 48,
    speed: 340,
    moveLeft: false,
    moveRight: false,
  },
};

function showOverlay(title, text, buttonText) {
  overlayTitleEl.textContent = title;
  overlayTextEl.textContent = text;
  overlayBtn.textContent = buttonText;
  overlayEl.classList.add("visible");
}

function hideOverlay() {
  overlayEl.classList.remove("visible");
}

function updateBestScore(nextScore) {
  if (nextScore <= bestScore.value) {
    return false;
  }

  bestScore.value = nextScore;
  localStorage.setItem(BEST_SCORE_KEY, String(bestScore.value));
  return true;
}

function updateHud() {
  scoreEl.textContent = String(game.score);
  livesEl.textContent = String(game.lives);
  timeEl.textContent = String(game.timeLeft);
  bestScoreEl.textContent = String(bestScore.value);
}

function getAudioContext() {
  if (!audioState.enabled) {
    return null;
  }

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  if (!audioState.context) {
    audioState.context = new AudioContextClass();
  }

  if (audioState.context.state === "suspended") {
    audioState.context.resume();
  }

  return audioState.context;
}

function playTone(type, frequency, duration, volume) {
  const context = getAudioContext();
  if (!context) {
    return;
  }

  const oscillator = context.createOscillator();
  const gainNode = context.createGain();
  const startTime = context.currentTime;
  const endTime = startTime + duration;

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  gainNode.gain.setValueAtTime(volume, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, endTime);

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start(startTime);
  oscillator.stop(endTime);
}

function playCatchSound() {
  playTone("triangle", 660, 0.12, 0.05);
}

function playHitSound() {
  playTone("sawtooth", 180, 0.2, 0.06);
}

function playStartSound() {
  playTone("sine", 440, 0.08, 0.04);
  setTimeout(() => playTone("sine", 660, 0.12, 0.04), 80);
}

function setSoundLabel() {
  soundBtn.textContent = `音效：${audioState.enabled ? "开" : "关"}`;
}

function startGame() {
  game.running = true;
  game.score = 0;
  game.lives = 3;
  game.timeLeft = 60;
  game.spawnTimer = 0;
  game.secondTimer = 0;
  game.lastFrame = 0;
  game.items = [];
  game.player.x = canvas.width / 2 - game.player.width / 2;
  messageEl.textContent = "游戏开始，接住星星，躲开炸弹。";
  hideOverlay();
  updateHud();
  playStartSound();
}

function spawnItem() {
  const isBomb = Math.random() < 0.26;
  game.items.push({
    x: 30 + Math.random() * (game.width - 60),
    y: -20,
    radius: isBomb ? 18 : 15,
    speed: 180 + Math.random() * 140 + (60 - game.timeLeft) * 2.2,
    kind: isBomb ? "bomb" : "star",
    drift: (Math.random() - 0.5) * 40,
  });
}

function drawBackground() {
  ctx.clearRect(0, 0, game.width, game.height);
  for (let i = 0; i < 28; i += 1) {
    const x = (i * 53 + 17) % game.width;
    const y = (i * 97 + 23) % game.height;
    ctx.fillStyle = "rgba(255,255,255,0.18)";
    ctx.beginPath();
    ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  const { x, y, width, height } = game.player;
  ctx.fillStyle = "#9ae6b4";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 12);
  ctx.fill();

  ctx.fillStyle = "#d9fff0";
  ctx.beginPath();
  ctx.roundRect(x + 14, y - 8, width - 28, 12, 8);
  ctx.fill();
}

function drawItem(item) {
  if (item.kind === "star") {
    ctx.save();
    ctx.translate(item.x, item.y);
    ctx.fillStyle = "#ffd166";
    ctx.beginPath();
    for (let i = 0; i < 5; i += 1) {
      const outer = i * ((Math.PI * 2) / 5) - Math.PI / 2;
      const inner = outer + Math.PI / 5;
      ctx.lineTo(Math.cos(outer) * item.radius, Math.sin(outer) * item.radius);
      ctx.lineTo(Math.cos(inner) * (item.radius * 0.45), Math.sin(inner) * (item.radius * 0.45));
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  }

  ctx.fillStyle = "#ff5d73";
  ctx.beginPath();
  ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffe6ea";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(item.x - 6, item.y - 6);
  ctx.lineTo(item.x + 6, item.y + 6);
  ctx.moveTo(item.x + 6, item.y - 6);
  ctx.lineTo(item.x - 6, item.y + 6);
  ctx.stroke();
}

function clampPlayer() {
  if (game.player.x < 0) {
    game.player.x = 0;
  }
  if (game.player.x + game.player.width > game.width) {
    game.player.x = game.width - game.player.width;
  }
}

function intersects(item) {
  const nearestX = Math.max(game.player.x, Math.min(item.x, game.player.x + game.player.width));
  const nearestY = Math.max(game.player.y, Math.min(item.y, game.player.y + game.player.height));
  const dx = item.x - nearestX;
  const dy = item.y - nearestY;
  return dx * dx + dy * dy <= item.radius * item.radius;
}

function endGame(reason) {
  game.running = false;
  const isNewRecord = updateBestScore(game.score);
  const resultText = isNewRecord
    ? `${reason}，你打破了最高分，最终得分 ${game.score}。`
    : `${reason}，最终得分 ${game.score}。`;
  messageEl.textContent = `${resultText} 点击“开始游戏”再来一局。`;
  showOverlay(
    isNewRecord ? "新纪录" : "本局结束",
    `${reason}，本局得分 ${game.score}，最高分 ${bestScore.value}。`,
    "再来一局"
  );
  updateHud();
}

function update(delta) {
  if (!game.running) {
    drawScene();
    return;
  }

  if (game.player.moveLeft) {
    game.player.x -= game.player.speed * delta;
  }
  if (game.player.moveRight) {
    game.player.x += game.player.speed * delta;
  }
  clampPlayer();

  game.spawnTimer += delta * 1000;
  game.secondTimer += delta * 1000;

  const pressure = Math.max(280, game.spawnInterval - (60 - game.timeLeft) * 5);
  if (game.spawnTimer >= pressure) {
    spawnItem();
    game.spawnTimer = 0;
  }

  if (game.secondTimer >= 1000) {
    game.timeLeft -= 1;
    game.secondTimer = 0;
    updateHud();
    if (game.timeLeft <= 0) {
      endGame("时间到");
      return;
    }
  }

  game.items = game.items.filter((item) => {
    item.y += item.speed * delta;
    item.x += item.drift * delta;

    if (intersects(item)) {
      if (item.kind === "star") {
        game.score += 10;
        playCatchSound();
      } else {
        game.lives -= 1;
        playHitSound();
      }
      updateBestScore(game.score);
      updateHud();
      if (game.lives <= 0) {
        endGame("生命耗尽");
      }
      return false;
    }

    if (item.y - item.radius > game.height) {
      if (item.kind === "star") {
        game.lives -= 1;
        playHitSound();
        updateHud();
        if (game.lives <= 0) {
          endGame("漏接太多星星");
        }
      }
      return false;
    }

    return true;
  });

  drawScene();
}

function drawScene() {
  drawBackground();
  game.items.forEach(drawItem);
  drawPlayer();
}

function loop(timestamp) {
  const delta = game.lastFrame ? (timestamp - game.lastFrame) / 1000 : 0;
  game.lastFrame = timestamp;
  update(delta);
  requestAnimationFrame(loop);
}

function setMove(direction, value) {
  if (direction === "left") {
    game.player.moveLeft = value;
  }
  if (direction === "right") {
    game.player.moveRight = value;
  }
}

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    setMove("left", true);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    setMove("right", true);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
    setMove("left", false);
  }
  if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
    setMove("right", false);
  }
});

function bindPress(button, direction) {
  const start = (event) => {
    event.preventDefault();
    setMove(direction, true);
  };
  const end = (event) => {
    event.preventDefault();
    setMove(direction, false);
  };

  button.addEventListener("pointerdown", start);
  button.addEventListener("pointerup", end);
  button.addEventListener("pointerleave", end);
  button.addEventListener("pointercancel", end);
}

bindPress(leftBtn, "left");
bindPress(rightBtn, "right");

startBtn.addEventListener("click", startGame);
overlayBtn.addEventListener("click", startGame);
soundBtn.addEventListener("click", () => {
  audioState.enabled = !audioState.enabled;
  setSoundLabel();
});

updateHud();
setSoundLabel();
showOverlay(
  "准备开局",
  "星星加分，炸弹扣命，漏接星星也会损失生命。",
  "立即开始"
);
drawScene();
requestAnimationFrame(loop);

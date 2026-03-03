const gamePanels = document.querySelectorAll("[data-game-panel]");
const gameLinks = document.querySelectorAll("[data-game-link]");
const quickStartBtn = document.getElementById("quickStartBtn");
const randomGameBtn = document.getElementById("randomGameBtn");
const backToHomeBtn = document.getElementById("backToHomeBtn");
const playTitleEl = document.getElementById("playTitle");
const playDescriptionEl = document.getElementById("playDescription");
const playGenreEl = document.getElementById("playGenre");
const playDifficultyEl = document.getElementById("playDifficulty");
const playDurationEl = document.getElementById("playDuration");

const gameModules = {};
const params = new URLSearchParams(window.location.search);

const catalog = {
  star: {
    title: "星落接接乐",
    description: "接住星星、躲开炸弹，60 秒冲分。",
    genre: "动作反应",
    difficulty: "简单上手",
    duration: "1 分钟",
  },
  ddz: {
    title: "斗地主小游戏",
    description: "单机快速局，和两个 AI 对战。",
    genre: "牌类策略",
    difficulty: "中等",
    duration: "3-5 分钟",
  },
  ttt: {
    title: "井字棋",
    description: "经典三连线，适合快速来一局。",
    genre: "轻策略",
    difficulty: "简单",
    duration: "30 秒",
  },
  memory: {
    title: "记忆翻牌",
    description: "翻开相同图案完成配对。",
    genre: "记忆益智",
    difficulty: "中等",
    duration: "2 分钟",
  },
  mole: {
    title: "打地鼠",
    description: "30 秒快打模式，拼手速和眼力。",
    genre: "极限反应",
    difficulty: "刺激",
    duration: "30 秒",
  },
  snake: {
    title: "贪吃蛇",
    description: "吃豆变长，撞墙或撞自己就结束。",
    genre: "经典街机",
    difficulty: "中等",
    duration: "2-4 分钟",
  },
  "2048": {
    title: "2048",
    description: "滑动数字方块，合成更大的数字。",
    genre: "数字益智",
    difficulty: "耐玩",
    duration: "3-8 分钟",
  },
  rps: {
    title: "石头剪刀布",
    description: "三局两胜也行，连续挑战也行。",
    genre: "休闲对抗",
    difficulty: "轻松",
    duration: "10 秒",
  },
  reaction: {
    title: "反应速度测试",
    description: "等信号变绿后立刻点击，测你的真实反应。",
    genre: "测试挑战",
    difficulty: "极简",
    duration: "15 秒",
  },
  breakout: {
    title: "打砖块",
    description: "接住小球，清光砖块就过关。",
    genre: "经典街机",
    difficulty: "中等偏上",
    duration: "2-5 分钟",
  },
};

const orderedGameIds = Object.keys(catalog);
let currentGameId = orderedGameIds.includes(params.get("game")) ? params.get("game") : "star";

function updateHero(gameId) {
  const info = catalog[gameId];
  playTitleEl.textContent = info.title;
  playDescriptionEl.textContent = info.description;
  playGenreEl.textContent = info.genre;
  playDifficultyEl.textContent = info.difficulty;
  playDurationEl.textContent = info.duration;
}

function setRandomLink() {
  const candidates = orderedGameIds.filter((id) => id !== currentGameId);
  const nextId = candidates[Math.floor(Math.random() * candidates.length)];
  randomGameBtn.dataset.targetGame = nextId;
}

function switchGame(gameId) {
  currentGameId = gameId;
  gamePanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.gamePanel === gameId);
  });
  gameLinks.forEach((link) => {
    link.classList.toggle("active", link.dataset.gameLink === gameId);
  });
  updateHero(gameId);
  setRandomLink();
  history.replaceState({}, "", `./play.html?game=${encodeURIComponent(gameId)}`);

  Object.entries(gameModules).forEach(([id, module]) => {
    module.active = id === gameId;
  });
  if (gameModules[gameId] && typeof gameModules[gameId].onActivate === "function") {
    gameModules[gameId].onActivate();
  }
}

function startCurrentGame() {
  const module = gameModules[currentGameId];
  if (module && typeof module.start === "function") {
    module.start();
  }
}

quickStartBtn.addEventListener("click", startCurrentGame);
backToHomeBtn.addEventListener("click", () => {
  window.location.href = "./index.html";
});
randomGameBtn.addEventListener("click", () => {
  const nextId = randomGameBtn.dataset.targetGame;
  if (nextId) {
    switchGame(nextId);
  }
});
gameLinks.forEach((button) => {
  button.addEventListener("click", () => switchGame(button.dataset.gameLink));
});

const starGame = (() => {
  const canvas = document.getElementById("starCanvas");
  const ctx = canvas.getContext("2d");
  const scoreEl = document.getElementById("starScore");
  const livesEl = document.getElementById("starLives");
  const timeEl = document.getElementById("starTime");
  const bestScoreEl = document.getElementById("starBestScore");
  const messageEl = document.getElementById("starMessage");
  const startBtn = document.getElementById("starStartBtn");
  const soundBtn = document.getElementById("starSoundBtn");
  const leftBtn = document.getElementById("starLeftBtn");
  const rightBtn = document.getElementById("starRightBtn");
  const overlayEl = document.getElementById("starOverlay");
  const overlayTitleEl = document.getElementById("starOverlayTitle");
  const overlayTextEl = document.getElementById("starOverlayText");
  const overlayBtn = document.getElementById("starOverlayBtn");

  const bestScoreKey = "star-catcher-best-score";
  const audioState = { enabled: true, context: null };
  const bestScore = { value: Number(localStorage.getItem(bestScoreKey) || 0) };
  const state = {
    active: currentGameId === "star",
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
    localStorage.setItem(bestScoreKey, String(bestScore.value));
    return true;
  }

  function updateHud() {
    scoreEl.textContent = String(state.score);
    livesEl.textContent = String(state.lives);
    timeEl.textContent = String(state.timeLeft);
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
    state.running = true;
    state.score = 0;
    state.lives = 3;
    state.timeLeft = 60;
    state.spawnTimer = 0;
    state.secondTimer = 0;
    state.lastFrame = 0;
    state.items = [];
    state.player.x = canvas.width / 2 - state.player.width / 2;
    messageEl.textContent = "游戏开始，接住星星，躲开炸弹。";
    hideOverlay();
    updateHud();
    playStartSound();
  }

  function spawnItem() {
    const isBomb = Math.random() < 0.26;
    state.items.push({
      x: 30 + Math.random() * (state.width - 60),
      y: -20,
      radius: isBomb ? 18 : 15,
      speed: 180 + Math.random() * 140 + (60 - state.timeLeft) * 2.2,
      kind: isBomb ? "bomb" : "star",
      drift: (Math.random() - 0.5) * 40,
    });
  }

  function drawBackground() {
    ctx.clearRect(0, 0, state.width, state.height);
    for (let i = 0; i < 28; i += 1) {
      const x = (i * 53 + 17) % state.width;
      const y = (i * 97 + 23) % state.height;
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      ctx.beginPath();
      ctx.arc(x, y, (i % 3) + 1, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawPlayer() {
    const { x, y, width, height } = state.player;
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
        ctx.lineTo(
          Math.cos(inner) * (item.radius * 0.45),
          Math.sin(inner) * (item.radius * 0.45)
        );
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
    if (state.player.x < 0) {
      state.player.x = 0;
    }
    if (state.player.x + state.player.width > state.width) {
      state.player.x = state.width - state.player.width;
    }
  }

  function intersects(item) {
    const nearestX = Math.max(state.player.x, Math.min(item.x, state.player.x + state.player.width));
    const nearestY = Math.max(state.player.y, Math.min(item.y, state.player.y + state.player.height));
    const dx = item.x - nearestX;
    const dy = item.y - nearestY;
    return dx * dx + dy * dy <= item.radius * item.radius;
  }

  function endGame(reason) {
    state.running = false;
    const isNewRecord = updateBestScore(state.score);
    const resultText = isNewRecord
      ? `${reason}，你打破了最高分，最终得分 ${state.score}。`
      : `${reason}，最终得分 ${state.score}。`;
    messageEl.textContent = `${resultText} 点击“开始游戏”再来一局。`;
    showOverlay(
      isNewRecord ? "新纪录" : "本局结束",
      `${reason}，本局得分 ${state.score}，最高分 ${bestScore.value}。`,
      "再来一局"
    );
    updateHud();
  }

  function drawScene() {
    drawBackground();
    state.items.forEach(drawItem);
    drawPlayer();
  }

  function update(delta) {
    if (!state.running) {
      drawScene();
      return;
    }

    if (state.player.moveLeft) {
      state.player.x -= state.player.speed * delta;
    }
    if (state.player.moveRight) {
      state.player.x += state.player.speed * delta;
    }
    clampPlayer();

    state.spawnTimer += delta * 1000;
    state.secondTimer += delta * 1000;

    const pressure = Math.max(280, state.spawnInterval - (60 - state.timeLeft) * 5);
    if (state.spawnTimer >= pressure) {
      spawnItem();
      state.spawnTimer = 0;
    }

    if (state.secondTimer >= 1000) {
      state.timeLeft -= 1;
      state.secondTimer = 0;
      updateHud();
      if (state.timeLeft <= 0) {
        endGame("时间到");
        return;
      }
    }

    state.items = state.items.filter((item) => {
      item.y += item.speed * delta;
      item.x += item.drift * delta;

      if (intersects(item)) {
        if (item.kind === "star") {
          state.score += 10;
          playCatchSound();
        } else {
          state.lives -= 1;
          playHitSound();
        }
        updateBestScore(state.score);
        updateHud();
        if (state.lives <= 0) {
          endGame("生命耗尽");
        }
        return false;
      }

      if (item.y - item.radius > state.height) {
        if (item.kind === "star") {
          state.lives -= 1;
          playHitSound();
          updateHud();
          if (state.lives <= 0) {
            endGame("漏接太多星星");
          }
        }
        return false;
      }

      return true;
    });
    drawScene();
  }

  function loop(timestamp) {
    const delta = state.lastFrame ? (timestamp - state.lastFrame) / 1000 : 0;
    state.lastFrame = timestamp;
    if (state.active) {
      update(delta);
    } else {
      drawScene();
    }
    requestAnimationFrame(loop);
  }

  function setMove(direction, value) {
    if (direction === "left") {
      state.player.moveLeft = value;
    }
    if (direction === "right") {
      state.player.moveRight = value;
    }
  }

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

  window.addEventListener("keydown", (event) => {
    if (!state.active) {
      return;
    }
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      setMove("left", true);
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      setMove("right", true);
    }
  });

  window.addEventListener("keyup", (event) => {
    if (!state.active) {
      return;
    }
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
      setMove("left", false);
    }
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") {
      setMove("right", false);
    }
  });

  startBtn.addEventListener("click", startGame);
  overlayBtn.addEventListener("click", startGame);
  soundBtn.addEventListener("click", () => {
    audioState.enabled = !audioState.enabled;
    setSoundLabel();
  });
  bindPress(leftBtn, "left");
  bindPress(rightBtn, "right");
  updateHud();
  setSoundLabel();
  showOverlay("准备开局", "星星加分，炸弹扣命，漏接星星也会损失生命。", "立即开始");
  drawScene();
  requestAnimationFrame(loop);
  state.start = startGame;
  return state;
})();
gameModules.star = starGame;

const douDiZhu = (() => {
  const phaseEl = document.getElementById("ddzPhase");
  const landlordEl = document.getElementById("ddzLandlord");
  const lastPlayEl = document.getElementById("ddzLastPlay");
  const messageEl = document.getElementById("ddzMessage");
  const leftCountEl = document.getElementById("ddzLeftCount");
  const rightCountEl = document.getElementById("ddzRightCount");
  const leftCardsEl = document.getElementById("ddzLeftCards");
  const rightCardsEl = document.getElementById("ddzRightCards");
  const leftActionEl = document.getElementById("ddzLeftAction");
  const rightActionEl = document.getElementById("ddzRightAction");
  const bottomCardsEl = document.getElementById("ddzBottomCards");
  const comboEl = document.getElementById("ddzCurrentCombo");
  const handEl = document.getElementById("ddzHand");
  const roleEl = document.getElementById("ddzRole");
  const restartBtn = document.getElementById("ddzRestartBtn");
  const callBtn = document.getElementById("ddzCallBtn");
  const passCallBtn = document.getElementById("ddzPassCallBtn");
  const playBtn = document.getElementById("ddzPlayBtn");
  const passBtn = document.getElementById("ddzPassBtn");
  const hintBtn = document.getElementById("ddzHintBtn");

  const rankLabels = {
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
    15: "2",
    16: "小王",
    17: "大王",
  };
  const suits = ["♠", "♥", "♣", "♦"];
  const state = {
    active: currentGameId === "ddz",
    phase: "bidding",
    players: [],
    bottomCards: [],
    selectedIds: new Set(),
    landlordId: null,
    currentPlayerIndex: 0,
    bidStarterIndex: 0,
    bidCursor: 0,
    lastCombo: null,
    lastPlayerIndex: -1,
    passStreak: 0,
    aiTimer: null,
  };

  function createDeck() {
    let uid = 0;
    const deck = [];
    for (let rank = 3; rank <= 15; rank += 1) {
      suits.forEach((suit) => {
        deck.push({ id: `c${uid += 1}`, rank, suit });
      });
    }
    deck.push({ id: `c${uid += 1}`, rank: 16, suit: "J" });
    deck.push({ id: `c${uid += 1}`, rank: 17, suit: "J" });
    return deck;
  }

  function shuffle(array) {
    const next = [...array];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function sortCards(cards) {
    cards.sort((a, b) => a.rank - b.rank || a.id.localeCompare(b.id));
  }

  function getPlayer(id) {
    return state.players.find((player) => player.id === id);
  }

  function getCurrentPlayer() {
    return state.players[state.currentPlayerIndex];
  }

  function evaluateHandStrength(cards) {
    const counts = {};
    let score = 0;
    cards.forEach((card) => {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
      score += card.rank;
    });
    Object.entries(counts).forEach(([rank, count]) => {
      const numericRank = Number(rank);
      if (count >= 2) {
        score += numericRank * count;
      }
      if (count === 4) {
        score += 20;
      }
    });
    if (counts[16] && counts[17]) {
      score += 30;
    }
    return score;
  }

  function classifyCards(cards) {
    if (cards.length === 0) {
      return null;
    }
    const sorted = [...cards].sort((a, b) => a.rank - b.rank);
    const counts = {};
    sorted.forEach((card) => {
      counts[card.rank] = (counts[card.rank] || 0) + 1;
    });
    const ranks = Object.keys(counts).map(Number);
    if (sorted.length === 2 && ranks.includes(16) && ranks.includes(17)) {
      return { type: "rocket", rank: 17, cards: sorted, label: "王炸" };
    }
    if (ranks.length !== 1) {
      return null;
    }
    const rank = ranks[0];
    const count = sorted.length;
    if (count === 1) return { type: "single", rank, cards: sorted, label: `单张 ${rankLabels[rank]}` };
    if (count === 2) return { type: "pair", rank, cards: sorted, label: `对子 ${rankLabels[rank]}` };
    if (count === 3) return { type: "triple", rank, cards: sorted, label: `三张 ${rankLabels[rank]}` };
    if (count === 4) return { type: "bomb", rank, cards: sorted, label: `炸弹 ${rankLabels[rank]}` };
    return null;
  }

  function canBeat(candidate, target) {
    if (!candidate) return false;
    if (!target) return true;
    if (candidate.type === "rocket") return true;
    if (target.type === "rocket") return false;
    if (candidate.type === "bomb" && target.type !== "bomb") return true;
    if (candidate.type !== target.type) return false;
    return candidate.rank > target.rank;
  }

  function allPlayableCombos(hand) {
    const combos = [];
    const groups = new Map();
    hand.forEach((card) => {
      if (!groups.has(card.rank)) groups.set(card.rank, []);
      groups.get(card.rank).push(card);
    });
    groups.forEach((cards, rank) => {
      combos.push({ type: "single", rank, cards: cards.slice(0, 1), label: `单张 ${rankLabels[rank]}` });
      if (cards.length >= 2) combos.push({ type: "pair", rank, cards: cards.slice(0, 2), label: `对子 ${rankLabels[rank]}` });
      if (cards.length >= 3) combos.push({ type: "triple", rank, cards: cards.slice(0, 3), label: `三张 ${rankLabels[rank]}` });
      if (cards.length === 4) combos.push({ type: "bomb", rank, cards: cards.slice(0, 4), label: `炸弹 ${rankLabels[rank]}` });
    });
    if (groups.has(16) && groups.has(17)) {
      combos.push({ type: "rocket", rank: 17, cards: [groups.get(16)[0], groups.get(17)[0]], label: "王炸" });
    }
    combos.sort((a, b) => {
      const weight = { single: 1, pair: 2, triple: 3, bomb: 4, rocket: 5 };
      return weight[a.type] - weight[b.type] || a.rank - b.rank;
    });
    return combos;
  }

  function updateButtons() {
    const isHumanTurn = state.phase === "playing" && getCurrentPlayer().id === "human";
    const isHumanBid = state.phase === "bidding" && state.players[state.bidCursor].id === "human";
    callBtn.disabled = !isHumanBid;
    passCallBtn.disabled = !isHumanBid;
    playBtn.disabled = !isHumanTurn;
    hintBtn.disabled = !isHumanTurn;
    passBtn.disabled = !(isHumanTurn && state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex);
  }

  function renderCard(card, { selectable = false, selected = false, tiny = false } = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card${card.suit === "♥" || card.suit === "♦" || card.rank >= 16 ? " red" : ""}${selected ? " selected" : ""}${tiny ? " tiny" : ""}`;
    button.innerHTML = `<strong>${rankLabels[card.rank]}</strong><small>${card.rank >= 16 ? "王" : card.suit}</small>`;
    if (!selectable) {
      button.disabled = true;
    }
    return button;
  }

  function renderBackCards(container, count, isTurn) {
    container.innerHTML = "";
    container.parentElement.classList.toggle("is-turn", isTurn);
    for (let i = 0; i < count; i += 1) {
      const card = document.createElement("div");
      card.className = "card-back tiny";
      container.appendChild(card);
    }
  }

  function renderHand() {
    const human = getPlayer("human");
    handEl.innerHTML = "";
    human.hand.forEach((card) => {
      const selected = state.selectedIds.has(card.id);
      const cardEl = renderCard(card, { selectable: true, selected });
      cardEl.addEventListener("click", () => {
        if (state.phase !== "playing" || getCurrentPlayer().id !== "human") return;
        if (selected) state.selectedIds.delete(card.id);
        else state.selectedIds.add(card.id);
        renderHand();
      });
      handEl.appendChild(cardEl);
    });
  }

  function renderBottomCards() {
    bottomCardsEl.innerHTML = "";
    state.bottomCards.forEach((card) => {
      bottomCardsEl.appendChild(renderCard(card, { tiny: true }));
    });
  }

  function renderStatus() {
    const human = getPlayer("human");
    const left = getPlayer("left");
    const right = getPlayer("right");
    phaseEl.textContent = state.phase === "bidding" ? "叫地主" : state.phase === "playing" ? "出牌中" : "已结束";
    landlordEl.textContent = state.landlordId ? getPlayer(state.landlordId).name : "待定";
    lastPlayEl.textContent = state.lastCombo ? state.lastCombo.label : "暂无";
    comboEl.textContent = state.lastCombo ? `${getPlayer(state.lastCombo.playerId).name} 出了 ${state.lastCombo.label}` : "暂无";
    leftCountEl.textContent = `${left.hand.length} 张`;
    rightCountEl.textContent = `${right.hand.length} 张`;
    roleEl.textContent = state.landlordId === "human" ? "地主" : "农民";
    renderBackCards(leftCardsEl, left.hand.length, getCurrentPlayer().id === "left");
    renderBackCards(rightCardsEl, right.hand.length, getCurrentPlayer().id === "right");
    renderBottomCards();
    renderHand();
    updateButtons();
  }

  function renderActions() {
    const left = getPlayer("left");
    const right = getPlayer("right");
    leftActionEl.textContent = left.lastAction || "等待发牌";
    rightActionEl.textContent = right.lastAction || "等待发牌";
  }

  function renderAll() {
    renderStatus();
    renderActions();
  }

  function nextPlayer() {
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length;
    renderAll();
    queueAiTurnIfNeeded();
  }

  function removeCardsFromHand(player, cards) {
    const ids = new Set(cards.map((card) => card.id));
    player.hand = player.hand.filter((card) => !ids.has(card.id));
  }

  function endRound(winner) {
    state.phase = "ended";
    clearTimeout(state.aiTimer);
    messageEl.textContent = winner.id === "human" ? "你赢了这一局。" : `${winner.name} 获胜，再开一局继续。`;
    renderAll();
  }

  function applyPlay(player, combo) {
    removeCardsFromHand(player, combo.cards);
    player.lastAction = `出了 ${combo.label}`;
    state.lastCombo = { ...combo, playerId: player.id };
    state.lastPlayerIndex = state.currentPlayerIndex;
    state.passStreak = 0;
    state.selectedIds.clear();
    if (player.hand.length === 0) {
      endRound(player);
      return;
    }
    messageEl.textContent = `${player.name} 出了 ${combo.label}。`;
    nextPlayer();
  }

  function handlePass(player) {
    player.lastAction = "不出";
    state.passStreak += 1;
    messageEl.textContent = `${player.name} 选择不出。`;
    if (state.passStreak >= 2) {
      const lastWinner = state.players[state.lastPlayerIndex];
      state.currentPlayerIndex = state.lastPlayerIndex;
      state.lastCombo = null;
      state.passStreak = 0;
      state.players.forEach((item) => {
        item.lastAction = item.id === lastWinner.id ? "重新领出" : item.lastAction;
      });
      renderAll();
      queueAiTurnIfNeeded();
      return;
    }
    nextPlayer();
  }

  function findHint() {
    const human = getPlayer("human");
    const combos = allPlayableCombos(human.hand);
    const target = state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex ? state.lastCombo : null;
    const candidate = combos.find((combo) => canBeat(combo, target));
    if (!candidate) {
      messageEl.textContent = "这手没有能压过的牌。";
      return;
    }
    state.selectedIds = new Set(candidate.cards.map((card) => card.id));
    renderHand();
  }

  function chooseAiBid(player) {
    return evaluateHandStrength(player.hand) >= 185;
  }

  function assignLandlord(player) {
    state.landlordId = player.id;
    player.hand.push(...state.bottomCards);
    sortCards(player.hand);
    state.phase = "playing";
    state.currentPlayerIndex = state.players.findIndex((item) => item.id === player.id);
    player.role = "landlord";
    state.players.forEach((item) => {
      if (item.id !== player.id) item.role = "farmer";
    });
    messageEl.textContent = `${player.name} 成为地主，开始出牌。`;
    renderAll();
    queueAiTurnIfNeeded();
  }

  function stepBidding() {
    if (state.phase !== "bidding") return;
    if (state.bidCursor >= state.players.length) {
      messageEl.textContent = "这一轮没人叫地主，系统重新发牌。";
      renderAll();
      state.aiTimer = setTimeout(startRound, 700);
      return;
    }
    const player = state.players[state.bidCursor];
    if (player.id === "human") {
      messageEl.textContent = "轮到你叫地主，可以选择叫地主或不叫。";
      updateButtons();
      return;
    }
    const willCall = chooseAiBid(player);
    player.lastAction = willCall ? "叫地主" : "不叫";
    renderActions();
    if (willCall) {
      assignLandlord(player);
      return;
    }
    state.bidCursor += 1;
    renderAll();
    stepBidding();
  }

  function startRound() {
    clearTimeout(state.aiTimer);
    const deck = shuffle(createDeck());
    state.phase = "bidding";
    state.bottomCards = deck.slice(-3);
    state.selectedIds.clear();
    state.landlordId = null;
    state.lastCombo = null;
    state.lastPlayerIndex = -1;
    state.passStreak = 0;
    state.players = [
      { id: "left", name: "左侧 AI", hand: deck.slice(0, 17), role: "farmer", lastAction: "等待叫地主" },
      { id: "human", name: "你", hand: deck.slice(17, 34), role: "farmer", lastAction: "等待叫地主" },
      { id: "right", name: "右侧 AI", hand: deck.slice(34, 51), role: "farmer", lastAction: "等待叫地主" },
    ];
    state.players.forEach((player) => sortCards(player.hand));
    state.bidStarterIndex = Math.floor(Math.random() * state.players.length);
    state.players = [...state.players.slice(state.bidStarterIndex), ...state.players.slice(0, state.bidStarterIndex)];
    state.bidCursor = 0;
    state.currentPlayerIndex = 0;
    messageEl.textContent = "新一局开始，进入叫地主阶段。";
    renderAll();
    stepBidding();
  }

  function chooseAiCombo(player) {
    const combos = allPlayableCombos(player.hand);
    const target = state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex ? state.lastCombo : null;
    if (!target) {
      return combos.find((combo) => combo.type !== "bomb" && combo.type !== "rocket") || combos[0];
    }
    return combos.find((combo) => canBeat(combo, target)) || null;
  }

  function takeAiTurn() {
    if (state.phase !== "playing") return;
    const player = getCurrentPlayer();
    if (player.id === "human") {
      updateButtons();
      return;
    }
    const combo = chooseAiCombo(player);
    if (combo) applyPlay(player, combo);
    else handlePass(player);
  }

  function queueAiTurnIfNeeded() {
    clearTimeout(state.aiTimer);
    if (!state.active || state.phase !== "playing") return;
    if (getCurrentPlayer().id === "human") {
      updateButtons();
      return;
    }
    state.aiTimer = setTimeout(takeAiTurn, 700);
  }

  callBtn.addEventListener("click", () => {
    if (state.phase !== "bidding" || state.players[state.bidCursor].id !== "human") return;
    getPlayer("human").lastAction = "叫地主";
    assignLandlord(getPlayer("human"));
  });
  passCallBtn.addEventListener("click", () => {
    if (state.phase !== "bidding" || state.players[state.bidCursor].id !== "human") return;
    getPlayer("human").lastAction = "不叫";
    state.bidCursor += 1;
    renderAll();
    stepBidding();
  });
  playBtn.addEventListener("click", () => {
    if (state.phase !== "playing" || getCurrentPlayer().id !== "human") return;
    const human = getPlayer("human");
    const selectedCards = human.hand.filter((card) => state.selectedIds.has(card.id));
    const combo = classifyCards(selectedCards);
    if (!combo) {
      messageEl.textContent = "当前只支持单张、对子、三张、炸弹和王炸。";
      return;
    }
    const target = state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex ? state.lastCombo : null;
    if (!canBeat(combo, target)) {
      messageEl.textContent = target ? "这手牌压不过当前桌面牌。" : "当前不能这样出牌。";
      return;
    }
    applyPlay(human, combo);
  });
  passBtn.addEventListener("click", () => {
    if (state.phase !== "playing" || getCurrentPlayer().id !== "human") return;
    if (!state.lastCombo || state.lastPlayerIndex === state.currentPlayerIndex) return;
    handlePass(getPlayer("human"));
  });
  hintBtn.addEventListener("click", findHint);
  restartBtn.addEventListener("click", startRound);
  startRound();
  state.onActivate = queueAiTurnIfNeeded;
  state.start = startRound;
  return state;
})();
gameModules.ddz = douDiZhu;

const ticTacToe = (() => {
  const boardEl = document.getElementById("tttBoard");
  const turnEl = document.getElementById("tttTurn");
  const scoreEl = document.getElementById("tttScore");
  const messageEl = document.getElementById("tttMessage");
  const restartBtn = document.getElementById("tttRestartBtn");
  const state = {
    active: currentGameId === "ttt",
    board: Array(9).fill(""),
    turn: "human",
    locked: false,
    scores: { human: 0, ai: 0 },
  };
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ];

  function winner(board) {
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a];
    }
    return board.every(Boolean) ? "draw" : null;
  }

  function updateHud() {
    turnEl.textContent = state.turn === "human" ? "你" : "电脑";
    scoreEl.textContent = `${state.scores.human} : ${state.scores.ai}`;
  }

  function render() {
    boardEl.innerHTML = "";
    state.board.forEach((cell, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ttt-cell";
      button.textContent = cell;
      button.disabled = Boolean(cell) || state.locked || state.turn !== "human";
      button.addEventListener("click", () => handleHumanMove(index));
      boardEl.appendChild(button);
    });
    updateHud();
  }

  function chooseAiMove() {
    const order = [4, 0, 2, 6, 8, 1, 3, 5, 7];
    for (const mark of ["O", "X"]) {
      for (const [a, b, c] of lines) {
        const line = [state.board[a], state.board[b], state.board[c]];
        const count = line.filter((item) => item === mark).length;
        const empty = [a, b, c].find((position) => state.board[position] === "");
        if (count === 2 && empty !== undefined) return empty;
      }
    }
    return order.find((index) => !state.board[index]);
  }

  function finishRound(result) {
    state.locked = true;
    if (result === "X") {
      state.scores.human += 1;
      messageEl.textContent = "你赢了这一局。";
    } else if (result === "O") {
      state.scores.ai += 1;
      messageEl.textContent = "电脑赢了这一局。";
    } else {
      messageEl.textContent = "平局，再来一局。";
    }
    updateHud();
  }

  function afterMove() {
    const result = winner(state.board);
    if (result) {
      finishRound(result);
      render();
      return true;
    }
    return false;
  }

  function handleHumanMove(index) {
    if (state.board[index] || state.locked || state.turn !== "human") return;
    state.board[index] = "X";
    if (afterMove()) return;
    state.turn = "ai";
    messageEl.textContent = "电脑思考中。";
    render();
    setTimeout(() => {
      const move = chooseAiMove();
      if (move === undefined) return;
      state.board[move] = "O";
      if (afterMove()) return;
      state.turn = "human";
      messageEl.textContent = "轮到你落子。";
      render();
    }, 320);
  }

  function resetRound() {
    state.board = Array(9).fill("");
    state.turn = "human";
    state.locked = false;
    messageEl.textContent = "你使用 X，电脑使用 O。";
    render();
  }

  restartBtn.addEventListener("click", resetRound);
  resetRound();
  state.start = resetRound;
  return state;
})();
gameModules.ttt = ticTacToe;

const memoryGame = (() => {
  const gridEl = document.getElementById("memoryGrid");
  const movesEl = document.getElementById("memoryMoves");
  const pairsEl = document.getElementById("memoryPairs");
  const bestEl = document.getElementById("memoryBest");
  const messageEl = document.getElementById("memoryMessage");
  const restartBtn = document.getElementById("memoryRestartBtn");
  const bestKey = "memory-best-moves";
  const state = {
    active: currentGameId === "memory",
    cards: [],
    opened: [],
    locked: false,
    moves: 0,
    matches: 0,
    best: Number(localStorage.getItem(bestKey) || 0),
  };
  const symbols = ["🍎", "🍊", "🍉", "🍇", "🥝", "🍓", "🍒", "🥥"];

  function shuffle(array) {
    const next = [...array];
    for (let i = next.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [next[i], next[j]] = [next[j], next[i]];
    }
    return next;
  }

  function updateHud() {
    movesEl.textContent = String(state.moves);
    pairsEl.textContent = `${state.matches} / 8`;
    bestEl.textContent = state.best ? String(state.best) : "-";
  }

  function render() {
    gridEl.innerHTML = "";
    state.cards.forEach((card, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `memory-card${card.revealed ? " revealed" : ""}${card.matched ? " matched" : ""}`;
      button.textContent = card.revealed || card.matched ? card.symbol : "";
      button.disabled = card.matched || card.revealed || state.locked;
      button.addEventListener("click", () => flipCard(index));
      gridEl.appendChild(button);
    });
    updateHud();
  }

  function finishIfNeeded() {
    if (state.matches !== 8) return;
    messageEl.textContent = `完成配对，共用了 ${state.moves} 步。`;
    if (!state.best || state.moves < state.best) {
      state.best = state.moves;
      localStorage.setItem(bestKey, String(state.best));
      messageEl.textContent = `新纪录，只用了 ${state.moves} 步。`;
    }
    updateHud();
  }

  function flipCard(index) {
    const card = state.cards[index];
    if (card.revealed || card.matched || state.locked) return;
    card.revealed = true;
    state.opened.push(index);
    render();
    if (state.opened.length < 2) return;
    state.moves += 1;
    const [firstIndex, secondIndex] = state.opened;
    const first = state.cards[firstIndex];
    const second = state.cards[secondIndex];
    if (first.symbol === second.symbol) {
      first.matched = true;
      second.matched = true;
      state.matches += 1;
      state.opened = [];
      messageEl.textContent = "配对成功。";
      render();
      finishIfNeeded();
      return;
    }
    state.locked = true;
    messageEl.textContent = "没配对上，再试一次。";
    setTimeout(() => {
      first.revealed = false;
      second.revealed = false;
      state.opened = [];
      state.locked = false;
      render();
    }, 650);
  }

  function reset() {
    state.cards = shuffle([...symbols, ...symbols]).map((symbol, index) => ({
      id: `m${index}`,
      symbol,
      revealed: false,
      matched: false,
    }));
    state.opened = [];
    state.locked = false;
    state.moves = 0;
    state.matches = 0;
    messageEl.textContent = "翻开两张相同卡片即可配对。";
    render();
  }

  restartBtn.addEventListener("click", reset);
  reset();
  state.start = reset;
  return state;
})();
gameModules.memory = memoryGame;

const moleGame = (() => {
  const gridEl = document.getElementById("moleGrid");
  const scoreEl = document.getElementById("moleScore");
  const timeEl = document.getElementById("moleTime");
  const bestEl = document.getElementById("moleBest");
  const messageEl = document.getElementById("moleMessage");
  const startBtn = document.getElementById("moleStartBtn");
  const bestKey = "mole-best-score";
  const state = {
    active: currentGameId === "mole",
    running: false,
    score: 0,
    timeLeft: 30,
    best: Number(localStorage.getItem(bestKey) || 0),
    activeHole: -1,
    tickTimer: null,
    spawnTimer: null,
    hideTimer: null,
  };

  function updateHud() {
    scoreEl.textContent = String(state.score);
    timeEl.textContent = String(state.timeLeft);
    bestEl.textContent = String(state.best);
  }

  function render() {
    gridEl.innerHTML = "";
    for (let i = 0; i < 9; i += 1) {
      const hole = document.createElement("div");
      hole.className = "mole-hole";
      const button = document.createElement("button");
      button.type = "button";
      button.className = `mole-btn${state.activeHole === i ? " active" : ""}`;
      button.textContent = "🐹";
      button.addEventListener("click", () => {
        if (!state.running || state.activeHole !== i) return;
        state.score += 1;
        state.activeHole = -1;
        messageEl.textContent = "命中。";
        updateHud();
        render();
      });
      hole.appendChild(button);
      gridEl.appendChild(hole);
    }
  }

  function stopGame() {
    state.running = false;
    clearInterval(state.tickTimer);
    clearInterval(state.spawnTimer);
    clearTimeout(state.hideTimer);
    state.activeHole = -1;
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(bestKey, String(state.best));
    }
    messageEl.textContent = `时间到，本局得分 ${state.score}。`;
    updateHud();
    render();
  }

  function startGame() {
    clearInterval(state.tickTimer);
    clearInterval(state.spawnTimer);
    clearTimeout(state.hideTimer);
    state.running = true;
    state.score = 0;
    state.timeLeft = 30;
    state.activeHole = -1;
    messageEl.textContent = "开始打地鼠。";
    updateHud();
    render();
    state.tickTimer = setInterval(() => {
      state.timeLeft -= 1;
      updateHud();
      if (state.timeLeft <= 0) stopGame();
    }, 1000);
    state.spawnTimer = setInterval(() => {
      state.activeHole = Math.floor(Math.random() * 9);
      render();
      clearTimeout(state.hideTimer);
      state.hideTimer = setTimeout(() => {
        state.activeHole = -1;
        render();
      }, 650);
    }, 900);
  }

  startBtn.addEventListener("click", startGame);
  updateHud();
  render();
  state.start = startGame;
  return state;
})();
gameModules.mole = moleGame;

const snakeGame = (() => {
  const canvas = document.getElementById("snakeCanvas");
  const ctx = canvas.getContext("2d");
  const startBtn = document.getElementById("snakeStartBtn");
  const scoreEl = document.getElementById("snakeScore");
  const speedEl = document.getElementById("snakeSpeed");
  const bestEl = document.getElementById("snakeBest");
  const messageEl = document.getElementById("snakeMessage");
  const bestKey = "snake-best-length";
  const size = 20;
  const cell = canvas.width / size;
  const state = {
    active: currentGameId === "snake",
    running: false,
    snake: [{ x: 10, y: 10 }],
    direction: { x: 1, y: 0 },
    nextDirection: { x: 1, y: 0 },
    food: { x: 15, y: 10 },
    tickMs: 180,
    timer: null,
    best: Number(localStorage.getItem(bestKey) || 1),
  };

  function randomFood() {
    let next;
    do {
      next = { x: Math.floor(Math.random() * size), y: Math.floor(Math.random() * size) };
    } while (state.snake.some((item) => item.x === next.x && item.y === next.y));
    return next;
  }

  function updateHud() {
    scoreEl.textContent = String(state.snake.length);
    speedEl.textContent = `${Math.max(1, Math.round((220 - state.tickMs) / 20))}x`;
    bestEl.textContent = String(state.best);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1a2d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    for (let i = 0; i < size; i += 1) {
      ctx.beginPath();
      ctx.moveTo(i * cell, 0);
      ctx.lineTo(i * cell, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cell);
      ctx.lineTo(canvas.width, i * cell);
      ctx.stroke();
    }
    ctx.fillStyle = "#ff6d83";
    ctx.beginPath();
    ctx.arc(state.food.x * cell + cell / 2, state.food.y * cell + cell / 2, cell * 0.32, 0, Math.PI * 2);
    ctx.fill();
    state.snake.forEach((item, index) => {
      ctx.fillStyle = index === 0 ? "#7ef0b2" : "#c8ffe6";
      ctx.fillRect(item.x * cell + 2, item.y * cell + 2, cell - 4, cell - 4);
    });
  }

  function stop(reason) {
    state.running = false;
    clearTimeout(state.timer);
    if (state.snake.length > state.best) {
      state.best = state.snake.length;
      localStorage.setItem(bestKey, String(state.best));
    }
    messageEl.textContent = `${reason} 本局长度 ${state.snake.length}。按“开始贪吃蛇”再来一局。`;
    updateHud();
  }

  function step() {
    if (!state.running) {
      draw();
      return;
    }
    state.direction = { ...state.nextDirection };
    const head = {
      x: state.snake[0].x + state.direction.x,
      y: state.snake[0].y + state.direction.y,
    };
    if (head.x < 0 || head.y < 0 || head.x >= size || head.y >= size || state.snake.some((item) => item.x === head.x && item.y === head.y)) {
      stop("撞到了");
      draw();
      return;
    }
    state.snake.unshift(head);
    if (head.x === state.food.x && head.y === state.food.y) {
      state.food = randomFood();
      state.tickMs = Math.max(80, state.tickMs - 6);
      messageEl.textContent = "吃到了，速度提高。";
    } else {
      state.snake.pop();
    }
    updateHud();
    draw();
    state.timer = setTimeout(step, state.tickMs);
  }

  function start() {
    clearTimeout(state.timer);
    state.running = true;
    state.snake = [{ x: 10, y: 10 }];
    state.direction = { x: 1, y: 0 };
    state.nextDirection = { x: 1, y: 0 };
    state.food = randomFood();
    state.tickMs = 180;
    messageEl.textContent = "方向键控制贪吃蛇。";
    updateHud();
    draw();
    state.timer = setTimeout(step, state.tickMs);
  }

  window.addEventListener("keydown", (event) => {
    if (!state.active) return;
    const map = {
      ArrowUp: { x: 0, y: -1 },
      ArrowDown: { x: 0, y: 1 },
      ArrowLeft: { x: -1, y: 0 },
      ArrowRight: { x: 1, y: 0 },
    };
    const next = map[event.key];
    if (!next) return;
    if (state.direction.x + next.x === 0 && state.direction.y + next.y === 0) return;
    state.nextDirection = next;
  });

  startBtn.addEventListener("click", start);
  updateHud();
  draw();
  state.start = start;
  return state;
})();
gameModules.snake = snakeGame;

const game2048 = (() => {
  const gridEl = document.getElementById("g2048Grid");
  const scoreEl = document.getElementById("g2048Score");
  const maxEl = document.getElementById("g2048Max");
  const bestEl = document.getElementById("g2048Best");
  const messageEl = document.getElementById("g2048Message");
  const restartBtn = document.getElementById("g2048RestartBtn");
  const bestKey = "2048-best-score";
  const state = {
    active: currentGameId === "2048",
    grid: Array(16).fill(0),
    score: 0,
    best: Number(localStorage.getItem(bestKey) || 0),
  };

  function emptyIndices() {
    return state.grid.map((value, index) => (value === 0 ? index : -1)).filter((item) => item >= 0);
  }

  function spawn() {
    const empties = emptyIndices();
    if (!empties.length) return;
    const index = empties[Math.floor(Math.random() * empties.length)];
    state.grid[index] = Math.random() < 0.9 ? 2 : 4;
  }

  function updateHud() {
    scoreEl.textContent = String(state.score);
    maxEl.textContent = String(Math.max(...state.grid));
    bestEl.textContent = String(state.best);
  }

  function render() {
    gridEl.innerHTML = "";
    state.grid.forEach((value) => {
      const cellEl = document.createElement("div");
      cellEl.className = `g2048-cell${value ? " filled" : ""}`;
      cellEl.textContent = value ? String(value) : "";
      gridEl.appendChild(cellEl);
    });
    updateHud();
  }

  function mergeLine(line) {
    const compact = line.filter(Boolean);
    const merged = [];
    for (let i = 0; i < compact.length; i += 1) {
      if (compact[i] && compact[i] === compact[i + 1]) {
        const next = compact[i] * 2;
        merged.push(next);
        state.score += next;
        i += 1;
      } else {
        merged.push(compact[i]);
      }
    }
    while (merged.length < 4) merged.push(0);
    return merged;
  }

  function move(direction) {
    const before = [...state.grid];
    const next = Array(16).fill(0);

    for (let i = 0; i < 4; i += 1) {
      let line;
      if (direction === "left" || direction === "right") {
        line = state.grid.slice(i * 4, i * 4 + 4);
        if (direction === "right") line.reverse();
      } else {
        line = [state.grid[i], state.grid[i + 4], state.grid[i + 8], state.grid[i + 12]];
        if (direction === "down") line.reverse();
      }
      const merged = mergeLine(line);
      if (direction === "right" || direction === "down") merged.reverse();
      if (direction === "left" || direction === "right") {
        merged.forEach((value, index) => {
          next[i * 4 + index] = value;
        });
      } else {
        merged.forEach((value, index) => {
          next[i + index * 4] = value;
        });
      }
    }

    if (before.join(",") === next.join(",")) return;
    state.grid = next;
    spawn();
    if (state.score > state.best) {
      state.best = state.score;
      localStorage.setItem(bestKey, String(state.best));
    }
    if (!emptyIndices().length) {
      messageEl.textContent = "格子满了，继续尝试刷新更高分吧。";
    }
    render();
  }

  function reset() {
    state.grid = Array(16).fill(0);
    state.score = 0;
    spawn();
    spawn();
    messageEl.textContent = "用方向键滑动方块，合成更大的数字。";
    render();
  }

  window.addEventListener("keydown", (event) => {
    if (!state.active) return;
    const keyMap = {
      ArrowLeft: "left",
      ArrowRight: "right",
      ArrowUp: "up",
      ArrowDown: "down",
    };
    const direction = keyMap[event.key];
    if (!direction) return;
    event.preventDefault();
    move(direction);
  });

  restartBtn.addEventListener("click", reset);
  reset();
  state.start = reset;
  return state;
})();
gameModules["2048"] = game2048;

const rpsGame = (() => {
  const winsEl = document.getElementById("rpsWins");
  const lossesEl = document.getElementById("rpsLosses");
  const drawsEl = document.getElementById("rpsDraws");
  const playerMoveEl = document.getElementById("rpsPlayerMove");
  const aiMoveEl = document.getElementById("rpsAiMove");
  const messageEl = document.getElementById("rpsMessage");
  const resetBtn = document.getElementById("rpsResetBtn");
  const moveButtons = document.querySelectorAll("[data-rps-move]");
  const labels = { rock: "石头", paper: "布", scissors: "剪刀" };
  const state = {
    active: currentGameId === "rps",
    wins: 0,
    losses: 0,
    draws: 0,
  };

  function updateHud() {
    winsEl.textContent = String(state.wins);
    lossesEl.textContent = String(state.losses);
    drawsEl.textContent = String(state.draws);
  }

  function play(move) {
    const options = ["rock", "paper", "scissors"];
    const aiMove = options[Math.floor(Math.random() * options.length)];
    playerMoveEl.textContent = labels[move];
    aiMoveEl.textContent = labels[aiMove];
    if (move === aiMove) {
      state.draws += 1;
      messageEl.textContent = "平局，再来一局。";
    } else if (
      (move === "rock" && aiMove === "scissors") ||
      (move === "paper" && aiMove === "rock") ||
      (move === "scissors" && aiMove === "paper")
    ) {
      state.wins += 1;
      messageEl.textContent = "你赢了。";
    } else {
      state.losses += 1;
      messageEl.textContent = "电脑赢了。";
    }
    updateHud();
  }

  function reset() {
    state.wins = 0;
    state.losses = 0;
    state.draws = 0;
    playerMoveEl.textContent = "-";
    aiMoveEl.textContent = "-";
    messageEl.textContent = "先随便来一拳，看看电脑出什么。";
    updateHud();
  }

  moveButtons.forEach((button) => button.addEventListener("click", () => play(button.dataset.rpsMove)));
  resetBtn.addEventListener("click", reset);
  reset();
  state.start = reset;
  return state;
})();
gameModules.rps = rpsGame;

const reactionGame = (() => {
  const currentEl = document.getElementById("reactionCurrent");
  const bestEl = document.getElementById("reactionBest");
  const stateEl = document.getElementById("reactionState");
  const messageEl = document.getElementById("reactionMessage");
  const startBtn = document.getElementById("reactionStartBtn");
  const padBtn = document.getElementById("reactionPad");
  const bestKey = "reaction-best";
  const state = {
    active: currentGameId === "reaction",
    phase: "idle",
    timeoutId: null,
    startAt: 0,
    best: Number(localStorage.getItem(bestKey) || 0),
  };

  function updateHud(currentText = "-") {
    currentEl.textContent = currentText;
    bestEl.textContent = state.best ? `${state.best} ms` : "-";
    stateEl.textContent = state.phase === "waiting" ? "等待变绿" : state.phase === "ready" ? "点击中" : "待开始";
    padBtn.classList.toggle("ready", state.phase === "ready");
  }

  function reset() {
    clearTimeout(state.timeoutId);
    state.phase = "idle";
    padBtn.textContent = "等待开始";
    messageEl.textContent = "点击开始后，等区域变绿再点击。";
    updateHud("-");
  }

  function begin() {
    clearTimeout(state.timeoutId);
    state.phase = "waiting";
    padBtn.textContent = "不要提前点";
    messageEl.textContent = "正在随机计时，等它变绿。";
    updateHud("-");
    state.timeoutId = setTimeout(() => {
      state.phase = "ready";
      state.startAt = performance.now();
      padBtn.textContent = "现在点";
      messageEl.textContent = "立刻点击。";
      updateHud("-");
    }, 1200 + Math.random() * 1800);
  }

  function hitPad() {
    if (state.phase === "waiting") {
      reset();
      messageEl.textContent = "点早了，重新来。";
      return;
    }
    if (state.phase !== "ready") {
      return;
    }
    const elapsed = Math.round(performance.now() - state.startAt);
    state.phase = "idle";
    padBtn.textContent = "等待开始";
    messageEl.textContent = `本次成绩 ${elapsed} ms。`;
    if (!state.best || elapsed < state.best) {
      state.best = elapsed;
      localStorage.setItem(bestKey, String(state.best));
      messageEl.textContent = `新纪录 ${elapsed} ms。`;
    }
    updateHud(`${elapsed} ms`);
  }

  startBtn.addEventListener("click", begin);
  padBtn.addEventListener("click", hitPad);
  reset();
  state.start = begin;
  return state;
})();
gameModules.reaction = reactionGame;

const breakoutGame = (() => {
  const canvas = document.getElementById("breakoutCanvas");
  const ctx = canvas.getContext("2d");
  const startBtn = document.getElementById("breakoutStartBtn");
  const scoreEl = document.getElementById("breakoutScore");
  const livesEl = document.getElementById("breakoutLives");
  const bricksEl = document.getElementById("breakoutBricks");
  const messageEl = document.getElementById("breakoutMessage");
  const state = {
    active: currentGameId === "breakout",
    running: false,
    score: 0,
    lives: 3,
    paddleX: canvas.width / 2 - 50,
    paddleWidth: 100,
    moveLeft: false,
    moveRight: false,
    ball: { x: canvas.width / 2, y: canvas.height - 80, vx: 3.6, vy: -4 },
    bricks: [],
    animationId: null,
  };

  function createBricks() {
    const bricks = [];
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 6; col += 1) {
        bricks.push({
          x: 26 + col * 78,
          y: 40 + row * 34,
          w: 64,
          h: 20,
          active: true,
        });
      }
    }
    return bricks;
  }

  function updateHud() {
    scoreEl.textContent = String(state.score);
    livesEl.textContent = String(state.lives);
    bricksEl.textContent = String(state.bricks.filter((brick) => brick.active).length);
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#0b1a2d";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    state.bricks.forEach((brick, index) => {
      if (!brick.active) return;
      ctx.fillStyle = index % 2 === 0 ? "#ffd166" : "#7ce7ff";
      ctx.fillRect(brick.x, brick.y, brick.w, brick.h);
    });

    ctx.fillStyle = "#7ef0b2";
    ctx.fillRect(state.paddleX, canvas.height - 30, state.paddleWidth, 12);
    ctx.beginPath();
    ctx.arc(state.ball.x, state.ball.y, 8, 0, Math.PI * 2);
    ctx.fillStyle = "#fff4d8";
    ctx.fill();
  }

  function resetBall() {
    state.ball = { x: canvas.width / 2, y: canvas.height - 80, vx: 3.6 * (Math.random() > 0.5 ? 1 : -1), vy: -4 };
    state.paddleX = canvas.width / 2 - 50;
  }

  function stop(reason) {
    state.running = false;
    messageEl.textContent = reason;
  }

  function step() {
    if (!state.running) {
      draw();
      return;
    }
    if (state.moveLeft) state.paddleX -= 6;
    if (state.moveRight) state.paddleX += 6;
    state.paddleX = Math.max(0, Math.min(canvas.width - state.paddleWidth, state.paddleX));

    state.ball.x += state.ball.vx;
    state.ball.y += state.ball.vy;

    if (state.ball.x <= 8 || state.ball.x >= canvas.width - 8) state.ball.vx *= -1;
    if (state.ball.y <= 8) state.ball.vy *= -1;

    if (
      state.ball.y >= canvas.height - 42 &&
      state.ball.x >= state.paddleX &&
      state.ball.x <= state.paddleX + state.paddleWidth &&
      state.ball.vy > 0
    ) {
      state.ball.vy *= -1;
      const hitPoint = (state.ball.x - (state.paddleX + state.paddleWidth / 2)) / (state.paddleWidth / 2);
      state.ball.vx = hitPoint * 5;
    }

    state.bricks.forEach((brick) => {
      if (!brick.active) return;
      if (
        state.ball.x > brick.x &&
        state.ball.x < brick.x + brick.w &&
        state.ball.y > brick.y &&
        state.ball.y < brick.y + brick.h
      ) {
        brick.active = false;
        state.score += 10;
        state.ball.vy *= -1;
      }
    });

    if (state.ball.y > canvas.height + 12) {
      state.lives -= 1;
      if (state.lives <= 0) {
        stop("游戏结束，点击“开始打砖块”再来一局。");
      } else {
        resetBall();
      }
    }

    if (state.bricks.every((brick) => !brick.active)) {
      stop("恭喜通关，砖块已经清空。");
    }

    updateHud();
    draw();
    state.animationId = requestAnimationFrame(step);
  }

  function start() {
    cancelAnimationFrame(state.animationId);
    state.running = true;
    state.score = 0;
    state.lives = 3;
    state.bricks = createBricks();
    resetBall();
    messageEl.textContent = "左右移动接球，清掉所有砖块即可过关。";
    updateHud();
    draw();
    state.animationId = requestAnimationFrame(step);
  }

  window.addEventListener("keydown", (event) => {
    if (!state.active) return;
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") state.moveLeft = true;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") state.moveRight = true;
  });
  window.addEventListener("keyup", (event) => {
    if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") state.moveLeft = false;
    if (event.key === "ArrowRight" || event.key.toLowerCase() === "d") state.moveRight = false;
  });

  startBtn.addEventListener("click", start);
  state.bricks = createBricks();
  updateHud();
  draw();
  state.start = start;
  return state;
})();
gameModules.breakout = breakoutGame;

switchGame(currentGameId);

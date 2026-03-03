const gameButtons = document.querySelectorAll("[data-game-select]");
const gamePanels = document.querySelectorAll("[data-game-panel]");
const gameModules = {};
const playSelectedBtn = document.getElementById("playSelectedBtn");
const playRandomBtn = document.getElementById("playRandomBtn");
const spotlightTitleEl = document.getElementById("spotlightTitle");
const spotlightDescriptionEl = document.getElementById("spotlightDescription");
const spotlightGenreEl = document.getElementById("spotlightGenre");
const spotlightDifficultyEl = document.getElementById("spotlightDifficulty");
const spotlightDurationEl = document.getElementById("spotlightDuration");
const spotlightHintEl = document.getElementById("spotlightHint");

const lobbyInfo = {
  star: {
    title: "星落接接乐",
    description: "接住星星、躲开炸弹，节奏快，适合先热手。",
    genre: "动作反应",
    difficulty: "简单上手",
    duration: "1 分钟",
    hint: "方向键或屏幕按钮都能玩，追求高分很上头。",
  },
  ddz: {
    title: "斗地主小游戏",
    description: "单机快速局，和两个 AI 对战，适合慢一点思考。",
    genre: "牌类策略",
    difficulty: "中等",
    duration: "3-5 分钟",
    hint: "支持单张、对子、三张、炸弹和王炸，适合休闲局。",
  },
  ttt: {
    title: "井字棋",
    description: "和电脑轮流落子，经典三连线小游戏。",
    genre: "轻策略",
    difficulty: "简单",
    duration: "30 秒",
    hint: "抢中心、堵对角，适合快速来一局。",
  },
  memory: {
    title: "记忆翻牌",
    description: "记住翻开的图案位置，用更少步数完成配对。",
    genre: "记忆益智",
    difficulty: "中等",
    duration: "2 分钟",
    hint: "越专注越容易刷出新纪录，适合连续挑战。",
  },
  mole: {
    title: "打地鼠",
    description: "30 秒快打模式，拼手速和反应。",
    genre: "极限反应",
    difficulty: "刺激",
    duration: "30 秒",
    hint: "适合手机点按，节奏紧凑，能快速来好几局。",
  },
};

let currentGameId = "star";

function updateSpotlight(gameId) {
  const info = lobbyInfo[gameId];
  if (!info) {
    return;
  }
  spotlightTitleEl.textContent = info.title;
  spotlightDescriptionEl.textContent = info.description;
  spotlightGenreEl.textContent = info.genre;
  spotlightDifficultyEl.textContent = info.difficulty;
  spotlightDurationEl.textContent = info.duration;
  spotlightHintEl.textContent = info.hint;
}

function switchGame(gameId) {
  gameButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.gameSelect === gameId);
  });
  gamePanels.forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.gamePanel === gameId);
  });
  currentGameId = gameId;
  updateSpotlight(gameId);
  Object.entries(gameModules).forEach(([id, module]) => {
    module.active = id === gameId;
  });
  if (gameModules[gameId] && typeof gameModules[gameId].onActivate === "function") {
    gameModules[gameId].onActivate();
  }
}

gameButtons.forEach((button) => {
  button.addEventListener("click", () => switchGame(button.dataset.gameSelect));
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
  const audioState = {
    enabled: true,
    context: null,
  };

  const bestScore = {
    value: Number(localStorage.getItem(bestScoreKey) || 0),
  };

  const state = {
    active: true,
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
    if (starGame.active) {
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
  showOverlay(
    "准备开局",
    "星星加分，炸弹扣命，漏接星星也会损失生命。",
    "立即开始"
  );
  drawScene();
  requestAnimationFrame(loop);

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
    active: false,
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

  function cardLabel(card) {
    return rankLabels[card.rank];
  }

  function cardSuit(card) {
    if (card.rank >= 16) {
      return "王";
    }
    return card.suit;
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
      return {
        type: "rocket",
        rank: 17,
        cards: sorted,
        label: "王炸",
      };
    }

    if (ranks.length !== 1) {
      return null;
    }

    const rank = ranks[0];
    const count = sorted.length;
    if (count === 1) {
      return { type: "single", rank, cards: sorted, label: `单张 ${rankLabels[rank]}` };
    }
    if (count === 2) {
      return { type: "pair", rank, cards: sorted, label: `对子 ${rankLabels[rank]}` };
    }
    if (count === 3) {
      return { type: "triple", rank, cards: sorted, label: `三张 ${rankLabels[rank]}` };
    }
    if (count === 4) {
      return { type: "bomb", rank, cards: sorted, label: `炸弹 ${rankLabels[rank]}` };
    }
    return null;
  }

  function canBeat(candidate, target) {
    if (!candidate) {
      return false;
    }
    if (!target) {
      return true;
    }
    if (candidate.type === "rocket") {
      return true;
    }
    if (target.type === "rocket") {
      return false;
    }
    if (candidate.type === "bomb" && target.type !== "bomb") {
      return true;
    }
    if (candidate.type !== target.type) {
      return false;
    }
    return candidate.rank > target.rank;
  }

  function allPlayableCombos(hand) {
    const combos = [];
    const groups = new Map();
    hand.forEach((card) => {
      if (!groups.has(card.rank)) {
        groups.set(card.rank, []);
      }
      groups.get(card.rank).push(card);
    });

    groups.forEach((cards, rank) => {
      combos.push({ type: "single", rank, cards: cards.slice(0, 1), label: `单张 ${rankLabels[rank]}` });
      if (cards.length >= 2) {
        combos.push({ type: "pair", rank, cards: cards.slice(0, 2), label: `对子 ${rankLabels[rank]}` });
      }
      if (cards.length >= 3) {
        combos.push({ type: "triple", rank, cards: cards.slice(0, 3), label: `三张 ${rankLabels[rank]}` });
      }
      if (cards.length === 4) {
        combos.push({ type: "bomb", rank, cards: cards.slice(0, 4), label: `炸弹 ${rankLabels[rank]}` });
      }
    });

    if (groups.has(16) && groups.has(17)) {
      combos.push({
        type: "rocket",
        rank: 17,
        cards: [groups.get(16)[0], groups.get(17)[0]],
        label: "王炸",
      });
    }

    combos.sort((a, b) => {
      const weight = { single: 1, pair: 2, triple: 3, bomb: 4, rocket: 5 };
      return weight[a.type] - weight[b.type] || a.rank - b.rank;
    });
    return combos;
  }

  function describeCombo(combo) {
    if (!combo) {
      return "暂无";
    }
    return combo.label;
  }

  function clearSelection() {
    state.selectedIds.clear();
  }

  function updateButtons() {
    const isHumanTurn = state.phase === "playing" && getCurrentPlayer().id === "human";
    const isHumanBid = state.phase === "bidding" && state.players[state.bidCursor].id === "human";

    callBtn.disabled = !isHumanBid;
    passCallBtn.disabled = !isHumanBid;
    playBtn.disabled = !isHumanTurn;
    hintBtn.disabled = !isHumanTurn;

    const canPass = isHumanTurn && state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex;
    passBtn.disabled = !canPass;
  }

  function renderCard(card, { selectable = false, selected = false, tiny = false, disabled = false } = {}) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `card${card.suit === "♥" || card.suit === "♦" || card.rank >= 16 ? " red" : ""}${
      selected ? " selected" : ""
    }${tiny ? " tiny" : ""}${disabled ? " disabled" : ""}`;
    button.innerHTML = `<strong>${cardLabel(card)}</strong><small>${cardSuit(card)}</small>`;
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
        if (state.phase !== "playing" || getCurrentPlayer().id !== "human") {
          return;
        }
        if (selected) {
          state.selectedIds.delete(card.id);
        } else {
          state.selectedIds.add(card.id);
        }
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
    lastPlayEl.textContent = describeCombo(state.lastCombo);
    comboEl.textContent = state.lastCombo
      ? `${getPlayer(state.lastCombo.playerId).name} 出了 ${state.lastCombo.label}`
      : "暂无";
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
    clearSelection();

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
    const target =
      state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex ? state.lastCombo : null;
    const candidate = combos.find((combo) => canBeat(combo, target));
    if (!candidate) {
      messageEl.textContent = "这手没有能压过的牌。";
      return;
    }
    state.selectedIds = new Set(candidate.cards.map((card) => card.id));
    renderHand();
  }

  function chooseAiBid(player) {
    const score = evaluateHandStrength(player.hand);
    return score >= 185;
  }

  function assignLandlord(player) {
    state.landlordId = player.id;
    player.hand.push(...state.bottomCards);
    sortCards(player.hand);
    state.phase = "playing";
    state.currentPlayerIndex = state.players.findIndex((item) => item.id === player.id);
    player.role = "landlord";
    state.players.forEach((item) => {
      if (item.id !== player.id) {
        item.role = "farmer";
      }
    });
    messageEl.textContent = `${player.name} 成为地主，开始出牌。`;
    renderAll();
    queueAiTurnIfNeeded();
  }

  function stepBidding() {
    if (state.phase !== "bidding") {
      return;
    }

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
    state.players = [
      ...state.players.slice(state.bidStarterIndex),
      ...state.players.slice(0, state.bidStarterIndex),
    ];
    state.bidCursor = 0;
    state.currentPlayerIndex = 0;

    messageEl.textContent = "新一局开始，进入叫地主阶段。";
    renderAll();
    stepBidding();
  }

  function chooseAiCombo(player) {
    const combos = allPlayableCombos(player.hand);
    const target =
      state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex ? state.lastCombo : null;

    if (!target) {
      return combos.find((combo) => combo.type !== "bomb" && combo.type !== "rocket") || combos[0];
    }

    return combos.find((combo) => canBeat(combo, target)) || null;
  }

  function takeAiTurn() {
    if (state.phase !== "playing") {
      return;
    }

    const player = getCurrentPlayer();
    if (player.id === "human") {
      updateButtons();
      return;
    }

    const combo = chooseAiCombo(player);
    if (combo) {
      applyPlay(player, combo);
    } else {
      handlePass(player);
    }
  }

  function queueAiTurnIfNeeded() {
    clearTimeout(state.aiTimer);
    if (!douDiZhu.active || state.phase !== "playing") {
      return;
    }
    if (getCurrentPlayer().id === "human") {
      updateButtons();
      return;
    }
    state.aiTimer = setTimeout(takeAiTurn, 700);
  }

  callBtn.addEventListener("click", () => {
    if (state.phase !== "bidding" || state.players[state.bidCursor].id !== "human") {
      return;
    }
    getPlayer("human").lastAction = "叫地主";
    assignLandlord(getPlayer("human"));
  });

  passCallBtn.addEventListener("click", () => {
    if (state.phase !== "bidding" || state.players[state.bidCursor].id !== "human") {
      return;
    }
    getPlayer("human").lastAction = "不叫";
    state.bidCursor += 1;
    renderAll();
    stepBidding();
  });

  playBtn.addEventListener("click", () => {
    if (state.phase !== "playing" || getCurrentPlayer().id !== "human") {
      return;
    }

    const human = getPlayer("human");
    const selectedCards = human.hand.filter((card) => state.selectedIds.has(card.id));
    const combo = classifyCards(selectedCards);

    if (!combo) {
      messageEl.textContent = "当前只支持单张、对子、三张、炸弹和王炸。";
      return;
    }

    const target =
      state.lastCombo && state.lastPlayerIndex !== state.currentPlayerIndex ? state.lastCombo : null;
    if (!canBeat(combo, target)) {
      messageEl.textContent = target ? "这手牌压不过当前桌面牌。" : "当前不能这样出牌。";
      return;
    }

    applyPlay(human, combo);
  });

  passBtn.addEventListener("click", () => {
    if (state.phase !== "playing" || getCurrentPlayer().id !== "human") {
      return;
    }
    if (!state.lastCombo || state.lastPlayerIndex === state.currentPlayerIndex) {
      return;
    }
    handlePass(getPlayer("human"));
  });

  hintBtn.addEventListener("click", findHint);
  restartBtn.addEventListener("click", startRound);

  startRound();
  state.onActivate = queueAiTurnIfNeeded;
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
    active: false,
    board: Array(9).fill(""),
    turn: "human",
    locked: false,
    scores: {
      human: 0,
      ai: 0,
    },
  };

  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  function winner(board) {
    for (const [a, b, c] of lines) {
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a];
      }
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
        if (count === 2 && empty !== undefined) {
          return empty;
        }
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
    if (state.board[index] || state.locked) {
      return;
    }
    if (state.turn !== "human") {
      return;
    }
    state.board[index] = "X";
    if (afterMove()) {
      return;
    }
    state.turn = "ai";
    messageEl.textContent = "电脑思考中。";
    render();
    setTimeout(() => {
      const move = chooseAiMove();
      if (move === undefined) {
        return;
      }
      state.board[move] = "O";
      if (afterMove()) {
        return;
      }
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
    active: false,
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
    if (state.matches !== 8) {
      return;
    }
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
    if (card.revealed || card.matched || state.locked) {
      return;
    }

    card.revealed = true;
    state.opened.push(index);
    render();

    if (state.opened.length < 2) {
      return;
    }

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
  updateHud();
  reset();
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
    active: false,
    running: false,
    score: 0,
    timeLeft: 30,
    best: Number(localStorage.getItem(bestKey) || 0),
    activeHole: -1,
    tickTimer: null,
    spawnTimer: null,
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
        if (!state.running || state.activeHole !== i) {
          return;
        }
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
      if (state.timeLeft <= 0) {
        stopGame();
      }
    }, 1000);

    state.spawnTimer = setInterval(() => {
      state.activeHole = Math.floor(Math.random() * 9);
      render();
    }, 520);
  }

  startBtn.addEventListener("click", startGame);
  updateHud();
  render();
  return state;
})();
gameModules.mole = moleGame;

playSelectedBtn.addEventListener("click", () => {
  switchGame(currentGameId);
  window.scrollTo({
    top: document.querySelector(`[data-game-panel="${currentGameId}"]`).offsetTop - 12,
    behavior: "smooth",
  });
});

playRandomBtn.addEventListener("click", () => {
  const ids = Object.keys(lobbyInfo);
  const randomId = ids[Math.floor(Math.random() * ids.length)];
  switchGame(randomId);
  window.scrollTo({
    top: document.querySelector(`[data-game-panel="${randomId}"]`).offsetTop - 12,
    behavior: "smooth",
  });
});

switchGame("star");

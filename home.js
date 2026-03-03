const catalogEntries = Array.isArray(window.arcadeCatalog?.games) ? window.arcadeCatalog.games : [];
const gameGalleryEl = document.getElementById("gameGallery");
const categoryStripEl = document.getElementById("homeCategoryStrip");
const hotRankingListEl = document.getElementById("hotRankingList");
const gameSearchInput = document.getElementById("gameSearchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");
const featuredTitleEl = document.getElementById("featuredTitle");
const featuredTextEl = document.getElementById("featuredText");
const featuredPlayBtn = document.getElementById("featuredPlayBtn");
const gallerySummaryEl = document.getElementById("gallerySummary");
const visibleGameCountEl = document.getElementById("visibleGameCount");
const currentFilterLabelEl = document.getElementById("currentFilterLabel");
const homeTotalGamesEl = document.getElementById("homeTotalGames");
const quickTagsEl = document.getElementById("quickTags");
const jumpToResultsBtn = document.getElementById("jumpToResultsBtn");

const state = {
  filter: "全部",
  search: "",
};

const categoryOrder = ["全部", "热门", ...new Set(catalogEntries.map((game) => game.category))];

function openGame(gameId) {
  window.location.href = `./play.html?game=${encodeURIComponent(gameId)}`;
}

function getSortedGames() {
  return [...catalogEntries].sort((left, right) => left.hotRank - right.hotRank);
}

function getVisibleGames() {
  const keyword = state.search.trim().toLowerCase();
  return getSortedGames().filter((game) => {
    const matchesFilter =
      state.filter === "全部" ||
      (state.filter === "热门" && game.hotRank <= 5) ||
      game.category === state.filter;

    if (!matchesFilter) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const haystack = [
      game.title,
      game.description,
      game.genre,
      game.category,
      ...game.tags,
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(keyword);
  });
}

function renderCategories() {
  categoryStripEl.innerHTML = categoryOrder
    .map((category) => {
      const activeClass = category === state.filter ? " active" : "";
      return `
        <button class="category-chip${activeClass}" type="button" data-category-filter="${category}">
          ${category}
        </button>
      `;
    })
    .join("");
}

function renderFeatured() {
  const featuredGame = getSortedGames()[0];
  if (!featuredGame) {
    return;
  }
  featuredTitleEl.textContent = `${featuredGame.title} 正在热门榜第 1`;
  featuredTextEl.textContent = `${featuredGame.description} 适合先来一局，当前标签：${featuredGame.tags.join(" / ")}。`;
  featuredPlayBtn.dataset.openGame = featuredGame.id;
  featuredPlayBtn.textContent = `先玩${featuredGame.title}`;
}

function renderQuickTags() {
  const tags = [...new Set(getSortedGames().flatMap((game) => game.tags))].slice(0, 8);
  quickTagsEl.innerHTML = tags
    .map(
      (tag) => `
        <button class="tag-filter-btn" type="button" data-tag-filter="${tag}">
          # ${tag}
        </button>
      `
    )
    .join("");
}

function renderRanking() {
  hotRankingListEl.innerHTML = getSortedGames()
    .slice(0, 5)
    .map(
      (game) => `
        <button class="rank-item" type="button" data-open-game="${game.id}">
          <span class="rank-number">TOP ${game.hotRank}</span>
          <span class="rank-copy">
            <strong>${game.title}</strong>
            <span>${game.genre}</span>
          </span>
          <span class="rank-icon">${game.icon}</span>
        </button>
      `
    )
    .join("");
}

function renderGallery() {
  const visibleGames = getVisibleGames();
  const discoverMode = Boolean(state.search.trim()) || state.filter !== "全部";
  document.body.classList.toggle("is-discovering", discoverMode);
  gameGalleryEl.classList.toggle("compact-results", discoverMode);
  visibleGameCountEl.textContent = String(visibleGames.length);
  currentFilterLabelEl.textContent = state.filter;
  gallerySummaryEl.textContent = keywordSummary(visibleGames.length);
  clearSearchBtn.hidden = !state.search.trim();

  if (!visibleGames.length) {
    gameGalleryEl.innerHTML = `
      <div class="gallery-empty">
        <p class="panel-tag">EMPTY RESULT</p>
        <h3>没有找到匹配的游戏</h3>
        <p>换一个关键词，或者点“全部”重新浏览。</p>
      </div>
    `;
    return;
  }

  gameGalleryEl.innerHTML = visibleGames
    .map(
      (game) => `
        <button
          class="gallery-card${game.hotRank <= 3 ? " hot" : ""}"
          type="button"
          data-open-game="${game.id}"
          style="--card-accent-a: ${game.coverA}; --card-accent-b: ${game.coverB};"
        >
          <div class="game-card-top">
            <span class="game-card-tag">${game.category}</span>
            <span class="game-card-difficulty">${game.difficulty}</span>
          </div>
          <div class="game-card-cover">
            <span class="game-card-icon">${game.icon}</span>
            <div>
              <strong>${game.coverLabel}</strong>
              <span>${game.coverNote}</span>
            </div>
          </div>
          <div class="game-card-copy">
            <h3>${game.title}</h3>
            <p>${game.description}</p>
          </div>
          <div class="game-card-footer">
            <span>${game.duration}</span>
            <span>TOP ${game.hotRank}</span>
          </div>
        </button>
      `
    )
    .join("");
}

function keywordSummary(count) {
  if (!state.search.trim()) {
    if (state.filter !== "全部") {
      return `当前分类为“${state.filter}”，共展示 ${count} 款游戏。`;
    }
    return `当前展示 ${count} 款游戏，点按钮即可跳转到独立游玩页。`;
  }
  return `关键词“${state.search.trim()}”共匹配到 ${count} 款游戏，结果已收紧展示。`;
}

function scrollToGallery() {
  gameGalleryEl.scrollIntoView({ behavior: "smooth", block: "start" });
}

function applySearch(nextValue, { scroll = false } = {}) {
  state.search = nextValue;
  gameSearchInput.value = nextValue;
  renderGallery();
  if (scroll) {
    scrollToGallery();
  }
}

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-game]");
  if (openButton) {
    openGame(openButton.dataset.openGame);
    return;
  }

  const categoryButton = event.target.closest("[data-category-filter]");
  if (categoryButton) {
    state.filter = categoryButton.dataset.categoryFilter;
    renderCategories();
    renderGallery();
    scrollToGallery();
    return;
  }

  const tagButton = event.target.closest("[data-tag-filter]");
  if (tagButton) {
    applySearch(tagButton.dataset.tagFilter, { scroll: true });
    return;
  }

  const randomButton = event.target.closest("[data-random-game]");
  if (randomButton) {
    const candidates = getSortedGames().slice(0, 5);
    const randomGame = candidates[Math.floor(Math.random() * candidates.length)];
    if (randomGame) {
      openGame(randomGame.id);
    }
  }
});

gameSearchInput.addEventListener("input", (event) => {
  applySearch(event.target.value, { scroll: false });
});

clearSearchBtn.addEventListener("click", () => {
  applySearch("", { scroll: false });
  gameSearchInput.focus();
});

jumpToResultsBtn.addEventListener("click", scrollToGallery);

homeTotalGamesEl.textContent = String(catalogEntries.length);
renderCategories();
renderFeatured();
renderRanking();
renderQuickTags();
renderGallery();

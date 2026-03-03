const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlayDom, destroyDom, click, wait } = require("./test-utils");

test("play page switches games and basic board interactions are playable", async (t) => {
  const dom = createPlayDom("gomoku");
  t.after(() => destroyDom(dom));
  const { document } = dom.window;

  assert.equal(document.querySelectorAll(".game-panel.active").length, 1);
  assert.equal(document.querySelector(".game-panel.active").dataset.gamePanel, "gomoku");
  assert.equal(document.querySelectorAll(".solo-topbar .back-link").length, 1);
  assert.equal(document.getElementById("playNav"), null);

  const gomokuCells = document.querySelectorAll("#gomokuBoard .board-cell");
  click(gomokuCells[0], dom.window);
  await wait(dom.window, 260);
  assert.equal(document.querySelectorAll("#gomokuBoard .stone-black").length, 1);
  assert.equal(document.querySelectorAll("#gomokuBoard .stone-white").length, 1);
});

test("independent play page starts the requested game directly", async (t) => {
  const dom = createPlayDom("connect4");
  t.after(() => destroyDom(dom));
  const { document } = dom.window;

  assert.equal(document.querySelectorAll(".game-panel.active").length, 1);
  assert.equal(document.querySelector(".game-panel.active").dataset.gamePanel, "connect4");

  const firstColumn = document.querySelector("#connect4Columns .column-btn");
  click(firstColumn, dom.window);
  await wait(dom.window, 260);
  const pieces = document.querySelectorAll("#connect4Board .disc-black, #connect4Board .disc-white");
  assert.ok(pieces.length >= 2);
});

test("xiangqi basic move flow is playable", async (t) => {
  const dom = createPlayDom("xiangqi");
  t.after(() => destroyDom(dom));
  const { document } = dom.window;

  assert.equal(document.querySelector(".game-panel.active").dataset.gamePanel, "xiangqi");
  let cells = document.querySelectorAll("#xiangqiBoard .board-cell");
  click(cells[54], dom.window);
  cells = document.querySelectorAll("#xiangqiBoard .board-cell");
  click(cells[45], dom.window);
  await wait(dom.window, 320);
  cells = document.querySelectorAll("#xiangqiBoard .board-cell");
  assert.equal(cells.length, 90);
  assert.ok(document.querySelector("#xiangqiBoard .xiangqi-piece-player"));
  assert.ok(document.querySelector("#xiangqiBoard .xiangqi-piece-ai"));
});

test("junqi basic move flow is playable", async (t) => {
  const dom = createPlayDom("junqi");
  t.after(() => destroyDom(dom));
  const { document } = dom.window;

  assert.equal(document.querySelector(".game-panel.active").dataset.gamePanel, "junqi");
  let cells = document.querySelectorAll("#junqiBoard .board-cell");
  click(cells[21], dom.window);
  cells = document.querySelectorAll("#junqiBoard .board-cell");
  click(cells[16], dom.window);
  await wait(dom.window, 280);
  cells = document.querySelectorAll("#junqiBoard .board-cell");
  assert.equal(cells.length, 30);
  assert.ok(document.querySelector("#junqiBoard .junqi-piece-player"));
  assert.ok(document.querySelector("#junqiBoard .junqi-piece-ai"));
});

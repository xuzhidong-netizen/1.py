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

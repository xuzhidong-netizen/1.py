const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlayDom, destroyDom, click, wait } = require("./test-utils");

test("play page switches games and basic board interactions are playable", async (t) => {
  const dom = createPlayDom("gomoku");
  t.after(() => destroyDom(dom));
  const { document } = dom.window;

  assert.equal(document.getElementById("playTitle").textContent, "五子棋");
  assert.equal(document.querySelectorAll("#playNav .play-nav-link").length, 20);

  const gomokuCells = document.querySelectorAll("#gomokuBoard .board-cell");
  click(gomokuCells[0], dom.window);
  await wait(dom.window, 260);
  assert.equal(document.querySelectorAll("#gomokuBoard .stone-black").length, 1);
  assert.equal(document.querySelectorAll("#gomokuBoard .stone-white").length, 1);

  const connect4Button = [...document.querySelectorAll("#playNav .play-nav-link")].find((button) =>
    button.textContent.includes("四子棋")
  );
  click(connect4Button, dom.window);
  assert.equal(document.getElementById("playTitle").textContent, "四子棋");

  const firstColumn = document.querySelector("#connect4Columns .column-btn");
  click(firstColumn, dom.window);
  await wait(dom.window, 260);
  const pieces = document.querySelectorAll("#connect4Board .disc-black, #connect4Board .disc-white");
  assert.ok(pieces.length >= 2);
});

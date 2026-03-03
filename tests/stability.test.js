const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlayDom, destroyDom, loadCatalogData } = require("./test-utils");

test("stability: each game opens as an isolated single-page play scene", async () => {
  const games = loadCatalogData();

  for (const game of games) {
    const dom = createPlayDom(game.id);
    const { document } = dom.window;
    const activePanel = document.querySelector(".game-panel.active");
    assert.ok(activePanel);
    assert.equal(activePanel.dataset.gamePanel, game.id);
    assert.equal(document.querySelectorAll(".game-panel.active").length, 1);
    assert.equal(document.querySelectorAll(".back-link").length, 1);
    assert.equal(document.getElementById("playNav"), null);
    destroyDom(dom);
  }
});

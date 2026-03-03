const test = require("node:test");
const assert = require("node:assert/strict");
const { createPlayDom, destroyDom, click, wait } = require("./test-utils");

test("stability: repeated switching across all game panels does not break active state", async (t) => {
  const dom = createPlayDom("star");
  t.after(() => destroyDom(dom));
  const { document } = dom.window;
  const navButtons = [...document.querySelectorAll("#playNav .play-nav-link")];

  for (const button of navButtons) {
    click(button, dom.window);
    await wait(dom.window, 30);
    const activePanel = document.querySelector(".game-panel.active");
    assert.ok(activePanel);
    assert.equal(activePanel.dataset.gamePanel, button.dataset.gameLink);
    assert.ok(document.getElementById("playTitle").textContent.length > 0);
  }
});

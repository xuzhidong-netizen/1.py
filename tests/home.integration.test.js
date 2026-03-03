const test = require("node:test");
const assert = require("node:assert/strict");
const { createHomeDom, destroyDom, click, input } = require("./test-utils");

test("home page renders the full catalog and supports filtering", (t) => {
  const dom = createHomeDom();
  t.after(() => destroyDom(dom));
  const { document } = dom.window;

  assert.equal(document.getElementById("homeTotalGames").textContent, "20");
  assert.equal(document.querySelectorAll("#gameGallery .gallery-card").length, 20);

  input(document.getElementById("gameSearchInput"), "五子棋", dom.window);
  assert.equal(document.getElementById("visibleGameCount").textContent, "1");
  assert.match(document.getElementById("gameGallery").textContent, /五子棋/);

  click(document.getElementById("clearSearchBtn"), dom.window);
  assert.equal(document.getElementById("visibleGameCount").textContent, "20");

  const chessCategory = [...document.querySelectorAll("[data-category-filter]")].find((button) =>
    button.textContent.includes("棋类")
  );
  click(chessCategory, dom.window);
  assert.equal(document.getElementById("visibleGameCount").textContent, "10");
});

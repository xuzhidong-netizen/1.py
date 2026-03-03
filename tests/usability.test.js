const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { ROOT, createHomeDom, createPlayDom, destroyDom } = require("./test-utils");

test("usability: key affordances and mobile metadata exist", () => {
  const indexHtml = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
  const playHtml = fs.readFileSync(path.join(ROOT, "play.html"), "utf8");

  assert.match(indexHtml, /name="viewport"/);
  assert.match(playHtml, /name="viewport"/);
  assert.match(indexHtml, /id="clearSearchBtn"/);
  assert.match(indexHtml, /id="jumpToResultsBtn"/);
});

test("usability: rendered cards and nav buttons include readable labels", (t) => {
  const homeDom = createHomeDom();
  const playDom = createPlayDom("star");
  t.after(() => {
    destroyDom(homeDom);
    destroyDom(playDom);
  });

  homeDom.window.document.querySelectorAll("#gameGallery .gallery-card").forEach((card) => {
    assert.ok(card.textContent.trim().length > 8);
  });

  playDom.window.document.querySelectorAll("#playNav .play-nav-link").forEach((button) => {
    assert.ok(button.textContent.includes(" "));
  });

  assert.ok(playDom.window.document.getElementById("starLeftBtn"));
  assert.ok(playDom.window.document.getElementById("starRightBtn"));
  assert.ok(playDom.window.document.getElementById("quickStartBtn"));
});

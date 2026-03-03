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
  assert.match(playHtml, /id="backToHomeBtn"/);
  assert.doesNotMatch(playHtml, /id="playNav"/);
  assert.doesNotMatch(playHtml, /id="quickStartBtn"/);
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

  assert.equal(playDom.window.document.querySelectorAll(".back-link").length, 1);
  assert.equal(playDom.window.document.querySelectorAll(".solo-topbar").length, 1);
  assert.equal(playDom.window.document.querySelectorAll(".game-panel.active").length, 1);
  assert.ok(playDom.window.document.getElementById("starLeftBtn"));
  assert.ok(playDom.window.document.getElementById("starRightBtn"));
  assert.equal(playDom.window.document.getElementById("playNav"), null);
});

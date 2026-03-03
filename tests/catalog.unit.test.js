const test = require("node:test");
const assert = require("node:assert/strict");
const { loadCatalogData } = require("./test-utils");

test("catalog keeps unique ids and complete metadata", () => {
  const games = loadCatalogData();
  const ids = games.map((game) => game.id);
  const ranks = games.map((game) => game.hotRank);

  assert.equal(games.length, 22);
  assert.equal(new Set(ids).size, games.length);
  assert.equal(new Set(ranks).size, games.length);

  games.forEach((game) => {
    assert.ok(game.title);
    assert.ok(game.description);
    assert.ok(game.genre);
    assert.ok(game.category);
    assert.ok(game.icon);
    assert.ok(Array.isArray(game.tags) && game.tags.length >= 2);
  });
});

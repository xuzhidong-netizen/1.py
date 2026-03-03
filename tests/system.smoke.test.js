const test = require("node:test");
const assert = require("node:assert/strict");
const { createStaticServer, fetchText } = require("./test-utils");

test("system smoke: static pages can be served and fetched", async () => {
  const { server, baseUrl } = await createStaticServer();

  try {
    const home = await fetchText(`${baseUrl}/`);
    const play = await fetchText(`${baseUrl}/play.html?game=gomoku`);

    assert.equal(home.status, 200);
    assert.equal(play.status, 200);
    assert.match(home.text, /小游戏大厅/);
    assert.match(play.text, /五子棋/);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

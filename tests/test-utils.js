const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const http = require("node:http");
const { JSDOM } = require("jsdom");

const ROOT = "/Volumes/Extreme SSD/Ai";

function loadCatalogData() {
  const sandbox = { window: {} };
  const catalogSource = fs.readFileSync(path.join(ROOT, "catalog.js"), "utf8");
  vm.runInNewContext(catalogSource, sandbox);
  return sandbox.window.arcadeCatalog.games;
}

function createCanvasContext() {
  return {
    fillRect() {},
    clearRect() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    roundRect() {},
    stroke() {},
    fill() {},
    arc() {},
    closePath() {},
    fillText() {},
    strokeRect() {},
    save() {},
    restore() {},
    translate() {},
    setLineDash() {},
    measureText() {
      return { width: 0 };
    },
  };
}

function installBrowserStubs(window) {
  window.scrollTo = () => {};
  window.requestAnimationFrame = (callback) => window.setTimeout(() => callback(Date.now()), 16);
  window.cancelAnimationFrame = (id) => window.clearTimeout(id);
  window.HTMLElement.prototype.scrollIntoView = () => {};
  window.HTMLCanvasElement.prototype.getContext = () => createCanvasContext();

  class FakeAudioContext {
    constructor() {
      this.currentTime = 0;
      this.destination = {};
    }

    createOscillator() {
      return {
        connect() {},
        start() {},
        stop() {},
        frequency: { value: 0 },
        type: "sine",
      };
    }

    createGain() {
      return {
        connect() {},
        gain: {
          value: 0,
          setValueAtTime() {},
          linearRampToValueAtTime() {},
          exponentialRampToValueAtTime() {},
        },
      };
    }
  }

  window.AudioContext = FakeAudioContext;
  window.webkitAudioContext = FakeAudioContext;
}

function loadScripts(window, scripts) {
  scripts.forEach((scriptName) => {
    const source = fs.readFileSync(path.join(ROOT, scriptName), "utf8");
    window.eval(source);
  });
}

function createDom(htmlFile, options = {}) {
  const html = fs.readFileSync(path.join(ROOT, htmlFile), "utf8");
  const dom = new JSDOM(html, {
    url: options.url || `http://localhost/${htmlFile}`,
    pretendToBeVisual: true,
    runScripts: "outside-only",
  });
  installBrowserStubs(dom.window);
  loadScripts(dom.window, options.scripts || []);
  return dom;
}

function createHomeDom() {
  return createDom("index.html", {
    scripts: ["catalog.js", "home.js"],
  });
}

function createPlayDom(gameId = "star") {
  return createDom("play.html", {
    url: `http://localhost/play.html?game=${encodeURIComponent(gameId)}`,
    scripts: ["catalog.js", "game.js"],
  });
}

function click(element, window) {
  element.dispatchEvent(
    new window.MouseEvent("click", {
      bubbles: true,
      cancelable: true,
    })
  );
}

function input(element, value, window) {
  element.value = value;
  element.dispatchEvent(new window.Event("input", { bubbles: true }));
}

function wait(window, ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createStaticServer() {
  const server = http.createServer((request, response) => {
    const requestPath = request.url.startsWith("/play.html") ? "/play.html" : request.url === "/" ? "/index.html" : request.url;
    const filePath = path.join(ROOT, requestPath.replace(/^\//, ""));
    if (!fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("Not found");
      return;
    }
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(fs.readFileSync(filePath));
  });

  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      resolve({
        server,
        baseUrl: `http://127.0.0.1:${address.port}`,
      });
    });
  });
}

async function fetchText(url) {
  const response = await fetch(url);
  return {
    status: response.status,
    text: await response.text(),
  };
}

module.exports = {
  ROOT,
  click,
  createHomeDom,
  createPlayDom,
  createStaticServer,
  destroyDom(dom) {
    dom.window.close();
  },
  fetchText,
  input,
  loadCatalogData,
  wait,
};

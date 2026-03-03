const homeGameButtons = document.querySelectorAll("[data-open-game]");
const homeRandomButton = document.querySelector("[data-random-game]");
const homeGameIds = ["star", "ddz", "ttt", "memory", "mole", "snake", "2048", "rps", "reaction", "breakout"];

function openGame(gameId) {
  window.location.href = `./play.html?game=${encodeURIComponent(gameId)}`;
}

homeGameButtons.forEach((button) => {
  button.addEventListener("click", () => openGame(button.dataset.openGame));
});

if (homeRandomButton) {
  homeRandomButton.addEventListener("click", () => {
    const randomId = homeGameIds[Math.floor(Math.random() * homeGameIds.length)];
    openGame(randomId);
  });
}

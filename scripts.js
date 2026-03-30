// --- Sounds ---
const hoverSound = new Audio('hover.mp3');
const clickSound = new Audio('click.mp3');

document.addEventListener('mouseover', e => {
    if (e.target.closest('.game')) {
        hoverSound.currentTime = 0;
        hoverSound.play().catch(() => {});
    }
});

document.addEventListener('click', e => {
    if (e.target.closest('a')) {
        clickSound.currentTime = 0;
        clickSound.play().catch(() => {});
    }
});

// Helper: check if DLC is real
function hasRealDLC(game) {
    return (
        Array.isArray(game.dlc) &&
        game.dlc.length > 0 &&
        game.dlc.some(d => d.name && d.name !== "N/A")
    );
}

// --- Index page: load game grid ---
fetch('https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json')
  .then(response => response.json())
  .then(games => {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;

    games.forEach(game => {
      const div = document.createElement('div');
      div.className = 'game';

      div.innerHTML = `
        <a href="game.html?id=${game.id}">
          <img src="${game.cover}" alt="${game.title}">
          <p>${game.title}</p>
          <small>${game.size}</small>

          ${hasRealDLC(game) ? `
            <div class="dlc-badge">
                <span class="dlc-icon">🧩</span> ${game.dlc.length} DLC
            </div>
          ` : ""}
        </a>
      `;

      grid.appendChild(div);
    });
  })
  .catch(err => console.error("JSON Load Error (index):", err));

// --- Game page: load single game ---
if (window.location.pathname.endsWith('game.html')) {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('id');

  fetch('https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json')
    .then(response => response.json())
    .then(games => {
      const game = games.find(g => g.id === id);
      const container = document.getElementById('gameContainer');

      if (!container) return;

      if (!game) {
        container.innerHTML = "<h1>Game not found</h1>";
        return;
      }

      container.innerHTML = `
        <h1>${game.title}</h1>
        <img class="cover-large" src="${game.cover}" alt="${game.title}">
        
        <h2>Size: ${game.size}</h2>
        <p>${game.description}</p>

        <h3>Details</h3>
        <ul>
          <li><strong>Release Year:</strong> ${game.year}</li>
          <li><strong>Genre:</strong> ${game.genre}</li>
        </ul>

        ${hasRealDLC(game) ? `
          <h3>DLC</h3>
          <ul>
            ${game.dlc
              .filter(d => d.name && d.name !== "N/A")
              .map(d => `<li>${d.name} — ${d.size}</li>`)
              .join("")}
          </ul>
        ` : ""}

        <a class="back-link" href="index.html">← Back to Library</a>
      `;
    })
    .catch(err => console.error("JSON Load Error (game page):", err));
}

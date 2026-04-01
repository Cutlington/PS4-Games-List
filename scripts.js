// Load JSON file
async function loadGames() {
    const response = await fetch("games.json");
    return await response.json();
}

// ------------------------------
// INDEX PAGE LOGIC
// ------------------------------
async function initIndexPage() {
    const gameGrid = document.getElementById("gameGrid");
    if (!gameGrid) return;

    const games = await loadGames();

    populateFilters(games);
    renderGameGrid(games);

    document.getElementById("genreFilter").addEventListener("change", () => renderGameGrid(games));
    document.getElementById("platformFilter").addEventListener("change", () => renderGameGrid(games));
    document.getElementById("searchInput").addEventListener("input", () => renderGameGrid(games));
}

function populateFilters(games) {
    const genreFilter = document.getElementById("genreFilter");
    const platformFilter = document.getElementById("platformFilter");

    const genres = new Set();
    const platforms = new Set();

    games.forEach(game => {
        if (game.genre1) genres.add(game.genre1);
        if (game.genre2) genres.add(game.genre2);
        if (game.genre3) genres.add(game.genre3);
        if (game.platform) platforms.add(game.platform);
    });

    genres.forEach(g => {
        const opt = document.createElement("option");
        opt.value = g;
        opt.textContent = g;
        genreFilter.appendChild(opt);
    });

    platforms.forEach(p => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        platformFilter.appendChild(opt);
    });
}

function renderGameGrid(games) {
    const gameGrid = document.getElementById("gameGrid");
    gameGrid.innerHTML = "";

    const genre = document.getElementById("genreFilter").value;
    const platform = document.getElementById("platformFilter").value;
    const search = document.getElementById("searchInput").value.toLowerCase();

    const filtered = games.filter(game => {
        const matchesGenre = !genre || game.genre1 === genre || game.genre2 === genre || game.genre3 === genre;
        const matchesPlatform = !platform || game.platform === platform;
        const matchesSearch = game.title.toLowerCase().includes(search);
        return matchesGenre && matchesPlatform && matchesSearch;
    });

    filtered.forEach(game => {
        const div = document.createElement("div");
        div.className = "game-card";
        div.innerHTML = `
            <img src="${game.gamebade}" class="gamebadge">
            <h3>${game.title}</h3>
        `;
        div.onclick = () => {
            window.location.href = `game.html?id=${game.id}`;
        };
        gameGrid.appendChild(div);
    });
}

// ------------------------------
// GAME PAGE LOGIC
// ------------------------------
async function initGamePage() {
    const container = document.getElementById("gameContainer");
    if (!container) return;

    const games = await loadGames();
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    const game = games.find(g => g.id == id);
    if (!game) {
        container.innerHTML = "<p>Game not found.</p>";
        return;
    }

    renderGameDetails(game);
}

function renderGameDetails(game) {
    const container = document.getElementById("gameContainer");

    container.innerHTML = `
        <div class="game-header">
            <img src="${game.gamebadge}" class="gamebadge">
            <div class="game-info">
                <h1>${game.title}</h1>
                <p>${game.description}</p>
            </div>
        </div>

        <h2>DLC</h2>
        <div class="dlc-list">
            ${renderDLCList(game.dlc)}
        </div>
    `;
}

function renderDLCList(dlcArray) {
    if (!dlcArray || dlcArray.length === 0) return "<p>No DLC available.</p>";

    return dlcArray.map(dlc => `
        <div class="dlc-item">
            <img src="${dlc.dlccover}" class="dlc-cover">
            <div class="dlc-info">
                <h3>${dlc.dlcname}</h3>
                <p><strong>Size:</strong> ${dlc.dlcsize}</p>
                <p><strong>Release Year:</strong> ${dlc.dlcrelyear}</p>
                <p>${dlc.dlcdescription}</p>
            </div>
        </div>
    `).join("");
}

// ------------------------------
// PAGE INITIALIZATION
// ------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initIndexPage();
    initGamePage();
});

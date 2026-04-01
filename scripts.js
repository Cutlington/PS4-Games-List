// Load JSON file
async function loadGames() {
    const response = await fetch("games.json");
    return await response.json();
}

// ------------------------------
// FILTER STATE
// ------------------------------
const FilterState = {
    search: "",
    genres: new Set(),
    platforms: new Set(),

    reset() {
        this.search = "";
        this.genres.clear();
        this.platforms.clear();
    }
};

// ------------------------------
// INDEX PAGE LOGIC
// ------------------------------
async function initIndexPage() {
    const gameGrid = document.getElementById("gameGrid");
    if (!gameGrid) return;

    const games = await loadGames();

    generateGenreFilters(games);
    generatePlatformFilters(games);
    setupSearchFilter();
    setupResetButton(games);

    renderGameGrid(games);
}

// ------------------------------
// GENERATE GENRE CHECKBOXES
// ------------------------------
function generateGenreFilters(games) {
    const container = document.getElementById("genreFilters");
    container.innerHTML = "";

    // Collect all genres from genre1, genre2, genre3
    const genres = new Set();
    games.forEach(g => {
        if (g.genre1) genres.add(g.genre1);
        if (g.genre2) genres.add(g.genre2);
        if (g.genre3) genres.add(g.genre3);
    });

    // Sort genres so the ones used most often as genre1 appear first
    const sortedGenres = [...genres].sort((a, b) => {
        const countA = games.filter(g => g.genre1 === a).length;
        const countB = games.filter(g => g.genre1 === b).length;
        return countB - countA;
    });

    // Build checkboxes
    sortedGenres.forEach(genre => {
        const id = "genre-" + genre.replace(/\s+/g, "-").toLowerCase();

        const wrapper = document.createElement("label");
        wrapper.className = "ps4-filter-item";

        wrapper.innerHTML = `
            <input type="checkbox" class="ps4-checkbox" value="${genre}" id="${id}">
            <span class="ps4-filter-text">${genre}</span>
        `;

        container.appendChild(wrapper);
    });

    // Checkbox listeners
    container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
            if (cb.checked) FilterState.genres.add(cb.value);
            else FilterState.genres.delete(cb.value);
            applyFilters();
        });
    });
}

// ------------------------------
// GENERATE PLATFORM CHECKBOXES
// ------------------------------
function generatePlatformFilters(games) {
    const container = document.getElementById("platformFilters");
    container.innerHTML = "";

    const platforms = new Set();
    games.forEach(g => {
        if (g.platform) platforms.add(g.platform);
    });

    [...platforms].sort().forEach(platform => {
        const id = "platform-" + platform.replace(/\s+/g, "-").toLowerCase();

        const wrapper = document.createElement("label");
        wrapper.className = "ps4-filter-item";

        wrapper.innerHTML = `
            <input type="checkbox" class="ps4-checkbox" value="${platform}" id="${id}">
            <span class="ps4-filter-text">${platform}</span>
        `;

        container.appendChild(wrapper);
    });

    container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
            if (cb.checked) FilterState.platforms.add(cb.value);
            else FilterState.platforms.delete(cb.value);
            applyFilters();
        });
    });
}

// ------------------------------
// SEARCH FILTER
// ------------------------------
function setupSearchFilter() {
    const searchInput = document.getElementById("search");

    searchInput.addEventListener("input", () => {
        FilterState.search = searchInput.value.toLowerCase();
        applyFilters();
    });
}

// ------------------------------
// RESET BUTTON
// ------------------------------
function setupResetButton(games) {
    const btn = document.getElementById("resetFilters");

    btn.addEventListener("click", () => {
        FilterState.reset();

        document.querySelectorAll(".sidebar input[type='checkbox']").forEach(cb => {
            cb.checked = false;
        });

        document.getElementById("search").value = "";

        renderGameGrid(games);
    });
}

// ------------------------------
// APPLY FILTERS
// ------------------------------
async function applyFilters() {
    const games = await loadGames();
    renderGameGrid(games);
}

// ------------------------------
// RENDER GAME GRID
// ------------------------------
function renderGameGrid(games) {
    const gameGrid = document.getElementById("gameGrid");
    gameGrid.innerHTML = "";

    const filtered = games.filter(game => {
        // Search
        const matchesSearch =
            !FilterState.search ||
            game.title.toLowerCase().includes(FilterState.search);

        // Genres (game appears under ALL 3 genres)
        const gameGenres = [game.genre1, game.genre2, game.genre3].filter(Boolean);
        const matchesGenres =
            FilterState.genres.size === 0 ||
            [...FilterState.genres].every(g => gameGenres.includes(g));

        // Platforms
        const matchesPlatforms =
            FilterState.platforms.size === 0 ||
            FilterState.platforms.has(game.platform);

        return matchesSearch && matchesGenres && matchesPlatforms;
    });

    filtered.forEach(game => {
        const div = document.createElement("div");
        div.className = "game-card";
        div.innerHTML = `
            <img src="${game.gamebadge}" class="game-cover">
            <h3>${game.title}</h3>
        `;
        div.onclick = () => {
            window.location.href = `game.html?id=${game.id}`;
        };
        gameGrid.appendChild(div);
    });
}

// ------------------------------
// GAME PAGE LOGIC (unchanged)
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
            <img src="${game.gamebadge}" class="game-cover-large">
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

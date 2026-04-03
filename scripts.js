// Load JSON file
async function loadGames() {
    const response = await fetch("games.json");
    return await response.json();
}

/* ------------------------------
   GENRE NORMALIZATION MAP
------------------------------ */
const genreNormalizationMap = {
    "Action": "Action",
    "Action RPG": "RPG",
    "Adventure": "Adventure",
    "Alchemy": "Simulation",
    "Arcade": "Arcade",
    "Artillery": "Strategy",
    "Asymmetric": "Multiplayer",
    "Automation": "Simulation",
    "Basketball": "Sports",
    "Beat Em Up": "Fighting",
    "Beat 'Em Up": "Fighting",
    "Billiards": "Sports",
    "Board Game": "Strategy",
    "Building": "Simulation",
    "Card Game": "Strategy",
    "Casual": "Casual",
    "Chaos": "Action",
    "City Builder": "Simulation",
    "Classic": "Retro",
    "Co op": "Co-op",
    "Co-op": "Co-op",
    "Cooperative": "Co-op",
    "Comedy": "Casual",
    "Compilation": "Compilation",
    "Cooking": "Simulation",
    "Crafting": "Simulation",
    "Destruction": "Action",
    "Driving": "Racing",
    "Dungeon Crawler": "RPG",
    "Emergency Services": "Simulation",
    "Endless Runner": "Arcade",
    "Engineering": "Simulation",
    "Episodic": "Narrative",
    "Exploration": "Adventure",
    "Extreme Sports": "Sports",
    "Family": "Casual",
    "Fantasy": "RPG",
    "Farming": "Simulation",
    "Fighting": "Fighting",
    "First-Person": "Shooter",
    "Fishing": "Sports",
    "Fitness": "Sports",
    "Hockey": "Sports",
    "Homebrew": "Indie",
    "Horror": "Horror",
    "Hunting": "Sports",
    "Idle": "Casual",
    "Indie": "Indie",
    "Kart": "Racing",
    "Kids": "Casual",
    "Life": "Simulation",
    "Life Simulation": "Simulation",
    "Management": "Simulation",
    "Metroidvania": "Action",
    "Mini Games": "Casual",
    "Mini-Games": "Casual",
    "Mixed Martial Arts": "Sports",
    "Motorbike": "Racing",
    "Multiplayer": "Multiplayer",
    "Music": "Music",
    "Narrative": "Narrative",
    "Off-Road": "Racing",
    "Open World": "Adventure",
    "Party": "Party",
    "Physics": "Simulation",
    "Platform Fighter": "Fighting",
    "Platformer": "Platformer",
    "Pool": "Sports",
    "Puzzle": "Puzzle",
    "Quiz": "Trivia",
    "Racing": "Racing",
    "Rail Shooter": "Shooter",
    "Relaxing": "Casual",
    "Retro": "Retro",
    "Roguelike": "RPG",
    "RPG": "RPG",
    "Rugby": "Sports",
    "Sandbox": "Sandbox",
    "Sci-Fi": "Sci-Fi",
    "Shooter": "Shooter",
    "Simulation": "Simulation",
    "Skateboarding": "Sports",
    "Soccer": "Sports",
    "Sports": "Sports",
    "Stealth": "Action",
    "Story Driven": "Narrative",
    "Strategy": "Strategy",
    "Superhero": "Action",
    "Survival": "Survival",
    "Tactical": "Strategy",
    "Theme Park": "Simulation",
    "Tower Defense": "Strategy",
    "Trivia": "Trivia",
    "Turn-Based": "Strategy",
    "VR": "VR",
    "Word": "Puzzle",
    "Wrestling": "Sports"
};

function normalizeGenre(raw) {
    if (!raw) return null;
    return genreNormalizationMap[raw] || raw;
}

/* ------------------------------
   FILTER STATE
------------------------------ */
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

/* ------------------------------
   INDEX PAGE LOGIC
------------------------------ */
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

/* ------------------------------
   GENRE FILTERS
------------------------------ */
function generateGenreFilters(games) {
    const container = document.getElementById("genreFilters");
    container.innerHTML = "";

    const genres = new Set();

    games.forEach(g => {
        const g1 = normalizeGenre(g.genre1);
        const g2 = normalizeGenre(g.genre2);
        const g3 = normalizeGenre(g.genre3);

        if (g1) genres.add(g1);
        if (g2) genres.add(g2);
        if (g3) genres.add(g3);
    });

    const sortedGenres = [...genres].sort();

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

    container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", () => {
            if (cb.checked) FilterState.genres.add(cb.value);
            else FilterState.genres.delete(cb.value);
            applyFilters();
        });
    });
}

/* ------------------------------
   PLATFORM FILTERS
------------------------------ */
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

/* ------------------------------
   SEARCH FILTER
------------------------------ */
function setupSearchFilter() {
    const searchInput = document.getElementById("search");

    searchInput.addEventListener("input", () => {
        FilterState.search = searchInput.value.toLowerCase();
        applyFilters();
    });
}

/* ------------------------------
   RESET BUTTON
------------------------------ */
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

/* ------------------------------
   APPLY FILTERS
------------------------------ */
async function applyFilters() {
    const games = await loadGames();
    renderGameGrid(games);
}

/* ------------------------------
   RENDER GAME GRID
------------------------------ */
function renderGameGrid(games) {
    const gameGrid = document.getElementById("gameGrid");
    gameGrid.innerHTML = "";

    const norm = v => (v ? v.toLowerCase() : "");

    const filtered = games.filter(game => {
        const matchesSearch =
            !FilterState.search ||
            norm(game.title).includes(FilterState.search) ||
            norm(game.description).includes(FilterState.search) ||
            norm(game.genre1).includes(FilterState.search) ||
            norm(game.genre2).includes(FilterState.search) ||
            norm(game.genre3).includes(FilterState.search) ||
            norm(game.id).includes(FilterState.search) ||
            norm(game.version).includes(FilterState.search) ||
            norm(game.publisher).includes(FilterState.search) ||
            norm(game.developer).includes(FilterState.search);

        const gameGenres = [
            normalizeGenre(game.genre1),
            normalizeGenre(game.genre2),
            normalizeGenre(game.genre3)
        ].filter(Boolean);

        const matchesGenres =
            FilterState.genres.size === 0 ||
            [...FilterState.genres].every(g => gameGenres.includes(g));

        const matchesPlatforms =
            FilterState.platforms.size === 0 ||
            FilterState.platforms.has(game.platform);

        return matchesSearch && matchesGenres && matchesPlatforms;
    });

    filtered.forEach(game => {
        const div = document.createElement("div");
        div.className = "game-card";

        const realDLC = Array.isArray(game.dlc)
            ? game.dlc.filter(d => d.dlcname && d.dlcname.trim().toUpperCase() !== "N/A")
            : [];

        div.innerHTML = `
            <div class="top-info">
                <div class="game-id-display">${game.id}</div>
            </div>

            <img src="${game.gamebadge}" class="game-cover">

            <h3>${game.title}</h3>

            ${realDLC.length > 0 ? `
                <div class="dlc-wrapper dlc-below-title">
                    <img src="icons/dlc.png" class="dlc-icon">
                    <span class="dlc-count">${realDLC.length}</span>
                </div>
            ` : ``}
        `;

        div.onclick = () => {
            window.location.href = `game.html?id=${game.id}`;
        };

        gameGrid.appendChild(div);
    });
}

/* ------------------------------
   GAME PAGE LOGIC
------------------------------ */
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

    renderFullGameDetails(game);
}

/* ------------------------------
   FULL PS4-STYLE GAME DETAILS
------------------------------ */
function renderFullGameDetails(game) {
    const container = document.getElementById("gameContainer");

    const genres = [
        normalizeGenre(game.genre1),
        normalizeGenre(game.genre2),
        normalizeGenre(game.genre3)
    ].filter(Boolean);

    const heroBG = game.backgrounds?.[0] || "";

    container.innerHTML = `
        <div class="hero-header" style="background-image: url('${heroBG}');">
            <div class="hero-overlay"></div>

            <div class="hero-content">
                <img src="${game.frontcover}" class="hero-cover">

                <div class="hero-info">
                    <h1>${game.title}</h1>

                    <div class="hero-meta">
                        <p><strong>ID:</strong> ${game.id}</p>
                        <p><strong>Version:</strong> ${game.version}</p>
                        <p><strong>Platform:</strong> ${game.platform}</p>
                        <p><strong>Release Year:</strong> ${game.gamerelyear}</p>
                        <p><strong>Genres:</strong> ${genres.join(" • ")}</p>
                    </div>

                    <div class="hero-icons">
                        <img src="${game.icon1}">
                        <img src="${game.icon2}">
                    </div>

                    <div class="hero-file-details">
                        <p><strong>Game Size:</strong> ${game.gamesize}</p>
                        <p><strong>DLC Size:</strong> ${game.dlcsize}</p>
                        <p><strong>Total Size:</strong> ${game.totalsize}</p>
                        <p><strong>Highest Firmware:</strong> ${game.highestfirmware}</p>
                        <p><strong>Backport:</strong> ${game.backport}</p>
                    </div>

                    <div class="hero-features">
                        <h2>Features</h2>
                        <div class="feature-grid">
                            ${renderFeature("Multiplayer", game.multiplayer, game.multiplayericon)}
                            ${renderFeature("Online Multiplayer", game.onlinemultiplayer, game.onlinemultiplayericon)}
                            ${renderFeature("Local Multiplayer", game.localmultiplayer, game.localmultiplayericon)}
                            ${renderFeature("Co-op", game.coop, game.coopicon)}
                            ${renderFeature("Online Co-op", game.onlinecoop, game.onlinecoopicon)}
                            ${renderFeature("Local Co-op", game.localcoop, game.localcoopicon)}
                            ${renderFeature("Split Screen", game.splitscreen, game.splitscreenicon)}
                            ${renderFeature("Max Players", game.maxplayers, game.maxplayersicon)}
                            ${renderFeature("PSVR", game.psvr, game.psvricon)}
                            ${renderFeature("PS Move", game.psmove, game.psmoveicon)}
                            ${renderFeature("PS Camera", game.pscamera, game.pscameraicon)}
                            ${renderFeature("Keyboard Support", game.keyboardsupport, game.keyboardsupporticon)}
                            ${renderFeature("Mouse Support", game.mousesupport, game.mousesupporticon)}
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="section">
            <h2>Game Description</h2>
            <p>${game.gamedescription}</p>
        </div>

        <div class="section">
            <h2>DLC</h2>
            <div class="dlc-list">
                ${renderDLCList(game.dlc)}
            </div>
        </div>

        <div class="section">
            <h2>Trailer</h2>
            <div class="trailer-container">
                <iframe src="${game.trailer}" frameborder="0" allowfullscreen></iframe>
            </div>
        </div>

        <div class="section">
            <h2>Backgrounds</h2>
            <div class="background-gallery">
                ${game.backgrounds.map(bg => `<img src="${bg}" class="bg-thumb">`).join("")}
            </div>
        </div>

        <div class="section">
            <h2>Back Cover</h2>
            <img src="${game.backcover}" class="backcover-img">
        </div>
    `;
}

function renderFeature(label, value, icon) {
    if (!value || value === "N/A") return "";
    return `
        <div class="feature-item">
            <img src="${icon}" class="feature-icon">
            <span>${label}: ${value}</span>
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

/* ------------------------------
   PAGE INITIALIZATION
------------------------------ */
document.addEventListener("DOMContentLoaded", () => {
    initIndexPage();
    initGamePage();
});

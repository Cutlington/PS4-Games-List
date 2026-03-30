// --------------------------------------------------
// GENRE GROUPING MAP (CONTROLLED OUTPUT LIST)
// --------------------------------------------------
// Only genres listed here will appear in the sidebar.
// This keeps your sidebar clean and minimal.
const genreGroups = {
    // Action / Adventure
    "Action": "Action",
    "Action Adventure": "Action-Adventure",
    "Action-Adventure": "Action-Adventure",
    "Adventure": "Action-Adventure",
    "Adventure RPG": "RPG",

    // RPG
    "RPG": "RPG",
    "JRPG": "RPG",
    "Action RPG": "RPG",

    // Shooter
    "Shooter": "Shooter",
    "FPS": "Shooter",
    "First-Person Shooter": "Shooter",
    "Third-Person Shooter": "Shooter",

    // Other common genres
    "Sports": "Sports",
    "Racing": "Racing",
    "Puzzle": "Puzzle",
    "Platformer": "Platformer",
    "Fighting": "Fighting",
    "Strategy": "Strategy",
    "Simulation": "Simulation",
    "Horror": "Horror",
    "Indie": "Indie",
    "VR": "VR",
    "Trivia / Game Show": "Game Show",
    "Games Show": "Game Show",
    "Trivia": "Game Show",
    "Survival": "Survival",

    // Board Game family
    "Board Game": "Board Game",
    "Board Games": "Board Game",
    "Boardgame": "Board Game",
    "BoardGame": "Board Game",
    "Board / Game": "Board Game",
    "Board-Game": "Board Game",
    "Dice Game": "Board Game",
    "Dice / Board Game": "Board Game",
};

// --------------------------------------------------
// GENRE NORMALIZER (THE CRITICAL FIX)
// --------------------------------------------------
// This fixes:
// - NBSP characters (the real cause of Board Game failing)
// - double spaces
// - trailing/leading spaces
// - inconsistent separators
function normalizeGenre(g) {
    return g
        .replace(/\u00A0/g, " ")   // Convert NBSP → normal space
        .replace(/\s+/g, " ")      // Collapse multiple spaces
        .replace(/\s*\/\s*/g, "/") // Normalize slash
        .replace(/\s*&\s*/g, "&")  // Normalize ampersand
        .replace(/\s*-\s*/g, "-")  // Normalize hyphen
        .trim();
}

// --------------------------------------------------
// SAFE SPLITTING (NO SPLITTING ON SPACES ANYMORE)
// --------------------------------------------------
// Only split on true separators: "/", ",", "&", "-"
// This prevents "Board Game" from being split incorrectly.
function splitGenres(raw) {
    return raw
        .split(/[/,&-]/g)
        .map(g => g.trim())
        .filter(g => g.length > 0);
}

// --------------------------------------------------
// MAP RAW GENRES → CLEAN GROUPED GENRES
// --------------------------------------------------
// Option 1 behavior: Only mapped genres are shown.
// Unmapped parts are ignored.
function getGenres(game) {
    let raw = [];

    if (Array.isArray(game.genres)) raw = game.genres;
    else if (Array.isArray(game.genre)) raw = game.genre;
    else if (typeof game.genre === "string") raw = [game.genre];

    // Normalize each raw genre string
    const normalized = raw.map(normalizeGenre);

    // Split into parts using safe splitting
    const parts = normalized.flatMap(splitGenres);

    // Map each part to a grouped genre
    const mapped = parts
        .map(g => genreGroups[g] || null)
        .filter(Boolean);

    // Remove duplicates
    return [...new Set(mapped)];
}

// --------------------------------------------------
// DLC CHECK
// --------------------------------------------------
function hasRealDLC(game) {
    return (
        Array.isArray(game.dlc) &&
        game.dlc.length > 0 &&
        game.dlc.some(d => d.name && d.name !== "N/A")
    );
}

// --------------------------------------------------
// GLOBALS & FILTER STATE
// --------------------------------------------------
let allGames = [];

const FilterState = {
    genres: new Set(),
    search: "",
    letter: "all",

    reset() {
        this.genres.clear();
        this.search = "";
        this.letter = "all";
    }
};

// --------------------------------------------------
// INDEX PAGE LOGIC
// --------------------------------------------------
if (document.getElementById("games-container")) {
    fetch('https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json')
        .then(response => response.json())
        .then(games => {
            allGames = games;

            generateGenreFilters(games);
            generateLetterSort();
            renderGames(games);

            const searchInput = document.getElementById("search");
            if (searchInput) {
                searchInput.addEventListener("input", e => {
                    FilterState.search = e.target.value.toLowerCase();
                    applyFilters();
                });
            }
        })
        .catch(err => console.error("JSON Load Error (index):", err));
}

// --------------------------------------------------
// RENDER GAME GRID
// --------------------------------------------------
function renderGames(games) {
    const grid = document.getElementById('games-container');
    if (!grid) return;

    grid.innerHTML = "";

    games.forEach(game => {
        const div = document.createElement('div');
        div.className = 'game-tile';

        div.innerHTML = `
            <a href="game.html?id=${game.id}">
                <img src="${game.cover}" alt="${game.title}">
                <p class="game-title">${game.title}</p>
                <small>${game.size}</small>

                ${hasRealDLC(game) ? `
                    <div class="dlc-badge">
                        🧩 ${game.dlc.length} DLC
                    </div>
                ` : ""}
            </a>
        `;

        grid.appendChild(div);
    });
}

// --------------------------------------------------
// FILTER ENGINE
// --------------------------------------------------
function applyFilters() {
    let filtered = allGames;

    // Genre filter
    if (FilterState.genres.size > 0) {
        filtered = filtered.filter(game =>
            getGenres(game).some(g => FilterState.genres.has(g))
        );
    }

    // Search filter
    if (FilterState.search.trim() !== "") {
        const q = FilterState.search.toLowerCase();
        filtered = filtered.filter(game =>
            game.title.toLowerCase().includes(q) ||
            String(game.id).includes(q) ||
            String(game.year).includes(q)
        );
    }

    // Letter filter
    if (FilterState.letter !== "all") {
        filtered = filtered.filter(game =>
            game.title.trim().toUpperCase().startsWith(FilterState.letter)
        );
    }

    renderGames(filtered);
}

// --------------------------------------------------
// SIDEBAR FILTER GENERATOR
// --------------------------------------------------
function generateGenreFilters(games) {
    const container = document.getElementById("genreFilters");
    if (!container) return;

    const genreSet = new Set();

    // Collect all mapped genres from all games
    games.forEach(game => {
        getGenres(game).forEach(g => genreSet.add(g));
    });

    container.innerHTML = "";

    [...genreSet].sort().forEach(genre => {
        const id = "genre-" + genre.replace(/\s+/g, "-").toLowerCase();

        const wrapper = document.createElement("label");
        wrapper.className = "ps4-filter-item";

        wrapper.innerHTML = `
            <input type="checkbox" value="${genre}" id="${id}">
            <span class="ps4-filter-text">${genre}</span>
        `;

        container.appendChild(wrapper);
    });

    container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", e => {
            const g = e.target.value;
            if (e.target.checked) FilterState.genres.add(g);
            else FilterState.genres.delete(g);
            applyFilters();
        });
    });

    const resetBtn = document.getElementById("resetFilters");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            FilterState.reset();
            container.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);

            const searchInput = document.getElementById("search");
            if (searchInput) searchInput.value = "";

            const sortLetter = document.getElementById("sortLetter");
            if (sortLetter) sortLetter.value = "all";

            applyFilters();
        });
    }
}

// --------------------------------------------------
// A–Z SORT DROPDOWN GENERATOR
// --------------------------------------------------
function generateLetterSort() {
    const select = document.getElementById("sortLetter");
    if (!select) return;

    for (let i = 65; i <= 90; i++) {
        const letter = String.fromCharCode(i);
        const option = document.createElement("option");
        option.value = letter;
        option.textContent = letter;
        select.appendChild(option);
    }

    select.addEventListener("change", () => {
        FilterState.letter = select.value;
        applyFilters();
    });
}

// --------------------------------------------------
// GAME PAGE LOGIC
// --------------------------------------------------
if (window.location.pathname.endsWith('game.html')) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    fetch('https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json')
        .then(response => response.json())
        .then(games => {
            const game = games.find(g => String(g.id) === String(id));
            const container = document.getElementById('gameContainer');

            if (!container) return;

            if (!game) {
                container.innerHTML = "<h1>Game not found</h1>";
                return;
            }

            const genresText = getGenres(game).join(", ");

            container.innerHTML = `
                <h1>${game.title}</h1>
                <img class="cover-large" src="${game.cover}" alt="${game.title}">
                
                <h2>Size: ${game.size}</h2>
                <p>${game.description}</p>

                <h3>Details</h3>
                <ul>
                    <li><strong>Release Year:</strong> ${game.year}</li>
                    <li><strong>Genre:</strong> ${genresText}</li>
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

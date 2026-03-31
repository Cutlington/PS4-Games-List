// --------------------------------------------------
// GENRE GROUPING MAP (CONTROLLED OUTPUT LIST)
// --------------------------------------------------
const genreGroups = {
    "Action": "Action",
    "Action Adventure": "Action-Adventure",
    "Action-Adventure": "Action-Adventure",
    "Adventure": "Action-Adventure",
    "Adventure RPG": "RPG",

    "RPG": "RPG",
    "JRPG": "RPG",
    "Action RPG": "RPG",

    "Shooter": "Shooter",
    "FPS": "Shooter",
    "First-Person Shooter": "Shooter",
    "Third-Person Shooter": "Shooter",

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
// GENRE NORMALIZER
// --------------------------------------------------
function normalizeGenre(g) {
    return g
        .replace(/\u00A0/g, " ")
        .replace(/\s+/g, " ")
        .replace(/\s*\/\s*/g, "/")
        .replace(/\s*&\s*/g, "&")
        .replace(/\s*-\s*/g, "-")
        .trim();
}

// --------------------------------------------------
// SAFE SPLITTING
// --------------------------------------------------
function splitGenres(raw) {
    return raw
        .split(/[/,&-]/g)
        .map(g => g.trim())
        .filter(g => g.length > 0);
}

// --------------------------------------------------
// MAP RAW GENRES → CLEAN GROUPED GENRES
// --------------------------------------------------
function getGenres(game) {
    let raw = [];

    if (Array.isArray(game.genres)) raw = game.genres;
    else if (Array.isArray(game.genre)) raw = game.genre;
    else if (typeof game.genre === "string") raw = [game.genre];

    const normalized = raw.map(normalizeGenre);
    const parts = normalized.flatMap(splitGenres);

    const mapped = parts
        .map(g => genreGroups[g] || null)
        .filter(Boolean);

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
// PLATFORM ICON DETECTION
// --------------------------------------------------
function getPlatformIcons(id, isVR) {
    const icons = [];
    const upper = String(id).toUpperCase();

    if (upper.startsWith("CUSA")) {
        if (isVR === true) icons.push("icons/psvrwhite.png");
        else icons.push("icons/ps4white.png");
        return icons;
    }

    if (upper.startsWith("SLES")) {
        icons.push("icons/pswhite.png");
        return icons;
    }

    if (upper.startsWith("SLUS")) {
        icons.push("icons/ps2white.png");
        return icons;
    }

    if (upper.startsWith("UCES") || upper.startsWith("ULUS")) {
        icons.push("icons/pspwhite.png");
        return icons;
    }

    return icons;
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
    fetch("https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json")
        .then(r => r.json())
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
    const grid = document.getElementById("games-container");
    if (!grid) return;

    grid.innerHTML = "";

    games.forEach(game => {
        const div = document.createElement("div");
        div.className = "game-tile";

        const platformIconsHTML = getPlatformIcons(game.id, game.vr)
            .map(src => `<img class="platform-icon" src="${src}" alt="Platform icon">`)
            .join("");

        div.innerHTML = `
    <a href="game.html?id=${game.id}">

        <div class="game-id-title">
            <small class="game-id">${game.id}</small>
            <p class="game-title">${game.title}</p>
        </div>

        <img src="${game.cover}" alt="${game.title}">

        <div class="platform-icons">${platformIconsHTML}</div>

        ${hasRealDLC(game) ? `
            <div class="dlc-badge">🧩 ${game.dlc.length} DLC</div>
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

    if (FilterState.genres.size > 0) {
        filtered = filtered.filter(game =>
            getGenres(game).some(g => FilterState.genres.has(g))
        );
    }

    if (FilterState.search.trim() !== "") {
        const q = FilterState.search.toLowerCase();
        filtered = filtered.filter(game =>
            game.title.toLowerCase().includes(q) ||
            String(game.id).includes(q) ||
            String(game.year).includes(q)
        );
    }

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
// GAME PAGE LOGIC (UPDATED WITH ID + PLATFORM ICONS)
// --------------------------------------------------
if (window.location.pathname.endsWith("game.html")) {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");

    fetch("https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json")
        .then(r => r.json())
        .then(games => {
            const game = games.find(g => String(g.id) === String(id));
            const container = document.getElementById("gameContainer");

            if (!container) return;

            if (!game) {
                container.innerHTML = "<h1>Game not found</h1>";
                return;
            }

            const genresText = getGenres(game).join(", ");
            const platformIconsHTML = getPlatformIcons(game.id, game.vr)
                .map(src => `<img class="platform-icon" src="${src}" alt="Platform icon">`)
                .join("");

            container.innerHTML = `
                <h1>${game.title}</h1>

                <div class="game-details-header">
                    <img class="cover-large" src="${game.cover}" alt="${game.title}">

                    <div class="game-meta">
                        <h2>ID: ${game.id}</h2>

                        <div class="platform-icons" style="margin: 8px 0;">
                            ${platformIconsHTML}
                        </div>

                        <p><strong>Release Year:</strong> ${game.year}</p>
                        <p><strong>Genre:</strong> ${genresText}</p>
                    </div>
                </div>

                <h3>Description</h3>
                <p>${game.description}</p>

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

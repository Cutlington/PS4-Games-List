// ------------------------------
// HELPERS
// ------------------------------

// Normalize genres: split all combined genres into individual tags
function normalizeGenres(rawGenres) {
    return rawGenres
        .flatMap(g =>
            g
                // split on commas, slashes, ampersands, dashes
                .split(/[,/&\-]+/g)
                // also split on word boundaries like "Action Adventure"
                .flatMap(part => part.split(/\s+(?=[A-Z])/g))
        )
        .map(g => g.trim())
        .filter(g => g.length > 0);
}

// Universal genre getter (supports: genre, genres, array, string)
function getGenres(game) {
    let raw = [];

    if (Array.isArray(game.genres)) raw = game.genres;
    else if (Array.isArray(game.genre)) raw = game.genre;
    else if (typeof game.genre === "string") raw = [game.genre];

    return normalizeGenres(raw);
}

// Helper: check if DLC is real
function hasRealDLC(game) {
    return (
        Array.isArray(game.dlc) &&
        game.dlc.length > 0 &&
        game.dlc.some(d => d.name && d.name !== "N/A")
    );
}

// ------------------------------
// GLOBALS & FILTER STATE
// ------------------------------
let allGames = [];

const FilterState = {
    genres: new Set(),
    search: "",

    reset() {
        this.genres.clear();
        this.search = "";
    }
};

// ------------------------------
// INDEX PAGE LOGIC
// ------------------------------
if (document.getElementById("gameGrid")) {
    fetch('https://raw.githubusercontent.com/Cutlington/PS4-Games-List/main/games.json')
        .then(response => response.json())
        .then(games => {
            allGames = games;

            generateGenreFilters(games);
            renderGames(games);

            const searchInput = document.getElementById("searchInput");
            if (searchInput) {
                searchInput.addEventListener("input", e => {
                    FilterState.search = e.target.value.toLowerCase();
                    applyFilters();
                });
            }
        })
        .catch(err => console.error("JSON Load Error (index):", err));
}

// ------------------------------
// RENDER GAME GRID
// ------------------------------
function renderGames(games) {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;

    grid.innerHTML = "";

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
}

// ------------------------------
// FILTER ENGINE
// ------------------------------
function applyFilters() {
    let filtered = allGames;

    // Genre filtering
    if (FilterState.genres.size > 0) {
        filtered = filtered.filter(game =>
            getGenres(game).some(g => FilterState.genres.has(g))
        );
    }

    // Search filtering
    if (FilterState.search.trim() !== "") {
        const q = FilterState.search.toLowerCase();
        filtered = filtered.filter(game =>
            game.title.toLowerCase().includes(q) ||
            String(game.id).includes(q) ||
            String(game.year).includes(q)
        );
    }

    renderGames(filtered);
}

// ------------------------------
// SIDEBAR FILTER GENERATOR
// ------------------------------
function generateGenreFilters(games) {
    const container = document.getElementById("genre-filters");
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
            <span class="ps4-checkbox"></span>
            <span class="ps4-filter-text">${genre}</span>
        `;

        container.appendChild(wrapper);
    });

    // Checkbox listeners
    container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", e => {
            const g = e.target.value;
            if (e.target.checked) FilterState.genres.add(g);
            else FilterState.genres.delete(g);
            applyFilters();
        });
    });

    // Reset button
    const resetBtn = document.getElementById("resetFilters");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            FilterState.reset();
            container.querySelectorAll("input[type='checkbox']").forEach(cb => cb.checked = false);
            const searchInput = document.getElementById("searchInput");
            if (searchInput) searchInput.value = "";
            applyFilters();
        });
    }
}

// ------------------------------
// GAME PAGE LOGIC
// ------------------------------
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

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

// ------------------------------
// GLOBALS FOR FILTERING
// ------------------------------
let allGames = [];
let selectedGenres = new Set();

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
        })
        .catch(err => console.error("JSON Load Error (index):", err));
}

// Render games into the grid
function renderGames(games) {
    const grid = document.getElementById('gameGrid');
    if (!grid) return;

    grid.innerHTML = ""; // Clear existing

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

// Generate sidebar genre checkboxes
function generateGenreFilters(games) {
    const container = document.getElementById("genre-filters");
    if (!container) return;

    const genreSet = new Set();

    games.forEach(game => {
        if (Array.isArray(game.genres)) {
            game.genres.forEach(g => genreSet.add(g));
        }
    });

    container.innerHTML = "";

    genreSet.forEach(genre => {
        const id = "genre-" + genre.replace(/\s+/g, "-").toLowerCase();

        container.innerHTML += `
            <label>
                <input type="checkbox" value="${genre}" id="${id}">
                ${genre}
            </label>
        `;
    });

    // Add listeners
    container.querySelectorAll("input[type='checkbox']").forEach(cb => {
        cb.addEventListener("change", handleGenreChange);
    });

    const resetBtn = document.getElementById("resetFilters");
    if (resetBtn) resetBtn.addEventListener("click", resetFilters);
}

// Checkbox change handler
function handleGenreChange(e) {
    const genre = e.target.value;

    if (e.target.checked) {
        selectedGenres.add(genre);
    } else {
        selectedGenres.delete(genre);
    }

    applyFilters();
}

// Apply genre filtering
function applyFilters() {
    if (selectedGenres.size === 0) {
        renderGames(allGames);
        return;
    }

    const filtered = allGames.filter(game =>
        game.genres?.some(g => selectedGenres.has(g))
    );

    renderGames(filtered);
}

// Reset filters
function resetFilters() {
    selectedGenres.clear();

    document
        .querySelectorAll("#genre-filters input[type='checkbox']")
        .forEach(cb => (cb.checked = false));

    renderGames(allGames);
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
                    <li><strong>Genre:</strong> ${Array.isArray(game.genres) ? game.genres.join(", ") : game.genre}</li>
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

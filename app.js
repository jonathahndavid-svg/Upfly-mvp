document.addEventListener("DOMContentLoaded", loadGames);

async function loadGames() {
    try {
        const response = await fetch("games/games.json");
        const games = await response.json();

        const feed = document.getElementById("game-feed");

        games.forEach(game => {
            const div = document.createElement("div");
            div.classList.add("game-item");

            div.innerHTML = `
                <iframe class="game-frame" src="${game.path}"></iframe>
                <div class="game-title">${game.title}</div>
            `;

            feed.appendChild(div);
        });

    } catch (error) {
        console.error("Error cargando juegos:", error);
    }
}

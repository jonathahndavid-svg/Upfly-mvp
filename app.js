const feed = document.getElementById("feed-container");

async function cargarJuegos() {
    try {
        const res = await fetch("games/games.json");
        const juegos = await res.json();

        juegos.forEach(juego => {
            const item = document.createElement("div");
            item.classList.add("feed-item");

            item.innerHTML = `
                <img src="${juego.cover}" class="feed-image">
                <div class="feed-overlay">
                    <h2>${juego.title}</h2>
                </div>
            `;

            // abrir el juego al hacer clic
            item.addEventListener("click", () => {
                window.location.href = juego.url;
            });

            feed.appendChild(item);
        });

    } catch (err) {
        console.error("Error cargando juegos:", err);
    }
}

cargarJuegos();

const feed = document.getElementById("feed-container");

let juegos = [];
let indiceActual = 0;
const TAMANO_LOTE = 3; // cuántos juegos cargar por scroll


// -------------------------------
// Cargar lista de juegos desde JSON
// -------------------------------
async function cargarListaJuegos() {
    const res = await fetch("games/games.json");
    juegos = await res.json();

    cargarLote();  // cargar primeros juegos
}


// -------------------------------
// Cargar un lote de juegos al feed
// -------------------------------
function cargarLote() {
    const fin = indiceActual + TAMANO_LOTE;
    const lote = juegos.slice(indiceActual, fin);

    lote.forEach(juego => {
        const item = document.createElement("div");
        item.classList.add("feed-item");

        item.innerHTML = `
            <img src="${juego.cover}" class="feed-image">
            <div class="feed-overlay">
                <h2>${juego.title}</h2>
            </div>
        `;

        item.addEventListener("click", () => {
            window.location.href = juego.url;
        });

        feed.appendChild(item);
    });

    indiceActual = fin;
}


// -------------------------------
// Detectar cuando se llega al final → cargar más
// -------------------------------
feed.addEventListener("scroll", () => {
    const scrollPos = feed.scrollTop + feed.clientHeight;
    const scrollMax = feed.scrollHeight - 50;

    if (scrollPos >= scrollMax) {
        if (indiceActual < juegos.length) {
            cargarLote();
        }
    }
});


// Iniciar todo
cargarListaJuegos();

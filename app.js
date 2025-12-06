// Seleccionar contenedor del feed
const feedContainer = document.getElementById("feed-container");

let juegos = [];
let juegoActualIndex = 0;
let cargando = false;

// Cargar lista de juegos desde games/games.json
async function cargarJuegos() {
    try {
        const respuesta = await fetch("games/games.json");
        if (!respuesta.ok) throw new Error("No se pudo cargar games.json");

        juegos = await respuesta.json();
        console.log("Juegos cargados:", juegos);

        if (juegos.length > 0) {
            mostrarJuego(juegoActualIndex);
        }

    } catch (error) {
        console.error("Error cargando juegos:", error);
        feedContainer.innerHTML = `
            <p class="text-red-500 text-center mt-10">
                Error loading games. Check console.
            </p>
        `;
    }
}

// Mostrar un juego por índice
function mostrarJuego(index) {
    const juego = juegos[index];
    if (!juego) return;

    const card = document.createElement("div");
    card.className = "game-card w-full h-screen snap-start border-b border-gray-700 relative";

    card.innerHTML = `
        <div class="absolute top-0 left-0 w-full h-16 bg-black bg-opacity-20 flex items-center px-4 text-white">
            <h2 class="text-xl font-bold">${juego.title}</h2>
        </div>

        <iframe 
            src="${juego.url}" 
            class="w-full h-full border-none">
        </iframe>

        <div class="absolute bottom-4 right-4 space-y-3 flex flex-col items-center">
            <button class="bg-white text-black font-bold px-3 py-2 rounded-full shadow">Up</button>
            <button class="bg-blue-500 text-white font-bold px-3 py-2 rounded-full shadow">Super Up</button>
            <button class="bg-gray-200 text-black font-bold px-3 py-2 rounded-full shadow">💬</button>
        </div>
    `;

    feedContainer.appendChild(card);
}

// Detectar scroll infinito
window.addEventListener("scroll", () => {
    if (cargando) return;

    const bottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 200;

    if (bottom) {
        cargando = true;

        juegoActualIndex++;

        // Si llega al final, vuelve al inicio (scroll infinito)
        if (juegoActualIndex >= juegos.length) {
            juegoActualIndex = 0;
        }

        mostrarJuego(juegoActualIndex);

        setTimeout(() => {
            cargando = false;
        }, 300);
    }
});

// Iniciar sistema
cargarJuegos();

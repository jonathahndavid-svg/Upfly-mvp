// app.js - Upfly MVP (Tailwind + vanilla JS)
// Carga juegos desde ./games/games.json y muestra swipe vertical 1 juego/pantalla
// Interactions (Up, SuperUp, Comments) guardados en localStorage (MVP)

/* CONFIG */
const BATCH_SIZE = 2;      // cuántas tarjetas cargar por batch
const MAX_LOADED = 6;      // max tarjetas en DOM (prune)
const FEED_ID = 'feed-container';
const GAMES_JSON = './games/games.json';

const feed = document.getElementById(FEED_ID);
let games = [];
let nextIndex = 0;
let observer = null;
let loading = false;

// util: escape
const esc = s => (s ? String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])) : '');

// localStorage helpers
const key = (prefix, id) => `upfly_${prefix}_${id}`;
const getCount = (prefix, id) => Number(localStorage.getItem(key(prefix,id)) || 0);
const incCount = (prefix, id) => {
  const k = key(prefix,id);
  const v = Number(localStorage.getItem(k)||0) + 1;
  localStorage.setItem(k, v);
  return v;
};

// fetch list and init
async function init(){
  try{
    const res = await fetch(GAMES_JSON);
    if(!res.ok) throw new Error('games.json not found: ' + res.status);
    games = await res.json();
    if(!Array.isArray(games) || games.length === 0){
      feed.innerHTML = `<div class="p-6 text-center text-red-400">No hay juegos en games/games.json</div>`;
      return;
    }
    appendBatch();
    setupObserver();
    // listen for scores sent by games via postMessage
    window.addEventListener('message', onMessageFromGame);
  }catch(err){
    console.error(err);
    feed.innerHTML = `<div class="p-6 text-center text-red-400">Error cargando games.json — revisa consola</div>`;
  }
}

// create card DOM
function createCard(game){
  const card = document.createElement('section');
  card.className = 'card w-full flex-shrink-0 snap-start';
  card.dataset.gameId = game.id || game.url || game.title;

  // iframe
  const iframe = document.createElement('iframe');
  iframe.className = 'game-frame';
  iframe.src = game.url;
  iframe.sandbox = 'allow-scripts allow-same-origin';
  iframe.loading = 'lazy';
  iframe.setAttribute('allow','autoplay; fullscreen');

  // info box (bottom-left)
  const info = document.createElement('div');
  info.className = 'info-box absolute left-4 bottom-6 p-3 rounded-md text-left max-w-[70%]';
  info.innerHTML = `<div class="title text-xl font-semibold">${esc(game.title)}</div>
                    <div class="meta text-sm text-[#94a3b8]">${esc(game.author || '')}</div>`;

  // action buttons box (bottom-right over iframe)
  const actions = document.createElement('div');
  actions.className = 'absolute right-4 bottom-20 flex flex-col items-center gap-3';

  // Up
  const upBtn = document.createElement('button');
  upBtn.className = 'action-btn bg-white/5 hover:bg-white/10 text-white rounded-xl w-14 h-14 flex items-center justify-center';
  upBtn.innerText = '⬆';
  upBtn.onclick = (e) => { e.stopPropagation(); const v = incCount('up', game.id); upBadge.innerText = v; };

  const upBadge = document.createElement('div');
  upBadge.className = 'badge text-xs text-[#94a3b8]';
  upBadge.innerText = getCount('up', game.id);

  // Super Up
  const supBtn = document.createElement('button');
  supBtn.className = 'action-btn bg-gradient-to-br from-yellow-400 to-red-500 text-black rounded-xl w-14 h-14 flex items-center justify-center font-bold';
  supBtn.innerText = '★';
  supBtn.onclick = (e) => { e.stopPropagation(); const v = incCount('super', game.id); supBadge.innerText = v; };

  const supBadge = document.createElement('div');
  supBadge.className = 'badge text-xs text-[#94a3b8]';
  supBadge.innerText = getCount('super', game.id);

  // Down (no public counter)
  const downBtn = document.createElement('button');
  downBtn.className = 'action-btn bg-white/5 hover:bg-white/10 text-white rounded-xl w-14 h-14 flex items-center justify-center';
  downBtn.innerText = '⬇';
  downBtn.onclick = (e) => { e.stopPropagation(); incCount('down', game.id); alert('Gracias por tu feedback'); };

  // Comments
  const commBtn = document.createElement('button');
  commBtn.className = 'action-btn bg-white/5 hover:bg-white/10 text-white rounded-xl w-14 h-14 flex items-center justify-center';
  commBtn.innerText = '💬';
  commBtn.onclick = (e) => { e.stopPropagation(); openComments(game.id); };

  // append elements
  actions.appendChild(upBtn);
  actions.appendChild(upBadge);
  actions.appendChild(supBtn);
  actions.appendChild(supBadge);
  actions.appendChild(downBtn);
  actions.appendChild(commBtn);

  card.appendChild(iframe);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

// append a batch of cards
function appendBatch(){
  if(loading) return;
  loading = true;
  const end = Math.min(nextIndex + BATCH_SIZE, games.length);
  for(let i = nextIndex; i < end; i++){
    const card = createCard(games[i]);
    feed.appendChild(card);
  }
  nextIndex = end;
  loading = false;
  refreshObserver();
  pruneOld();
}

// remove oldest cards beyond MAX_LOADED
function pruneOld(){
  const cards = feed.querySelectorAll('.card');
  if(cards.length <= MAX_LOADED) return;
  const removeCount = cards.length - MAX_LOADED;
  for(let i=0;i<removeCount;i++){
    if(cards[i] && cards[i].parentNode) cards[i].parentNode.removeChild(cards[i]);
  }
}

// IntersectionObserver to load more when last is visible
function setupObserver(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if(en.isIntersecting && en.target.classList.contains('card')){
        const cards = feed.querySelectorAll('.card');
        const last = cards[cards.length - 1];
        if(en.target === last && nextIndex < games.length){
          appendBatch();
        }
      }
    });
  }, { root: feed, threshold: 0.75 });
  refreshObserver();
}

function refreshObserver(){
  if(!observer) return;
  observer.disconnect();
  const cards = feed.querySelectorAll('.card');
  if(cards.length > 0){
    observer.observe(cards[cards.length - 1]);
  }
}

// simple comments saved in localStorage
function openComments(gameId){
  const keyC = `upfly_comments_${gameId}`;
  const existing = JSON.parse(localStorage.getItem(keyC) || '[]');
  const txt = prompt('Escribe tu comentario (se guarda localmente):', '');
  if(txt && txt.trim()){
    existing.push({text: txt.trim(), date: new Date().toISOString()});
    localStorage.setItem(keyC, JSON.stringify(existing));
    alert('Comentario guardado localmente');
  }
}

// handle messages from games (postMessage)
function onMessageFromGame(ev){
  if(!ev.data || typeof ev.data !== 'object') return;
  if(ev.data.type === 'score'){
    // example: { type:'score', value: 123, gameId: 'space-runner' }
    const v = Number(ev.data.value || 0);
    const id = ev.data.gameId || (ev.source && ev.source.frameElement && ev.source.frameElement.parentElement && ev.source.frameElement.parentElement.dataset && ev.source.frameElement.parentElement.dataset.gameId);
    if(id){
      // store total score per user in localStorage aggregate
      const aggKey = 'upfly_total_score';
      const total = Number(localStorage.getItem(aggKey) || 0) + v;
      localStorage.setItem(aggKey, total);
      alert(`Score recibido: ${v}. Total acumulado (local): ${total}`);
    } else {
      alert(`Score recibido: ${v}`);
    }
  }
}

// init
init();

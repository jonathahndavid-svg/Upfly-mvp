// Upfly — Swipe infinite feed (Option C)
// Loads games from games/games.json and renders fullscreen cards, one per viewport.
// Batching + IntersectionObserver to load next batch when last visible card enters viewport.

const FEED = document.getElementById('feed');
const BATCH_SIZE = 2;         // how many cards to append per batch
const MAX_LOADED = 6;        // keep at most this many cards in DOM (old ones removed)
let gamesList = [];
let nextIndex = 0;
let loading = false;
let observer = null;

// fetch JSON list
async function loadGamesList(){
  try{
    const res = await fetch('./games/games.json');
    if(!res.ok) throw new Error('games.json not found: ' + res.status);
    gamesList = await res.json();
    // initial batch
    appendBatch();
    setupObserver();
  }catch(err){
    console.error(err);
    FEED.innerHTML = '<div style="padding:20px;color:#f88">Error cargando juegos. Revisa games/games.json</div>';
  }
}

// create card element for a game
function createCard(game){
  const card = document.createElement('section');
  card.className = 'card';
  card.dataset.gameId = game.id || game.url || game.title;

  // iframe sandbox to isolate game
  const iframe = document.createElement('iframe');
  iframe.src = game.url;
  iframe.setAttribute('allow','autoplay; fullscreen');
  iframe.loading = 'lazy';

  // info overlay
  const info = document.createElement('div');
  info.className = 'infoBox';
  info.innerHTML = `<div class="title">${escapeHtml(game.title || 'Untitled')}</div>
                    <div class="meta">${escapeHtml(game.author || '')}</div>`;

  // actions (Up, SuperUp, Down, Comments)
  const actions = document.createElement('div');
  actions.className = 'actions';
  const upBtn = makeBtn('⬆', 'up-btn');
  const upBadge = document.createElement('div'); upBadge.className='badge'; upBadge.textContent = getLocalCount('up', game.id);
  const superBtn = makeBtn('★', 'super-btn', true);
  const superBadge = document.createElement('div'); superBadge.className='badge'; superBadge.textContent = getLocalCount('super', game.id);
  const downBtn = makeBtn('⬇', 'down-btn');
  const commBtn = makeBtn('💬', 'comm-btn');

  upBtn.onclick = ()=>{ incrementLocal('up', game.id); upBadge.textContent = getLocalCount('up', game.id); }
  superBtn.onclick = ()=>{ incrementLocal('super', game.id); superBadge.textContent = getLocalCount('super', game.id); }
  downBtn.onclick = ()=>{ incrementLocal('down', game.id); alert('Gracias por tu feedback'); }
  commBtn.onclick = ()=>{ openComments(game.id); }

  actions.appendChild(upBtn); actions.appendChild(upBadge);
  actions.appendChild(superBtn); actions.appendChild(superBadge);
  actions.appendChild(downBtn);
  actions.appendChild(commBtn);

  card.appendChild(iframe);
  card.appendChild(info);
  card.appendChild(actions);

  return card;
}

// helper to create action button
function makeBtn(text, cls, isSuper=false){
  const b = document.createElement('button');
  b.className = 'action-btn' + (isSuper ? ' super' : '');
  b.title = text;
  b.innerText = text;
  return b;
}

// escape
function escapeHtml(s){ if(!s) return ''; return String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// local counts helpers
function localKey(prefix, id){ return `upfly_${prefix}_${id}`; }
function getLocalCount(prefix, id){ return Number(localStorage.getItem(localKey(prefix,id)) || 0); }
function incrementLocal(prefix, id){ const k=localKey(prefix,id); const v=Number(localStorage.getItem(k)||0)+1; localStorage.setItem(k,v); return v; }

// append a batch of cards
function appendBatch(){
  if(loading) return;
  loading = true;
  const end = Math.min(nextIndex + BATCH_SIZE, gamesList.length);
  for(let i=nextIndex;i<end;i++){
    const card = createCard(gamesList[i]);
    FEED.appendChild(card);
  }
  nextIndex = end;
  loading = false;
  // ensure observer is observing newest last card
  refreshObserver();
  // prune old nodes if too many
  pruneOldCards();
}

// prune old cards to limit memory
function pruneOldCards(){
  const cards = FEED.querySelectorAll('.card');
  if(cards.length <= MAX_LOADED) return;
  const removeCount = cards.length - MAX_LOADED;
  for(let i=0;i<removeCount;i++){
    FEED.removeChild(cards[i]);
  }
}

// IntersectionObserver: when last card visible, append next batch
function setupObserver(){
  if(observer) observer.disconnect();
  observer = new IntersectionObserver((entries) => {
    entries.forEach(en=>{
      if(en.isIntersecting && en.target.classList.contains('card')){
        // if this is last card in feed and more games exist -> append
        const cards = FEED.querySelectorAll('.card');
        const last = cards[cards.length-1];
        if(en.target === last && nextIndex < gamesList.length){
          appendBatch();
        }
      }
    });
  }, {root: FEED, threshold: 0.65});
  refreshObserver();
}

function refreshObserver(){
  if(!observer) return;
  observer.disconnect();
  const cards = FEED.querySelectorAll('.card');
  if(cards.length>0){
    const last = cards[cards.length-1];
    observer.observe(last);
  }
}

// simple comments UI (localStorage)
function openComments(gameId){
  const key = `upfly_comments_${gameId}`;
  const comments = JSON.parse(localStorage.getItem(key) || '[]');
  const txt = prompt('Comentarios para el juego (se guardan localmente):', '');
  if(txt && txt.trim()){
    comments.push({t:txt.trim(),d:new Date().toISOString()});
    localStorage.setItem(key, JSON.stringify(comments));
    alert('Comentario guardado localmente');
  }
}

// initialize
loadGamesList();

// catalog.js - Catalogue Module with search, filtering, and text-to-speech functionality

import { state } from './app.js';

let activeVerbFilter = 'all';
let activeDifficultyFilter = 'all';
let activeFavoriteFilter = 'all';
let audioSpeed = 1.0;

export function initCatalog() {
  const searchInput = document.getElementById('catalog-search');
  
  // 1. Search Event
  searchInput.addEventListener('input', () => {
    renderCatalog();
  });
  
  // 2. Verb Filters
  const verbButtons = document.querySelectorAll('#filter-verb-group .filter-btn');
  verbButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      verbButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeVerbFilter = btn.getAttribute('data-verb');
      renderCatalog();
    });
  });
  
  // 3. Difficulty Filters
  const diffButtons = document.querySelectorAll('#filter-difficulty-group .filter-btn');
  diffButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      diffButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeDifficultyFilter = btn.getAttribute('data-difficulty');
      renderCatalog();
    });
  });
  
  // 4. Favorites Filters
  const favButtons = document.querySelectorAll('#filter-favorite-group .filter-btn');
  favButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      favButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFavoriteFilter = btn.getAttribute('data-favorite');
      renderCatalog();
    });
  });

  // 5. Append Audio Speed Selector dynamically to the filters row
  appendSpeedSelector();
  
  // 6. Initial render
  renderCatalog();
}

function appendSpeedSelector() {
  const filterRow = document.querySelector('.filter-groups-row');
  if (!filterRow) return;
  
  const speedGroup = document.createElement('div');
  speedGroup.className = 'filter-group';
  speedGroup.innerHTML = `
    <span class="filter-group-label">Vitesse Audio</span>
    <div class="filter-btn-group" id="filter-speed-group">
      <button class="filter-btn active" data-speed="1.0">⚡ Normale</button>
      <button class="filter-btn" data-speed="0.65">🐢 Lente</button>
    </div>
  `;
  
  filterRow.appendChild(speedGroup);
  
  const speedButtons = speedGroup.querySelectorAll('.filter-btn');
  speedButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      speedButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      audioSpeed = parseFloat(btn.getAttribute('data-speed'));
    });
  });
}

// Speak text using Web Speech API
export function speakText(text, speed = 1.0) {
  if (!('speechSynthesis' in window)) {
    console.warn("La synthèse vocale n'est pas supportée par ce navigateur.");
    return;
  }
  
  window.speechSynthesis.cancel(); // Stop any active speech
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'fr-FR';
  utterance.rate = speed;
  
  // Try to find a high-quality French voice
  const voices = window.speechSynthesis.getVoices();
  const frVoice = voices.find(v => v.lang.startsWith('fr') && v.name.includes('Google')) ||
                  voices.find(v => v.lang.startsWith('fr')) ||
                  voices[0];
                  
  if (frVoice) {
    utterance.voice = frVoice;
  }
  
  window.speechSynthesis.speak(utterance);
}

// Render Catalogue Grid Cards
export function renderCatalog() {
  const container = document.getElementById('catalog-grid-container');
  if (!container) return;
  
  const searchQuery = document.getElementById('catalog-search').value.toLowerCase().trim();
  container.innerHTML = '';
  
  // Filter database
  const filtered = state.expressions.filter(item => {
    // Search match
    const matchesSearch = searchQuery === '' || 
                          item.expression.toLowerCase().includes(searchQuery) ||
                          item.translation.toLowerCase().includes(searchQuery) ||
                          item.definition.toLowerCase().includes(searchQuery) ||
                          item.example.toLowerCase().includes(searchQuery);
                          
    // Verb match
    const matchesVerb = activeVerbFilter === 'all' || item.verb === activeVerbFilter;
    
    // Difficulty match
    const matchesDifficulty = activeDifficultyFilter === 'all' || item.difficulty === activeDifficultyFilter;
    
    // Favorite match
    const matchesFavorite = activeFavoriteFilter === 'all' || state.favorites.includes(item.id);
    
    return matchesSearch && matchesVerb && matchesDifficulty && matchesFavorite;
  });
  
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: hsl(var(--text-muted));">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" style="margin-bottom: 1rem;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <p>Aucune expression ne correspond à votre recherche.</p>
      </div>
    `;
    return;
  }
  
  // Render cards
  filtered.forEach(item => {
    const isFav = state.favorites.includes(item.id);
    const difficultyClass = item.difficulty === 'Débutant' ? 'easy' : item.difficulty === 'Intermédiaire' ? 'medium' : 'hard';
    
    const cardEl = document.createElement('div');
    cardEl.className = 'expression-card';
    cardEl.id = `expr-card-${item.id}`;
    
    cardEl.innerHTML = `
      <div>
        <div class="card-top">
          <span class="badge badge-${difficultyClass}">${item.difficulty}</span>
          <button class="card-favorite-btn ${isFav ? 'active' : ''}" data-id="${item.id}" title="Favori">
            <svg viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
          </button>
        </div>
        
        <h3 class="expression-text">${item.expression}</h3>
        <p class="expression-translation">${item.translation}</p>
        <p class="expression-definition">${item.definition}</p>
        <div class="expression-example">${item.example}</div>
      </div>
      
      <div class="card-bottom">
        <div class="badge-row">
          <span class="badge badge-register">${item.register}</span>
          <span class="badge badge-register" style="opacity: 0.85;">${item.verb}</span>
        </div>
        <button class="audio-btn card-audio-btn" data-text="${item.expression}" title="Prononcer">
          <svg viewBox="0 0 24 24"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
        </button>
      </div>
    `;
    
    // Add Event Listeners to Card buttons
    cardEl.querySelector('.card-favorite-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const id = parseInt(btn.getAttribute('data-id'));
      const active = state.toggleFavorite(id);
      if (active) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
        // If filtering by favorites only, remove card immediately with an animation
        if (activeFavoriteFilter === 'only') {
          cardEl.style.opacity = '0';
          cardEl.style.transform = 'scale(0.8)';
          setTimeout(() => renderCatalog(), 150);
        }
      }
    });
    
    cardEl.querySelector('.card-audio-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      const btn = e.currentTarget;
      const text = btn.getAttribute('data-text');
      speakText(text, audioSpeed);
    });
    
    container.appendChild(cardEl);
  });
}

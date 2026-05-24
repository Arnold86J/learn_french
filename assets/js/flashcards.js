// flashcards.js - Flashcard Module with 3D flip, shuffle, and navigation logic

import { state } from './app.js';
import { speakText } from './catalog.js';

let currentIndex = 0;
let isShuffled = false;
let cardsSequence = []; // Array of indices

export function initFlashcards() {
  const cardEl = document.getElementById('flashcard-el');
  const clickArea = document.getElementById('flashcard-click-area');
  const prevBtn = document.getElementById('fc-btn-prev');
  const nextBtn = document.getElementById('fc-btn-next');
  const shuffleBtn = document.getElementById('fc-btn-shuffle');
  const favBtn = document.getElementById('fc-fav-btn');
  const learnedBtn = document.getElementById('fc-learned-toggle');
  const speakBtn = document.getElementById('fc-audio-speak-btn');
  
  // 1. Reset cards sequence
  resetSequence();
  
  // 2. Flip Card Event
  clickArea.addEventListener('click', (e) => {
    // Prevent flip if clicked on inner action buttons
    if (e.target.closest('#fc-fav-btn') || e.target.closest('#fc-audio-speak-btn') || e.target.closest('#fc-learned-toggle')) {
      return;
    }
    cardEl.classList.toggle('is-flipped');
  });
  
  // 3. Navigation Prev/Next
  prevBtn.addEventListener('click', () => {
    navigate(-1);
  });
  
  nextBtn.addEventListener('click', () => {
    navigate(1);
  });
  
  // Keyboard Support (Left/Right arrow keys for navigation, Space for flip)
  document.addEventListener('keydown', (e) => {
    // Only trigger if flashcards section is visible
    const section = document.getElementById('tab-flashcards');
    if (!section || !section.classList.contains('active')) return;
    
    if (e.code === 'ArrowLeft') {
      navigate(-1);
    } else if (e.code === 'ArrowRight') {
      navigate(1);
    } else if (e.code === 'Space') {
      e.preventDefault();
      cardEl.classList.toggle('is-flipped');
    }
  });
  
  // 4. Shuffle Event
  shuffleBtn.addEventListener('click', () => {
    isShuffled = !isShuffled;
    shuffleBtn.classList.toggle('active', isShuffled);
    resetSequence();
    currentIndex = 0;
    loadCard(currentIndex);
  });
  
  // 5. Favorite Toggle Event
  favBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = getCurrentItem();
    const active = state.toggleFavorite(item.id);
    favBtn.classList.toggle('active', active);
  });
  
  // 6. Learned Status Toggle Event
  learnedBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = getCurrentItem();
    const active = state.toggleLearned(item.id);
    updateLearnedButton(active);
  });
  
  // 7. Pronounce Event
  speakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const item = getCurrentItem();
    // Speak at 0.85 rate by default for learning clarity
    speakText(item.expression, 0.85);
  });
  
  // Load initial card
  loadCard(currentIndex);
}

function resetSequence() {
  cardsSequence = Array.from({ length: state.expressions.length }, (_, i) => i);
  if (isShuffled) {
    // Fisher-Yates Shuffle
    for (let i = cardsSequence.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cardsSequence[i], cardsSequence[j]] = [cardsSequence[j], cardsSequence[i]];
    }
  }
}

function getCurrentItem() {
  const dbIndex = cardsSequence[currentIndex];
  return state.expressions[dbIndex];
}

function navigate(direction) {
  const cardEl = document.getElementById('flashcard-el');
  
  // Reset flipped state with animation delay
  if (cardEl.classList.contains('is-flipped')) {
    cardEl.classList.remove('is-flipped');
    setTimeout(() => {
      currentIndex = (currentIndex + direction + cardsSequence.length) % cardsSequence.length;
      loadCard(currentIndex);
    }, 150); // Small delay to let card unflip before loading content
  } else {
    currentIndex = (currentIndex + direction + cardsSequence.length) % cardsSequence.length;
    loadCard(currentIndex);
  }
}

function loadCard(index) {
  const item = state.expressions[cardsSequence[index]];
  if (!item) return;
  
  // Update elements
  document.getElementById('fc-front-text').textContent = item.expression;
  document.getElementById('fc-front-verb-badge').textContent = `Verbe principal : ${item.verb}`;
  
  document.getElementById('fc-back-translation').textContent = item.translation;
  document.getElementById('fc-back-definition').textContent = item.definition;
  document.getElementById('fc-back-example').textContent = `"${item.example}"`;
  
  // Update Difficulty badge
  const diffBadge = document.getElementById('fc-difficulty-badge');
  diffBadge.textContent = item.difficulty;
  diffBadge.className = 'badge'; // clear old classes
  const difficultyClass = item.difficulty === 'Débutant' ? 'easy' : item.difficulty === 'Intermédiaire' ? 'medium' : 'hard';
  diffBadge.classList.add(`badge-${difficultyClass}`);
  
  // Update Register badge
  document.getElementById('fc-register-badge').textContent = item.register;
  
  // Update Favorites active status
  const isFav = state.favorites.includes(item.id);
  document.getElementById('fc-fav-btn').classList.toggle('active', isFav);
  
  // Update Learned status button
  const isLearned = state.learned.includes(item.id);
  updateLearnedButton(isLearned);
  
  // Update index indicator
  document.getElementById('fc-progress-display').textContent = `${index + 1} / ${cardsSequence.length}`;
}

function updateLearnedButton(isLearned) {
  const btn = document.getElementById('fc-learned-toggle');
  const btnText = document.getElementById('fc-learned-btn-text');
  
  if (isLearned) {
    btn.classList.add('learned');
    btnText.textContent = 'Apprise !';
  } else {
    btn.classList.remove('learned');
    btnText.textContent = 'Marquer comme appris';
  }
}

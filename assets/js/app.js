// app.js - Application Entry Point, State Management, and Routing

import { expressions } from './data.js';
import { initCatalog, renderCatalog } from './catalog.js';
import { initFlashcards } from './flashcards.js';
import { initQuiz } from './quiz.js';
import { initStats, updateStatsPage } from './stats.js';

// Global Reactive State
export const state = {
  expressions: expressions,
  favorites: [],
  learned: [],
  quizHistory: [],
  
  // Load state from localStorage
  load() {
    this.favorites = JSON.parse(localStorage.getItem('fe_favorites')) || [];
    this.learned = JSON.parse(localStorage.getItem('fe_learned')) || [];
    this.quizHistory = JSON.parse(localStorage.getItem('fe_quiz_history')) || [];
  },
  
  // Save state to localStorage
  save() {
    localStorage.setItem('fe_favorites', JSON.stringify(this.favorites));
    localStorage.setItem('fe_learned', JSON.stringify(this.learned));
    localStorage.setItem('fe_quiz_history', JSON.stringify(this.quizHistory));
    
    // Proactively update UI indicators
    updateDashboardUI();
  },
  
  // Toggle favorite status
  toggleFavorite(id) {
    const index = this.favorites.indexOf(id);
    if (index === -1) {
      this.favorites.push(id);
    } else {
      this.favorites.splice(index, 1);
    }
    this.save();
    return this.favorites.includes(id);
  },
  
  // Toggle learned status
  toggleLearned(id) {
    const index = this.learned.indexOf(id);
    if (index === -1) {
      this.learned.push(id);
    } else {
      this.learned.splice(index, 1);
    }
    this.save();
    return this.learned.includes(id);
  }
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  // 1. Load state
  state.load();
  
  // 2. Initialize modules
  initCatalog();
  initFlashcards();
  initQuiz();
  initStats();
  
  // 3. Setup global router
  setupRouter();
  
  // 4. Setup theme toggles
  setupTheme();
  
  // 5. Update initial Dashboard UI
  updateDashboardUI();
  
  // 6. Setup PWA registration
  registerServiceWorker();
  
  // Start learning button shortcut
  document.getElementById('btn-start-learning').addEventListener('click', () => {
    switchTab('flashcards');
  });
});

// Routing Engine (Tab switcher)
function setupRouter() {
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = link.getAttribute('data-tab');
      switchTab(tabId);
    });
  });
}

export function switchTab(tabId) {
  // Update desktop navigation links
  document.querySelectorAll('.nav-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Update mobile navigation links
  document.querySelectorAll('.mobile-nav-link').forEach(link => {
    if (link.getAttribute('data-tab') === tabId) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
  
  // Switch sections visible state
  document.querySelectorAll('.app-section').forEach(section => {
    if (section.id === `tab-${tabId}`) {
      section.classList.add('active');
    } else {
      section.classList.remove('active');
    }
  });
  
  // Trigger component updates on tab focus
  if (tabId === 'stats') {
    updateStatsPage();
  } else if (tabId === 'catalog') {
    renderCatalog();
  } else if (tabId === 'dashboard') {
    updateDashboardUI();
  }
}

// Theme Engine (Dark / Light mode)
function setupTheme() {
  const toggleBtn = document.getElementById('theme-toggle-desktop');
  const toggleIcon = document.getElementById('theme-icon-desktop');
  const toggleText = toggleBtn.querySelector('span');
  
  // Get preferred theme or default to dark
  let theme = localStorage.getItem('fe_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', theme);
  updateThemeUI(theme);
  
  toggleBtn.addEventListener('click', () => {
    theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fe_theme', theme);
    updateThemeUI(theme);
  });
  
  function updateThemeUI(currentTheme) {
    if (currentTheme === 'dark') {
      toggleText.textContent = 'Mode Clair';
      toggleIcon.innerHTML = '<path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707.707M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"></path>'; // Sun icon SVG
    } else {
      toggleText.textContent = 'Mode Sombre';
      toggleIcon.innerHTML = '<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>'; // Moon icon SVG
    }
  }
}

// Dashboard statistics synchronizer
function updateDashboardUI() {
  const totalLearned = state.learned.length;
  const totalFavorites = state.favorites.length;
  const totalQuizPlayed = state.quizHistory.length;
  
  document.getElementById('stat-total-learned').textContent = `${totalLearned} / 100`;
  document.getElementById('stat-total-favorites').textContent = totalFavorites;
  document.getElementById('stat-quiz-played').textContent = totalQuizPlayed;
  
  // Update activity text
  const activityTextEl = document.getElementById('dashboard-activity-text');
  if (totalQuizPlayed > 0) {
    const lastQuiz = state.quizHistory[state.quizHistory.length - 1];
    activityTextEl.innerHTML = `Vous progressez bien ! Votre dernier quiz a été réalisé sur le verbe <strong>${lastQuiz.verb === 'all' ? 'Tous' : lastQuiz.verb}</strong> avec un score de <strong>${lastQuiz.score} / ${lastQuiz.total}</strong>.<br><br>Continuez ainsi pour perfectionner vos compétences.`;
  } else if (totalLearned > 0) {
    activityTextEl.innerHTML = `Vous avez déjà appris <strong>${totalLearned}</strong> expressions indispensables !<br><br>Testez vos connaissances en réalisant votre premier Quiz.`;
  } else {
    activityTextEl.innerHTML = `Vous n'avez pas encore commencé votre parcours.<br><br>Accédez aux <strong>Flashcards</strong> pour mémoriser vos premières expressions ou consultez le <strong>Catalogue</strong> pour les écouter !`;
  }
  
  // Update Progress Ring SVG
  const circle = document.getElementById('dashboard-ring-circle');
  const pctText = document.getElementById('dashboard-progress-percentage');
  const percent = totalLearned; // Since total is 100
  
  pctText.textContent = `${percent}%`;
  
  // Circle circumference is 2 * pi * r = 2 * 3.14159 * 70 = ~439.8
  const strokeDashoffset = 439.8 - (percent / 100) * 439.8;
  circle.style.strokeDashoffset = strokeDashoffset;
}

// PWA Service Worker Registration
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(reg => console.log('Service Worker enregistré avec succès.', reg.scope))
      .catch(err => console.warn('Échec de l\'enregistrement du Service Worker.', err));
  }
}

// PWA Installation Banner Prompter
let deferredPrompt = null;
const installBanner = document.getElementById('pwa-install-banner');
const installBtn = document.getElementById('pwa-btn-install');
const closeBtn = document.getElementById('pwa-btn-close');

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  installBanner.classList.add('show');
});

installBtn.addEventListener('click', () => {
  installBanner.classList.remove('show');
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((choiceResult) => {
    if (choiceResult.outcome === 'accepted') {
      console.log('L\'utilisateur a accepté l\'installation.');
    } else {
      console.log('L\'utilisateur a décliné l\'installation.');
    }
    deferredPrompt = null;
  });
});

closeBtn.addEventListener('click', () => {
  installBanner.classList.remove('show');
});

window.addEventListener('appinstalled', () => {
  deferredPrompt = null;
  installBanner.classList.remove('show');
  console.log('L\'application a été installée avec succès !');
});


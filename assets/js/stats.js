// stats.js - Analytics Dashboard module using Chart.js

import { state } from './app.js';

let progressChart = null;

export function initStats() {
  // Stats are updated on tab focus
}

export function updateStatsPage() {
  const totalLearned = state.learned.length;
  const totalFavorites = state.favorites.length;
  const history = state.quizHistory;
  
  // 1. Update Progress Ring
  const circle = document.getElementById('stats-ring-circle');
  const pctText = document.getElementById('stats-progress-percentage');
  const legendText = document.getElementById('stats-progress-text-legend');
  
  const percent = totalLearned; // total is 100
  pctText.textContent = `${percent}%`;
  legendText.textContent = `${totalLearned} expression${totalLearned > 1 ? 's' : ''} apprise${totalLearned > 1 ? 's' : ''} sur 100.`;
  
  // Circle circumference is 2 * pi * r = ~439.8
  const strokeDashoffset = 439.8 - (percent / 100) * 439.8;
  circle.style.strokeDashoffset = strokeDashoffset;
  
  // 2. Update stats summary indicators
  document.getElementById('stats-fav-count').textContent = totalFavorites;
  
  const avgScoreEl = document.getElementById('stats-avg-score');
  if (history.length > 0) {
    const totalScorePct = history.reduce((sum, item) => sum + (item.score / item.total), 0);
    const avgPct = Math.round((totalScorePct / history.length) * 100);
    avgScoreEl.textContent = `${avgPct}%`;
  } else {
    avgScoreEl.textContent = '-';
  }
  
  // 3. Render Quiz History List
  renderQuizHistory();
  
  // 4. Render Chart.js Graph
  renderChart();
}

function renderQuizHistory() {
  const listContainer = document.getElementById('stats-quiz-history-list');
  const noHistoryText = document.getElementById('stats-no-history');
  
  listContainer.innerHTML = '';
  const history = [...state.quizHistory].reverse(); // Show latest first
  
  if (history.length === 0) {
    listContainer.appendChild(noHistoryText);
    noHistoryText.style.display = 'block';
    return;
  }
  
  history.forEach(item => {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    
    // Format verb text
    const verbLabel = item.verb === 'all' ? 'Toutes expressions' : `Verbe ${item.verb}`;
    
    historyItem.innerHTML = `
      <div class="history-item-details">
        <h5>Quiz : ${verbLabel}</h5>
        <span>Le ${item.date}</span>
      </div>
      <div class="history-item-score">
        ${item.score} / ${item.total}
      </div>
    `;
    
    listContainer.appendChild(historyItem);
  });
}

function renderChart() {
  const ctx = document.getElementById('progressChart').getContext('2d');
  
  // Compute learned counts by verb
  const verbs = ['Être', 'Avoir', 'Faire', 'Dire', 'Pouvoir', 'Aller', 'Voir', 'Savoir', 'Vouloir', 'Venir'];
  const learnedCounts = verbs.map(verb => {
    return state.expressions.filter(item => item.verb === verb && state.learned.includes(item.id)).length;
  });
  
  // Destroy old chart instance to prevent canvas rendering conflicts
  if (progressChart) {
    progressChart.destroy();
  }
  
  const isLight = document.documentElement.getAttribute('data-theme') === 'light';
  const gridColor = isLight ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.08)';
  const textColor = isLight ? '#4b5563' : '#9ca3af';
  
  progressChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: verbs,
      datasets: [{
        label: 'Expressions apprises (Max 10)',
        data: learnedCounts,
        backgroundColor: 'rgba(99, 102, 241, 0.65)',
        borderColor: 'rgba(99, 102, 241, 1)',
        borderWidth: 2,
        borderRadius: 6,
        hoverBackgroundColor: 'rgba(20, 184, 166, 0.75)',
        hoverBorderColor: 'rgba(20, 184, 166, 1)'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          max: 10,
          ticks: {
            stepSize: 2,
            color: textColor
          },
          grid: {
            color: gridColor
          }
        },
        x: {
          ticks: {
            color: textColor,
            font: {
              family: 'Outfit',
              weight: 'bold'
            }
          },
          grid: {
            display: false
          }
        }
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(18, 22, 33, 0.95)',
          titleColor: isLight ? '#1f2937' : '#f9fafb',
          bodyColor: isLight ? '#4b5563' : '#d1d5db',
          borderColor: 'rgba(99, 102, 241, 0.25)',
          borderWidth: 1,
          cornerRadius: 8,
          titleFont: {
            family: 'Outfit',
            weight: 'bold'
          },
          bodyFont: {
            family: 'Inter'
          }
        }
      }
    }
  });
}

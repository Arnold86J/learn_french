// quiz.js - Interactive Quiz Engine (QCM, True/False, Word Bank)

import { state, switchTab } from './app.js';

let activeQuestions = [];
let currentQuestionIndex = 0;
let score = 0;
let selectedOption = null;
let isAnswered = false;

export function initQuiz() {
  const startBtn = document.getElementById('quiz-btn-start');
  const actionBtn = document.getElementById('quiz-btn-action');
  const retryBtn = document.getElementById('quiz-btn-retry');
  const backSetupBtn = document.getElementById('quiz-btn-back-setup');
  
  // Start Quiz
  startBtn.addEventListener('click', () => {
    startQuizSession();
  });
  
  // Submit Answer / Next Question
  actionBtn.addEventListener('click', () => {
    if (!isAnswered) {
      validateAnswer();
    } else {
      goToNextQuestion();
    }
  });
  
  // Retry Quiz
  retryBtn.addEventListener('click', () => {
    startQuizSession();
  });
  
  // Go Back to Setup
  backSetupBtn.addEventListener('click', () => {
    resetQuizViews();
  });
}

function resetQuizViews() {
  document.getElementById('quiz-setup-container').style.display = 'block';
  document.getElementById('quiz-play-container').style.display = 'none';
  document.getElementById('quiz-results-container').style.display = 'none';
}

function startQuizSession() {
  const selectedVerb = document.getElementById('quiz-select-verb').value;
  const selectedDifficulty = document.getElementById('quiz-select-difficulty').value;
  const selectedLimit = parseInt(document.getElementById('quiz-select-limit').value);
  
  // 1. Filter matching expressions
  let eligible = state.expressions.filter(item => {
    const matchesVerb = selectedVerb === 'all' || item.verb === selectedVerb;
    const matchesDifficulty = selectedDifficulty === 'all' || item.difficulty === selectedDifficulty;
    return matchesVerb && matchesDifficulty;
  });
  
  if (eligible.length < 4) {
    alert("Pas assez d'expressions correspondantes dans la base pour générer un quiz (minimum 4 requis). Veuillez élargir vos filtres.");
    return;
  }
  
  // Shuffle eligible list
  eligible = [...eligible].sort(() => Math.random() - 0.5);
  const selectedItems = eligible.slice(0, Math.min(selectedLimit, eligible.length));
  
  // 2. Generate questions
  activeQuestions = selectedItems.map((item, index) => {
    return generateQuestion(item, eligible, index + 1);
  });
  
  // 3. Reset state
  currentQuestionIndex = 0;
  score = 0;
  isAnswered = false;
  selectedOption = null;
  
  // 4. Update UI views
  document.getElementById('quiz-setup-container').style.display = 'none';
  document.getElementById('quiz-play-container').style.display = 'block';
  document.getElementById('quiz-results-container').style.display = 'none';
  
  // Load first question
  loadQuestion(currentQuestionIndex);
}

function generateQuestion(item, database, indexNum) {
  // Randomly choose question type: 0 = QCM Translation, 1 = True/False, 2 = Fill-in-the-blank (Word bank)
  const type = Math.floor(Math.random() * 3);
  
  if (type === 0) {
    // QCM - Find Translation or Meaning
    const subType = Math.random() > 0.5; // True = translate to English, False = identify French definition
    
    // Select 3 distractors
    const distractors = database
      .filter(d => d.id !== item.id)
      .slice(0, 3);
      
    const choices = [];
    if (subType) {
      choices.push({ text: item.translation, isCorrect: true, itemId: item.id });
      distractors.forEach(d => choices.push({ text: d.translation, isCorrect: false, itemId: d.id }));
    } else {
      choices.push({ text: item.definition, isCorrect: true, itemId: item.id });
      distractors.forEach(d => choices.push({ text: d.definition, isCorrect: false, itemId: d.id }));
    }
    
    // Shuffle choices
    choices.sort(() => Math.random() - 0.5);
    
    return {
      id: indexNum,
      type: 'qcm',
      prompt: subType ? `Quelle est la traduction anglaise de l'expression : <br><strong style="color: hsl(var(--color-primary)); font-size: 1.2rem;">"${item.expression}"</strong> ?` : `Quelle est la signification correcte de l'expression : <br><strong style="color: hsl(var(--color-primary)); font-size: 1.2rem;">"${item.expression}"</strong> ?`,
      choices: choices,
      correctAnswer: subType ? item.translation : item.definition,
      explanation: `L'expression <strong>"${item.expression}"</strong> signifie "${item.definition}" (${item.translation}).`
    };
    
  } else if (type === 1) {
    // True / False
    const isCorrectRelation = Math.random() > 0.5;
    let presentedDefinition = item.definition;
    
    if (!isCorrectRelation) {
      // Find a random wrong definition
      const wrongItem = database.find(d => d.id !== item.id);
      presentedDefinition = wrongItem.definition;
    }
    
    const choices = [
      { text: 'Vrai', isCorrect: isCorrectRelation, value: true },
      { text: 'Faux', isCorrect: !isCorrectRelation, value: false }
    ];
    
    return {
      id: indexNum,
      type: 'true_false',
      prompt: `L'expression <strong style="color: hsl(var(--color-primary)); font-size: 1.15rem;">"${item.expression}"</strong> a pour signification : <br><br><em>"${presentedDefinition}"</em> ?`,
      choices: choices,
      correctAnswer: isCorrectRelation ? 'Vrai' : 'Faux',
      explanation: `L'expression <strong>"${item.expression}"</strong> signifie en réalité : <br>"${item.definition}".`
    };
    
  } else {
    // Fill in the blanks (Word Bank)
    // Find matching part of expression to replace. The examples usually contain the expression conjugated
    // We will extract a portion or just do word bank matching of expression name
    const exampleSentence = item.example;
    let blankedSentence = exampleSentence;
    
    // Try to find the expression in example (case-insensitive, strip some verbs)
    // Often, the expressions are formatted exactly, or slightly modified.
    // If we cannot find it, we will replace the key part, or fallback to hiding a specific phrase.
    let targetWord = "";
    
    // Function to escape regex special characters
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // We clean the expression to search
    const cleanExpr = item.expression.replace(/^(Être|Avoir|Faire|Dire|Pouvoir|Aller|Voir|Savoir|Vouloir|Venir)\s+(de\s+)?/, '').replace(/\s+\+\s+infinitif$/, '').trim();
    
    const escapedExpr = escapeRegExp(cleanExpr);
    const regex = new RegExp(escapedExpr, 'gi');
    if (cleanExpr && regex.test(exampleSentence)) {
      blankedSentence = exampleSentence.replace(regex, '___________');
      targetWord = exampleSentence.match(regex)[0];
    } else {
      // Fallback: replace a portion of the expression
      const words = item.expression.split(' ');
      const keyPart = words.slice(1).join(' ').replace(/\s+\+\s+infinitif$/, '').trim(); // Skip first word (verb)
      const escapedKey = escapeRegExp(keyPart);
      const regexKey = new RegExp(escapedKey, 'gi');
      if (keyPart && regexKey.test(exampleSentence)) {
        blankedSentence = exampleSentence.replace(regexKey, '___________');
        targetWord = exampleSentence.match(regexKey)[0];
      } else {
        // Ultimate fallback: Hide the whole expression in the prompt
        blankedSentence = `"${exampleSentence}"`;
        targetWord = item.expression;
      }
    }
    
    // Generate distractors
    const distractors = database
      .filter(d => d.id !== item.id)
      .slice(0, 3)
      .map(d => d.expression.replace(/^(Être|Avoir|Faire|Dire|Pouvoir|Aller|Voir|Savoir|Vouloir|Venir)\s+/, '').trim());
      
    const choices = [
      { text: targetWord, isCorrect: true },
      ...distractors.map(text => ({ text: text, isCorrect: false }))
    ];
    choices.sort(() => Math.random() - 0.5);
    
    return {
      id: indexNum,
      type: 'fill_blank',
      prompt: `Complétez la phrase d'exemple avec l'expression manquante : <br><br><span class="fill-blank-container">"${blankedSentence}"</span>`,
      choices: choices,
      correctAnswer: targetWord,
      explanation: `La phrase complète est : <br><strong>"${exampleSentence}"</strong>`
    };
  }
}

function loadQuestion(index) {
  const question = activeQuestions[index];
  if (!question) return;
  
  isAnswered = false;
  selectedOption = null;
  
  // Disable next/validate button until option selected
  const actionBtn = document.getElementById('quiz-btn-action');
  actionBtn.textContent = 'Valider';
  actionBtn.disabled = true;
  
  // Hide feedback box
  const feedbackBox = document.getElementById('quiz-feedback-box');
  feedbackBox.className = 'quiz-feedback-box';
  feedbackBox.style.display = 'none';
  
  // Update progress text and fill bar
  document.getElementById('quiz-progress-text').textContent = `Question ${index + 1} / ${activeQuestions.length}`;
  const pct = ((index) / activeQuestions.length) * 100;
  document.getElementById('quiz-progress-fill').style.width = `${pct}%`;
  
  // Inject question text
  document.getElementById('quiz-type-title').textContent = 
    question.type === 'qcm' ? 'Question à choix multiples' : 
    question.type === 'true_false' ? 'Vrai ou Faux' : 'Compléter la phrase';
    
  document.getElementById('quiz-question-prompt').innerHTML = question.prompt;
  
  // Inject choices
  const wrapper = document.getElementById('quiz-options-wrapper');
  wrapper.innerHTML = '';
  
  question.choices.forEach((choice, idx) => {
    const optionBtn = document.createElement('button');
    optionBtn.className = 'quiz-option-btn';
    optionBtn.setAttribute('data-index', idx);
    
    const alphabet = ['A', 'B', 'C', 'D'];
    const marker = question.type === 'true_false' ? (choice.text === 'Vrai' ? '✓' : '✗') : alphabet[idx];
    
    optionBtn.innerHTML = `
      <span>${choice.text}</span>
      <span class="option-marker">${marker}</span>
    `;
    
    optionBtn.addEventListener('click', () => {
      if (isAnswered) return;
      
      // Select option
      const currentSelected = wrapper.querySelector('.quiz-option-btn.selected');
      if (currentSelected) currentSelected.classList.remove('selected');
      
      optionBtn.classList.add('selected');
      selectedOption = choice;
      actionBtn.disabled = false;
    });
    
    wrapper.appendChild(optionBtn);
  });
}

function validateAnswer() {
  isAnswered = true;
  const question = activeQuestions[currentQuestionIndex];
  const wrapper = document.getElementById('quiz-options-wrapper');
  const actionBtn = document.getElementById('quiz-btn-action');
  const feedbackBox = document.getElementById('quiz-feedback-box');
  const feedbackTitle = document.getElementById('quiz-feedback-title');
  const feedbackDesc = document.getElementById('quiz-feedback-desc');
  
  // Find buttons
  const buttons = wrapper.querySelectorAll('.quiz-option-btn');
  buttons.forEach(btn => {
    btn.classList.add('disabled');
    const idx = parseInt(btn.getAttribute('data-index'));
    const choice = question.choices[idx];
    
    if (choice.isCorrect) {
      btn.classList.add('correct');
    }
  });
  
  const isCorrect = selectedOption.isCorrect;
  
  if (isCorrect) {
    score++;
    feedbackBox.className = 'quiz-feedback-box correct';
    feedbackTitle.textContent = 'Excellent !';
    feedbackDesc.innerHTML = question.explanation;
  } else {
    // Mark chosen option as incorrect
    const selectedBtn = Array.from(buttons).find(btn => btn.classList.contains('selected'));
    if (selectedBtn) selectedBtn.classList.add('incorrect');
    
    feedbackBox.className = 'quiz-feedback-box incorrect';
    feedbackTitle.textContent = 'Oups !';
    feedbackDesc.innerHTML = question.explanation;
  }
  
  feedbackBox.style.display = 'block';
  actionBtn.textContent = currentQuestionIndex === activeQuestions.length - 1 ? 'Terminer' : 'Suivant';
}

function goToNextQuestion() {
  currentQuestionIndex++;
  if (currentQuestionIndex < activeQuestions.length) {
    loadQuestion(currentQuestionIndex);
  } else {
    showQuizResults();
  }
}

function showQuizResults() {
  // 1. Hide playing box
  document.getElementById('quiz-play-container').style.display = 'none';
  const resultsContainer = document.getElementById('quiz-results-container');
  resultsContainer.style.display = 'block';
  
  // 2. Set score display
  document.getElementById('quiz-results-score').textContent = `${score} / ${activeQuestions.length}`;
  
  // 3. Set congratulation message based on performance
  const pct = (score / activeQuestions.length) * 100;
  const titleEl = document.getElementById('quiz-results-title');
  if (pct === 100) {
    titleEl.textContent = "🏆 Parfait ! Sans faute !";
  } else if (pct >= 80) {
    titleEl.textContent = "🥇 Excellent travail !";
  } else if (pct >= 50) {
    titleEl.textContent = "🥈 Pas mal du tout !";
  } else {
    titleEl.textContent = "📚 Continuez d'étudier !";
  }
  
  // 4. Save session to history state
  const selectedVerb = document.getElementById('quiz-select-verb').value;
  const dateStr = new Date().toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  state.quizHistory.push({
    date: dateStr,
    verb: selectedVerb,
    score: score,
    total: activeQuestions.length
  });
  
  state.save();
}

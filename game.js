'use strict';

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
const gameState = {
  activeGame: null,
  activeLevelIndex: 0,
  score: 0,
  totalAnswered: 0,
  questionsPerRound: 5,
  questionIndex: 0,
  questions: [],
  currentQ: null,
  answered: false,
  unlockedLevelCount: 1,
  completedLevels: [],
};

// ─────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────
const STORAGE_KEYS = {
  unlocked: 'miloUnlockedLevelCount',
  completed: 'miloCompletedLevels',
};

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function repeat(char, n) {
  return Array(n).fill(char).join(' ');
}

function randomFrom(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function getLevel(levelIndex) {
  return LEVELS[levelIndex];
}

function getCurrentLevel() {
  return getLevel(gameState.activeLevelIndex);
}

function hasNextLevel(levelIndex) {
  return levelIndex + 1 < LEVELS.length;
}

function isNextLevelUnlocked(levelIndex) {
  return hasNextLevel(levelIndex) && levelIndex + 1 < gameState.unlockedLevelCount;
}

function loadProgress() {
  try {
    const unlocked = Number(window.localStorage.getItem(STORAGE_KEYS.unlocked)) || 1;
    const completed = JSON.parse(window.localStorage.getItem(STORAGE_KEYS.completed) || '[]');
    gameState.unlockedLevelCount = Math.min(Math.max(unlocked, 1), LEVELS.length);
    gameState.completedLevels = Array.isArray(completed)
      ? completed.filter(levelIndex => Number.isInteger(levelIndex) && levelIndex >= 0 && levelIndex < LEVELS.length)
      : [];
  } catch (error) {
    gameState.unlockedLevelCount = 1;
    gameState.completedLevels = [];
  }
}

function saveProgress() {
  try {
    window.localStorage.setItem(STORAGE_KEYS.unlocked, String(gameState.unlockedLevelCount));
    window.localStorage.setItem(STORAGE_KEYS.completed, JSON.stringify(gameState.completedLevels));
  } catch (error) {
    // Ignore storage issues so the game still works in restricted browsers.
  }
}

function markLevelComplete(levelIndex) {
  if (!gameState.completedLevels.includes(levelIndex)) {
    gameState.completedLevels.push(levelIndex);
    gameState.completedLevels.sort((a, b) => a - b);
  }

  let unlockMessage = 'You cleared this level! Replay it anytime for more stars.';
  const nextLevelIndex = levelIndex + 1;
  if (hasNextLevel(levelIndex) && gameState.unlockedLevelCount <= nextLevelIndex) {
    gameState.unlockedLevelCount = nextLevelIndex + 1;
    playSound('unlock');
    unlockMessage = 'New level unlocked: ' + LEVELS[nextLevelIndex].name + '!';
  }

  saveProgress();
  updateScoreDisplay();
  updateMapProgressText();
  renderLevelMap();
  return unlockMessage;
}

// ─────────────────────────────────────────────
//  Screen navigation
// ─────────────────────────────────────────────
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
}

// ─────────────────────────────────────────────
//  Mini-game definitions
// ─────────────────────────────────────────────

/* ── 1. Counting Chaos ─────────────────────── */
const COUNTING_ITEMS = [
  { emoji: '��', name: 'balloons' },
  { emoji: '🍌', name: 'bananas'  },
  { emoji: '⭐', name: 'stars'    },
  { emoji: '🐝', name: 'bees'     },
  { emoji: '🍎', name: 'apples'   },
  { emoji: '🌸', name: 'flowers'  },
];
const MAX_COUNTING_LIMIT = 25;

function makeCountingQuestion(level) {
  const item  = COUNTING_ITEMS[randInt(0, COUNTING_ITEMS.length - 1)];
  const minCount = level.minCount || 1;
  const maxCount = level.maxCount || 20;
  const distractorRange = level.distractorRange || 4;
  const count = randInt(minCount, maxCount);
  const correct = count;

  const distractors = new Set();
  const maxChoiceLimit = Math.max(maxCount + distractorRange + 2, MAX_COUNTING_LIMIT);
  while (distractors.size < 3) {
    const d = correct + randInt(-distractorRange, distractorRange);
    if (d !== correct && d >= 1 && d <= maxChoiceLimit) distractors.add(d);
  }

  return {
    type: 'counting',
    scene: repeat(item.emoji, count),
    question: 'How many ' + item.name + ' does Milo see? 🐵',
    correct,
    choices: shuffle([correct, ...distractors]),
    wrongAnim: 'float',
    wrongMsg: 'Oh no! Milo grabbed too many balloons and FLEW AWAY! 🎈🎈🎈',
    correctMsg: 'Great counting! Milo lands safely! 🐵🎉',
  };
}

/* ── 2. Measuring Mayhem ───────────────────── */
const MEASURE_PAIRS = [
  { a: { emoji: '🌳', label: 'a big tree'   }, b: { emoji: '🌱', label: 'a tiny sprout'    } },
  { a: { emoji: '🐘', label: 'an elephant'  }, b: { emoji: '🐭', label: 'a mouse'           } },
  { a: { emoji: '🏠', label: 'a house'      }, b: { emoji: '⛺', label: 'a tent'             } },
  { a: { emoji: '🚂', label: 'a train'      }, b: { emoji: '🚲', label: 'a bicycle'         } },
  { a: { emoji: '🍉', label: 'a watermelon' }, b: { emoji: '🍇', label: 'grapes'             } },
  { a: { emoji: '🦕', label: 'a dinosaur'   }, b: { emoji: '🐇', label: 'a bunny'           } },
  { a: { emoji: '🌊', label: 'the ocean'    }, b: { emoji: '🛁', label: 'a bathtub'         } },
  { a: { emoji: '🌞', label: 'the sun'      }, b: { emoji: '🌙', label: 'the moon'          } },
];

function makeMeasuringQuestion(level) {
  const pair     = MEASURE_PAIRS[randInt(0, MEASURE_PAIRS.length - 1)];
  const askBig   = Math.random() < 0.5;
  const bigLabel = pair.a.emoji + ' ' + pair.a.label;
  const smlLabel = pair.b.emoji + ' ' + pair.b.label;
  const correct  = askBig ? bigLabel : smlLabel;
  const choices  = [bigLabel, smlLabel];

  if (level.includeThirdChoice) {
    let decoy = correct;
    while (choices.includes(decoy)) {
      const extraPair = randomFrom(MEASURE_PAIRS);
      decoy = Math.random() < 0.5
        ? extraPair.a.emoji + ' ' + extraPair.a.label
        : extraPair.b.emoji + ' ' + extraPair.b.label;
    }
    choices.push(decoy);
  }

  return {
    type: 'measuring',
    scene: pair.a.emoji + '   ' + pair.b.emoji,
    question: askBig
      ? 'Which is BIGGER: ' + pair.a.label + ' or ' + pair.b.label + '?'
      : 'Which is SMALLER: ' + pair.a.label + ' or ' + pair.b.label + '?',
    correct,
    choices: shuffle(choices),
    wrongAnim: 'fall',
    wrongMsg: 'Oops! Milo measured wrong and fell into the jelly! 🫙💥',
    correctMsg: 'Perfect measuring! Milo stays dry! 📏🐵✨',
  };
}

/* ── 3. Sharing Snacks ─────────────────────── */
const SNACK_ITEMS = [
  { emoji: '🍌', name: 'bananas' },
  { emoji: '🍪', name: 'cookies' },
  { emoji: '🍓', name: 'berries' },
  { emoji: '🥜', name: 'peanuts' },
  { emoji: '🍬', name: 'candies' },
];

function makeSharingQuestion(level) {
  const item  = SNACK_ITEMS[randInt(0, SNACK_ITEMS.length - 1)];
  const mode  = randInt(0, 2); // 0=addition  1=subtraction  2=sharing

  let question, correct, scene;
  const additionRange = level.additionRange || [1, 10];
  const subtractionTotalRange = level.subtractionTotalRange || [3, 15];
  const sharingFriendsRange = level.sharingFriendsRange || [2, 4];
  const sharingPerFriendRange = level.sharingPerFriendRange || [1, 5];

  if (mode === 0) {
    const a = randInt(additionRange[0], additionRange[1]);
    const b = randInt(additionRange[0], additionRange[1]);
    correct  = a + b;
    scene    = repeat(item.emoji, a) + '  ➕  ' + repeat(item.emoji, b);
    question = 'Milo has ' + a + ' ' + item.name + ', then finds ' + b + ' more. How many altogether?';
  } else if (mode === 1) {
    const total = randInt(subtractionTotalRange[0], subtractionTotalRange[1]);
    const eaten = randInt(1, total - 1);
    correct  = total - eaten;
    scene    = repeat(item.emoji, total);
    question = 'Milo has ' + total + ' ' + item.name + ' and eats ' + eaten + '. How many are left?';
  } else {
    const friends   = randInt(sharingFriendsRange[0], sharingFriendsRange[1]);
    const perFriend = randInt(sharingPerFriendRange[0], sharingPerFriendRange[1]);
    const total     = friends * perFriend;
    correct  = perFriend;
    scene    = repeat(item.emoji, total);
    question = 'Milo shares ' + total + ' ' + item.name + ' equally among ' + friends + ' friends. How many each?';
  }

  const distractors = new Set();
  while (distractors.size < 3) {
    const d = correct + randInt(-4, 4);
    if (d !== correct && d >= 0 && d <= 30) distractors.add(d);
  }

  return {
    type: 'sharing',
    scene,
    question,
    correct,
    choices: shuffle([correct, ...distractors]),
    wrongAnim: 'tumble',
    wrongMsg: 'Uh oh! Wrong share! The friends rolled away with ALL the snacks! 🍌🎲',
    correctMsg: 'Sharing is caring! Everyone gets their snacks! 🐵🍌🎉',
  };
}

/* ── 4. Weight Trouble ─────────────────────── */
const WEIGHT_PAIRS = [
  { a: { emoji: '🧲', label: 'a magnet'        }, b: { emoji: '🪶', label: 'a feather'        } },
  { a: { emoji: '🪨', label: 'a big rock'      }, b: { emoji: '🍃', label: 'a leaf'           } },
  { a: { emoji: '📚', label: 'books'            }, b: { emoji: '🎈', label: 'a balloon'        } },
  { a: { emoji: '🚗', label: 'a toy car'       }, b: { emoji: '🧸', label: 'a teddy bear'     } },
  { a: { emoji: '🍎', label: 'an apple'         }, b: { emoji: '🍓', label: 'a strawberry'     } },
  { a: { emoji: '⚽', label: 'a football'       }, b: { emoji: '🏓', label: 'a ping pong ball' } },
  { a: { emoji: '🦁', label: 'a lion'           }, b: { emoji: '🐹', label: 'a hamster'        } },
];

function makeWeightQuestion(level) {
  const pair      = WEIGHT_PAIRS[randInt(0, WEIGHT_PAIRS.length - 1)];
  const askHeavy  = Math.random() < 0.5;
  const heavyLabel = pair.a.emoji + ' ' + pair.a.label;
  const lightLabel = pair.b.emoji + ' ' + pair.b.label;
  const correct    = askHeavy ? heavyLabel : lightLabel;
  const choices    = [heavyLabel, lightLabel];

  if (level.includeThirdChoice) {
    let decoy = correct;
    while (choices.includes(decoy)) {
      const extraPair = randomFrom(WEIGHT_PAIRS);
      decoy = Math.random() < 0.5
        ? extraPair.a.emoji + ' ' + extraPair.a.label
        : extraPair.b.emoji + ' ' + extraPair.b.label;
    }
    choices.push(decoy);
  }

  return {
    type: 'weight',
    scene: 'seesaw',
    seesawA: pair.a.emoji,
    seesawB: pair.b.emoji,
    question: askHeavy
      ? 'Which is HEAVIER: ' + pair.a.label + ' or ' + pair.b.label + '?'
      : 'Which is LIGHTER: ' + pair.a.label + ' or ' + pair.b.label + '?',
    correct,
    choices: shuffle(choices),
    wrongAnim: 'launch',
    wrongMsg: 'BOING! Wrong weight — Milo got launched off the seesaw! 🪂',
    correctMsg: 'The seesaw balances! Great thinking! ⚖️🐵🎊',
  };
}

// ─────────────────────────────────────────────
//  Game registry
// ─────────────────────────────────────────────
const MINI_GAMES = {
  counting: { title: 'Counting Chaos 🎈',   makeQuestion: makeCountingQuestion  },
  measuring:{ title: 'Measuring Mayhem 📏', makeQuestion: makeMeasuringQuestion },
  sharing:  { title: 'Sharing Snacks 🍌',   makeQuestion: makeSharingQuestion   },
  weight:   { title: 'Weight Trouble ⚖️',   makeQuestion: makeWeightQuestion    },
};

const LEVELS = [
  {
    name: 'Level 1 · Balloon Trail',
    game: 'counting',
    icon: '🎈',
    badge: 'Count 1–10',
    description: 'Warm up by counting Milo’s first balloon bundles.',
    questionsPerRound: 5,
    minCount: 1,
    maxCount: 10,
    distractorRange: 2,
  },
  {
    name: 'Level 2 · Giant or Tiny',
    game: 'measuring',
    icon: '📏',
    badge: 'Big / Small',
    description: 'Pick the bigger or smaller thing on Milo’s trail.',
    questionsPerRound: 5,
  },
  {
    name: 'Level 3 · Snack Split',
    game: 'sharing',
    icon: '🍌',
    badge: 'Easy Sums',
    description: 'Share Milo’s snacks with tiny totals and easy math.',
    questionsPerRound: 5,
    additionRange: [1, 6],
    subtractionTotalRange: [4, 10],
    sharingFriendsRange: [2, 3],
    sharingPerFriendRange: [1, 4],
  },
  {
    name: 'Level 4 · Seesaw Start',
    game: 'weight',
    icon: '⚖️',
    badge: 'Heavy / Light',
    description: 'Balance the jungle seesaw with simple weight picks.',
    questionsPerRound: 5,
  },
  {
    name: 'Level 5 · Counting Canopy',
    game: 'counting',
    icon: '🌴',
    badge: 'Count 6–18',
    description: 'Count bigger bunches before Milo floats into the canopy.',
    questionsPerRound: 6,
    minCount: 6,
    maxCount: 18,
    distractorRange: 4,
  },
  {
    name: 'Level 6 · Size Safari',
    game: 'measuring',
    icon: '🦒',
    badge: 'Extra Choice',
    description: 'A trickier size challenge with one extra silly answer.',
    questionsPerRound: 6,
    includeThirdChoice: true,
  },
  {
    name: 'Level 7 · Banana Bonanza',
    game: 'sharing',
    icon: '🍌',
    badge: 'Bigger Math',
    description: 'Solve larger addition, subtraction, and sharing puzzles.',
    questionsPerRound: 6,
    additionRange: [3, 12],
    subtractionTotalRange: [8, 18],
    sharingFriendsRange: [2, 5],
    sharingPerFriendRange: [2, 6],
  },
  {
    name: 'Level 8 · Monkey Master',
    game: 'weight',
    icon: '🏆',
    badge: 'Expert Picks',
    description: 'Milo’s final weight challenge adds another answer to dodge.',
    questionsPerRound: 7,
    includeThirdChoice: true,
  },
];

// ─────────────────────────────────────────────
//  Build a round of questions
// ─────────────────────────────────────────────
function buildRound(level) {
  const mk = MINI_GAMES[level.game].makeQuestion;
  return Array.from({ length: gameState.questionsPerRound }, () => mk(level));
}

// ─────────────────────────────────────────────
//  Score display helpers
// ─────────────────────────────────────────────
function updateScoreDisplay() {
  document.getElementById('score-display').textContent =
    '⭐ Levels Cleared: ' + gameState.completedLevels.length + ' / ' + LEVELS.length;
}

function updateMapProgressText() {
  const progressText = document.getElementById('map-progress-text');
  if (!progressText) return;

  if (gameState.completedLevels.length >= LEVELS.length) {
    progressText.textContent = 'Amazing! You unlocked every stop on Milo’s jungle map!';
    return;
  }

  const nextLevel = LEVELS[Math.max(gameState.unlockedLevelCount - 1, 0)];
  progressText.textContent = 'Next jungle stop: ' + nextLevel.name + '. Tap any unlocked level to play!';
}

function renderLevelMap() {
  const mapEl = document.getElementById('level-map');
  if (!mapEl) return;

  mapEl.innerHTML = '';

  LEVELS.forEach((level, levelIndex) => {
    const unlocked = levelIndex < gameState.unlockedLevelCount;
    const completed = gameState.completedLevels.includes(levelIndex);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'level-node ' + (completed ? 'completed' : (unlocked ? 'unlocked' : 'locked'));
    button.setAttribute('aria-label', level.name + (unlocked ? '' : ' locked'));
    button.setAttribute('aria-disabled', unlocked ? 'false' : 'true');
    button.innerHTML =
      '<span class="level-step">' + (levelIndex + 1) + '</span>' +
      '<span class="card-icon">' + level.icon + '</span>' +
      '<div class="card-title">' + level.name + '</div>' +
      '<div class="card-desc">' + level.description + '</div>' +
      '<span class="card-badge">' + level.badge + '</span>' +
      '<span class="card-status">' + (completed ? 'Cleared ✅' : (unlocked ? 'Ready to play' : 'Locked 🔒')) + '</span>';
    button.addEventListener('click', () => {
      if (!unlocked) {
        playSound('locked');
        return;
      }
      startLevel(levelIndex);
    });
    mapEl.appendChild(button);
  });
}

// ─────────────────────────────────────────────
//  Render the current question
// ─────────────────────────────────────────────
function renderQuestion() {
  const q = gameState.currentQ;

  document.getElementById('game-title-label').textContent = MINI_GAMES[gameState.activeGame].title;
  document.getElementById('question-counter').textContent =
    'Q ' + (gameState.questionIndex + 1) + ' / ' + gameState.questionsPerRound;

  // Reset Milo animation
  const miloEl = document.getElementById('milo-char');
  miloEl.className = 'milo-character';
  void miloEl.offsetWidth; // reflow

  // Scene
  const sceneEl = document.getElementById('question-scene');
  if (q.type === 'weight') {
    sceneEl.innerHTML =
      '<div class="seesaw-container">' +
        '<div class="seesaw-side">' +
          '<span style="font-size:2.8rem">' + q.seesawA + '</span>' +
          '<div class="seesaw-bar" style="transform:rotate(-12deg)"></div>' +
        '</div>' +
        '<div class="seesaw-pivot">' +
          '<div class="seesaw-fulcrum"></div>' +
        '</div>' +
        '<div class="seesaw-side">' +
          '<div class="seesaw-bar" style="transform:rotate(12deg)"></div>' +
          '<span style="font-size:2.8rem">' + q.seesawB + '</span>' +
        '</div>' +
      '</div>';
  } else {
    sceneEl.innerHTML = '<div class="question-emoji-row">' + q.scene + '</div>';
  }

  document.getElementById('question-text').textContent = q.question;

  // Answer buttons
  const grid = document.getElementById('answers-grid');
  grid.innerHTML = '';
  q.choices.forEach(choice => {
    const btn = document.createElement('button');
    btn.className = 'answer-btn';
    btn.textContent = choice;
    btn.dataset.value = choice;
    btn.addEventListener('click', () => handleAnswer(choice));
    grid.appendChild(btn);
  });

  // Clear feedback
  const fb = document.getElementById('feedback-banner');
  fb.className = 'feedback-banner';
  fb.innerHTML = '';

  document.getElementById('next-btn').style.display = 'none';
  gameState.answered = false;
}

// ─────────────────────────────────────────────
//  Handle answer selection
// ─────────────────────────────────────────────
function handleAnswer(chosen) {
  if (gameState.answered) return;
  gameState.answered = true;
  gameState.totalAnswered++;

  const q = gameState.currentQ;
  const isCorrect = String(chosen) === String(q.correct);

  // Style buttons
  document.querySelectorAll('.answer-btn').forEach(btn => {
    btn.disabled = true;
    if (String(btn.dataset.value) === String(q.correct)) {
      btn.classList.add('correct');
    } else if (String(btn.dataset.value) === String(chosen) && !isCorrect) {
      btn.classList.add('wrong');
    }
  });

  // Milo animation
  const miloEl = document.getElementById('milo-char');
  miloEl.className = 'milo-character';
  void miloEl.offsetWidth;
  miloEl.classList.add(isCorrect ? 'celebrate' : (q.wrongAnim || 'tumble'));

  if (isCorrect) gameState.score++;
  playSound(isCorrect ? 'correct' : 'wrong');

  // Feedback
  const fb = document.getElementById('feedback-banner');
  if (isCorrect) {
    fb.className = 'feedback-banner correct';
    fb.innerHTML = '<span class="feedback-icon">🎉</span>' + q.correctMsg;
  } else {
    fb.className = 'feedback-banner wrong';
    fb.innerHTML = '<span class="feedback-icon">😬</span>' + q.wrongMsg;
  }

  // Show next / finish button
  const nextBtn = document.getElementById('next-btn');
  const isLast  = gameState.questionIndex >= gameState.questionsPerRound - 1;
  nextBtn.textContent = isLast ? 'See Results 🏆' : 'Next Question ➡️';
  nextBtn.style.display = 'inline-block';
}

// ─────────────────────────────────────────────
//  Advance to next question or results
// ─────────────────────────────────────────────
function advanceQuestion() {
  gameState.questionIndex++;
  if (gameState.questionIndex >= gameState.questionsPerRound) {
    showResults();
  } else {
    gameState.currentQ = gameState.questions[gameState.questionIndex];
    renderQuestion();
  }
}

// ─────────────────────────────────────────────
//  Show results screen
// ─────────────────────────────────────────────
function showResults() {
  const level = getCurrentLevel();
  const pct = gameState.score / gameState.questionsPerRound;
  let stars = '⭐';
  let msg   = 'Good effort! Keep practicing with Milo!';
  if (pct === 1) {
    stars = '⭐⭐⭐';
    msg   = 'PERFECT SCORE! Milo is so proud of you! 🐵🎊';
  } else if (pct >= 0.6) {
    stars = '⭐⭐';
    msg   = 'Great job! You are getting really good at math! 🐵';
  }

  document.getElementById('results-score-text').textContent =
    'You got ' + gameState.score + ' out of ' + gameState.questionsPerRound + ' correct!';
  document.getElementById('results-stars').textContent = stars;
  document.getElementById('results-msg').textContent = msg;
  document.getElementById('results-game-name').textContent = level.name + ' • ' + MINI_GAMES[level.game].title;
  document.getElementById('results-unlock-text').textContent = markLevelComplete(gameState.activeLevelIndex);

  const nextLevelBtn = document.getElementById('next-level-btn');
  if (isNextLevelUnlocked(gameState.activeLevelIndex)) {
    nextLevelBtn.style.display = 'inline-block';
  } else {
    nextLevelBtn.style.display = 'none';
  }
  showScreen('results-screen');
}

// ─────────────────────────────────────────────
//  Start a mini-game
// ─────────────────────────────────────────────
function startLevel(levelIndex) {
  const level = getLevel(levelIndex);
  gameState.activeLevelIndex = levelIndex;
  gameState.activeGame    = level.game;
  gameState.score         = 0;
  gameState.totalAnswered = 0;
  gameState.questionsPerRound = level.questionsPerRound || 5;
  gameState.questionIndex = 0;
  gameState.questions     = buildRound(level);
  gameState.currentQ      = gameState.questions[0];
  playSound('start');
  showScreen('game-screen');
  renderQuestion();
}

// ─────────────────────────────────────────────
//  Browser sound effects
// ─────────────────────────────────────────────
let audioContext = null;

function getAudioContext() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  if (!AudioCtx) return null;
  if (!audioContext) audioContext = new AudioCtx();
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

/**
 * Play a short sequence of synthesized tones.
 * @param {Array<{freq:number, duration?:number, type?:OscillatorType, volume?:number, gap?:number}>} tones
 *   Tone descriptors used to build a playful sound effect.
 */
function playToneSequence(tones) {
  const ctx = getAudioContext();
  if (!ctx) return;

  let startTime = ctx.currentTime + 0.01;
  tones.forEach(tone => {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const duration = tone.duration || 0.12;
    const volume = tone.volume || 0.06;

    oscillator.type = tone.type || 'sine';
    oscillator.frequency.setValueAtTime(tone.freq, startTime);
    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(volume, startTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(startTime);
    oscillator.stop(startTime + duration + 0.02);

    startTime += duration + (tone.gap || 0.04);
  });
}

/**
 * Play one of the built-in UI sound effects.
 * Valid effects: click, start, correct, wrong, unlock, locked.
 * @param {string} effect
 */
function playSound(effect) {
  const sounds = {
    click: [
      { freq: 520, duration: 0.05, type: 'triangle', volume: 0.03 },
      { freq: 660, duration: 0.05, type: 'triangle', volume: 0.03 },
    ],
    start: [
      { freq: 330, duration: 0.06, type: 'square', volume: 0.04 },
      { freq: 440, duration: 0.06, type: 'square', volume: 0.04 },
      { freq: 554, duration: 0.08, type: 'triangle', volume: 0.05 },
    ],
    correct: [
      { freq: 523, duration: 0.08, type: 'triangle' },
      { freq: 659, duration: 0.08, type: 'triangle' },
      { freq: 784, duration: 0.12, type: 'sine' },
    ],
    wrong: [
      { freq: 280, duration: 0.09, type: 'sawtooth', volume: 0.05 },
      { freq: 220, duration: 0.14, type: 'sawtooth', volume: 0.05 },
    ],
    unlock: [
      { freq: 440, duration: 0.06, type: 'triangle' },
      { freq: 660, duration: 0.06, type: 'triangle' },
      { freq: 880, duration: 0.16, type: 'sine', volume: 0.08 },
    ],
    locked: [
      { freq: 190, duration: 0.08, type: 'square', volume: 0.04 },
      { freq: 150, duration: 0.08, type: 'square', volume: 0.04 },
    ],
  };

  if (sounds[effect]) playToneSequence(sounds[effect]);
}

// ─────────────────────────────────────────────
//  DOM ready
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  updateScoreDisplay();
  updateMapProgressText();
  renderLevelMap();

  // Welcome → Menu
  document.getElementById('play-btn').addEventListener('click', () => {
    playSound('click');
    showScreen('menu-screen');
  });

  // Next / Finish button
  document.getElementById('next-btn').addEventListener('click', () => {
    playSound('click');
    advanceQuestion();
  });

  // Back to menu from game
  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    playSound('click');
    updateMapProgressText();
    renderLevelMap();
    showScreen('menu-screen');
  });

  // Results → play same game again
  document.getElementById('play-again-btn').addEventListener('click', () => {
    playSound('click');
    startLevel(gameState.activeLevelIndex);
  });

  // Results → next level
  document.getElementById('next-level-btn').addEventListener('click', () => {
    playSound('click');
    if (isNextLevelUnlocked(gameState.activeLevelIndex)) {
      startLevel(gameState.activeLevelIndex + 1);
    }
  });

  // Results → choose another game
  document.getElementById('choose-game-btn').addEventListener('click', () => {
    playSound('click');
    updateMapProgressText();
    renderLevelMap();
    showScreen('menu-screen');
  });

  // Start on welcome screen
  showScreen('welcome-screen');
});

// ─────────────────────────────────────────────
//  Staging environment banner
// ─────────────────────────────────────────────
(function applyEnvBadge() {
  if (typeof window !== 'undefined' && window.MILO_ENV === 'staging') {
    const badge = document.getElementById('env-badge');
    if (badge) badge.style.display = 'block';
  }
})();

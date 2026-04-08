'use strict';

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
const gameState = {
  activeGame: null,
  score: 0,
  totalAnswered: 0,
  questionsPerRound: 5,
  questionIndex: 0,
  questions: [],
  currentQ: null,
  answered: false,
};

// ─────────────────────────────────────────────
//  Utility helpers
// ─────────────────────────────────────────────
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

const FAIL_SOUNDS_DIR = 'sounds/fail/';
const FAIL_SOUNDS_MANIFEST = FAIL_SOUNDS_DIR + 'manifest.json';
const FALLBACK_FAIL_SOUNDS = [
  'universfield-cartoon-fail-trumpet-278822.mp3',
  'olivia_parker-fail-2-demo-306647.mp3',
  'u_8g40a9z0la-fail-234710.mp3',
  'x_bass6668-funny-meow-110120.mp3',
  'mangaletp-funny-laughing-406018.mp3',
].map(file => FAIL_SOUNDS_DIR + file);

const failSoundState = {
  urls: [...FALLBACK_FAIL_SOUNDS],
  nextIndex: 0,
  didScanDirectory: false,
};

function normalizeFailSoundUrl(fileName) {
  if (!fileName) return null;
  try {
    return FAIL_SOUNDS_DIR + encodeURIComponent(decodeURIComponent(fileName));
  } catch {
    return FAIL_SOUNDS_DIR + encodeURIComponent(fileName);
  }
}

async function scanFailSoundsDirectory() {
  if (failSoundState.didScanDirectory || typeof fetch !== 'function') return;
  failSoundState.didScanDirectory = true;

  try {
    const manifestResponse = await fetch(FAIL_SOUNDS_MANIFEST, { cache: 'no-store' });
    if (manifestResponse.ok) {
      const manifest = await manifestResponse.json();
      if (Array.isArray(manifest)) {
        const fromManifest = manifest
          .map(fileName => normalizeFailSoundUrl(fileName))
          .filter(Boolean);
        if (fromManifest.length > 0) {
          failSoundState.urls = [...new Set(fromManifest)];
          failSoundState.nextIndex = 0;
          return;
        }
      }
    }

    const response = await fetch(FAIL_SOUNDS_DIR, { cache: 'no-store' });
    if (!response.ok) return;

    const html = await response.text();
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const discovered = [...doc.querySelectorAll('a[href]')]
      .map(link => link.getAttribute('href') || '')
      .map(href => href.split('#')[0].split('?')[0])
      .filter(href => /\.(mp3|ogg|wav|m4a)$/i.test(href))
      .map(href => normalizeFailSoundUrl(href.split('/').pop()))
      .filter(Boolean);

    if (discovered.length > 0) {
      failSoundState.urls = [...new Set(discovered)];
      failSoundState.nextIndex = 0;
    }
  } catch {
    // Keep fallback list when directory scanning is unavailable.
  }
}

function playNextFailSound() {
  if (failSoundState.urls.length === 0 || typeof Audio !== 'function') return;
  const url = failSoundState.urls[failSoundState.nextIndex % failSoundState.urls.length];
  failSoundState.nextIndex += 1;

  const audio = new Audio(url);
  audio.play().catch(() => {
    // Ignore autoplay/policy failures.
  });
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
  { emoji: '🎈', name: 'balloons' },
  { emoji: '🍌', name: 'bananas'  },
  { emoji: '⭐', name: 'stars'    },
  { emoji: '🐝', name: 'bees'     },
  { emoji: '🍎', name: 'apples'   },
  { emoji: '🌸', name: 'flowers'  },
];

function makeCountingQuestion() {
  const item  = COUNTING_ITEMS[randInt(0, COUNTING_ITEMS.length - 1)];
  const count = randInt(1, 20);
  const correct = count;

  const distractors = new Set();
  while (distractors.size < 3) {
    const d = correct + randInt(-4, 4);
    if (d !== correct && d >= 1 && d <= 25) distractors.add(d);
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

function makeMeasuringQuestion() {
  const pair     = MEASURE_PAIRS[randInt(0, MEASURE_PAIRS.length - 1)];
  const askBig   = Math.random() < 0.5;
  const bigLabel = pair.a.emoji + ' ' + pair.a.label;
  const smlLabel = pair.b.emoji + ' ' + pair.b.label;
  const correct  = askBig ? bigLabel : smlLabel;
  const choices  = shuffle([bigLabel, smlLabel]);

  return {
    type: 'measuring',
    scene: pair.a.emoji + '   ' + pair.b.emoji,
    question: askBig
      ? 'Which is BIGGER: ' + pair.a.label + ' or ' + pair.b.label + '?'
      : 'Which is SMALLER: ' + pair.a.label + ' or ' + pair.b.label + '?',
    correct,
    choices,
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

function makeSharingQuestion() {
  const item  = SNACK_ITEMS[randInt(0, SNACK_ITEMS.length - 1)];
  const mode  = randInt(0, 1); // 0=addition  1=subtraction

  let question, correct, scene;

  if (mode === 0) {
    const a = randInt(1, 10), b = randInt(1, 10);
    correct  = a + b;
    scene    = repeat(item.emoji, a) + '  ➕  ' + repeat(item.emoji, b);
    question = 'Milo has ' + a + ' ' + item.name + ', then finds ' + b + ' more. How many altogether?';
  } else if (mode === 1) {
    const total = randInt(3, 15), eaten = randInt(1, total - 1);
    correct  = total - eaten;
    scene    = repeat(item.emoji, total);
    question = 'Milo has ' + total + ' ' + item.name + ' and eats ' + eaten + '. How many are left?';
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

/* ── 4. Who Has More? ──────────────────────── */
const WHO_HAS_MORE_FRIENDS = [
  { emoji: '🦊', name: 'Fifi the fox' },
  { emoji: '🐼', name: 'Poppy the panda' },
  { emoji: '🐸', name: 'Freddy the frog' },
  { emoji: '🐻', name: 'Bobo the bear' },
  { emoji: '🐧', name: 'Pip the penguin' },
];

function makeWhoHasMoreQuestion() {
  const item = SNACK_ITEMS[randInt(0, SNACK_ITEMS.length - 1)];
  const friend = WHO_HAS_MORE_FRIENDS[randInt(0, WHO_HAS_MORE_FRIENDS.length - 1)];

  const miloCount = randInt(2, 12);
  let friendCount = randInt(2, 12);
  while (friendCount === miloCount) friendCount = randInt(2, 12);

  const correct = miloCount > friendCount ? 'Milo' : friend.name;

  return {
    type: 'who-has-more',
    scene: '🐵 ' + repeat(item.emoji, miloCount) + '\n' +
           friend.emoji + ' ' + repeat(item.emoji, friendCount),
    question: 'Who has more ' + item.name + '?',
    correct,
    choices: shuffle(['Milo', friend.name]),
    wrongAnim: 'fall',
    wrongMsg: 'Oops! Milo guessed wrong and slipped on snack crumbs! 🍪💥',
    correctMsg: 'Nice comparing! You spotted who has more! 🐵✅',
  };
}

/* ── 5. What Is More? ───────────────────────── */
const MORE_ITEM_PAIRS = [
  { a: { emoji: '🍎', name: 'apples' }, b: { emoji: '🍌', name: 'bananas' } },
  { a: { emoji: '🌟', name: 'stars' }, b: { emoji: '☁️', name: 'clouds' } },
  { a: { emoji: '🐠', name: 'fish' }, b: { emoji: '🦀', name: 'crabs' } },
  { a: { emoji: '⚽', name: 'balls' }, b: { emoji: '🏀', name: 'basketballs' } },
  { a: { emoji: '🍪', name: 'cookies' }, b: { emoji: '🧁', name: 'cupcakes' } },
];

function makeWhatIsMoreQuestion() {
  const pair = MORE_ITEM_PAIRS[randInt(0, MORE_ITEM_PAIRS.length - 1)];
  const aCount = randInt(2, 12);
  let bCount = randInt(2, 12);
  while (bCount === aCount) bCount = randInt(2, 12);

  const correct = aCount > bCount
    ? pair.a.emoji + ' ' + pair.a.name
    : pair.b.emoji + ' ' + pair.b.name;

  return {
    type: 'what-is-more',
    scene: repeat(pair.a.emoji, aCount) + '\n' + repeat(pair.b.emoji, bCount),
    question: 'What is MORE?',
    correct,
    choices: shuffle([
      pair.a.emoji + ' ' + pair.a.name,
      pair.b.emoji + ' ' + pair.b.name,
    ]),
    wrongAnim: 'tumble',
    wrongMsg: 'Whoops! Milo mixed up the bigger group! 🤹',
    correctMsg: 'Awesome! You found what is more! 🎉',
  };
}

/* ── 6. Compound Crunch ─────────────────────── */
function makeCompoundQuestion() {
  const a = randInt(1, 10);
  const b = randInt(1, 10);
  const c = randInt(1, a + b);
  const correct = a + b - c;

  const distractors = new Set();
  while (distractors.size < 3) {
    const d = correct + randInt(-4, 4);
    if (d !== correct && d >= 0 && d <= 25) distractors.add(d);
  }

  return {
    type: 'compound',
    scene: a + '  ➕  ' + b + '  ➖  ' + c,
    question: 'What is ' + a + ' + ' + b + ' - ' + c + '?',
    correct,
    choices: shuffle([correct, ...distractors]),
    wrongAnim: 'launch',
    wrongMsg: 'Oops! Milo lost track in the two-step math! 😵',
    correctMsg: 'Great two-step solving! Milo is impressed! 🐵🧠',
  };
}

/* ── 7. Weight Trouble ─────────────────────── */
const WEIGHT_PAIRS = [
  { a: { emoji: '🧲', label: 'a magnet'        }, b: { emoji: '🪶', label: 'a feather'        } },
  { a: { emoji: '🪨', label: 'a big rock'      }, b: { emoji: '🍃', label: 'a leaf'           } },
  { a: { emoji: '📚', label: 'books'            }, b: { emoji: '🎈', label: 'a balloon'        } },
  { a: { emoji: '🚗', label: 'a toy car'       }, b: { emoji: '🧸', label: 'a teddy bear'     } },
  { a: { emoji: '🍎', label: 'an apple'         }, b: { emoji: '🍓', label: 'a strawberry'     } },
  { a: { emoji: '⚽', label: 'a football'       }, b: { emoji: '🏓', label: 'a ping pong ball' } },
  { a: { emoji: '🦁', label: 'a lion'           }, b: { emoji: '🐹', label: 'a hamster'        } },
];

function makeWeightQuestion() {
  const pair      = WEIGHT_PAIRS[randInt(0, WEIGHT_PAIRS.length - 1)];
  const askHeavy  = Math.random() < 0.5;
  const heavyLabel = pair.a.emoji + ' ' + pair.a.label;
  const lightLabel = pair.b.emoji + ' ' + pair.b.label;
  const correct    = askHeavy ? heavyLabel : lightLabel;
  const choices    = shuffle([heavyLabel, lightLabel]);

  return {
    type: 'weight',
    scene: 'seesaw',
    seesawA: pair.a.emoji,
    seesawB: pair.b.emoji,
    question: askHeavy
      ? 'Which is HEAVIER: ' + pair.a.label + ' or ' + pair.b.label + '?'
      : 'Which is LIGHTER: ' + pair.a.label + ' or ' + pair.b.label + '?',
    correct,
    choices,
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
  whoMore:  { title: 'Who Has More? 🙋',    makeQuestion: makeWhoHasMoreQuestion },
  whatMore: { title: 'What Is More? 👀',    makeQuestion: makeWhatIsMoreQuestion },
  compound: { title: 'Compound Crunch ➕➖', makeQuestion: makeCompoundQuestion   },
  weight:   { title: 'Weight Trouble ⚖️',   makeQuestion: makeWeightQuestion    },
};

// ─────────────────────────────────────────────
//  Build a round of questions
// ─────────────────────────────────────────────
function buildRound(gameKey) {
  const mk = MINI_GAMES[gameKey].makeQuestion;
  return Array.from({ length: gameState.questionsPerRound }, () => mk());
}

// ─────────────────────────────────────────────
//  Score display helpers
// ─────────────────────────────────────────────
function updateScoreDisplay() {
  document.getElementById('score-display').textContent =
    '⭐ Score: ' + gameState.score + ' / ' + gameState.totalAnswered;
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
  updateScoreDisplay();

  // Feedback
  const fb = document.getElementById('feedback-banner');
  if (isCorrect) {
    fb.className = 'feedback-banner correct';
    fb.innerHTML = '<span class="feedback-icon">🎉</span>' + q.correctMsg;
  } else {
    fb.className = 'feedback-banner wrong';
    fb.innerHTML = '<span class="feedback-icon">😬</span>' + q.wrongMsg;
    playNextFailSound();
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
  document.getElementById('results-game-name').textContent = MINI_GAMES[gameState.activeGame].title;
  showScreen('results-screen');
}

// ─────────────────────────────────────────────
//  Start a mini-game
// ─────────────────────────────────────────────
function startGame(gameKey) {
  gameState.activeGame    = gameKey;
  gameState.score         = 0;
  gameState.totalAnswered = 0;
  gameState.questionIndex = 0;
  gameState.questions     = buildRound(gameKey);
  gameState.currentQ      = gameState.questions[0];
  updateScoreDisplay();
  showScreen('game-screen');
  renderQuestion();
}

// ─────────────────────────────────────────────
//  DOM ready
// ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  scanFailSoundsDirectory();

  // Welcome → Menu
  document.getElementById('play-btn').addEventListener('click', () => {
    showScreen('menu-screen');
  });

  // Menu → mini-games
  document.querySelectorAll('.game-card').forEach(card => {
    card.addEventListener('click', () => startGame(card.dataset.game));
  });

  // Next / Finish button
  document.getElementById('next-btn').addEventListener('click', advanceQuestion);

  // Back to menu from game
  document.getElementById('back-to-menu-btn').addEventListener('click', () => {
    showScreen('menu-screen');
  });

  // Results → play same game again
  document.getElementById('play-again-btn').addEventListener('click', () => {
    startGame(gameState.activeGame);
  });

  // Results → choose another game
  document.getElementById('choose-game-btn').addEventListener('click', () => {
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

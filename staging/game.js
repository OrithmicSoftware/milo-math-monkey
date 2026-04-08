'use strict';

// ─────────────────────────────────────────────
//  State
// ─────────────────────────────────────────────
const gameState = {
  activeGame: null,
  language: 'en',
  score: 0,
  totalAnswered: 0,
  questionsPerRound: 5,
  questionIndex: 0,
  questions: [],
  currentQ: null,
  answered: false,
};

const SUPPORTED_LANGUAGES = ['en', 'ru', 'he', 'ar'];
const RTL_LANGUAGES = new Set(['he', 'ar']);

const I18N = {
  en: {
    welcomeTitle: 'Milo the\nMath Monkey',
    welcomeSlogan: '"Count it right… or watch Milo take a tumble!"',
    languageLabel: 'Language',
    menuTitle: '🐵 Choose a Mini-Game!',
    aria: { answers: 'Answer choices' },
    buttons: {
      play: '🎮 Play!',
      nextQuestion: 'Next Question ➡️',
      seeResults: 'See Results 🏆',
      backToMenu: '⬅ Back to Menu',
      playAgain: '🔄 Play Again',
      chooseGame: '🎮 Choose Game',
    },
    labels: {
      score: '⭐ Score: {score} / {total}',
      questionCounter: 'Q {current} / {total}',
    },
    cards: {
      counting: { title: 'Counting Chaos', desc: 'Count the items before Milo grabs too many balloons and flies away!', badge: 'Counting 1–20' },
      measuring: { title: 'Measuring Mayhem', desc: 'Get it wrong and Milo falls face-first into the jelly!', badge: 'Size & Comparison' },
      sharing: { title: 'Sharing Snacks', desc: 'Wrong answer and the characters roll away with ALL the snacks!', badge: 'Addition & Subtraction' },
      weight: { title: 'Weight Trouble', desc: 'Wrong weight comparison launches Milo off the seesaw — BOING!', badge: 'Heavier & Lighter' },
    },
    games: {
      counting: { title: 'Counting Chaos 🎈' },
      measuring: { title: 'Measuring Mayhem 📏' },
      sharing: { title: 'Sharing Snacks 🍌' },
      weight: { title: 'Weight Trouble ⚖️' },
    },
    items: {
      counting: { balloons: 'balloons', bananas: 'bananas', stars: 'stars', bees: 'bees', apples: 'apples', flowers: 'flowers' },
      snacks: { bananas: 'bananas', cookies: 'cookies', berries: 'berries', peanuts: 'peanuts', candies: 'candies' },
      measureLabels: { bigTree: 'a big tree', tinySprout: 'a tiny sprout', elephant: 'an elephant', mouse: 'a mouse', house: 'a house', tent: 'a tent', train: 'a train', bicycle: 'a bicycle', watermelon: 'a watermelon', grapes: 'grapes', dinosaur: 'a dinosaur', bunny: 'a bunny', ocean: 'the ocean', bathtub: 'a bathtub', sun: 'the sun', moon: 'the moon' },
      weightLabels: { magnet: 'a magnet', feather: 'a feather', bigRock: 'a big rock', leaf: 'a leaf', books: 'books', balloon: 'a balloon', toyCar: 'a toy car', teddyBear: 'a teddy bear', apple: 'an apple', strawberry: 'a strawberry', football: 'a football', pingPongBall: 'a ping pong ball', lion: 'a lion', hamster: 'a hamster' },
    },
    questions: {
      counting: 'How many {item} does Milo see? 🐵',
      measuringBigger: 'Which is BIGGER: {a} or {b}?',
      measuringSmaller: 'Which is SMALLER: {a} or {b}?',
      sharingAdd: 'Milo has {a} {item}, then finds {b} more. How many altogether?',
      sharingSub: 'Milo has {total} {item} and eats {eaten}. How many are left?',
      weightHeavier: 'Which is HEAVIER: {a} or {b}?',
      weightLighter: 'Which is LIGHTER: {a} or {b}?',
    },
    feedback: {
      countingWrong: 'Oh no! Milo grabbed too many balloons and FLEW AWAY! 🎈🎈🎈',
      countingCorrect: 'Great counting! Milo lands safely! 🐵🎉',
      measuringWrong: 'Oops! Milo measured wrong and fell into the jelly! 🫙💥',
      measuringCorrect: 'Perfect measuring! Milo stays dry! 📏🐵✨',
      sharingWrong: 'Uh oh! Wrong share! The friends rolled away with ALL the snacks! 🍌🎲',
      sharingCorrect: 'Sharing is caring! Everyone gets their snacks! 🐵🍌🎉',
      weightWrong: 'BOING! Wrong weight — Milo got launched off the seesaw! 🪂',
      weightCorrect: 'The seesaw balances! Great thinking! ⚖️🐵🎊',
    },
    results: {
      title: 'Round Complete!',
      scoreText: 'You got {score} out of {total} correct!',
      goodEffort: 'Good effort! Keep practicing with Milo!',
      perfect: 'PERFECT SCORE! Milo is so proud of you! 🐵🎊',
      great: 'Great job! You are getting really good at math! 🐵',
    },
    envBadge: '🚧 STAGING ENVIRONMENT — not for production use 🚧',
  },
  ru: {
    welcomeTitle: 'Мило —\nМатематическая Обезьянка',
    welcomeSlogan: '"Считай правильно… или Мило снова попадёт в беду!"',
    languageLabel: 'Язык',
    menuTitle: '🐵 Выбери мини-игру!',
    aria: { answers: 'Варианты ответа' },
    buttons: {
      play: '🎮 Играть!',
      nextQuestion: 'Следующий вопрос ➡️',
      seeResults: 'Показать результат 🏆',
      backToMenu: '⬅ Назад в меню',
      playAgain: '🔄 Играть снова',
      chooseGame: '🎮 Выбрать игру',
    },
    labels: { score: '⭐ Счёт: {score} / {total}', questionCounter: 'Вопрос {current} / {total}' },
    cards: {
      counting: { title: 'Счётный хаос', desc: 'Сосчитай предметы, пока Мило не улетел с шариками!', badge: 'Счёт 1–20' },
      measuring: { title: 'Измерительный переполох', desc: 'Ошибись — и Мило плюхнется в желе!', badge: 'Размер и сравнение' },
      sharing: { title: 'Делим угощения', desc: 'Неверный ответ — и друзья укатят со ВСЕМИ вкусняшками!', badge: 'Сложение и вычитание' },
      weight: { title: 'Весовые неприятности', desc: 'Ошибка в сравнении веса — и Мило улетает с качелей!', badge: 'Тяжелее и легче' },
    },
    games: {
      counting: { title: 'Счётный хаос 🎈' },
      measuring: { title: 'Измерительный переполох 📏' },
      sharing: { title: 'Делим угощения 🍌' },
      weight: { title: 'Весовые неприятности ⚖️' },
    },
    items: {
      counting: { balloons: 'шариков', bananas: 'бананов', stars: 'звёзд', bees: 'пчёл', apples: 'яблок', flowers: 'цветов' },
      snacks: { bananas: 'бананов', cookies: 'печенек', berries: 'ягод', peanuts: 'орешков', candies: 'конфет' },
      measureLabels: { bigTree: 'большое дерево', tinySprout: 'маленький росток', elephant: 'слон', mouse: 'мышка', house: 'дом', tent: 'палатка', train: 'поезд', bicycle: 'велосипед', watermelon: 'арбуз', grapes: 'виноград', dinosaur: 'динозавр', bunny: 'кролик', ocean: 'океан', bathtub: 'ванна', sun: 'солнце', moon: 'луна' },
      weightLabels: { magnet: 'магнит', feather: 'перо', bigRock: 'большой камень', leaf: 'лист', books: 'книги', balloon: 'шарик', toyCar: 'игрушечная машинка', teddyBear: 'плюшевый мишка', apple: 'яблоко', strawberry: 'клубника', football: 'футбольный мяч', pingPongBall: 'мячик для пинг-понга', lion: 'лев', hamster: 'хомяк' },
    },
    questions: {
      counting: 'Сколько {item} видит Мило? 🐵',
      measuringBigger: 'Что БОЛЬШЕ: {a} или {b}?',
      measuringSmaller: 'Что МЕНЬШЕ: {a} или {b}?',
      sharingAdd: 'У Мило {a} {item}, потом он находит ещё {b}. Сколько стало всего?',
      sharingSub: 'У Мило {total} {item}, и он съедает {eaten}. Сколько осталось?',
      weightHeavier: 'Что ТЯЖЕЛЕЕ: {a} или {b}?',
      weightLighter: 'Что ЛЕГЧЕ: {a} или {b}?',
    },
    feedback: {
      countingWrong: 'О нет! Мило схватил слишком много шариков и УЛЕТЕЛ! 🎈🎈🎈',
      countingCorrect: 'Отличный счёт! Мило приземлился безопасно! 🐵🎉',
      measuringWrong: 'Упс! Мило ошибся в измерении и упал в желе! 🫙💥',
      measuringCorrect: 'Отлично измерено! Мило сухой и довольный! 📏🐵✨',
      sharingWrong: 'Ой-ой! Неправильно поделили — друзья укатили со всеми вкусняшками! 🍌🎲',
      sharingCorrect: 'Делиться — это здорово! Всем достались угощения! 🐵🍌🎉',
      weightWrong: 'БУМ! Ошибка в весе — Мило улетел с качелей! 🪂',
      weightCorrect: 'Качели в равновесии! Отличное мышление! ⚖️🐵🎊',
    },
    results: {
      title: 'Раунд завершён!',
      scoreText: 'Ты ответил правильно на {score} из {total}!',
      goodEffort: 'Хорошая попытка! Продолжай тренироваться с Мило!',
      perfect: 'ИДЕАЛЬНО! Мило очень тобой гордится! 🐵🎊',
      great: 'Отличная работа! Ты здорово считаешь! 🐵',
    },
    envBadge: '🚧 СРЕДА STAGING — не для продакшена 🚧',
  },
  he: {
    welcomeTitle: 'מילו קוף\nהמתמטיקה',
    welcomeSlogan: '"תספור נכון… או שתראו את מילו מסתבך!"',
    languageLabel: 'שפה',
    menuTitle: '🐵 בחרו מיני-משחק!',
    aria: { answers: 'אפשרויות תשובה' },
    buttons: {
      play: '🎮 משחקים!',
      nextQuestion: 'שאלה הבאה ➡️',
      seeResults: 'לתוצאות 🏆',
      backToMenu: '⬅ חזרה לתפריט',
      playAgain: '🔄 משחקים שוב',
      chooseGame: '🎮 בוחרים משחק',
    },
    labels: { score: '⭐ ניקוד: {score} / {total}', questionCounter: 'שאלה {current} / {total}' },
    cards: {
      counting: { title: 'בלגן ספירה', desc: 'ספרו את הפריטים לפני שמילו יעוף עם יותר מדי בלונים!', badge: 'ספירה 1–20' },
      measuring: { title: 'מהומת מדידה', desc: 'טעות — ומילו נופל ישר לג׳לי!', badge: 'גודל והשוואה' },
      sharing: { title: 'מחלקים חטיפים', desc: 'תשובה שגויה — והחברים מתגלגלים עם כל החטיפים!', badge: 'חיבור וחיסור' },
      weight: { title: 'צרות משקל', desc: 'השוואת משקל שגויה מעיפה את מילו מהנדנדה!', badge: 'כבד וקל' },
    },
    games: {
      counting: { title: 'בלגן ספירה 🎈' },
      measuring: { title: 'מהומת מדידה 📏' },
      sharing: { title: 'מחלקים חטיפים 🍌' },
      weight: { title: 'צרות משקל ⚖️' },
    },
    items: {
      counting: { balloons: 'בלונים', bananas: 'בננות', stars: 'כוכבים', bees: 'דבורים', apples: 'תפוחים', flowers: 'פרחים' },
      snacks: { bananas: 'בננות', cookies: 'עוגיות', berries: 'פירות יער', peanuts: 'בוטנים', candies: 'סוכריות' },
      measureLabels: { bigTree: 'עץ גדול', tinySprout: 'נבט קטן', elephant: 'פיל', mouse: 'עכבר', house: 'בית', tent: 'אוהל', train: 'רכבת', bicycle: 'אופניים', watermelon: 'אבטיח', grapes: 'ענבים', dinosaur: 'דינוזאור', bunny: 'ארנב', ocean: 'האוקיינוס', bathtub: 'אמבטיה', sun: 'השמש', moon: 'הירח' },
      weightLabels: { magnet: 'מגנט', feather: 'נוצה', bigRock: 'אבן גדולה', leaf: 'עלה', books: 'ספרים', balloon: 'בלון', toyCar: 'מכונית צעצוע', teddyBear: 'דובון', apple: 'תפוח', strawberry: 'תות', football: 'כדורגל', pingPongBall: 'כדור פינג-פונג', lion: 'אריה', hamster: 'אוגר' },
    },
    questions: {
      counting: 'כמה {item} מילו רואה? 🐵',
      measuringBigger: 'מה יותר גדול: {a} או {b}?',
      measuringSmaller: 'מה יותר קטן: {a} או {b}?',
      sharingAdd: 'למילו יש {a} {item}, ואז הוא מוצא עוד {b}. כמה יש בסך הכול?',
      sharingSub: 'למילו יש {total} {item} והוא אוכל {eaten}. כמה נשאר?',
      weightHeavier: 'מה יותר כבד: {a} או {b}?',
      weightLighter: 'מה יותר קל: {a} או {b}?',
    },
    feedback: {
      countingWrong: 'אוי לא! מילו לקח יותר מדי בלונים ו... עף! 🎈🎈🎈',
      countingCorrect: 'ספירה מעולה! מילו נוחת בבטחה! 🐵🎉',
      measuringWrong: 'אופס! מילו טעה במדידה ונפל לג׳לי! 🫙💥',
      measuringCorrect: 'מדידה מושלמת! מילו נשאר יבש! 📏🐵✨',
      sharingWrong: 'אוי! חילוק לא נכון — החברים התגלגלו עם כל החטיפים! 🍌🎲',
      sharingCorrect: 'לחלק זה כיף! לכולם יש חטיפים! 🐵🍌🎉',
      weightWrong: 'בווינג! טעות במשקל — מילו נזרק מהנדנדה! 🪂',
      weightCorrect: 'הנדנדה מאוזנת! חשיבה נהדרת! ⚖️🐵🎊',
    },
    results: {
      title: 'הסבב הושלם!',
      scoreText: 'ענית נכון על {score} מתוך {total}!',
      goodEffort: 'מאמץ יפה! המשיכו להתאמן עם מילו!',
      perfect: 'מושלם! מילו ממש גאה בכם! 🐵🎊',
      great: 'עבודה נהדרת! אתם משתפרים מאוד במתמטיקה! 🐵',
    },
    envBadge: '🚧 סביבת STAGING — לא לשימוש בייצור 🚧',
  },
  ar: {
    welcomeTitle: 'ميلو قرد\nالرياضيات',
    welcomeSlogan: '"عدّها جيدًا… وإلا سيتعثر ميلو!"',
    languageLabel: 'اللغة',
    menuTitle: '🐵 اختر لعبة صغيرة!',
    aria: { answers: 'خيارات الإجابة' },
    buttons: {
      play: '🎮 العب!',
      nextQuestion: 'السؤال التالي ➡️',
      seeResults: 'عرض النتائج 🏆',
      backToMenu: '⬅ العودة للقائمة',
      playAgain: '🔄 العب مرة أخرى',
      chooseGame: '🎮 اختر لعبة',
    },
    labels: { score: '⭐ النتيجة: {score} / {total}', questionCounter: 'سؤال {current} / {total}' },
    cards: {
      counting: { title: 'فوضى العد', desc: 'عدّ العناصر قبل أن يأخذ ميلو بالونات كثيرة ويطير!', badge: 'العد من 1 إلى 20' },
      measuring: { title: 'فوضى القياس', desc: 'إجابة خاطئة وميلو يسقط في الجيلي!', badge: 'الحجم والمقارنة' },
      sharing: { title: 'تقاسم الوجبات', desc: 'إجابة خاطئة والأصدقاء يهربون بكل الوجبات!', badge: 'الجمع والطرح' },
      weight: { title: 'مشكلة الوزن', desc: 'مقارنة وزن خاطئة تطلق ميلو من الأرجوحة!', badge: 'أثقل وأخف' },
    },
    games: {
      counting: { title: 'فوضى العد 🎈' },
      measuring: { title: 'فوضى القياس 📏' },
      sharing: { title: 'تقاسم الوجبات 🍌' },
      weight: { title: 'مشكلة الوزن ⚖️' },
    },
    items: {
      counting: { balloons: 'بالونات', bananas: 'موز', stars: 'نجوم', bees: 'نحل', apples: 'تفاح', flowers: 'زهور' },
      snacks: { bananas: 'موز', cookies: 'بسكويت', berries: 'توت', peanuts: 'فول سوداني', candies: 'حلويات' },
      measureLabels: { bigTree: 'شجرة كبيرة', tinySprout: 'نبتة صغيرة', elephant: 'فيل', mouse: 'فأر', house: 'منزل', tent: 'خيمة', train: 'قطار', bicycle: 'دراجة', watermelon: 'بطيخة', grapes: 'عنب', dinosaur: 'ديناصور', bunny: 'أرنب', ocean: 'المحيط', bathtub: 'حوض استحمام', sun: 'الشمس', moon: 'القمر' },
      weightLabels: { magnet: 'مغناطيس', feather: 'ريشة', bigRock: 'صخرة كبيرة', leaf: 'ورقة', books: 'كتب', balloon: 'بالون', toyCar: 'سيارة لعبة', teddyBear: 'دبدوب', apple: 'تفاحة', strawberry: 'فراولة', football: 'كرة قدم', pingPongBall: 'كرة تنس طاولة', lion: 'أسد', hamster: 'هامستر' },
    },
    questions: {
      counting: 'كم عدد {item} التي يراها ميلو؟ 🐵',
      measuringBigger: 'أيّهما أكبر: {a} أم {b}؟',
      measuringSmaller: 'أيّهما أصغر: {a} أم {b}؟',
      sharingAdd: 'مع ميلو {a} من {item}، ثم يجد {b} أخرى. كم أصبح المجموع؟',
      sharingSub: 'مع ميلو {total} من {item} وأكل {eaten}. كم بقي؟',
      weightHeavier: 'أيّهما أثقل: {a} أم {b}؟',
      weightLighter: 'أيّهما أخف: {a} أم {b}؟',
    },
    feedback: {
      countingWrong: 'أوه لا! أخذ ميلو بالونات كثيرة وطار بعيدًا! 🎈🎈🎈',
      countingCorrect: 'عدّ ممتاز! هبط ميلو بسلام! 🐵🎉',
      measuringWrong: 'أوبس! أخطأ ميلو في القياس وسقط في الجيلي! 🫙💥',
      measuringCorrect: 'قياس رائع! ميلو بقي جافًا! 📏🐵✨',
      sharingWrong: 'يا إلهي! تقاسم خاطئ — الأصدقاء تدحرجوا مع كل الوجبات! 🍌🎲',
      sharingCorrect: 'المشاركة رائعة! الجميع حصل على وجبته! 🐵🍌🎉',
      weightWrong: 'بويـنغ! مقارنة وزن خاطئة — انطلق ميلو من الأرجوحة! 🪂',
      weightCorrect: 'الأرجوحة متوازنة! تفكير ممتاز! ⚖️🐵🎊',
    },
    results: {
      title: 'انتهت الجولة!',
      scoreText: 'أجبت بشكل صحيح على {score} من {total}!',
      goodEffort: 'مجهود رائع! استمر في التدريب مع ميلو!',
      perfect: 'نتيجة مثالية! ميلو فخور بك جدًا! 🐵🎊',
      great: 'عمل رائع! أنت تتحسن كثيرًا في الرياضيات! 🐵',
    },
    envBadge: '🚧 بيئة STAGING — ليست للإنتاج 🚧',
  },
};

function getNestedTranslation(path, fallbackLanguage) {
  const base = I18N[fallbackLanguage];
  if (!base) return undefined;
  return path.split('.').reduce((obj, key) => (obj && key in obj ? obj[key] : undefined), base);
}

function interpolate(text, params) {
  const values = params || {};
  return text.replace(/\{([^}]+)\}/g, (full, key) => (
    key in values ? String(values[key]) : full
  ));
}

function t(path, params) {
  const inLanguage = getNestedTranslation(path, gameState.language);
  const fallback = getNestedTranslation(path, 'en');
  const value = inLanguage !== undefined ? inLanguage : fallback;
  return typeof value === 'string' ? interpolate(value, params) : value;
}

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
  { emoji: '🎈', nameKey: 'balloons' },
  { emoji: '🍌', nameKey: 'bananas'  },
  { emoji: '⭐', nameKey: 'stars'    },
  { emoji: '🐝', nameKey: 'bees'     },
  { emoji: '🍎', nameKey: 'apples'   },
  { emoji: '🌸', nameKey: 'flowers'  },
];

function makeCountingQuestion() {
  const item  = COUNTING_ITEMS[randInt(0, COUNTING_ITEMS.length - 1)];
  const count = randInt(1, 20);
  const correct = count;
  const itemName = t('items.counting.' + item.nameKey);

  const distractors = new Set();
  while (distractors.size < 3) {
    const d = correct + randInt(-4, 4);
    if (d !== correct && d >= 1 && d <= 25) distractors.add(d);
  }

  return {
    type: 'counting',
    scene: repeat(item.emoji, count),
    question: t('questions.counting', { item: itemName }),
    correct,
    choices: shuffle([correct, ...distractors]),
    wrongAnim: 'float',
    wrongMsg: t('feedback.countingWrong'),
    correctMsg: t('feedback.countingCorrect'),
  };
}

/* ── 2. Measuring Mayhem ───────────────────── */
const MEASURE_PAIRS = [
  { a: { emoji: '🌳', labelKey: 'bigTree'    }, b: { emoji: '🌱', labelKey: 'tinySprout' } },
  { a: { emoji: '🐘', labelKey: 'elephant'   }, b: { emoji: '🐭', labelKey: 'mouse'      } },
  { a: { emoji: '🏠', labelKey: 'house'      }, b: { emoji: '⛺', labelKey: 'tent'       } },
  { a: { emoji: '🚂', labelKey: 'train'      }, b: { emoji: '🚲', labelKey: 'bicycle'    } },
  { a: { emoji: '🍉', labelKey: 'watermelon' }, b: { emoji: '🍇', labelKey: 'grapes'     } },
  { a: { emoji: '🦕', labelKey: 'dinosaur'   }, b: { emoji: '🐇', labelKey: 'bunny'      } },
  { a: { emoji: '🌊', labelKey: 'ocean'      }, b: { emoji: '🛁', labelKey: 'bathtub'    } },
  { a: { emoji: '🌞', labelKey: 'sun'        }, b: { emoji: '🌙', labelKey: 'moon'       } },
];

function makeMeasuringQuestion() {
  const pair     = MEASURE_PAIRS[randInt(0, MEASURE_PAIRS.length - 1)];
  const askBig   = Math.random() < 0.5;
  const aLabel = t('items.measureLabels.' + pair.a.labelKey);
  const bLabel = t('items.measureLabels.' + pair.b.labelKey);
  const bigLabel = pair.a.emoji + ' ' + aLabel;
  const smlLabel = pair.b.emoji + ' ' + bLabel;
  const correct  = askBig ? bigLabel : smlLabel;
  const choices  = shuffle([bigLabel, smlLabel]);

  return {
    type: 'measuring',
    scene: pair.a.emoji + '   ' + pair.b.emoji,
    question: askBig
      ? t('questions.measuringBigger', { a: aLabel, b: bLabel })
      : t('questions.measuringSmaller', { a: aLabel, b: bLabel }),
    correct,
    choices,
    wrongAnim: 'fall',
    wrongMsg: t('feedback.measuringWrong'),
    correctMsg: t('feedback.measuringCorrect'),
  };
}

/* ── 3. Sharing Snacks ─────────────────────── */
const SNACK_ITEMS = [
  { emoji: '🍌', nameKey: 'bananas' },
  { emoji: '🍪', nameKey: 'cookies' },
  { emoji: '🍓', nameKey: 'berries' },
  { emoji: '🥜', nameKey: 'peanuts' },
  { emoji: '🍬', nameKey: 'candies' },
];

function makeSharingQuestion() {
  const item  = SNACK_ITEMS[randInt(0, SNACK_ITEMS.length - 1)];
  const mode  = randInt(0, 1); // 0=addition  1=subtraction
  const itemName = t('items.snacks.' + item.nameKey);

  let question, correct, scene;

  if (mode === 0) {
    const a = randInt(1, 10), b = randInt(1, 10);
    correct  = a + b;
    scene    = repeat(item.emoji, a) + '  ➕  ' + repeat(item.emoji, b);
    question = t('questions.sharingAdd', { a, b, item: itemName });
  } else if (mode === 1) {
    const total = randInt(3, 15), eaten = randInt(1, total - 1);
    correct  = total - eaten;
    scene    = repeat(item.emoji, total);
    question = t('questions.sharingSub', { total, eaten, item: itemName });
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
    wrongMsg: t('feedback.sharingWrong'),
    correctMsg: t('feedback.sharingCorrect'),
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
  { a: { emoji: '🧲', labelKey: 'magnet'       }, b: { emoji: '🪶', labelKey: 'feather'      } },
  { a: { emoji: '🪨', labelKey: 'bigRock'      }, b: { emoji: '🍃', labelKey: 'leaf'         } },
  { a: { emoji: '📚', labelKey: 'books'        }, b: { emoji: '🎈', labelKey: 'balloon'      } },
  { a: { emoji: '🚗', labelKey: 'toyCar'       }, b: { emoji: '🧸', labelKey: 'teddyBear'    } },
  { a: { emoji: '🍎', labelKey: 'apple'        }, b: { emoji: '🍓', labelKey: 'strawberry'   } },
  { a: { emoji: '⚽', labelKey: 'football'     }, b: { emoji: '🏓', labelKey: 'pingPongBall' } },
  { a: { emoji: '🦁', labelKey: 'lion'         }, b: { emoji: '🐹', labelKey: 'hamster'      } },
];

function makeWeightQuestion() {
  const pair      = WEIGHT_PAIRS[randInt(0, WEIGHT_PAIRS.length - 1)];
  const askHeavy  = Math.random() < 0.5;
  const aLabel = t('items.weightLabels.' + pair.a.labelKey);
  const bLabel = t('items.weightLabels.' + pair.b.labelKey);
  const heavyLabel = pair.a.emoji + ' ' + aLabel;
  const lightLabel = pair.b.emoji + ' ' + bLabel;
  const correct    = askHeavy ? heavyLabel : lightLabel;
  const choices    = shuffle([heavyLabel, lightLabel]);

  return {
    type: 'weight',
    scene: 'seesaw',
    seesawA: pair.a.emoji,
    seesawB: pair.b.emoji,
    question: askHeavy
      ? t('questions.weightHeavier', { a: aLabel, b: bLabel })
      : t('questions.weightLighter', { a: aLabel, b: bLabel }),
    correct,
    choices,
    wrongAnim: 'launch',
    wrongMsg: t('feedback.weightWrong'),
    correctMsg: t('feedback.weightCorrect'),
  };
}

// ─────────────────────────────────────────────
//  Game registry
// ─────────────────────────────────────────────
const MINI_GAMES = {
  counting: { titleKey: 'games.counting.title',   makeQuestion: makeCountingQuestion  },
  measuring:{ titleKey: 'games.measuring.title',  makeQuestion: makeMeasuringQuestion },
  sharing:  { titleKey: 'games.sharing.title',    makeQuestion: makeSharingQuestion   },
  whoMore:  { title: 'Who Has More? 🙋',    makeQuestion: makeWhoHasMoreQuestion },
  whatMore: { title: 'What Is More? 👀',    makeQuestion: makeWhatIsMoreQuestion },
  compound: { title: 'Compound Crunch ➕➖', makeQuestion: makeCompoundQuestion   },
  weight:   { titleKey: 'games.weight.title',     title: 'Weight Trouble ⚖️', makeQuestion: makeWeightQuestion },
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
    t('labels.score', { score: gameState.score, total: gameState.totalAnswered });
}

function getGameTitle(gameKey) {
  const game = MINI_GAMES[gameKey];
  if (!game) return '';
  if (game.titleKey) return t(game.titleKey);
  return game.title || '';
}

function setText(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = value;
}

function applyLanguage() {
  document.documentElement.lang = gameState.language;
  document.documentElement.dir = RTL_LANGUAGES.has(gameState.language) ? 'rtl' : 'ltr';

  setText('welcome-title', t('welcomeTitle'));
  setText('welcome-slogan', t('welcomeSlogan'));
  setText('language-label', t('languageLabel'));
  setText('play-btn', t('buttons.play'));
  setText('menu-title', t('menuTitle'));
  setText('card-counting-title', t('cards.counting.title'));
  setText('card-counting-desc', t('cards.counting.desc'));
  setText('card-counting-badge', t('cards.counting.badge'));
  setText('card-measuring-title', t('cards.measuring.title'));
  setText('card-measuring-desc', t('cards.measuring.desc'));
  setText('card-measuring-badge', t('cards.measuring.badge'));
  setText('card-sharing-title', t('cards.sharing.title'));
  setText('card-sharing-desc', t('cards.sharing.desc'));
  setText('card-sharing-badge', t('cards.sharing.badge'));
  setText('card-weight-title', t('cards.weight.title'));
  setText('card-weight-desc', t('cards.weight.desc'));
  setText('card-weight-badge', t('cards.weight.badge'));
  setText('next-btn', t('buttons.nextQuestion'));
  setText('back-to-menu-btn', t('buttons.backToMenu'));
  setText('results-title', t('results.title'));
  setText('play-again-btn', t('buttons.playAgain'));
  setText('choose-game-btn', t('buttons.chooseGame'));
  setText('env-badge-text', t('envBadge'));

  const answersGrid = document.getElementById('answers-grid');
  if (answersGrid) {
    answersGrid.setAttribute('aria-label', t('aria.answers'));
  }

  updateScoreDisplay();
}

// ─────────────────────────────────────────────
//  Render the current question
// ─────────────────────────────────────────────
function renderQuestion() {
  const q = gameState.currentQ;

  document.getElementById('game-title-label').textContent = getGameTitle(gameState.activeGame);
  document.getElementById('question-counter').textContent =
    t('labels.questionCounter', { current: gameState.questionIndex + 1, total: gameState.questionsPerRound });

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
  nextBtn.textContent = isLast ? t('buttons.seeResults') : t('buttons.nextQuestion');
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
  let msg   = t('results.goodEffort');
  if (pct === 1) {
    stars = '⭐⭐⭐';
    msg   = t('results.perfect');
  } else if (pct >= 0.6) {
    stars = '⭐⭐';
    msg   = t('results.great');
  }

  document.getElementById('results-score-text').textContent =
    t('results.scoreText', { score: gameState.score, total: gameState.questionsPerRound });
  document.getElementById('results-stars').textContent = stars;
  document.getElementById('results-msg').textContent = msg;
  document.getElementById('results-game-name').textContent = getGameTitle(gameState.activeGame);
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
  let storedLanguage = null;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      storedLanguage = window.localStorage.getItem('milo-language');
    }
  } catch (_) {
    storedLanguage = null;
  }
  if (storedLanguage && SUPPORTED_LANGUAGES.includes(storedLanguage)) {
    gameState.language = storedLanguage;
  }

  scanFailSoundsDirectory();

  applyLanguage();

  const languageSelect = document.getElementById('language-select');
  if (languageSelect) {
    languageSelect.value = gameState.language;
    languageSelect.addEventListener('change', event => {
      const nextLanguage = event.target.value;
      if (!SUPPORTED_LANGUAGES.includes(nextLanguage)) return;
      gameState.language = nextLanguage;
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.setItem('milo-language', gameState.language);
        }
      } catch (_) {}
      applyLanguage();
    });
  }

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

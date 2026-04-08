const soundPresets = {
  hoot: [
    { frequency: 440, duration: 0.08, type: 'triangle', gain: 0.14 },
    { frequency: 590, duration: 0.12, type: 'triangle', gain: 0.12 },
    { frequency: 470, duration: 0.18, type: 'sine', gain: 0.08 },
  ],
  boing: [
    { frequency: 260, duration: 0.08, type: 'square', gain: 0.12 },
    { frequency: 520, duration: 0.18, type: 'sawtooth', gain: 0.1 },
    { frequency: 190, duration: 0.14, type: 'sine', gain: 0.08 },
  ],
  gasp: [
    { frequency: 350, duration: 0.05, type: 'triangle', gain: 0.12 },
    { frequency: 700, duration: 0.05, type: 'triangle', gain: 0.12 },
    { frequency: 880, duration: 0.18, type: 'sine', gain: 0.09 },
  ],
  chatter: [
    { frequency: 320, duration: 0.05, type: 'square', gain: 0.08 },
    { frequency: 390, duration: 0.05, type: 'square', gain: 0.08 },
    { frequency: 460, duration: 0.05, type: 'square', gain: 0.08 },
    { frequency: 320, duration: 0.08, type: 'square', gain: 0.06 },
  ],
};

const soundNames = Object.keys(soundPresets);
const audioContext =
  window.AudioContext || window.webkitAudioContext
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

function clearState(className, delay = 1100) {
  window.clearTimeout(clearState.timers?.[className]);
  clearState.timers = clearState.timers || {};
  clearState.timers[className] = window.setTimeout(() => {
    document.body.classList.remove(className);
  }, delay);
}

function animateCharacter(className, delay) {
  document.body.classList.add(className);
  clearState(className, delay);
}

function playTone(startTime, { frequency, duration, type, gain }) {
  if (!audioContext) {
    return startTime;
  }

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);

  gainNode.gain.setValueAtTime(0.0001, startTime);
  gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.start(startTime);
  oscillator.stop(startTime + duration);

  return startTime + duration * 0.82;
}

async function ensureAudioReady() {
  if (!audioContext) {
    return false;
  }

  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }

  return true;
}

async function playSound(name) {
  const preset = soundPresets[name];

  if (!preset) {
    return;
  }

  await ensureAudioReady();

  if (!audioContext) {
    return;
  }

  let cursor = audioContext.currentTime;
  preset.forEach((tone) => {
    cursor = playTone(cursor, tone);
  });
}

function playRandomSound() {
  const randomName = soundNames[Math.floor(Math.random() * soundNames.length)];
  playSound(randomName);
}

document.querySelectorAll('[data-sound]').forEach((button) => {
  button.addEventListener('click', () => {
    playSound(button.dataset.sound);
  });
});

document.querySelector('[data-action="reach"]')?.addEventListener('click', () => {
  animateCharacter('is-reaching', 1800);
  playSound('gasp');
});

document.querySelector('[data-action="celebrate"]')?.addEventListener('click', () => {
  animateCharacter('is-celebrating', 1700);
  playSound('hoot');
});

document
  .querySelector('[data-action="random-sound"]')
  ?.addEventListener('click', playRandomSound);

function deepFreeze(value) {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) {
    return value;
  }
  Object.freeze(value);
  Object.getOwnPropertyNames(value).forEach((name) => {
    deepFreeze(value[name]);
  });
  return value;
}

const SOUND_PRESETS = deepFreeze({
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
});

const TRANSIENT_ANIMATION_CLASSES = ['is-reaching', 'is-celebrating'];
const REDUCED_MOTION_DURATION_MS = 120;

class ToneEngine {
  constructor(soundPresets) {
    this.soundPresets = soundPresets;
    this.soundNames = Object.keys(soundPresets);
    this.audioContext = null;
    this.AudioContextCtor = window.AudioContext || window.webkitAudioContext || null;
  }

  randomSoundName() {
    if (!this.soundNames.length) {
      return null;
    }
    const randomIndex = window.crypto?.getRandomValues
      ? (() => {
          const entropy = new Uint32Array(1);
          window.crypto.getRandomValues(entropy);
          return entropy[0] % this.soundNames.length;
        })()
      : Math.floor(Math.random() * this.soundNames.length);
    return this.soundNames[randomIndex];
  }

  async play(name) {
    const preset = this.soundPresets[name];
    if (!preset || !(await this.ensureReady())) {
      return false;
    }

    let cursor = this.audioContext.currentTime;
    preset.forEach((tone) => {
      cursor = this.playTone(cursor, tone);
    });
    return true;
  }

  async ensureReady() {
    if (!this.AudioContextCtor) {
      return false;
    }

    if (!this.audioContext) {
      this.audioContext = new this.AudioContextCtor();
    }

    if (this.audioContext.state === 'suspended') {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn(
          'Unable to resume audio context. User interaction may be required to enable audio.',
          error
        );
        return false;
      }
    }

    return this.audioContext.state === 'running';
  }

  playTone(startTime, { frequency, duration, type, gain }) {
    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, startTime);

    gainNode.gain.setValueAtTime(0.0001, startTime);
    gainNode.gain.exponentialRampToValueAtTime(gain, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.start(startTime);
    oscillator.stop(startTime + duration);

    return startTime + duration * 0.82;
  }
}

class MiloPrototypeController {
  constructor(root = document) {
    this.root = root;
    this.body = root.body;
    this.statusEl = root.querySelector('[data-status]');
    this.timers = new Map();
    this.engine = new ToneEngine(SOUND_PRESETS);
    this.motionQuery = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    this.reduceMotion = this.motionQuery ? this.motionQuery.matches : false;
  }

  init() {
    this.root.addEventListener('click', (event) => this.onClick(event));
    if (this.motionQuery?.addEventListener) {
      this.motionQuery.addEventListener('change', (event) => {
        this.reduceMotion = event.matches;
      });
    } else if (!this.motionQuery) {
      console.info('Reduced-motion preference monitoring is unavailable in this browser.');
    }
    this.setStatus('Ready. Use the controls to trigger movement and sounds.');
  }

  onClick(event) {
    const button = event.target.closest('button');
    if (!button) {
      return;
    }

    const action = button.dataset.action;
    const sound = button.dataset.sound;

    if (action) {
      this.handleAction(action);
      return;
    }

    if (sound) {
      this.playSound(sound);
    }
  }

  async handleAction(action) {
    if (action === 'reach') {
      this.playAnimation('is-reaching', 1800);
      await this.playSound('gasp', 'Milo reached for bananas.');
      return;
    }

    if (action === 'celebrate') {
      this.playAnimation('is-celebrating', 1700);
      await this.playSound('hoot', 'Milo is celebrating.');
      return;
    }

    if (action === 'random-sound') {
      const soundName = this.engine.randomSoundName();
      if (!soundName) {
        this.setStatus('No sound preset is available.');
        return;
      }
      await this.playSound(soundName, `Played random sound: ${soundName}.`);
    }
  }

  async playSound(name, successMessage = null) {
    const ok = await this.engine.play(name);
    if (ok) {
      this.setStatus(successMessage || `Played sound: ${name}.`);
    } else {
      this.setStatus('Audio is unavailable in this browser right now.');
    }
  }

  playAnimation(className, durationMs) {
    TRANSIENT_ANIMATION_CLASSES.forEach((animationClass) => {
      if (animationClass !== className) {
        this.cancelTimer(animationClass);
        this.body.classList.remove(animationClass);
      }
    });

    this.cancelTimer(className);
    this.body.classList.remove(className);

    // Restart CSS animation by re-adding the class in the next frame.
    window.requestAnimationFrame(() => {
      this.body.classList.add(className);
    });

    const timeoutMs = this.reduceMotion ? REDUCED_MOTION_DURATION_MS : durationMs;
    const timerId = window.setTimeout(() => {
      this.body.classList.remove(className);
      this.timers.delete(className);
    }, timeoutMs);

    this.timers.set(className, timerId);
  }

  cancelTimer(key) {
    const timer = this.timers.get(key);
    if (timer) {
      window.clearTimeout(timer);
      this.timers.delete(key);
    }
  }

  setStatus(message) {
    if (this.statusEl) {
      this.statusEl.textContent = message;
    }
  }
}

new MiloPrototypeController(document).init();

// Web Audio API ambient chime and melody synthesizer for Mariam Birthday Experience
let audioCtx: AudioContext | null = null;
let isMuted = false;
let isMusicPlaying = false;
let melodyTimeout: number | null = null;
let melodyActiveOscs: OscillatorNode[] = [];

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function toggleAudioMute(): boolean {
  isMuted = !isMuted;
  if (isMuted && isMusicPlaying) {
    stopBirthdayMusic();
  }
  return isMuted;
}

export function getAudioMuted(): boolean {
  return isMuted;
}

export function getIsMusicPlaying(): boolean {
  return isMusicPlaying;
}

// Gentle celestial chime for trait selection or interaction
export function playChime(noteIndex = 0) {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5]; // C5, D5, E5, G5, A5, C6
    const freq = scale[noteIndex % scale.length];

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, ctx.currentTime);

    // Warm harmonics
    gain.gain.setValueAtTime(0, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.08, ctx.currentTime + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 1.25);
  } catch {
    // Graceful fallback
  }
}

// Celebratory sparkle chord for candle blowing and special moments
export function playCelebrationChord() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const chord = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    chord.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = i % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);

      gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.08);
      gain.gain.linearRampToValueAtTime(0.06, ctx.currentTime + i * 0.08 + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 2.0);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 2.1);
    });
  } catch {
    // Graceful fallback
  }
}

// Soft candle puff sound
export function playPuff() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const bufferSize = Math.floor(ctx.sampleRate * 0.15);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.04));
    }

    const whiteNoise = ctx.createBufferSource();
    whiteNoise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.15);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.1, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    whiteNoise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    whiteNoise.start();
  } catch {
    // Graceful fallback
  }
}

// Metallic flint click & wheel strike of a vintage lighter
export function playLighterFlick() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    // High metallic click
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2800, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);

    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.07);

    // Friction scratch
    const bufferSize = Math.floor(ctx.sampleRate * 0.04);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.5;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(3200, ctx.currentTime);
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.06, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.04);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
  } catch {
    // Graceful fallback
  }
}

// Warm soft flame ignition whoosh
export function playFlameIgnite() {
  if (isMuted) return;
  const ctx = getContext();
  if (!ctx) return;

  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.08);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.28);

    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.07, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.36);
  } catch {
    // Graceful fallback
  }
}

// Enchanting music-box / celesta "Happy Birthday" melody synthesizer
const BIRTHDAY_NOTES: { note: number; dur: number; pause: number }[] = [
  // Happy (C4 C4)
  { note: 261.63, dur: 0.28, pause: 0.32 },
  { note: 261.63, dur: 0.22, pause: 0.26 },
  // Birthday (D4 C4)
  { note: 293.66, dur: 0.52, pause: 0.58 },
  { note: 261.63, dur: 0.52, pause: 0.58 },
  // To you (F4 E4)
  { note: 349.23, dur: 0.52, pause: 0.58 },
  { note: 329.63, dur: 1.0, pause: 1.15 },

  // Happy (C4 C4)
  { note: 261.63, dur: 0.28, pause: 0.32 },
  { note: 261.63, dur: 0.22, pause: 0.26 },
  // Birthday (D4 C4)
  { note: 293.66, dur: 0.52, pause: 0.58 },
  { note: 261.63, dur: 0.52, pause: 0.58 },
  // To you (G4 F4)
  { note: 392.0, dur: 0.52, pause: 0.58 },
  { note: 349.23, dur: 1.0, pause: 1.15 },

  // Happy (C4 C4)
  { note: 261.63, dur: 0.28, pause: 0.32 },
  { note: 261.63, dur: 0.22, pause: 0.26 },
  // Birthday dear Mariam (C5 A4 F4 E4 D4)
  { note: 523.25, dur: 0.55, pause: 0.6 },
  { note: 440.0, dur: 0.55, pause: 0.6 },
  { note: 349.23, dur: 0.55, pause: 0.6 },
  { note: 329.63, dur: 0.55, pause: 0.6 },
  { note: 293.66, dur: 0.95, pause: 1.1 },

  // Happy (Bb4 Bb4)
  { note: 466.16, dur: 0.28, pause: 0.32 },
  { note: 466.16, dur: 0.22, pause: 0.26 },
  // Birthday to you (A4 F4 G4 F4)
  { note: 440.0, dur: 0.55, pause: 0.6 },
  { note: 349.23, dur: 0.55, pause: 0.6 },
  { note: 392.0, dur: 0.55, pause: 0.6 },
  { note: 349.23, dur: 1.4, pause: 1.8 },
];

function playNote(freq: number, duration: number) {
  const ctx = getContext();
  if (!ctx || isMuted) return;

  try {
    // Celesta / Music Box Bell Timbre: fundamental + chime overtone
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, ctx.currentTime);

    // Subtle sweet bell octave overtone
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, ctx.currentTime);

    const startTime = ctx.currentTime;
    const peakGain = 0.055;

    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(peakGain, startTime + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(startTime);
    osc2.start(startTime);
    osc1.stop(startTime + duration + 0.1);
    osc2.stop(startTime + duration + 0.1);

    melodyActiveOscs.push(osc1, osc2);
    setTimeout(() => {
      melodyActiveOscs = melodyActiveOscs.filter((o) => o !== osc1 && o !== osc2);
    }, (duration + 0.2) * 1000);
  } catch {
    // Graceful fallback
  }
}

export function startBirthdayMusic(onStateChange?: (playing: boolean) => void) {
  if (isMusicPlaying) return;
  const ctx = getContext();
  if (!ctx) return;
  if (isMuted) {
    isMuted = false;
  }

  isMusicPlaying = true;
  onStateChange?.(true);

  let currentIdx = 0;

  const scheduleNext = () => {
    if (!isMusicPlaying) return;
    const item = BIRTHDAY_NOTES[currentIdx];
    playNote(item.note, item.dur);

    currentIdx = (currentIdx + 1) % BIRTHDAY_NOTES.length;
    melodyTimeout = window.setTimeout(
      scheduleNext,
      item.pause * 1000 * 0.95 // slightly swift, cheerful music box tempo
    );
  };

  scheduleNext();
}

export function stopBirthdayMusic(onStateChange?: (playing: boolean) => void) {
  isMusicPlaying = false;
  onStateChange?.(false);
  if (melodyTimeout) {
    clearTimeout(melodyTimeout);
    melodyTimeout = null;
  }
  melodyActiveOscs.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      // Ignored
    }
  });
  melodyActiveOscs = [];
}

export function toggleBirthdayMusic(onStateChange?: (playing: boolean) => void): boolean {
  if (isMusicPlaying) {
    stopBirthdayMusic(onStateChange);
    return false;
  } else {
    startBirthdayMusic(onStateChange);
    return true;
  }
}


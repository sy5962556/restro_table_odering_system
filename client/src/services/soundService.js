// Web Audio API Sound Synthesizer for Real-Time Kitchen & Restaurant Notifications

let audioCtx = null;

const getAudioContext = () => {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

/**
 * Play high-pitched double dining bell chime for New Order / Waiter Call
 */
export const playOrderBell = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const playChime = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, startTime + duration);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    const now = ctx.currentTime;
    playChime(880, now, 0.4);        // A5
    playChime(1318.5, now + 0.15, 0.6); // E6
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};

/**
 * Play pleasant success chime for order placed / bill generated
 */
export const playSuccessChime = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.35);
    });
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};

/**
 * Play urgent pulsating alarm for low stock / urgent waiter call
 */
export const playUrgentAlert = () => {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.2, 0.4].forEach(offset => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(600, now + offset);
      osc.frequency.setValueAtTime(450, now + offset + 0.1);

      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.01, now + offset + 0.18);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.18);
    });
  } catch (err) {
    console.warn('Audio play error:', err);
  }
};

export const soundService = {
  playOrderBell,
  playDiningBell: playOrderBell,
  playSuccessChime,
  playUrgentAlert
};

export default soundService;

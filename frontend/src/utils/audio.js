let audioCtx = null;

function getAudioContext() {
  if (typeof window === 'undefined') return null;
  // Lazily instantiate AudioContext on first user interaction to bypass browser policies
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

/**
 * Plays a premium synthesized chime notification sound
 */
export function playNotificationSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Chime 1 (C5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.55);

    osc1.connect(gain1);
    gain1.connect(ctx.destination);

    // Chime 2 (E5) delayed slightly for arpeggio chime effect
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(659.25, now + 0.08); // E5
    gain2.gain.setValueAtTime(0, now + 0.08);
    gain2.gain.linearRampToValueAtTime(0.15, now + 0.10);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);

    osc2.connect(gain2);
    gain2.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.6);

    osc2.start(now + 0.08);
    osc2.stop(now + 0.7);
  } catch (error) {
    console.warn('Synthesized audio chime failed to play:', error);
  }
}

/**
 * Plays an ascending arpeggiated success chord sweep (celebration)
 */
export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    const delays = [0, 0.07, 0.14, 0.21];

    notes.forEach((freq, i) => {
      const startTime = now + delays[i];
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      // Warm triangle wave instead of simple sine for a more rich chord texture
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);
      
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.08, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.6);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(startTime);
      osc.stop(startTime + 0.65);
    });
  } catch (error) {
    console.warn('Synthesized celebration chords failed to play:', error);
  }
}

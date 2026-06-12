/**
 * Synthesizes a traditional visual Wooden Fish (木魚) sound using Web Audio API.
 * This is clean, safe, and works entirely offline.
 */
export function playWoodenFishSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    // Low, wooden hollow sound. We use a combination of triangle wave with low frequency and steep frequency drop.
    osc.type = "triangle";
    osc.frequency.setValueAtTime(260, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.12);
    
    gain.gain.setValueAtTime(0.7, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch (e) {
    console.warn("Audio Context playback not allowed yet / failed:", e);
  }
}

/**
 * Synthesizes a solemn Temple Bell / Bowl (磬/引磬) gong-like sound.
 * Used to celebrate a completed sutra count submission.
 */
export function playBellSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Combine 2 oscillators for metallic high harmonics (Traditional bowl chime / Qing 磬)
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, ctx.currentTime); // E5 frequency
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(987.77, ctx.currentTime); // B5 frequency (perfect fifth higher)
    
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 2.0);
    
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    
    osc1.start();
    osc2.start();
    
    osc1.stop(ctx.currentTime + 2.1);
    osc2.stop(ctx.currentTime + 2.1);
  } catch (e) {
    console.warn("Audio Context playback failed:", e);
  }
}

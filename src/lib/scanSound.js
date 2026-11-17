// Short confirmation tones for the scanner, generated on the fly with the
// Web Audio API — no audio file to host or load, works offline, and is
// instant (no network round-trip for a sound asset).
let ctx = null;
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  // Browsers suspend AudioContext until a user gesture; a scan is always
  // triggered by user action (camera already running from a button press,
  // or manual submit), so this resume is effectively synchronous in practice.
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, startTime, duration, gainPeak = 0.22) {
  const audioCtx = getCtx();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.015);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

// Bright rising two-note chime — "confirmed".
export function playSuccessSound() {
  try {
    const audioCtx = getCtx();
    const now = audioCtx.currentTime;
    tone(880, now, 0.12);
    tone(1320, now + 0.1, 0.18);
  } catch { /* audio unsupported/blocked — scan result still shows visually */ }
}

// Single flat mid tone — "already used".
export function playDuplicateSound() {
  try {
    const audioCtx = getCtx();
    tone(440, audioCtx.currentTime, 0.22, 0.18);
  } catch { /* ignore */ }
}

// Low double buzz — "invalid".
export function playErrorSound() {
  try {
    const audioCtx = getCtx();
    const now = audioCtx.currentTime;
    tone(220, now, 0.14, 0.2);
    tone(190, now + 0.16, 0.18, 0.2);
  } catch { /* ignore */ }
}

export function playScanSound(result) {
  if (result === 'success') playSuccessSound();
  else if (result === 'duplicate') playDuplicateSound();
  else playErrorSound();
}

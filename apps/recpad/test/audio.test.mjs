import assert from "node:assert/strict";
import test from "node:test";

import {
  applyGain,
  clampRange,
  cut,
  dbToGain,
  decodeWav,
  encodeWav,
  fft,
  formatTime,
  mixToMono,
  normalize,
  peak,
  peaks,
  rms,
  spectralGate,
  trim,
  UndoStack,
  NORMALIZE_PEAK,
} from "../src/lib/audio.ts";

// Deterministic noise so the gate test cannot flake.
function noise(n, amp, seed = 1234) {
  let s = seed >>> 0;
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    s = (s * 1664525 + 1013904223) >>> 0;
    out[i] = ((s / 0xffffffff) * 2 - 1) * amp;
  }
  return out;
}

function sine(sampleRate, seconds, freq, amp) {
  const n = Math.round(sampleRate * seconds);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = amp * Math.sin((2 * Math.PI * freq * i) / sampleRate);
  return out;
}

test("WAV encoder writes a valid RIFF header and round-trips the sample count", () => {
  const sr = 44100;
  const left = sine(sr, 0.5, 440, 0.5);
  const buf = encodeWav([left], sr);
  const view = new DataView(buf);
  const tag = (o) => String.fromCharCode(view.getUint8(o), view.getUint8(o + 1), view.getUint8(o + 2), view.getUint8(o + 3));
  assert.equal(tag(0), "RIFF");
  assert.equal(tag(8), "WAVE");
  assert.equal(tag(12), "fmt ");
  assert.equal(tag(36), "data");
  assert.equal(view.getUint16(20, true), 1, "PCM");
  assert.equal(view.getUint16(22, true), 1, "mono");
  assert.equal(view.getUint32(24, true), sr);
  assert.equal(view.getUint16(34, true), 16, "16-bit");
  assert.equal(view.getUint32(40, true), left.length * 2);
  assert.equal(buf.byteLength, 44 + left.length * 2);

  const back = decodeWav(buf);
  assert.equal(back.sampleRate, sr);
  assert.equal(back.channels.length, 1);
  assert.equal(back.channels[0].length, left.length);
  let maxErr = 0;
  for (let i = 0; i < left.length; i++) maxErr = Math.max(maxErr, Math.abs(back.channels[0][i] - left[i]));
  assert.ok(maxErr < 1 / 0x7fff + 1e-6, `16-bit quantisation only, got ${maxErr}`);
});

test("WAV encoder interleaves stereo and the decoder splits it back", () => {
  const l = new Float32Array([0.25, -0.25, 0.5]);
  const r = new Float32Array([-0.5, 0.75, -1]);
  const back = decodeWav(encodeWav([l, r], 22050));
  assert.equal(back.channels.length, 2);
  assert.ok(Math.abs(back.channels[0][2] - 0.5) < 1e-3);
  assert.ok(Math.abs(back.channels[1][1] - 0.75) < 1e-3);
  assert.ok(Math.abs(back.channels[1][2] + 1) < 1e-3);
  const mono = mixToMono(back.channels);
  assert.equal(mono.length, 3);
  assert.ok(Math.abs(mono[0] - (0.25 - 0.5) / 2) < 1e-3);
});

test("normalize lifts the loudest sample to about -1 dB and leaves silence alone", () => {
  const quiet = sine(8000, 0.2, 100, 0.2);
  const loud = normalize(quiet);
  assert.ok(Math.abs(peak(loud) - NORMALIZE_PEAK) < 1e-3, `peak ${peak(loud)}`);
  assert.equal(loud.length, quiet.length);
  assert.ok(Math.abs(peak(quiet) - 0.2) < 1e-3, "input untouched");
  const custom = normalize(quiet, 0.5);
  assert.ok(Math.abs(peak(custom) - 0.5) < 1e-3);
  const silence = normalize(new Float32Array(100));
  assert.equal(peak(silence), 0);
  assert.equal(silence.length, 100);
});

test("gain multiplies samples, clips at full scale, and dB conversion is sane", () => {
  const x = new Float32Array([0.1, -0.2, 0.5]);
  const y = applyGain(x, 2);
  assert.deepEqual(Array.from(y).map((v) => +v.toFixed(4)), [0.2, -0.4, 1]);
  assert.equal(applyGain(x, 10)[2], 1, "clipped");
  assert.equal(applyGain(x, -10)[2], -1, "clipped negative");
  assert.ok(Math.abs(dbToGain(6) - 1.9953) < 1e-3);
  assert.ok(Math.abs(dbToGain(-6) - 0.5012) < 1e-3);
  assert.ok(Math.abs(dbToGain(0) - 1) < 1e-9);
  assert.ok(Math.abs(rms(new Float32Array([1, -1, 1, -1])) - 1) < 1e-9);
});

test("trim keeps the selection, cut removes it, ranges are clamped and ordered", () => {
  const x = new Float32Array(1000).map((_, i) => i / 1000);
  assert.equal(trim(x, 100, 400).length, 300);
  assert.equal(trim(x, 400, 100).length, 300, "reversed range");
  assert.equal(trim(x, -50, 5000).length, 1000, "clamped");
  assert.equal(trim(x, 100, 400)[0], x[100]);
  const c = cut(x, 100, 400);
  assert.equal(c.length, 700);
  assert.equal(c[99], x[99]);
  assert.equal(c[100], x[400]);
  assert.equal(cut(x, 0, 1000).length, 0);
  assert.deepEqual(clampRange(7.4, 2.6, 5), [3, 5]);
  assert.equal(x.length, 1000, "input untouched");
});

test("peaks buckets min/max per column", () => {
  const x = new Float32Array([0, 0.5, -0.5, 0, 1, -1, 0, 0]);
  const p = peaks(x, 2);
  assert.equal(p.max[0], 0.5);
  assert.equal(p.min[0], -0.5);
  assert.equal(p.max[1], 1);
  assert.equal(p.min[1], -1);
  const empty = peaks(new Float32Array(0), 4);
  assert.equal(empty.max.length, 4);
});

test("fft: a pure tone lands in one bin and the inverse restores the signal", () => {
  const n = 1024;
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) re[i] = Math.sin((2 * Math.PI * 16 * i) / n);
  const orig = Float64Array.from(re);
  fft(re, im);
  let best = 0;
  for (let k = 1; k < n / 2; k++) if (Math.hypot(re[k], im[k]) > Math.hypot(re[best], im[best])) best = k;
  assert.equal(best, 16);
  fft(re, im, true);
  let err = 0;
  for (let i = 0; i < n; i++) err = Math.max(err, Math.abs(re[i] - orig[i]));
  assert.ok(err < 1e-9, `inverse error ${err}`);
});

test("spectral gate removes most of the energy from a noise-only buffer", () => {
  const sr = 16000;
  const x = noise(sr * 2, 0.05);
  const before = rms(x);
  const y = spectralGate(x, sr, { strength: 1 });
  assert.equal(y.length, x.length);
  const after = rms(y);
  assert.ok(after < before * 0.3, `expected ≥70% reduction, got ${(1 - after / before) * 100}%`);
  assert.ok(Math.abs(rms(x) - before) < 1e-9, "input untouched");
});

test("spectral gate keeps a loud tone while quieting the hiss around it", () => {
  const sr = 16000;
  const hiss = noise(sr * 3, 0.02, 99);
  const tone = sine(sr, 1, 330, 0.5);
  const x = new Float32Array(hiss);
  // Tone sits in the middle second; the first and last seconds are room tone.
  for (let i = 0; i < tone.length; i++) x[sr + i] += tone[i];
  const y = spectralGate(x, sr, { strength: 0.8 });
  const head = (b) => b.subarray(0, sr - 2048);
  const mid = (b) => b.subarray(sr + 2048, sr * 2 - 2048);
  const hissBefore = rms(head(x));
  const hissAfter = rms(head(y));
  const toneBefore = rms(mid(x));
  const toneAfter = rms(mid(y));
  assert.ok(hissAfter < hissBefore * 0.4, `hiss ${hissBefore} -> ${hissAfter}`);
  assert.ok(toneAfter > toneBefore * 0.8, `tone ${toneBefore} -> ${toneAfter}`);
});

test("spectral gate with strength 0 is a no-op and empty input stays empty", () => {
  const x = noise(4000, 0.1);
  const y = spectralGate(x, 8000, { strength: 0 });
  assert.deepEqual(Array.from(y), Array.from(x));
  assert.equal(spectralGate(new Float32Array(0), 8000).length, 0);
});

test("undo stack restores the previous buffer length and is capped", () => {
  const stack = new UndoStack(3);
  let buf = new Float32Array(1000).fill(0.1);
  stack.push(buf);
  buf = trim(buf, 0, 500);
  assert.equal(buf.length, 500);
  stack.push(buf);
  buf = cut(buf, 100, 200);
  assert.equal(buf.length, 400);
  buf = stack.pop();
  assert.equal(buf.length, 500);
  buf = stack.pop();
  assert.equal(buf.length, 1000);
  assert.equal(stack.pop(), undefined);
  for (let i = 0; i < 10; i++) stack.push(new Float32Array(i + 1));
  assert.equal(stack.size, 3);
  assert.equal(stack.pop().length, 10);
  const src = new Float32Array([1, 2, 3]);
  stack.push(src);
  src[0] = 9;
  assert.equal(stack.pop()[0], 1, "push stores a copy");
});

test("formatTime renders m:ss.s", () => {
  assert.equal(formatTime(0), "0:00.0");
  assert.equal(formatTime(61_500), "1:01.5");
  assert.equal(formatTime(-5), "0:00.0");
});

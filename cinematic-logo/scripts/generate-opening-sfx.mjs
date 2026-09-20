import fs from "node:fs";
import path from "node:path";

const sampleRate = 48000;
const duration = 7;
const channels = 2;
const samples = sampleRate * duration;
const bytesPerSample = 2;
const dataSize = samples * channels * bytesPerSample;
const buffer = Buffer.alloc(44 + dataSize);

buffer.write("RIFF", 0);
buffer.writeUInt32LE(36 + dataSize, 4);
buffer.write("WAVE", 8);
buffer.write("fmt ", 12);
buffer.writeUInt32LE(16, 16);
buffer.writeUInt16LE(1, 20);
buffer.writeUInt16LE(channels, 22);
buffer.writeUInt32LE(sampleRate, 24);
buffer.writeUInt32LE(sampleRate * channels * bytesPerSample, 28);
buffer.writeUInt16LE(channels * bytesPerSample, 32);
buffer.writeUInt16LE(bytesPerSample * 8, 34);
buffer.write("data", 36);
buffer.writeUInt32LE(dataSize, 40);

const dumHits = [0.18, 1.28, 2.38, 3.48, 4.58, 5.68, 6.22];
const takHits = [0.72, 1.82, 2.92, 4.02, 5.12, 6.0];
const clapHits = [1.82, 3.48, 5.12, 6.22];
const rollHits = [5.76, 5.91, 6.06, 6.21, 6.36];
const delayLeft = new Float32Array(Math.round(sampleRate * 0.105));
const delayRight = new Float32Array(Math.round(sampleRate * 0.145));
let leftIndex = 0;
let rightIndex = 0;
let randomState = 0x91b7d2e5;
let softNoise = 0;

const random = () => {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 0xffffffff;
};

const smoothStep = (edge0, edge1, x) => {
  const value = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return value * value * (3 - 2 * value);
};

const dafDum = (time, start, noise) => {
  if (time < start || time > start + 0.62) return 0;
  const local = time - start;
  const pitch = 104 - 42 * Math.min(1, local / 0.32);
  const body = Math.sin(2 * Math.PI * pitch * local) * Math.exp(-local * 8.8);
  const skin = noise * Math.exp(-local * 34) * 0.28;
  return (body * 0.9 + skin) * 0.18;
};

const dafTak = (time, start, noise) => {
  if (time < start || time > start + 0.23) return 0;
  const local = time - start;
  const attack = 1 - Math.exp(-local * 260);
  const ring =
    Math.sin(2 * Math.PI * 820 * local) * 0.28 +
    Math.sin(2 * Math.PI * 1280 * local) * 0.15;
  return (noise * 0.72 + ring) * attack * Math.exp(-local * 22) * 0.075;
};

const handClap = (time, start, noise) => {
  if (time < start || time > start + 0.24) return 0;
  const local = time - start;
  const burst1 = Math.exp(-local * 35);
  const burst2 = local > 0.026 ? Math.exp(-(local - 0.026) * 42) * 0.58 : 0;
  const burst3 = local > 0.052 ? Math.exp(-(local - 0.052) * 48) * 0.34 : 0;
  return noise * (burst1 + burst2 + burst3) * 0.047;
};

const dafRoll = (time, start, noise) => {
  if (time < start || time > start + 0.14) return 0;
  const local = time - start;
  return (
    (noise * 0.74 + Math.sin(2 * Math.PI * 690 * local) * 0.26) *
    Math.exp(-local * 28) *
    0.042
  );
};

for (let i = 0; i < samples; i++) {
  const time = i / sampleRate;
  const fadeIn = smoothStep(0, 0.13, time);
  const fadeOut = 1 - smoothStep(6.46, 7, time);
  const noise = random() * 2 - 1;
  softNoise = softNoise * 0.975 + noise * 0.025;

  let rhythm = 0;
  for (const hit of dumHits) rhythm += dafDum(time, hit, noise);
  for (const hit of takHits) rhythm += dafTak(time, hit, noise);
  for (const hit of clapHits) rhythm += handClap(time, hit, noise);
  for (const hit of rollHits) rhythm += dafRoll(time, hit, noise);

  const pulse = Math.floor(time / 0.275);
  const pulseStart = pulse * 0.275;
  const pulseLocal = time - pulseStart;
  const shaker =
    noise *
    Math.exp(-pulseLocal * 52) *
    (pulse % 2 === 0 ? 0.0075 : 0.0045) *
    smoothStep(0.35, 1.1, time) *
    (1 - smoothStep(6.2, 6.8, time));

  const roomTone = softNoise * 0.0025 * smoothStep(0, 0.5, time) * fadeOut;
  const dry = (rhythm + shaker + roomTone) * fadeIn * fadeOut;
  const echoLeft = delayLeft[leftIndex];
  const echoRight = delayRight[rightIndex];
  delayLeft[leftIndex] = dry + echoRight * 0.08;
  delayRight[rightIndex] = dry + echoLeft * 0.07;
  leftIndex = (leftIndex + 1) % delayLeft.length;
  rightIndex = (rightIndex + 1) % delayRight.length;

  const left = Math.max(-1, Math.min(1, dry * 0.96 + echoLeft * 0.13 + echoRight * 0.04));
  const right = Math.max(-1, Math.min(1, dry * 0.96 + echoRight * 0.13 + echoLeft * 0.04));
  const offset = 44 + i * 4;
  buffer.writeInt16LE(Math.round(left * 32767), offset);
  buffer.writeInt16LE(Math.round(right * 32767), offset + 2);
}

const output = path.resolve("public", "opening-sfx-nasheed-sunnah.wav");
fs.writeFileSync(output, buffer);
console.log(output);

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

let randomState = 0x6d2b79f5;
let smoothNoise = 0;

const random = () => {
  randomState = (Math.imul(randomState, 1664525) + 1013904223) >>> 0;
  return randomState / 0xffffffff;
};

const smoothStep = (edge0, edge1, x) => {
  const value = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return value * value * (3 - 2 * value);
};

const bell = (time, start, frequency, gain, decay) => {
  if (time < start) return 0;
  const local = time - start;
  return Math.sin(2 * Math.PI * frequency * local) * Math.exp(-local * decay) * gain;
};

for (let i = 0; i < samples; i++) {
  const time = i / sampleRate;
  const fadeIn = smoothStep(0, 0.75, time);
  const fadeOut = 1 - smoothStep(6.25, 7, time);
  const swell = Math.sin(Math.PI * Math.min(1, time / duration));
  const fundamental = 48 + 24 * (time / duration);

  const low =
    Math.sin(2 * Math.PI * fundamental * time) * 0.085 +
    Math.sin(2 * Math.PI * fundamental * 2.01 * time) * 0.028;

  const shimmer =
    bell(time, 0.72, 523.25, 0.07, 1.9) +
    bell(time, 1.05, 783.99, 0.045, 2.4) +
    bell(time, 3.82, 659.25, 0.06, 2.1) +
    bell(time, 4.22, 987.77, 0.042, 2.8) +
    bell(time, 5.25, 1174.66, 0.055, 2.6);

  const impactTime = Math.max(0, time - 4.95);
  const impact =
    time >= 4.95
      ? Math.sin(2 * Math.PI * (82 - 22 * Math.min(1, impactTime)) * impactTime) *
        Math.exp(-impactTime * 2.8) *
        0.16
      : 0;

  const noiseEnvelope =
    smoothStep(0.2, 2.4, time) *
    (1 - smoothStep(5.15, 6.2, time)) *
    (0.035 + 0.05 * smoothStep(3.4, 5.05, time));
  smoothNoise = smoothNoise * 0.94 + (random() * 2 - 1) * 0.06;
  const air = smoothNoise * noiseEnvelope;

  const mono = (low * (0.35 + swell * 0.65) + shimmer + impact + air) * fadeIn * fadeOut;
  const left = Math.max(-1, Math.min(1, mono * 0.97));
  const right = Math.max(-1, Math.min(1, mono * 1.03));
  const offset = 44 + i * 4;
  buffer.writeInt16LE(Math.round(left * 32767), offset);
  buffer.writeInt16LE(Math.round(right * 32767), offset + 2);
}

const output = path.resolve("public", "opening-sfx.wav");
fs.writeFileSync(output, buffer);
console.log(output);

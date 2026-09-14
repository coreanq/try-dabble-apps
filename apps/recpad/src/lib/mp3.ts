/**
 * MP3 export with the pure-JavaScript LAME port (@breezystack/lamejs). The
 * encoder is loaded on first use so the main bundle stays small, and it
 * runs entirely inside this tab: no upload, no server-side transcoder, no
 * paywall. 128 kbps mono is plenty for a practice take.
 */
import { floatTo16 } from "./audio.ts";

export const MP3_KBPS = 128;
const BLOCK = 1152;

export async function encodeMp3(samples: Float32Array, sampleRate: number, kbps = MP3_KBPS): Promise<Blob> {
  const { Mp3Encoder } = await import("@breezystack/lamejs");
  const encoder = new Mp3Encoder(1, sampleRate, kbps);
  const pcm = floatTo16(samples);
  const parts: BlobPart[] = [];
  for (let i = 0; i < pcm.length; i += BLOCK) {
    const chunk = encoder.encodeBuffer(pcm.subarray(i, Math.min(i + BLOCK, pcm.length)));
    if (chunk.length > 0) parts.push(new Uint8Array(chunk));
  }
  const tail = encoder.flush();
  if (tail.length > 0) parts.push(new Uint8Array(tail));
  return new Blob(parts, { type: "audio/mpeg" });
}

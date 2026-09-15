/**
 * Per-note lock, Web Crypto only. A PIN or password plus a random salt goes
 * through PBKDF2-SHA-256 into an AES-GCM key; the body is encrypted with a
 * fresh iv every time it is written. What lands in storage and in the JSON
 * backup is { ciphertext, iv, salt, kdf } — never the body, never the PIN.
 *
 * There is no recovery path on purpose: without the PIN the ciphertext is
 * just bytes. The UI says so before a note is locked.
 */
export interface KdfParams {
  name: "PBKDF2";
  hash: "SHA-256";
  iterations: number;
}

export interface LockedBlob {
  ciphertext: string; // base64
  iv: string; // base64, 12 bytes
  salt: string; // base64, 16 bytes
  kdf: KdfParams;
}

export const KDF_ITERATIONS = 150_000;
export const MIN_KDF_ITERATIONS = 100_000;
export const DEFAULT_KDF: KdfParams = { name: "PBKDF2", hash: "SHA-256", iterations: KDF_ITERATIONS };

const enc = new TextEncoder();
const dec = new TextDecoder();

function subtle(): SubtleCrypto {
  const c = globalThis.crypto;
  if (!c?.subtle) throw new Error("Web Crypto is not available");
  return c.subtle;
}

export function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

export function fromBase64(text: string): Uint8Array {
  const s = atob(text);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

export function randomBytes(n: number): Uint8Array {
  const out = new Uint8Array(n);
  globalThis.crypto.getRandomValues(out);
  return out;
}

export function isKdfParams(v: unknown): v is KdfParams {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return o.name === "PBKDF2" && o.hash === "SHA-256" && typeof o.iterations === "number" && Number.isFinite(o.iterations) && o.iterations > 0;
}

export function isLockedBlob(v: unknown): v is LockedBlob {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.ciphertext === "string" && o.ciphertext.length > 0 && typeof o.iv === "string" && o.iv.length > 0 && typeof o.salt === "string" && o.salt.length > 0 && isKdfParams(o.kdf);
}

/** PIN + salt -> non-extractable AES-GCM key. Kept in memory for a session so edits re-encrypt without asking again. */
export async function deriveKey(secret: string, salt: Uint8Array, kdf: KdfParams = DEFAULT_KDF): Promise<CryptoKey> {
  const s = subtle();
  const material = await s.importKey("raw", enc.encode(secret.normalize("NFKC")), "PBKDF2", false, ["deriveKey"]);
  return s.deriveKey(
    { name: "PBKDF2", hash: kdf.hash, salt: salt as BufferSource, iterations: kdf.iterations },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptWithKey(key: CryptoKey, plaintext: string): Promise<{ ciphertext: string; iv: string }> {
  const iv = randomBytes(12);
  const buf = await subtle().encrypt({ name: "AES-GCM", iv: iv as BufferSource }, key, enc.encode(plaintext));
  return { ciphertext: toBase64(new Uint8Array(buf)), iv: toBase64(iv) };
}

export async function decryptWithKey(key: CryptoKey, ciphertext: string, iv: string): Promise<string> {
  const buf = await subtle().decrypt({ name: "AES-GCM", iv: fromBase64(iv) as BufferSource }, key, fromBase64(ciphertext) as BufferSource);
  return dec.decode(buf);
}

/** Fresh salt + fresh iv. Used when a note is first locked. */
export async function encryptText(secret: string, plaintext: string, kdf: KdfParams = DEFAULT_KDF): Promise<LockedBlob> {
  const salt = randomBytes(16);
  const key = await deriveKey(secret, salt, kdf);
  const { ciphertext, iv } = await encryptWithKey(key, plaintext);
  return { ciphertext, iv, salt: toBase64(salt), kdf: { ...kdf } };
}

/** Throws on a wrong PIN or tampered bytes (AES-GCM tag mismatch). */
export async function decryptText(secret: string, blob: LockedBlob): Promise<string> {
  const key = await deriveKey(secret, fromBase64(blob.salt), blob.kdf);
  return decryptWithKey(key, blob.ciphertext, blob.iv);
}

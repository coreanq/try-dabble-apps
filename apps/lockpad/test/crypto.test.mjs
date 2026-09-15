import assert from "node:assert/strict";
import test from "node:test";

import { decryptText, deriveKey, decryptWithKey, encryptText, encryptWithKey, fromBase64, isLockedBlob, KDF_ITERATIONS, toBase64 } from "../src/lib/crypto.ts";
import { backoffDelayMs, BACKOFF_MAX_MS, recordFailure, remainingMs, resetBackoff } from "../src/lib/backoff.ts";

test("base64 round trip", () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 255]);
  assert.equal(toBase64(bytes), "AAEC+v8=");
  assert.deepEqual([...fromBase64("AAEC+v8=")], [...bytes]);
});

test("encrypt -> decrypt round trip keeps the body and never stores it", async () => {
  const blob = await encryptText("1234", "the cat sat on the mat 🐈");
  assert.ok(isLockedBlob(blob));
  assert.equal(blob.kdf.name, "PBKDF2");
  assert.equal(blob.kdf.hash, "SHA-256");
  assert.ok(blob.kdf.iterations >= 100000);
  assert.equal(blob.kdf.iterations, KDF_ITERATIONS);
  assert.doesNotMatch(JSON.stringify(blob), /the cat/);
  assert.equal(await decryptText("1234", blob), "the cat sat on the mat 🐈");
});

test("a wrong PIN fails to decrypt", async () => {
  const blob = await encryptText("1234", "secret");
  await assert.rejects(() => decryptText("1235", blob));
  await assert.rejects(() => decryptText("", blob));
});

test("two encryptions of the same body use fresh salt and iv", async () => {
  const a = await encryptText("pw", "same");
  const b = await encryptText("pw", "same");
  assert.notEqual(a.salt, b.salt);
  assert.notEqual(a.iv, b.iv);
  assert.notEqual(a.ciphertext, b.ciphertext);
});

test("a cached key re-encrypts edits with a fresh iv and the same salt", async () => {
  const first = await encryptText("pw", "v1");
  const key = await deriveKey("pw", fromBase64(first.salt), first.kdf);
  const next = await encryptWithKey(key, "v2");
  assert.notEqual(next.iv, first.iv);
  assert.equal(await decryptWithKey(key, next.ciphertext, next.iv), "v2");
  assert.equal(await decryptText("pw", { ...first, ...next }), "v2");
});

test("tampered ciphertext is rejected", async () => {
  const blob = await encryptText("pw", "hello");
  const bytes = fromBase64(blob.ciphertext);
  bytes[0] ^= 0xff;
  await assert.rejects(() => decryptText("pw", { ...blob, ciphertext: toBase64(bytes) }));
});

test("isLockedBlob rejects partial blobs", () => {
  assert.ok(!isLockedBlob({ ciphertext: "a", iv: "b" }));
  assert.ok(!isLockedBlob({ ciphertext: "a", iv: "b", salt: "c", kdf: { name: "scrypt" } }));
  assert.ok(isLockedBlob({ ciphertext: "a", iv: "b", salt: "c", kdf: { name: "PBKDF2", hash: "SHA-256", iterations: 100000 } }));
});

test("wrong-PIN backoff doubles from 1s and caps", () => {
  assert.equal(backoffDelayMs(0), 0);
  assert.equal(backoffDelayMs(1), 1000);
  assert.equal(backoffDelayMs(2), 2000);
  assert.equal(backoffDelayMs(3), 4000);
  assert.equal(backoffDelayMs(4), 8000);
  assert.equal(backoffDelayMs(20), BACKOFF_MAX_MS);
  assert.equal(backoffDelayMs(-3), 0);
});

test("recordFailure / remainingMs / reset", () => {
  let s = resetBackoff();
  assert.equal(remainingMs(s, 1000), 0);
  s = recordFailure(s, 1000);
  assert.equal(s.failures, 1);
  assert.equal(s.lockedUntil, 2000);
  assert.equal(remainingMs(s, 1500), 500);
  assert.equal(remainingMs(s, 2000), 0);
  s = recordFailure(s, 2000);
  assert.equal(s.failures, 2);
  assert.equal(s.lockedUntil, 4000);
  s = recordFailure(s, 4000);
  assert.equal(s.lockedUntil, 8000);
  assert.deepEqual(resetBackoff(), { failures: 0, lockedUntil: 0 });
});

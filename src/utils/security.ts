/**
 * Security and privacy utilities for Masrofy.
 *
 * IMPORTANT SECURITY DISCLOSURE & MODEL:
 * 1. Client-Side Screen Locking:
 *    The in-app PIN is an application-layer UI barrier designed to protect against casual
 *    snooping when the device is unlocked and handed to another person.
 * 2. Cryptographic Classification:
 *    This uses salted SHA-256 hashing. It is NOT equivalent to, nor a replacement for,
 *    password-specific memory-hard Key Derivation Functions (KDFs) such as Argon2id,
 *    scrypt, or PBKDF2. Because 6-digit PINs have a tiny search space (1,000,000 permutations),
 *    no client-side hash can withstand an offline brute-force attack by an adversary with direct
 *    filesystem/IndexedDB access.
 * 3. Never Store Plaintext:
 *    Even if Web Crypto (crypto.subtle) is unavailable, the fallback algorithm performs a true
 *    deterministic SHA-256 calculation so the PIN is never silently written in plaintext.
 */

const PIN_SALT = 'masrofy_v1_secure_pin_salt';

/**
 * Standard pure JS implementation of SHA-256 (FIPS 180-4)
 * Ensures standard SHA-256 hashes are produced even if crypto.subtle is unavailable.
 */
function sha256Pure(ascii: string): string {
  function rightRotate(value: number, amount: number) {
    return (value >>> amount) | (value << (32 - amount));
  }

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
  ];

  let i = 0;
  for (; i < ascii.length; i++) {
    words[i >> 2] |= (ascii.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  words[i >> 2] |= 0x80 << (24 - (i % 4) * 8);
  words[(((ascii.length + 8) >> 6) << 4) + 15] = asciiBitLength;

  const w = new Array(64);
  for (let j = 0; j < words.length; j += 16) {
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      if (t < 16) {
        w[t] = words[j + t] | 0;
      } else {
        const gamma0 = rightRotate(w[t - 15], 7) ^ rightRotate(w[t - 15], 18) ^ (w[t - 15] >>> 3);
        const gamma1 = rightRotate(w[t - 2], 17) ^ rightRotate(w[t - 2], 19) ^ (w[t - 2] >>> 10);
        w[t] = (w[t - 16] + gamma0 + w[t - 7] + gamma1) | 0;
      }
      const s1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + s1 + ch + k[t] + w[t]) | 0;
      const s0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (s0 + maj) | 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
  }

  function toHex(val: number) {
    return (val >>> 0).toString(16).padStart(8, '0');
  }
  return toHex(h0) + toHex(h1) + toHex(h2) + toHex(h3) + toHex(h4) + toHex(h5) + toHex(h6) + toHex(h7);
}

/**
 * Hashes a PIN with the application salt using SHA-256.
 * Output format: 'sha256:<64-char-hex>'
 */
export async function hashPasscode(pin: string): Promise<string> {
  const normalized = (pin || '').trim();
  const payload = `${PIN_SALT}:${normalized}`;

  if (typeof crypto !== 'undefined' && crypto.subtle && typeof crypto.subtle.digest === 'function') {
    try {
      const encoder = new TextEncoder();
      const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(payload));
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      return `sha256:${hex}`;
    } catch {
      // Fall through to pure JS SHA-256 implementation
    }
  }

  // Guaranteed standard SHA-256 fallback; never outputs plaintext
  const hex = sha256Pure(payload);
  return `sha256:${hex}`;
}

/**
 * Verifies an entered PIN against a stored passcode.
 * Backward compatible: Handles both hashed passcodes and legacy 6-digit plaintext PINs.
 */
export async function verifyPasscode(inputPin: string, storedPasscode: string): Promise<boolean> {
  if (!inputPin || !storedPasscode) return false;
  const normalizedInput = inputPin.trim();
  const normalizedStored = storedPasscode.trim();

  // If stored in hashed format
  if (normalizedStored.startsWith('sha256:')) {
    const computedHash = await hashPasscode(normalizedInput);
    return computedHash === normalizedStored;
  }

  // Legacy plaintext backward-compatibility (e.g. '123456')
  return normalizedInput === normalizedStored;
}

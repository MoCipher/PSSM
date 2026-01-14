// Web Crypto-based encryption helpers for browser-safe PBKDF2 + AES-GCM
const subtle = window.crypto.subtle;

const bufToBase64 = (buf: ArrayBuffer): string => {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
};

const base64ToBuf = (b64: string): ArrayBuffer => {
  const binary = atob(b64);
  const len = binary.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
};

const strToBuf = (str: string) => new TextEncoder().encode(str);
const bufToStr = (buf: ArrayBuffer) => new TextDecoder().decode(buf);

export interface EncryptedBlob {
  version: number;
  salt: string; // base64
  iv: string; // base64
  iterations: number;
  ciphertext: string; // base64
}

export const generateSalt = (length = 16): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(length));
};

export const generateIv = (length = 12): Uint8Array => {
  return window.crypto.getRandomValues(new Uint8Array(length));
};

export const deriveKey = async (password: string, salt: Uint8Array, iterations = 200000) => {
  const baseKey = await subtle.importKey(
    'raw',
    strToBuf(password),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return subtle.deriveKey(
    {
      name: 'PBKDF2',
      // ensure we pass a plain ArrayBufferView backed by a standard ArrayBuffer
      salt: Uint8Array.from(salt),
      iterations,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
};

export const encryptWithPassword = async (plaintext: string, password: string): Promise<string> => {
  const salt = generateSalt(16);
  const iv = generateIv(12);
  const iterations = 200000;

  const key = await deriveKey(password, salt, iterations);

  const ct = await subtle.encrypt(
    { name: 'AES-GCM', iv: Uint8Array.from(iv) },
    key,
    strToBuf(plaintext)
  );

  const blob: EncryptedBlob = {
    version: 1,
    salt: bufToBase64(Uint8Array.from(salt).buffer),
    iv: bufToBase64(Uint8Array.from(iv).buffer),
    iterations,
    ciphertext: bufToBase64(ct)
  };

  return JSON.stringify(blob);
};

export const decryptWithPassword = async (encrypted: string, password: string): Promise<string> => {
  const blob: EncryptedBlob = JSON.parse(encrypted);
  if (blob.version !== 1) throw new Error('Unsupported encrypted blob version');

  const salt = new Uint8Array(base64ToBuf(blob.salt));
  const iv = new Uint8Array(base64ToBuf(blob.iv));

  const key = await deriveKey(password, salt, blob.iterations);

  const pt = await subtle.decrypt(
    { name: 'AES-GCM', iv: iv },
    key,
    base64ToBuf(blob.ciphertext)
  );

  return bufToStr(pt);
};

export const deriveVerifier = async (password: string, salt: Uint8Array, iterations = 200000): Promise<string> => {
  // Derive raw bits from PBKDF2 and use that as the verifier. We avoid
  // exporting CryptoKey material (which may be non-extractable) by
  // deriving bits directly using the SubtleCrypto API.
  const baseKey = await subtle.importKey(
    'raw',
    strToBuf(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const bits = await subtle.deriveBits(
    { name: 'PBKDF2', salt: Uint8Array.from(salt), iterations, hash: 'SHA-256' },
    baseKey,
    256
  );

  return bufToBase64(bits);
};

export default {};

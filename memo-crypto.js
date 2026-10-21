// メモの暗号化・復号（ブラウザと Node の両方で動く Web Crypto 実装）
// 形式: { v, kdf, iter, salt, iv, ct }（salt/iv/ct は base64）
// 鍵: PBKDF2-SHA256 でパスフレーズから導出 / 暗号: AES-256-GCM

const ITERATIONS = 600000;

const enc = new TextEncoder();
const dec = new TextDecoder();

function toBase64(bytes) {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function fromBase64(str) {
  return Uint8Array.from(atob(str), c => c.charCodeAt(0));
}

async function deriveKey(passphrase, salt, iterations) {
  const base = await crypto.subtle.importKey('raw', enc.encode(passphrase), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt, iterations },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptMemo(text, passphrase) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt, ITERATIONS);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text)));
  return {
    v: 1,
    kdf: 'PBKDF2-SHA256',
    iter: ITERATIONS,
    salt: toBase64(salt),
    iv: toBase64(iv),
    ct: toBase64(ct),
  };
}

// パスフレーズが違う（またはデータが壊れている）場合は例外を投げる
export async function decryptMemo(data, passphrase) {
  if (data.v !== 1) throw new Error('未対応の形式です (v=' + data.v + ')');
  const key = await deriveKey(passphrase, fromBase64(data.salt), data.iter);
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(data.iv) }, key, fromBase64(data.ct));
  return dec.decode(pt);
}

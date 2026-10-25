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

// --- 複数メモ ---
export const MIN_PASSPHRASE_LENGTH = 12;

// 暗号化する平文: { memos: [{ name, text }, ...] }（name は手元のファイル名から .txt を除いたもの）

// 名前が不正なら例外を投げる
export function validateName(name) {
  if (!name) throw new Error('名前が空です');
  if (/[\/\\]/.test(name)) throw new Error(`名前に / や \\ は使えません: ${name}`);
  if (name.startsWith('.')) throw new Error(`名前を . で始めることはできません: ${name}`);
}

// 旧形式（テキスト1つ）なら "memo" という名前のメモ1つとして扱う
export function parseMemos(plaintext) {
  try {
    const data = JSON.parse(plaintext);
    if (Array.isArray(data?.memos)) return data.memos.map(({ name, text }) => ({ name, text }));
  } catch {}
  return [{ name: 'memo', text: plaintext }];
}

export function serializeMemos(memos) {
  const names = new Set();
  for (const { name } of memos) {
    validateName(name);
    if (names.has(name)) throw new Error(`同じ名前のメモがあります: ${name}`);
    names.add(name);
  }
  return JSON.stringify({ memos: memos.map(({ name, text }) => ({ name, text })) });
}

// data/memo.txt（平文・非公開）を暗号化して memo.enc（公開用）を書き出す
// 使い方: node tools/encrypt.mjs
//   パスフレーズは環境変数 MEMO_PASSPHRASE、なければ端末で入力（表示されない）

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { encryptMemo, decryptMemo } from '../memo-crypto.js';
import { getPassphrase } from './passphrase.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = root + 'data/memo.txt';
const DEST = root + 'memo.enc';
const MIN_LENGTH = 12;

const text = await readFile(SRC, 'utf8');
const passphrase = await getPassphrase({ confirm: true });
if (passphrase.length < MIN_LENGTH) {
  console.error(`パスフレーズは ${MIN_LENGTH} 文字以上にしてください`);
  process.exit(1);
}

const data = await encryptMemo(text, passphrase);
// 書き出す前に復号できることを確認
if ((await decryptMemo(data, passphrase)) !== text) throw new Error('復号の確認に失敗しました');

await writeFile(DEST, JSON.stringify(data, null, 2) + '\n');
console.log(`暗号化しました: ${DEST}`);

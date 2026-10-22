// memo.enc を復号して data/memo.txt（平文・非公開）に書き出す
// ブラウザで編集した内容を手元に取り込むときに使う（先に git pull すること）
// 使い方: node tools/decrypt.mjs

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { decryptMemo } from '../memo-crypto.js';
import { getPassphrase } from './passphrase.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = root + 'memo.enc';
const DEST = root + 'data/memo.txt';

const data = JSON.parse(await readFile(SRC, 'utf8'));
const passphrase = await getPassphrase();

let text;
try {
  text = await decryptMemo(data, passphrase);
} catch {
  console.error('パスフレーズが違います');
  process.exit(1);
}

await writeFile(DEST, text);
console.log(`復号しました: ${DEST}`);

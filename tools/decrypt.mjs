// memo.enc を復号して data/<名前>.txt（平文・非公開）に1メモ1ファイルで書き出す
// ブラウザで編集した内容を手元に取り込むときに使う（先に git pull すること）
// memo.enc にないファイルが data/ にあっても消さない（警告のみ）
// 使い方: node tools/decrypt.mjs

import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { decryptMemo, parseMemos, validateName } from '../memo-crypto.js';
import { getPassphrase } from './passphrase.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = root + 'memo.enc';
const DEST_DIR = root + 'data/';

const data = JSON.parse(await readFile(SRC, 'utf8'));
const passphrase = await getPassphrase();

let plaintext;
try {
  plaintext = await decryptMemo(data, passphrase);
} catch {
  console.error('パスフレーズが違います');
  process.exit(1);
}

const memos = parseMemos(plaintext);
memos.forEach(m => validateName(m.name));

await mkdir(DEST_DIR, { recursive: true });
for (const { name, text } of memos) {
  await writeFile(DEST_DIR + name + '.txt', text);
  console.log(`復号しました: data/${name}.txt`);
}

const names = new Set(memos.map(m => m.name + '.txt'));
const extra = (await readdir(DEST_DIR)).filter(f => f.endsWith('.txt') && !names.has(f));
if (extra.length) {
  console.warn('\nmemo.enc にないファイルがあります（次の encrypt でメモとして追加されます。不要なら削除してください）:');
  extra.forEach(f => console.warn(`  data/${f}`));
}

// data/*.txt（平文・非公開）をまとめて暗号化して memo.enc（公開用）を書き出す
// ファイル名（.txt を除く）がメモの名前になる。data/ から消したファイルはメモからも消える
// 使い方: node tools/encrypt.mjs
//   パスフレーズは環境変数 MEMO_PASSPHRASE、なければ端末で入力（表示されない）

import { readdir, readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { encryptMemo, decryptMemo, serializeMemos } from '../memo-crypto.js';
import { getPassphrase } from './passphrase.mjs';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC_DIR = root + 'data/';
const DEST = root + 'memo.enc';
const MIN_LENGTH = 12;

const files = (await readdir(SRC_DIR)).filter(f => f.endsWith('.txt')).sort();
if (!files.length) {
  console.error('data/ に .txt ファイルがありません');
  process.exit(1);
}
const memos = await Promise.all(files.map(async f => ({
  name: f.slice(0, -'.txt'.length),
  text: await readFile(SRC_DIR + f, 'utf8'),
})));
const plaintext = serializeMemos(memos);

const passphrase = await getPassphrase({ confirm: true });
if (passphrase.length < MIN_LENGTH) {
  console.error(`パスフレーズは ${MIN_LENGTH} 文字以上にしてください`);
  process.exit(1);
}

const data = await encryptMemo(plaintext, passphrase);
// 書き出す前に復号できることを確認
if ((await decryptMemo(data, passphrase)) !== plaintext) throw new Error('復号の確認に失敗しました');

await writeFile(DEST, JSON.stringify(data, null, 2) + '\n');
console.log(`暗号化しました: ${DEST}（${files.map(f => f.slice(0, -4)).join(', ')}）`);

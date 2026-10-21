// data/memo.txt（平文・非公開）を暗号化して memo.enc（公開用）を書き出す
// 使い方: node tools/encrypt.mjs
//   パスフレーズは環境変数 MEMO_PASSPHRASE、なければ端末で入力（表示されない）

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { encryptMemo, decryptMemo } from '../memo-crypto.js';

const root = fileURLToPath(new URL('..', import.meta.url));
const SRC = root + 'data/memo.txt';
const DEST = root + 'memo.enc';
const MIN_LENGTH = 12;

function promptHidden(question) {
  return new Promise((resolve, reject) => {
    const { stdin, stdout } = process;
    if (!stdin.isTTY) return reject(new Error('端末から実行するか、MEMO_PASSPHRASE を設定してください'));
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    let input = '';
    const onData = ch => {
      if (ch === '\r' || ch === '\n') {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off('data', onData);
        stdout.write('\n');
        resolve(input);
      } else if (ch === '\u0003') {
        stdout.write('\n');
        process.exit(130);
      } else if (ch === '\u007f' || ch === '\b') {
        input = input.slice(0, -1);
      } else {
        input += ch;
      }
    };
    stdin.on('data', onData);
  });
}

async function getPassphrase() {
  if (process.env.MEMO_PASSPHRASE) return process.env.MEMO_PASSPHRASE;
  const first = await promptHidden('パスフレーズ: ');
  const second = await promptHidden('もう一度: ');
  if (first !== second) throw new Error('パスフレーズが一致しません');
  return first;
}

const text = await readFile(SRC, 'utf8');
const passphrase = await getPassphrase();
if (passphrase.length < MIN_LENGTH) {
  console.error(`パスフレーズは ${MIN_LENGTH} 文字以上にしてください`);
  process.exit(1);
}

const data = await encryptMemo(text, passphrase);
// 書き出す前に復号できることを確認
if ((await decryptMemo(data, passphrase)) !== text) throw new Error('復号の確認に失敗しました');

await writeFile(DEST, JSON.stringify(data, null, 2) + '\n');
console.log(`暗号化しました: ${DEST}`);

// パスフレーズの取得（環境変数 MEMO_PASSPHRASE、なければ端末で入力・非表示）

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

// confirm: true なら 2 回入力させて一致を確認する（暗号化時）
export async function getPassphrase({ confirm = false } = {}) {
  if (process.env.MEMO_PASSPHRASE) return process.env.MEMO_PASSPHRASE;
  const first = await promptHidden('パスフレーズ: ');
  if (confirm && first !== (await promptHidden('もう一度: '))) throw new Error('パスフレーズが一致しません');
  return first;
}

# memo-management

テキスト1つだけのメモを GitHub Pages で公開する最小構成。
メモはパスフレーズで暗号化して公開し、ブラウザ側で復号して表示する。

- 公開 URL: https://haya256.github.io/memo-management/

## 仕組み

- `memo.enc` — 暗号化したメモ（公開）。AES-256-GCM、鍵はパスフレーズから PBKDF2-SHA256（600,000 回）で導出
- `memo-crypto.js` — 暗号化・復号の処理（ブラウザと Node で共通）
- `index.html` — パスフレーズを入力すると `memo.enc` を取得してブラウザ内で復号・表示する。編集して保存すると、ブラウザ内で暗号化し GitHub Contents API で `memo.enc` を直接コミットする
- `tools/encrypt.mjs` — 手元の `data/memo.txt`（平文・リポジトリ外）を暗号化して `memo.enc` を書き出す
- `tools/decrypt.mjs` — `memo.enc` を復号して `data/memo.txt` に書き出す

## メモの更新方法

### ブラウザから（ふだんはこちら）

公開 URL を開き、パスフレーズを入力 →「編集」→「保存」。
初回の保存時に GitHub の fine-grained personal access token を求められる（下記）。トークンはパスフレーズで暗号化してブラウザの localStorage に保存される。

トークンの作り方: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- Repository access: Only select repositories → `memo-management`
- Permissions → Repository permissions → Contents: Read and write

### 手元から

```sh
git pull                      # ブラウザで保存した分を取り込む
node tools/decrypt.mjs        # memo.enc → data/memo.txt
# data/memo.txt を編集してから
node tools/encrypt.mjs        # パスフレーズを入力（表示されない）
git add memo.enc && git commit -m "Update memo" && git push
```

## 注意

- 暗号文は誰でも取得できるため、安全性はパスフレーズの強さで決まる。長く推測しにくいもの（例: 単語4〜5個の組み合わせ）を使うこと。
- パスフレーズを忘れるとメモは復元できない（平文は手元の `data/memo.txt` にのみある）。

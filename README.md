# memo-management

複数のテキストメモを GitHub Pages で公開する最小構成。
メモはパスフレーズで暗号化して公開し、ブラウザ側で復号して表示する。

- 公開 URL: https://haya256.github.io/memo-management/

## 仕組み

- `memo.enc` — 暗号化したメモ（公開）。全メモをまとめて1ファイルに暗号化するので、メモの数や名前も外からは見えない。AES-256-GCM、鍵はパスフレーズから PBKDF2-SHA256（600,000 回）で導出
- `memo-crypto.js` — 暗号化・復号と、複数メモのまとめ・分解の処理（ブラウザと Node で共通）
- `index.html` — パスフレーズを入力すると `memo.enc` を取得してブラウザ内で復号し、メモの一覧を表示する。メモの閲覧・編集・新規作成・削除ができ、保存すると、ブラウザ内で暗号化し GitHub Contents API で `memo.enc` を直接コミットする
- `tools/encrypt.mjs` — 手元の `data/*.txt`（平文・リポジトリ外、1メモ1ファイル）をまとめて暗号化して `memo.enc` を書き出す。ファイル名（`.txt` を除く）がメモの名前になる
- `tools/decrypt.mjs` — `memo.enc` を復号して `data/<名前>.txt` に書き出す

## メモの更新方法

### ブラウザから（ふだんはこちら）

公開 URL を開き、パスフレーズを入力 → 一覧からメモを選んで「編集」→「保存」（「新規」で追加、編集画面の「削除」で削除）。
初回の保存時に GitHub の fine-grained personal access token を求められる（下記）。トークンはパスフレーズで暗号化してブラウザの localStorage に保存される。

トークンの作り方: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- Repository access: Only select repositories → `memo-management`
- Permissions → Repository permissions → Contents: Read and write

### 手元から

```sh
git pull                      # ブラウザで保存した分を取り込む
node tools/decrypt.mjs        # memo.enc → data/*.txt
# data/ のファイルを編集・追加・削除してから（削除したファイルはメモからも消える）
node tools/encrypt.mjs        # パスフレーズを入力（表示されない）
git add memo.enc && git commit -m "Update memo" && git push
```

## 注意

- 暗号文は誰でも取得できるため、安全性はパスフレーズの強さで決まる。長く推測しにくいもの（例: 単語4〜5個の組み合わせ）を使うこと。
- パスフレーズを忘れるとメモは復元できない（平文は手元の `data/` にのみある）。

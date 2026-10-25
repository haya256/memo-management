# memo-management

複数のテキストメモを GitHub Pages で公開する最小構成。
メモはパスフレーズで暗号化して公開し、ブラウザ側で復号して表示する。ブラウザから編集・保存もできる。

## 仕組み

- `memo.enc` — 暗号化したメモ（公開）。全メモをまとめて1ファイルに暗号化するので、メモの数や名前も外からは見えない。AES-256-GCM、鍵はパスフレーズから PBKDF2-SHA256（600,000 回）で導出
- `memo-crypto.js` — 暗号化・復号と、複数メモのまとめ・分解の処理（ブラウザと Node で共通）
- `index.html` — パスフレーズを入力すると `memo.enc` を取得してブラウザ内で復号し、メモの一覧を表示する。メモの閲覧・編集・新規作成・削除ができ、保存すると、ブラウザ内で暗号化し GitHub Contents API で `memo.enc` を直接コミットする
- `tools/encrypt.mjs` — 手元の `data/*.txt`（平文・リポジトリ外、1メモ1ファイル）をまとめて暗号化して `memo.enc` を書き出す。ファイル名（`.txt` を除く）がメモの名前になる
- `tools/decrypt.mjs` — `memo.enc` を復号して `data/<名前>.txt` に書き出す

ビルドや依存パッケージは不要。手元のツールには Node.js 20 以降が必要。

## セットアップ

### 1. リポジトリを用意する

このリポジトリを自分のアカウントに fork する（または clone して自分の新しいリポジトリに push する）。
以下、自分のリポジトリを `<user>/<repo>` と書く。

```sh
git clone https://github.com/<user>/<repo>.git
cd <repo>
```

### 2. 保存先のリポジトリを書き換える

`index.html` の次の行を、自分のリポジトリに書き換える。ブラウザで保存したときのコミット先になる。

```js
const API = 'https://api.github.com/repos/<user>/<repo>/contents/memo.enc';
```

### 3. 自分のメモを暗号化する

同梱の `memo.enc` は作者のものなので、自分のパスフレーズで作り直す。
`data/` は `.gitignore` 済みなので平文はコミットされない。

```sh
mkdir -p data
echo "はじめてのメモ" > data/memo.txt
node tools/encrypt.mjs        # パスフレーズを2回入力（12文字以上・表示されない）
git add index.html memo.enc
git commit -m "Set up my memo"
git push
```

### 4. GitHub Pages を有効にする

GitHub のリポジトリ → Settings → Pages → Build and deployment
- Source: Deploy from a branch
- Branch: `main` / `/ (root)`

数分後に `https://<user>.github.io/<repo>/` で開けるようになる。

### 5. ブラウザから保存するためのトークンを作る

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- Repository access: Only select repositories → 自分のリポジトリ
- Permissions → Repository permissions → Contents: Read and write

初回の保存時にこのトークンを求められる。トークンはパスフレーズで暗号化してブラウザの localStorage に保存される（ブラウザごとに1回入力）。

## メモの更新方法

### ブラウザから（ふだんはこちら）

公開 URL を開き、パスフレーズを入力 → 一覧からメモを選んで「編集」→「保存」（「新規」で追加、編集画面の「削除」で削除）。

### 手元から

```sh
git pull                      # ブラウザで保存した分を取り込む
node tools/decrypt.mjs        # memo.enc → data/*.txt
# data/ のファイルを編集・追加・削除してから（削除したファイルはメモからも消える）
node tools/encrypt.mjs        # パスフレーズを入力（表示されない）
git add memo.enc && git commit -m "Update memo" && git push
```

パスフレーズは環境変数 `MEMO_PASSPHRASE` で渡すこともできる。

## 注意

- 暗号文は誰でも取得できるため、安全性はパスフレーズの強さで決まる。長く推測しにくいもの（例: 単語4〜5個の組み合わせ）を使うこと。
- パスフレーズを忘れるとメモは復元できない（平文は手元の `data/` にのみある）。
- fork したリポジトリは公開リポジトリになる。`memo.enc` も公開される前提で使うこと。

## ライセンス

[MIT License](LICENSE)

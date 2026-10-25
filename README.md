# memo-management

複数のテキストメモを GitHub Pages で公開する最小構成。
メモはパスフレーズで暗号化して公開し、ブラウザ側で復号して表示する。ブラウザから編集・保存もできる。

## 仕組み

- `memo.enc` — 暗号化したメモ（公開）。全メモをまとめて1ファイルに暗号化するので、メモの数や名前も外からは見えない。AES-256-GCM、鍵はパスフレーズから PBKDF2-SHA256（600,000 回）で導出
- `memo-crypto.js` — 暗号化・復号と、複数メモのまとめ・分解の処理（ブラウザと Node で共通）
- `index.html` — パスフレーズを入力すると `memo.enc` を取得してブラウザ内で復号し、メモの一覧を表示する。メモの閲覧・編集・新規作成・削除ができ、保存すると、ブラウザ内で暗号化し GitHub Contents API で `memo.enc` を直接コミットする
- `tools/encrypt.mjs` — 手元の `data/*.txt`（平文・リポジトリ外、1メモ1ファイル）をまとめて暗号化して `memo.enc` を書き出す。ファイル名（`.txt` を除く）がメモの名前になる
- `tools/decrypt.mjs` — `memo.enc` を復号して `data/<名前>.txt` に書き出す

ビルドや依存パッケージは不要。手元のツールを使う場合だけ Node.js 20 以降が必要。

## セットアップ

GitHub アカウントがあれば、ブラウザだけでセットアップできる。

1. **リポジトリを作る** — このリポジトリの「Use this template」→「Create a new repository」（または fork）で、自分のアカウントにコピーを作る。Pages を無料プランで使うなら Public にする
2. **作者の `memo.enc` を削除する** — 自分のリポジトリで `memo.enc` を開き、「…」→「Delete file」でコミットする。作者のメモ（暗号化済み）なので不要
3. **GitHub Pages を有効にする** — Settings → Pages → Build and deployment で Source: Deploy from a branch、Branch: `main` / `/ (root)` を選ぶ。数分後に `https://<user>.github.io/<repo>/` で開けるようになる
4. **パスフレーズを決める** — そのページを開くと、`memo.enc` がないので新しいパスフレーズの入力画面になる（12 文字以上）
5. **最初のメモを保存する** — 「新規」でメモを書いて「保存」。トークンを求められるので、下記の手順で作って貼り付ける。保存すると `memo.enc` が作られる

保存先のリポジトリは、ページの URL（`<user>.github.io/<repo>/`）から自動で判定する。独自ドメインで公開する場合などは、`index.html` の `<meta name="memo-repo" content="">` に `owner/repo` を書く。

### トークンの作り方

GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token
- Repository access: Only select repositories → 自分のリポジトリ
- Permissions → Repository permissions → Contents: Read and write

トークンはパスフレーズで暗号化してブラウザの localStorage に保存される（ブラウザごとに1回入力）。

## メモの更新方法

### ブラウザから（ふだんはこちら）

`https://<user>.github.io/<repo>/` を開き、パスフレーズを入力 → 一覧からメモを選んで「編集」→「保存」（「新規」で追加、編集画面の「削除」で削除）。

### 手元から

```sh
git clone https://github.com/<user>/<repo>.git   # 初回のみ
cd <repo>
git pull                      # ブラウザで保存した分を取り込む
node tools/decrypt.mjs        # memo.enc → data/*.txt
# data/ のファイルを編集・追加・削除してから（削除したファイルはメモからも消える）
node tools/encrypt.mjs        # パスフレーズを入力（表示されない）
git add memo.enc && git commit -m "Update memo" && git push
```

パスフレーズは環境変数 `MEMO_PASSPHRASE` で渡すこともできる。

## 注意

- 暗号文は誰でも取得できるため、安全性はパスフレーズの強さで決まる。長く推測しにくいもの（例: 単語4〜5個の組み合わせ）を使うこと。
- パスフレーズを忘れるとメモは復元できない（平文が残るのは、手元のツールで書き出した `data/` だけ）。
- Public リポジトリでは `memo.enc` もコミット履歴も誰でも見られる。過去の版の `memo.enc` も、当時のパスフレーズで復号できる。

## ライセンス

[MIT License](LICENSE)

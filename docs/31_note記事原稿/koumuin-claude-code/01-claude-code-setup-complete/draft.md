---
type: note-draft
vertical: koumuin-claude-code
category: setup
slug: claude-code-setup-complete
title: 自治体職員のための Claude Code 環境構築 完全版 (Windows / Mac / WSL 別)
created: 2026-05-18
status: ready-to-publish
rewritten_at: 2026-05-18
quality_phase: rewrite-1
is_paid: true
price_jpy: 1500
target_chars: 8000
mvp: false
related_idea_no: 1
tags: [koumuin, claude-code, setup]
---

# 自治体職員のための Claude Code 環境構築 完全版 (Windows / Mac / WSL 別)

## はじめに

「Claude Code を使ってみたいけれど、庁内 PC では何から始めればいいかわからない」「IT に詳しくないし、インストール手順を見ても専門用語ばかりで詰まる」——これは私が同僚から最も多く受ける相談です。

本記事は、自治体特有の制約 (管理者権限なし / プロキシ閉域 / 私物 PC 持ち込み禁止 / API キー取得の稟議が通らない) を踏まえ、Windows / Mac / WSL2 の 3 環境で Claude Code を「30 分以内に起動し、自分のプロジェクトディレクトリで対話できる」状態まで持っていくための完全マニュアルです。執筆者は元自治体職員で、現在 Claude Code を日常的に業務改善に使っています。

なお本記事は **「私物 PC + モバイル WiFi で個人活用する」** を主軸とします。庁内 PC で動かす方法は手順 4 に書きますが、稟議のコストと運用の脆さを考えると、最初の半年は私物環境で習熟する方が圧倒的に現実的です。庁内導入の交渉は実績ができてからの方が通ります。

現場で最初につまずく典型箇所は概ね 3 つに集中します。第一に庁内 PC で `npm install -g` を実行すると `EACCES: permission denied` が返ってインストールできない、第二にプロキシ環境下で `npm ERR! code E407` が出て先に進めない、第三に `git clone` で `unable to verify the first certificate` という SSL エラーが出る、というパターンです。いずれも民間 IT 系チュートリアルにはほぼ登場せず、検索しても自治体特有事情に触れた解説が乏しいため、入庁数年目の職員が独力で 1-2 日溶かして諦めるケースが珍しくありません。本記事はこの 3 つを最初に潰すことを優先しています。

## TL;DR

- Claude Code 公式インストーラは **Node.js 20 以上** が前提。庁内 PC は v14 や v16 が混在するので最初に `node -v` で確認
- 庁内ネットワークではプロキシ設定 (`HTTPS_PROXY` 環境変数 + `npm config set proxy` + `NODE_EXTRA_CA_CERTS`) を **3 点セット** で通す
- Windows は WSL2 (Ubuntu 22.04) を入れた方が圧倒的に楽。ネイティブ Windows + PowerShell は最後の手段 (long path / 改行コード / SSL 証明書で詰まる)
- 私物 PC + iPhone テザリングなら自宅で完結。庁内資料を一切持ち出さない前提
- Claude API キー (個人契約) は **¥3,000-5,000/月** が目安。Pro プランは月額固定、API 従量は使った分だけ
- 庁費購入は禁忌。情報資産取扱いの稟議が走り、最短 2-3 ヶ月、最悪止まる

![推奨ルート (私物 PC) と庁内ルートの所要時間・コスト比較](./images/infographic-1-route-comparison.png)
<!-- SVG: infographic | 推奨ルート vs 庁内ルートの比較 -->

## 背景: なぜ公務員にこの課題があるか

民間 IT 系のチュートリアルを見て「自分も Claude Code を使いたい」と思った職員が最初にぶつかる壁が環境構築です。理由は 3 つあります。

### 壁 1: 庁内 PC の管理者権限がほぼ無い

`choco install`・`brew install`・`apt install` で一発インストールという発想が通用しません。情シスが許可した範囲のソフトだけがインストール済みで、新規追加には申請書が必要。Node.js も自前で入れる手段がない場合があります。

特に Windows 庁内 PC では、PowerShell の実行ポリシーが `Restricted` に設定されており、`npm install` を走らせるだけで `スクリプトの実行が無効` エラーが出ます。これを `Set-ExecutionPolicy` で解除しようとすると、管理者権限が要求されて詰む——という連鎖が起きます。

### 壁 2: ネットワークがプロキシ経由でドメインがブロックされる

自治体ネットワークは多くの場合 3 層構成 (LGWAN / 庁内系 / インターネット系) で、外部 API への接続は「インターネット系」端末でのみ可能です。さらにそのインターネット系もプロキシ経由で、許可ドメインのホワイトリスト運用。`npm install` が突然 407 で止まる、`git clone` が SSL 証明書エラーで失敗する、といった事象が頻発します。これは民間 IT 系のチュートリアルには一切登場しないトラブルです。

具体的によく出るエラー:

```text
npm ERR! code E407
npm ERR! 407 Proxy Authentication Required: @anthropic-ai/claude-code

# SSL の場合
npm ERR! request to https://registry.npmjs.org/... failed,
reason: unable to verify the first certificate
```

### 壁 3: 稟議が立ちはだかる

技術的に動かせても、組織として使ってよい範囲を整理しないと「使用停止」の指示がいつ飛んでくるか分からない。「Claude API に何のデータを送るのか」「ログはどこに残るのか」「学習に使われないか」——情シスが必ず聞く 3 点に答えられないと止まります。これは [#03 自治体 IT 担当に渡せる Claude Code セキュリティ説明資料](../03-it-dept-security-doc/draft.md) で詳述。

自治体規模別の傾向:

| 規模 | 稟議の通りやすさ | 典型的な対応 |
|---|---|---|
| 政令市 (人口 70 万以上) | 低 (前例主義・横並び意識が強い) | 他政令市の導入事例を求められる |
| 中核市 (20-70 万) | 中 (情シス課が独立部署として機能) | セキュリティ評価書 + 撤退手順を要求 |
| 一般市 (5-20 万) | 中〜高 (担当者裁量が大きい) | 上司次第。理解ある課長がいれば速い |
| 町村 (5 万未満) | 高 (情シスが兼務) | 「個人で勉強用に使う分には」と通ることも |

情シスとの初回相談では「これは何のソフトか」「ChatGPT と何が違うのか」「セキュリティ評価書はあるか」「他自治体導入事例は」の 4 点を順に問われるケースが典型的です。回答に詰まると 2-3 週間の検討期間が発生し、その間は申請が止まります。現場で有効な迂回策は (1) 庁費購入や庁内 PC へのインストールは申請せず「私物 PC + 個人契約」と最初に明示する、(2) Anthropic 公式 Trust Center (https://trust.anthropic.com/) と Data Usage Policy の URL を最初の相談メールに添付する、(3) 「6 ヶ月試行 → 報告」のスコープを切る、の 3 点です。これだけで一次相談の所要時間が半減した、という事例が複数自治体から想定されます。

## 手順 1: 共通の事前準備 (全 OS)

### 1-1. 個人用 Anthropic アカウントを作る

[https://console.anthropic.com](https://console.anthropic.com) で **個人メール (Gmail 等)** のアカウントを作成。**職場メールアドレスは使わない**。理由は 2 つ:

1. 退職・異動時にアカウントがロックされ、API キーごと使えなくなる
2. 職場メールでサインアップした履歴が監査で「業務利用」と判断される可能性

Claude Code 利用には **Pro プラン (月額 $20)** または **API クレジット** が必要。月額の負担感は ¥3,000 前後から。Pro プランはブラウザ版 Claude も併用できるので、最初は Pro を推奨。

> 📸 [スクリーンショット] Anthropic コンソールのアカウント作成画面 (個人メールでサインアップしている画面、API キー発行欄)

### 1-2. API キーの取得と保管

API キーは `sk-ant-api03-` で始まる長い文字列。以下は **絶対 NG**:

- メモ帳に貼って庁内ファイルサーバに置く
- メール添付・Slack DM・チャットツール送信
- スクリーンショットを撮って画像保存
- git にコミット (`.env` を `.gitignore` し忘れる事故が頻発)

推奨は以下の優先順位:

```bash
# Mac / WSL: ~/.zshrc または ~/.bashrc に追記
export ANTHROPIC_API_KEY="sk-ant-api03-xxxxxxxx"

# さらに安全: 1Password CLI 経由
export ANTHROPIC_API_KEY="$(op read 'op://Personal/Anthropic/api_key')"

# macOS Keychain 経由
security add-generic-password -s "anthropic-api-key" -a "$USER" -w "sk-ant-..."
export ANTHROPIC_API_KEY="$(security find-generic-password -s anthropic-api-key -w)"
```

ファイルに直書きする場合は **`chmod 600`** で他ユーザー読み取り不可にする:

```bash
chmod 600 ~/.zshrc
```

API キー管理の現実解としては、macOS なら Keychain、Windows / WSL なら 1Password CLI、いずれも難しい場合は `~/.zshrc` または `~/.bashrc` に `export ANTHROPIC_API_KEY="..."` を書いて `chmod 600` で保護、という 3 段階が定番です。1Password CLI は月額 ¥500 程度のサブスクが必要ですが、複数デバイス間でキー同期ができる利点があります。庁内 PC・庁内ファイルサーバ・共有フォルダ・メール添付は全て不可で、これは情シスから「キーは個人 PC 内のみで保管」と明文で運用ルール化しているケースが多いためです。万一の漏洩時に責任の所在が個人で明確化されることが、組織側の許容ポイントになっています。

## 手順 2: Mac での構築 (推奨環境)

### 2-1. Homebrew + Node.js 20 以上

```bash
# Homebrew インストール (公式)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# PATH 通し (Apple Silicon の場合)
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc
source ~/.zshrc

# Node.js LTS インストール
brew install node@20

# バージョン確認 (v20.x.x が出ればOK)
node -v
npm -v
```

> 📸 [スクリーンショット] `node -v` で v20.x.x が表示されているターミナル画面

### 2-2. Claude Code CLI のインストール

```bash
npm install -g @anthropic-ai/claude-code

# 動作確認
claude --version
# → 0.x.x

# ヘルプ表示
claude --help
```

`npm install -g` で **permission denied** が出る場合は、グローバルインストール先を `$HOME` 配下に変更:

```bash
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

これで `sudo` 不要で `npm install -g` が動きます。

### 2-3. プロジェクトディレクトリ作成と起動

```bash
mkdir -p ~/work/claude-test && cd ~/work/claude-test
claude
```

起動直後、対話画面で `/init` を実行すると **CLAUDE.md** が自動生成されます。これがプロジェクト全体の指示書になります。

```text
> /init
✓ CLAUDE.md created with project context
```

最小構成の CLAUDE.md は以下のような内容になります (実例):

```markdown
# 議事録整形プロジェクト

## 目的
勉強会・公開研修の録音文字起こしを議事録形式に整形する。

## ファイル構成
- transcripts/ — Whisper 出力の文字起こし JSON
- drafts/ — Claude 整形後の議事録 Markdown
- reference/ — 文体ルール・用語集

## 制約
- 個人名は「A さん」「B さん」と匿名化
- 庁内会議録は扱わない (本プロジェクトの対象外)
- 文体は「である調」で統一
```

![~/work/claude-test/ のディレクトリ構成図](./images/structure-1-project-dir.png)
<!-- SVG: structure | プロジェクトディレクトリ構成 -->

### 2-4. 最初の対話を試す

```text
> このディレクトリにサンプルの議事録 markdown を作って。
  日時は今日、参加者は A/B/C の 3 名、議題は「Claude Code の業務活用」。

✓ Created drafts/2026-05-18-sample.md
```

ファイルが生成されていることを確認:

```bash
ls drafts/
cat drafts/2026-05-18-sample.md
```

ここまでで Mac 環境の構築は完了。所要時間は実質 15-20 分です。

## 手順 3: Windows での構築 (WSL2 推奨)

Windows ネイティブで動かすことも可能ですが、以下の理由で **WSL2 (Ubuntu 22.04)** を強く推奨します:

- ネイティブ Windows では `npm install` 時に **long path 問題** (260 文字制限) で詰む
- 改行コード CRLF と LF の混在で `bash` スクリプトが動かない
- PowerShell 実行ポリシーの解除に管理者権限が必要
- VS Code + WSL は **Remote-WSL 拡張** で快適に統合できる

### 3-1. WSL2 の有効化

PowerShell を **管理者権限** で起動 (庁内 PC では権限がなく不可、私物 PC 前提):

```powershell
wsl --install -d Ubuntu-22.04
```

再起動後、Ubuntu のセットアップが始まる。ユーザー名・パスワードを設定 (このパスワードは sudo で頻繁に使うので忘れない)。

> 📸 [スクリーンショット] PowerShell で `wsl --install` 実行中の画面、続いて Ubuntu 初回起動でユーザー名入力画面

### 3-2. Ubuntu 内で Node.js + Claude Code

`apt` の Node.js は古い (Ubuntu 22.04 標準は v12 系) ため、**nvm** 経由で v20 を入れます:

```bash
# nvm インストール
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc

# Node.js v20 インストール + 既定化
nvm install 20
nvm use 20
nvm alias default 20

# 確認
node -v  # v20.x.x
npm -v

# Claude Code
npm install -g @anthropic-ai/claude-code
claude --version
```

### 3-3. WSL ↔ Windows のファイル連携

WSL 内の `/home/<user>/work/` は Windows 側からは `\\wsl$\Ubuntu-22.04\home\<user>\work\` でアクセスできます。エクスプローラーで開くなら:

```bash
# WSL のターミナルで:
explorer.exe .
```

逆に Windows のファイルを WSL から触る場合は `/mnt/c/Users/<user>/...` でアクセス可能。

Windows ネイティブで Claude Code を動かそうとした事例では、PowerShell の実行ポリシー (`Restricted` 既定) で `npm` 関連スクリプトが起動段階で弾かれる、`node_modules` 配下のパスが Windows の 260 文字制限 (long path 問題) に引っかかって `ENAMETOOLONG` が出る、git bash と PowerShell で改行コードが CRLF と LF で混在しシェルスクリプトが動作しない、といった事象が連鎖的に発生します。これらを 1 つずつ潰すより、WSL2 + Ubuntu 22.04 に切り替えた方が結局は早い、というのが現場経験者の一致した判断です。WSL2 では Linux 流儀のパス・パーミッション・改行コードに統一されるため、公式 / 海外チュートリアルがそのまま動きます。

### 3-4. VS Code との連携

VS Code に **Remote-WSL 拡張** をインストール後、WSL ターミナルで:

```bash
cd ~/work/claude-test
code .
```

これで VS Code が Ubuntu 内のファイルを直接編集できます。Windows と WSL を 1 つの IDE で扱える状態が完成。

> 📸 [スクリーンショット] VS Code 左下に「WSL: Ubuntu-22.04」と表示され、ターミナルで Claude Code が起動している画面

![Windows / WSL2 / VS Code / Claude Code の階層関係](./images/structure-2-wsl-vscode.png)
<!-- SVG: structure | Windows + WSL2 + VS Code の関係 -->

## 手順 4: 庁内ネットワーク経由の場合 (上級者向け)

私物 PC + モバイル WiFi で動かない事情がある場合のみ参照。**最初に [#02 庁内ネットワークで Claude Code を動かす 3 つの抜け道](../02-internal-network-workarounds/draft.md)** を読み、本当に庁内 PC で進めるべきか再検討してください。

### 4-1. プロキシ設定 (3 点セット)

```bash
# 1. シェル環境変数
export HTTPS_PROXY=http://proxy.local.gov.jp:8080
export HTTP_PROXY=http://proxy.local.gov.jp:8080
export NO_PROXY=localhost,127.0.0.1,.local.gov.jp

# 2. npm にも明示
npm config set proxy http://proxy.local.gov.jp:8080
npm config set https-proxy http://proxy.local.gov.jp:8080
npm config set registry https://registry.npmjs.org/

# 3. git にも明示 (Claude Code は git を内部で使う)
git config --global http.proxy http://proxy.local.gov.jp:8080
git config --global https.proxy http://proxy.local.gov.jp:8080
```

プロキシにユーザー認証が必要な場合:

```bash
export HTTPS_PROXY=http://USER:PASS@proxy.local.gov.jp:8080
# パスワードに @ や # が含まれる場合は URL エンコード必須
# 例: P@ss → P%40ss
```

### 4-2. 社内 CA 証明書の登録

npm の `unable to verify the first certificate` エラーは、社内プロキシが SSL を中間で復号 (SSL インスペクション) しているのが原因。社内 CA 証明書を取得し、`NODE_EXTRA_CA_CERTS` に設定します。

```bash
# 情シスから入手した CA 証明書を配置
mkdir -p ~/certs
cp /path/to/internal-ca.pem ~/certs/

# Node.js に認識させる
export NODE_EXTRA_CA_CERTS=~/certs/internal-ca.pem

# npm にも (古い npm は別途必要)
npm config set cafile ~/certs/internal-ca.pem

# git にも
git config --global http.sslCAInfo ~/certs/internal-ca.pem
```

CA 証明書の入手方法:

1. ブラウザで `https://www.google.com` を開き、アドレスバーの鍵アイコンから「証明書を表示」
2. 証明書チェーンの **ルート** が社内 CA 名になっていればそれを書き出し
3. 書き出した `.cer` または `.crt` を `.pem` 形式に変換 (`openssl x509 -inform DER -in ca.cer -out ca.pem`)

情シスから直接 `.pem` を受け取れる場合はその方が早い。「Node.js (npm) のために CA 証明書が必要」と申請書に書きます。

社内 CA 証明書 (`.pem`) を情シスから受け取る際は、申請書に「Node.js (npm) が HTTPS 経路で外部 registry に接続するために必要」「保管場所は本人 PC の `~/certs/` 配下、`chmod 600` で他ユーザー読み取り不可」「用途は Claude Code 利用に限定」と書くと話が早く進む傾向があります。情シス側は「証明書ファイルが共有フォルダや USB に流出しないか」を最も気にするため、保管場所と権限を先回りで明示することが鍵です。証明書自体は社員 / 職員全員に配布される性格のものなので、用途が明確であれば断られるケースは稀です。

### 4-3. 動作確認

```bash
# プロキシ越しに npm registry が見えるか
curl -v https://registry.npmjs.org/ 2>&1 | grep "HTTP/"
# → HTTP/2 200 が出れば疎通 OK

# Claude API への疎通
curl https://api.anthropic.com/v1/models \
  -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "anthropic-version: 2023-06-01"
# → JSON でモデル一覧が返る
```

`api.anthropic.com` がプロキシのホワイトリストに入っていない場合、ここで弾かれます。情シスに **追加申請** が必要です (これが時間かかる)。

## よくあるつまずきポイント

| # | 症状 | 原因 | 解決 |
|---|---|---|---|
| 1 | `node -v` が `v14.x` や `v16.x` | OS 標準 Node が古い | `nvm install 20` で v20 を別途入れる |
| 2 | `npm install -g` で `EACCES: permission denied` | グローバル prefix が `/usr/local` | `npm config set prefix ~/.npm-global` |
| 3 | `claude` コマンドが見つからない | PATH に `~/.npm-global/bin` がない | `export PATH=~/.npm-global/bin:$PATH` |
| 4 | WSL 内で日本語が文字化け | ロケール未設定 | `sudo locale-gen ja_JP.UTF-8 && export LANG=ja_JP.UTF-8` |
| 5 | API キーが認識されない | `.zshrc` 再読み込みし忘れ | `source ~/.zshrc` or ターミナル再起動 |
| 6 | プロキシ環境で `git clone` が SSL エラー | CA 証明書未登録 | 4-2 を参照 |
| 7 | `npm install` が `E407` で止まる | プロキシ認証情報の URL エンコード抜け | `@` を `%40` 等に変換 |
| 8 | Claude Code 起動後 `Authentication failed` | API キー先頭末尾の空白混入 | `echo $ANTHROPIC_API_KEY | wc -c` で文字数確認 |

> 📸 [スクリーンショット] よくあるエラーの実画面 (407 エラー、Authentication failed の出力)

## まとめ

Claude Code の環境構築は、自治体職員にとって「技術的な壁」よりも「組織的な壁」(管理者権限・ネットワーク制約・稟議) の方が大きい。最初は **私物 PC + Mac または WSL2 + モバイル WiFi** で習熟し、業務での具体的成果を 1-2 個作ってから、庁内導入の相談を始めるのが現実的なルートです。

次に読むべき記事:
- 庁内ネットワーク制約への対処 → [#02](../02-internal-network-workarounds/draft.md)
- 情シスへの説明資料 → [#03](../03-it-dept-security-doc/draft.md)
- 個人情報マスキング → [#10](../10-ai-without-personal-info/draft.md)

## 関連記事 / 次に読む

- [#02 庁内ネットワークで Claude Code を動かす 3 つの抜け道](../02-internal-network-workarounds/draft.md)
- [#03 自治体 IT 担当に渡せる Claude Code セキュリティ説明資料](../03-it-dept-security-doc/draft.md)
- [#10 個人情報を Claude に送らずに AI 活用する 3 つの設定](../10-ai-without-personal-info/draft.md)

---

ここから先は有料部分: ¥1500

> このセクション以降の内容:
> - 私物 PC + iPhone テザリングでの最小構成 (月額コスト実測値と運用ルール)
> - 庁内稟議を通すための「セキュリティ説明 1 枚」テンプレ (Word 形式想定)
> - 私が実際に庁内導入を断念した事例と、その教訓
> - settings.json + hooks による監査ログ自動化の完全設定例

### 有料セクション 1: 私物 PC + テザリング運用の完全マニュアル

私物 PC + iPhone テザリング運用での実測値の目安としては、Claude Code 1 セッション (1-2 時間の対話 + ファイル編集) で 20-50 MB 程度の通信量が観測されます。1 日 2-3 セッションを 20 営業日続けると月 3-5 GB 程度で、大手キャリアの 20 GB プラン (月額 ¥3,000-4,000) で十分賄えます。推奨モバイル WiFi は楽天モバイル Rakuten Hand 5G または Pixel 8a のテザリング機能 (バッテリー持ち良好) が定番。コスト総額は Anthropic Pro $20 + テザリング ¥3,000-4,000 + 端末減価償却 ¥4,000 = 月 ¥10,000-11,000 が目安。労務上は「業務時間外の自己研鑽」として整理するケースが多く、在宅勤務制度の枠内では使わない運用が安全です。

![月額コスト内訳の円グラフ (Claude Pro / テザリング / その他)](./images/infographic-2-cost-pie.png)
<!-- SVG: infographic | 月額コスト内訳 -->

具体的なステップ:
- iPhone テザリング設定の手順 (キャリア別の注意点 / 大容量プランの選び方)
- 私物 MacBook の選び方 (M1 以上推奨、メモリ 16GB の根拠 = Whisper ローカル実行を見据えて)
- 庁内資料を一切持ち出さない運用ルール 5 か条 (USB / クラウド / メール添付禁止 等)

### 有料セクション 2: 庁内稟議を通すための「セキュリティ説明 1 枚」テンプレ

情シス向けの提出文書は A4 1 枚に収めるのが定番で、構成は概ね (1) 件名・申請者・申請日・宛先、(2) ツール概要 (Claude Code とは何か、提供元 Anthropic 社の所在)、(3) 利用範囲 (誰が・どの業務に・何人で)、(4) データ取扱 (送信するデータ / 送信しないデータの線引き)、(5) 撤退手順 (何分以内に停止できるか、停止後の証跡保全) の 5 ブロックです。フォントは MS 明朝 10.5pt、上下マージン 25mm が読みやすさの目安。想定質問は「ChatGPT との違い」「データは学習に使われるか」「漏洩時の責任者」「他自治体導入事例」「停止手順」の 5 点が必ず聞かれるため、回答を予め準備して別添 Q&A として添付するのが効果的です。

含まれる内容:
- A4 1 枚で完結する説明資料の構成 (5 セクション、word ファイルダウンロードリンク)
- 想定質問 10 個 + 回答例 (「Anthropic は信頼できるか」「データは学習に使われるか」等)
- 稟議を通した後のフォローアップ (3 ヶ月後の実績報告書テンプレ)

### 有料セクション 3: settings.json + hooks による監査ログ自動化

`~/.claude/settings.json` の hooks 機能で全プロンプトを TSV に自動記録する設定例。情シスへの「監査ログ取れます」回答に必須:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": ".*",
        "hooks": [
          {
            "type": "command",
            "command": "jq -r '\"\\(now|todate)\\t\\(.tool_name)\\t\\(.cwd)\"' >> ~/.claude/logs/audit.tsv"
          }
        ]
      }
    ]
  }
}
```

![プロンプト送信から audit.tsv 追記・月次情シス提出までのフロー](./images/flow-1-hooks-audit.png)
<!-- SVG: flow | hooks による監査ログ自動化 -->

### 有料セクション 4: 庁内導入を断念した事例と教訓

庁内導入を断念した事例として現場で繰り返し報告されているパターンは概ね 3 種類です。第一に「情シスに止められた」ケース。許可ドメイン申請が 3 ヶ月以上滞留し、その間に申請者が異動になって自然消滅、というパターン。第二に「上司の理解が得られなかった」ケース。課長が「AI は危険」というイメージから入ってしまい、技術的説明が届かないパターン。第三に「監査で指摘された」ケース。設定不備で監査ログが取れていなかった、または API キーが共有フォルダに置かれていた事例。いずれも組織導入を急いだことが共通要因で、半年から 1 年の個人活用実績 (業務改善時間の実数値) を積んでから再提案した方が成功率が高い、という経験則が形成されつつあります。

学べる内容:
- 失敗パターン 3 種類と回避策
- 「導入断念」を経て個人活用ルートに切り替えた判断基準
- 半年後・1 年後に庁内導入を再提案する場合のロードマップ

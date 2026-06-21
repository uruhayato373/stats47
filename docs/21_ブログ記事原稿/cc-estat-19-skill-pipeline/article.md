---
title: "15本の図を毎週ほったらかしで最新化｜Skillチェーン×GitHub Actions"
seoTitle: "[2026]Claude Code×GitHub Actions｜Skillチェーンで毎週図を自動再生成"
subtitle: "Claude Code 未経験エンジニアのための実例集 Part 19"
slug: cc-estat-19-skill-pipeline
description: "毎週末の半日が、図の手動更新で消えていました──Part 3-17 で作った 15 種のチャートを、Claude Code の Skill チェーンと GitHub Actions cron で「日曜 20:00 にほったらかしで最新化」する全手順を書きます。"
category: ict
tags:
  - ClaudeCode
  - GitHubActions
  - Skill
  - 自動化
  - cron
publishedAt: 2026-05-17
updatedAt: 2026-05-17
published: true
ogImage: /blog/cc-estat-19-skill-pipeline/og.png
---

Part 3 〜 17 にかけて、47 都道府県データを D3.js で可視化する 15 種のチャートを作ってきました。棒グラフ、ヒートマップ、コロプレス、散布図、Bar Chart Race、レーダー、箱ひげ、積み上げ面、Small Multiples、バブル、スロープ ── ここに挙げた 11 種を含む計 15 種、どれもそれなりに気合いの入った作例です。

ただ、ここで一つ正直に告白しておきます。**全部を毎週手で更新するのは、地獄です。**

`/fetch-estat-data` を 15 回叩き、整形スクリプトを 15 本走らせ、Remotion でレンダリングし、R2 に push して、Cloudflare のキャッシュをパージします。1 サイクル 90 分。週末の半日が消えます。やる気が落ちて 2 週飛ばすと、サイトのデータが「最新」を名乗れなくなります。

本記事（Part 19）では、**この一連の作業を Claude Code の Skill チェーンと GitHub Actions cron で完全自動化** する手順を書きます。毎週日曜 JST 20:00 に勝手にデータが更新され、失敗したら Issue が立ち、必要なら部分実行で復旧できる ── そういうパイプラインです。

筆者は元県庁職員で、現在は [stats47.jp](https://stats47.jp/) を 1 人で運営しています。サイトには 530 を超えるランキングがあり、その大半は本記事のパターンで自動更新されています。Claude Code 未経験のソフトウェアエンジニア向けに、再利用可能な「Skill × Actions」パイプラインの組み方を共有します。なお、自動化する対象のチャートそのものの作り方は、シリーズ序盤の[人口データを棒グラフ化する Part 3](https://stats47.jp/blog/cc-estat-03-population-bar) で扱っています。


## 毎週 15 本のチャートを手で更新する地獄

まずは「なぜ自動化するのか」を整理しておきます。

本記事のパイプラインが扱うのは、Part 3 〜 17 で作った 15 種のチャートです。`/ranking/` 配下と `/themes/` ダッシュボードに散らばっており、それぞれが e-Stat から取得した最新値で描画されます。e-Stat は月次・四半期・年次で更新タイミングがバラバラなので、「全部を最新に保つ」には少なくとも週次の取り込みが必要です。

手動運用フローは、ざっとこんな手順でした。

1. ターミナルを開き、`/search-estat` で更新対象 ID を再確認する
2. `/fetch-estat-data <id>` を 15 回繰り返す
3. 取得した JSON を D3.js プロジェクトに配置する
4. `npm run build:charts` でチャート 15 種を再生成する
5. Remotion で SNS 用静止画を 5 種レンダリングする
6. `npx wrangler r2 object put` で R2 に push する
7. Cloudflare Cache を `/purge-cdn` でパージする
8. Slack に「更新完了」をペーストする

所要時間 60 〜 90 分。途中で API がレート制限に当たると 30 分追加です。**「やればやるほど嫌になる作業」の典型**です。

しかも、手動運用には別の隠れたコストがあります。本当に怖いのは作業時間そのものより、人間が手で回すことで生まれる以下の 4 つの劣化です。

- **抜け漏れ** — 15 種のうち 1 つだけ更新を忘れて、サイトに混在期がある統計が出てしまいます
- **揺れ** — 取得日時がバラバラだと「同じ年度の値」という前提が静かに崩れます
- **引き継ぎ不能** — 手順が頭の中にしかなく、他の人や未来の自分が再現できなくなります
- **やる気消費** — 「今週はサボろう」が積み重なって、データが半年古くなります

このすべてを Claude Code の Skill 機能と GitHub Actions cron で潰します。

> [!WARNING]
> 「自動化」と聞くと 1 本のシェルスクリプトを cron に乗せる絵を思い浮かべがちですが、**それが一番ハマる失敗です**。途中の 1 段が失敗するたびに最初の fetch からやり直しになり、e-Stat の API レートを無駄に消費します。本記事の肝は「各段を独立させて部分再実行できるようにする」ことであって、cron で起動すること自体ではありません。


## アーキテクチャ全体図｜4 段パイプライン

最終形を先に出します。データの流れは fetch → transform → render → push の 4 段で、各段が独立した Skill になっています。

```
[ GitHub Actions cron (毎週日曜 JST 20:00) ]
        │
        ▼
[ Claude Code headless mode ]
        │
        ▼
[ /weekly-refresh (上位スキル) ]
        │
        ├──▶ /fetch-estat-data    (15 種類の statsDataId を順次取得)
        │
        ├──▶ /transform-snapshots (JSON → CSV / SQLite シード形式に整形)
        │
        ├──▶ /render-charts       (D3.js で SVG/PNG 生成、Remotion で静止画)
        │
        └──▶ /push-r2             (R2 にスナップショット push + Cloudflare purge)
        │
        ▼
[ 失敗時: gh issue create で起票 ]
[ 成功時: 完了レポートを docs/ に append ]
```

各段が独立した Skill なので、**「render だけ再実行」「push だけ再実行」が可能**です。これがパイプラインの設計上のキモになります。モノリシックな 1 本シェルスクリプトにすると、途中失敗時に最初からやり直しになって罠を踏みます。

4 段それぞれの責務は、こんな分担です。

- **1 段目 `/fetch-estat-data`** — statsDataId のリストを入力に、生 JSON（`tmp/raw/*.json`）を出力します。所要 5 〜 10 分（API レート次第）
- **2 段目 `/transform-snapshots`** — 生 JSON を入力に、CSV / SQLite シードを出力します。所要 1 〜 3 分
- **3 段目 `/render-charts`** — CSV / SQLite を入力に、SVG / PNG / mp4 を出力します。所要 10 〜 30 分（Remotion 込み）
- **4 段目 `/push-r2`** — 出力ファイル群を入力に、R2 オブジェクト + キャッシュパージを行います。所要 2 〜 5 分

合計 20 〜 50 分。GitHub Actions の無料枠（月 2,000 分）で楽に収まります。


## Step 1: 各段を Skill 化する

Claude Code の Skill は、`.claude/skills/<name>/SKILL.md` という Markdown ファイル 1 枚で定義します。詳細は[Skill の基本を扱った Part 2](https://stats47.jp/blog/cc-estat-02-search-skill) で書いたので、ここでは「パイプライン構成要素として Skill を書くときの注意点」だけ抑えます。

### 単一責務にする

1 つの Skill に「データ取得 + 整形 + push」を全部詰め込むと、再実行性が壊れます。**Skill 1 つ = 1 段 = 1 つの責務**を徹底します。

```bash
mkdir -p .claude/skills/fetch-estat-data
mkdir -p .claude/skills/transform-snapshots
mkdir -p .claude/skills/render-charts
mkdir -p .claude/skills/push-r2
mkdir -p .claude/skills/weekly-refresh   # ← 上位スキル
```

### frontmatter の description は呼び出し動機を明示する

```markdown
---
name: transform-snapshots
description: tmp/raw/*.json を読み込み、CSV と SQLite シード形式に変換する。fetch-estat-data の後段で使う。
---
```

`description` が曖昧だと、Claude が「いま transform を呼ぶべきか」の判断に迷います。「fetch-estat-data の後段で使う」のように **前後関係まで書いておく**と、上位スキルから自動的に呼び出されやすくなります。

### 出力契約をはっきりさせる

各 Skill は次段が読める形式で必ず出力します。例えば `/fetch-estat-data` の SKILL.md には、こう書いておきます。

```markdown
## 出力契約

- 出力先: `tmp/raw/<statsDataId>-<YYYY-MM-DD>.json`
- 1 ファイル 1 statsDataId
- 取得失敗した場合は `tmp/raw/_errors.log` に追記し、終了コード 0 で次段に渡す
```

「失敗してもパイプラインを止めない」「次段が拾えるエラーログを残す」という設計にしておくと、`/transform-snapshots` 側で「これは存在しないからスキップ」と判断できます。**全体停止より部分降格**のほうが、週次バッチでは実用的です。

> [!NOTE]
> ここで言う「Skill」は Claude Code の機能で、`SKILL.md` の `description` を見て Claude 自身が「いま呼ぶべきか」を判断する仕組みです。OS の cron が直接スクリプトを叩くのとは別物で、判断が要る箇所だけ Claude に委ね、決定的に決まる箇所（cron トリガや push）はコード側に持たせる、という役割分担で読んでください。


## Step 2: Skill チェーンを 1 つの上位 Skill から呼ぶ

4 つの Skill を順次呼ぶだけの上位 Skill `/weekly-refresh` を作ります。これがあると「Actions からは `weekly-refresh` だけ叩けばよい」状態になり、ワークフローが極端にシンプルになります。

```markdown
---
name: weekly-refresh
description: 毎週日曜に走らせる総合バッチ。fetch → transform → render → push を順次実行し、失敗時は Issue を起票する。
---

# /weekly-refresh

## 目的

stats47.jp の全チャート（15 種）を最新の e-Stat データで再生成し、R2 に push して Cloudflare のキャッシュをパージする。

## 前提

- 環境変数: `ESTAT_APP_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `CLOUDFLARE_API_TOKEN`
- 対象 statsDataId のリスト: `.claude/state/weekly-refresh-targets.json`

## 手順

1. `.claude/state/weekly-refresh-targets.json` から statsDataId を全件読み込む
2. 各 ID について `/fetch-estat-data <id>` を順次呼び出す（並列度 3、API レート対策）
3. 取得完了後、`/transform-snapshots` を呼び出して CSV/SQLite を生成
4. `/render-charts` を呼び出してチャート 15 種をレンダリング
5. `/push-r2` を呼び出して R2 push + キャッシュパージ
6. 各段の出力サマリを `docs/03_週次運用/メトリクス/YYYY-Www.md` に append
7. いずれかの段で失敗した場合は次節「失敗時処理」に従う

## 失敗時処理

- `gh issue create` で起票
  - title: `[weekly-refresh] YYYY-MM-DD 失敗: <段名>`
  - body: 失敗した段、エラーログ末尾 20 行、再実行コマンド例
  - label: `auto-generated,weekly-refresh-failure`
- 残りの段はスキップする（前段の出力が信頼できない以上、強行しても意味がない）

## 出力契約

- 標準出力: 各段の所要時間と件数を JSON で 1 行ずつ出す
- ファイル: `docs/03_週次運用/メトリクス/YYYY-Www.md` に Markdown 表を append
```

上位 Skill から下位 Skill を呼ぶときは、Claude Code に「順次呼び出してね」と書いておけば素直に従ってくれます。中で `Bash` ツールを使ってもよいし、各下位 Skill の手順を呼び出す形でもよいです。

実行イメージはこうです。

```bash
# ローカル動作確認
claude --skill weekly-refresh
```

これだけで 4 段が走ります。手動で 90 分かかっていたものが、Skill 化した瞬間に「コマンド 1 行」になります。


## Step 3: GitHub Actions の YAML｜毎週日曜 JST 20:00

ここから自動化の本丸です。GitHub Actions の cron で `/weekly-refresh` を叩きます。cron トリガ（日曜 20:00 JST 起動）から Claude Code Skill 起動、R2 push、失敗時 Issue 起票までが 1 本のワークフローに乗ります。`.github/workflows/weekly-refresh.yml` を以下の内容で作成します。

```yaml
name: Weekly Refresh

on:
  schedule:
    # 毎週日曜 JST 20:00 = UTC 11:00
    - cron: "0 11 * * 0"
  workflow_dispatch:
    inputs:
      stage:
        description: "再実行する段（fetch / transform / render / push / all）"
        required: false
        default: "all"
        type: choice
        options: ["all", "fetch", "transform", "render", "push"]

permissions:
  contents: write
  issues: write
  pull-requests: write

jobs:
  refresh:
    runs-on: ubuntu-latest
    timeout-minutes: 60
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "20"
          cache: "npm"

      - run: npm ci

      - name: Install Claude Code
        run: npm install -g @anthropic-ai/claude-code

      - name: Run /weekly-refresh
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          ESTAT_APP_ID: ${{ secrets.ESTAT_APP_ID }}
          R2_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
          R2_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          STAGE: ${{ github.event.inputs.stage || 'all' }}
        run: |
          claude --skill weekly-refresh --headless \
            --prompt "stage=$STAGE で実行してください"

      - name: Commit metrics
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add docs/03_週次運用/メトリクス/
          git diff --staged --quiet || \
            git commit -m "chore(metrics): weekly-refresh $(date -u +%Y-%m-%d)"
          git push
```

ポイントは 3 つです。

- **`cron: "0 11 * * 0"`** — UTC 11:00 = JST 20:00 日曜です。**Actions の cron は必ず UTC** なのでタイムゾーンに注意します
- **`workflow_dispatch.inputs.stage`** — 手動再実行時に「render だけ」のような部分実行ができます
- **`permissions.issues: write`** — 失敗時 Issue 起票に必要です。デフォルトの read だけだと `gh issue create` が 403 で死にます

`claude --skill weekly-refresh --headless` の `--headless` フラグで、対話なしで Skill を実行します。CI 環境向けの実行モードです。

cron 文字列の読み方も整理しておきます。左から「分・時（UTC）・日・月・曜日」の 5 フィールドで、今回の `"0 11 * * 0"` は「0 分・UTC 11 時（= JST 20 時）・毎日・毎月・日曜（0 と 7 はどちらも日曜）」を意味します。「毎週月曜 朝 6 時 JST」にしたければ `"0 21 * * 0"`（UTC 日曜 21:00 = JST 月曜 06:00）になります。地味に間違えやすいので、cron 文字列のコメントに **JST 換算** を必ず書くクセを付けておきます。


## Step 4: Secrets 管理｜appId と R2_API_TOKEN

GitHub Actions に渡す秘密情報は GitHub Secrets で管理します。リポジトリの Settings → Secrets and variables → Actions から登録します。

最低限必要なのは以下の 4 系統です。

- **`ANTHROPIC_API_KEY`** — 取得元は [console.anthropic.com](https://console.anthropic.com/)。Claude Code を headless で動かすために必須です
- **`ESTAT_APP_ID`** — 取得元は e-Stat API 登録ページ。e-Stat API キーです
- **`R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY`** — 取得元は Cloudflare Dashboard → R2 → Manage API Tokens。R2 への書き込み権限です
- **`CLOUDFLARE_API_TOKEN`** — 取得元は Cloudflare Dashboard → My Profile → API Tokens。Cache Purge と Pages デプロイに使います

`CLOUDFLARE_API_TOKEN` は権限を最小化するのがおすすめです。stats47 では「D1 Edit + R2 Storage Edit + Pages Edit + Account Settings Read」を 1 つのトークンに集約しています。

```bash
# gh CLI で Secrets を一括登録する例
gh secret set ANTHROPIC_API_KEY --body "sk-ant-xxx"
gh secret set ESTAT_APP_ID --body "xxxx"
gh secret set R2_ACCESS_KEY_ID --body "xxxx"
gh secret set R2_SECRET_ACCESS_KEY --body "xxxx"
gh secret set CLOUDFLARE_API_TOKEN --body "xxxx"
```

ローカルの `.env` ファイルと同じ値を GitHub Secrets に入れるだけです。ただし以下は **絶対にやらない** ことです。

- `.env` をコミットする（gitignore 必須）
- ログに `echo $ANTHROPIC_API_KEY` を残す（Actions のログは公開リポジトリだと誰でも見られる）
- PR の diff に Secret を貼って動作確認する

ローテーション周期は最低でも年 1 回にしましょう。`ANTHROPIC_API_KEY` は支払いに直結するので、漏洩すると一夜で月額数万円分使い込まれるリスクがあります。

> [!WARNING]
> 「Actions のログは Secret をマスクしてくれるから安全」と思い込まないでください。マスクされるのは **GitHub Secrets として登録した値そのものと完全一致した文字列だけ**です。Secret を base64 や JSON に加工してから echo すると、マスクをすり抜けて生で残ります。トークンは「加工せずそのまま env に渡す」のが鉄則です。


## Step 5: 失敗時通知｜Issue 起票で運用に乗せる

Actions cron は「成功したか失敗したか」が見えにくいです。デフォルトだと「失敗したら Email が来る」程度で、忙しいと気付かずに放置されます。これを防ぐため、**失敗時に GitHub Issue を起票する**仕組みを入れます。

`/weekly-refresh` Skill の中で `gh` コマンドを叩く形でも実装できますが、Actions の `if: failure()` で書いておくほうが確実です。

```yaml
      - name: Notify on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            const today = new Date().toISOString().slice(0, 10);
            const runUrl = `${context.serverUrl}/${context.repo.owner}/${context.repo.repo}/actions/runs/${context.runId}`;
            await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: `[weekly-refresh] ${today} 失敗`,
              body: [
                `## 失敗概要`,
                ``,
                `- Run URL: ${runUrl}`,
                `- 実行日時 (UTC): ${new Date().toISOString()}`,
                `- 入力 stage: ${{ github.event.inputs.stage || 'all' }}`,
                ``,
                `## 再実行コマンド`,
                ``,
                "```bash",
                "gh workflow run weekly-refresh.yml -f stage=all",
                "```",
                ``,
                `失敗した段だけ再実行する場合は \`stage=fetch\` などを指定。`,
              ].join("\n"),
              labels: ["auto-generated", "weekly-refresh-failure"],
            });
```

これで失敗のたびに Issue が立ち、GitHub のホーム画面に通知が来ます。Slack 連携が欲しい場合は、Issue 起票をトリガーに別の Workflow で Slack に飛ばす二段構成にすると保守しやすいです（直接 Slack に飛ばす構成は webhook URL の管理が増えてダルいです）。

stats47 では、`auto-generated` ラベルが付いた Issue を 24 時間以内に対応するルールにしています。3 日以上溜まったら手動運用に戻すか、対象 statsDataId を pause する判断をします。**「失敗を可視化して、放置を許さない」**のがパイプライン保守の肝です。


## Step 6: 部分実行｜特定スキルだけ再実行する流れ

パイプラインを長く運用していると、「render だけ失敗した」「fetch は成功したけど push がタイムアウト」という事故が必ず起きます。このとき毎回 fetch から全部やり直すと、e-Stat の API レートを無駄に消費しますし、所要時間も膨らみます。

そこで `workflow_dispatch.inputs.stage` を使って **段単位で再実行できる**ようにしておきます。

```bash
# render だけ再実行
gh workflow run weekly-refresh.yml -f stage=render

# push だけ再実行
gh workflow run weekly-refresh.yml -f stage=push
```

`/weekly-refresh` Skill 側では、受け取った `stage` パラメータに応じて呼び出す下位 Skill を切り替えます。

```markdown
## stage パラメータの処理

- `stage=all`（デフォルト）: fetch → transform → render → push を順次実行
- `stage=fetch`: fetch だけ実行。出力は `tmp/raw/` に残す
- `stage=transform`: transform だけ実行。前回の `tmp/raw/` を入力にする
- `stage=render`: render だけ実行。前回の CSV/SQLite を入力にする
- `stage=push`: push だけ実行。前回の出力ファイルを入力にする
```

これで「render が失敗した → コード直して push せず render だけ再実行 → 結果確認 → 問題なければ push だけ追加実行」という流れがスムーズに回ります。

特に大事なのは **中間成果物を tmp/ に保持する** ことです。`tmp/raw/`, `tmp/transformed/`, `tmp/rendered/` のように段ごとにディレクトリを切り、Actions の Artifacts として upload しておくと、再実行時に download して使えます。

```yaml
      - name: Upload intermediate artifacts
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: weekly-refresh-${{ github.run_id }}
          path: |
            tmp/raw/
            tmp/transformed/
            tmp/rendered/
          retention-days: 14
```

`if: always()` で失敗時も成果物を残しておくのがコツです。あとから「何が起きていたのか」を再現できるかどうかが、運用継続性を大きく変えます。


## つまずきポイント｜タイムゾーン、API レート、依存ファイル

最後に、筆者が踏んだ地雷を 3 つだけ共有しておきます。

### 1. タイムゾーン: GitHub Actions の cron は UTC

これは何回踏んでも忘れます。`cron: "0 20 * * 0"` と書くと「JST 20 時」のつもりで「UTC 20 時 = JST 翌日 05 時」になります。

対策は単純で、**cron 行の上にコメントで JST 換算を必ず書く**ことです。

```yaml
on:
  schedule:
    # JST 日曜 20:00 = UTC 日曜 11:00
    - cron: "0 11 * * 0"
```

もう一つの落とし穴は、Actions runner の `date` コマンドが UTC で返ってくることです。`docs/` に追記する日付やファイル名に使う場合は、`TZ=Asia/Tokyo date +%Y-%m-%d` で明示しましょう。

> [!TIP]
> cron の曜日フィールドは「`0` と `7` がどちらも日曜」という地味な罠を持っています。`5-0`（金〜日）のような範囲指定で日曜をまたぐ書き方は環境によって解釈が割れるので、複数曜日を指定したいときは範囲ではなくカンマ区切り（`0,3,5`）で列挙するほうが事故りません。

### 2. e-Stat API レート: 並列度は 3 が安全圏

`/fetch-estat-data` を 15 種類分まとめて Promise.all で叩くと、e-Stat 側で 429（Too Many Requests）を返してきます。公式に明示されたレート制限は緩いのですが、実測では **同時 5 接続を超えると不安定**になります。

並列度 3 で `p-limit` を使うのが安全です。

```typescript
import pLimit from "p-limit";

const limit = pLimit(3);
const ids = await loadTargetIds();
const results = await Promise.all(
  ids.map((id) =>
    limit(async () => {
      const json = await fetchStatsData(id);
      await fs.writeFile(`tmp/raw/${id}-${today}.json`, JSON.stringify(json));
      return { id, status: "ok" };
    }),
  ),
);
```

15 件を並列度 3 で回しても 5 〜 10 分で終わります。「並列度を上げて速くしよう」の誘惑には負けないことです。

### 3. 依存ファイルの commit: state ディレクトリの扱い

「対象 statsDataId のリスト」「成功ログ」「Skill が読み書きする state」をどこに置くかは、毎回悩むポイントです。stats47 では下記の規約に統一しました。

- **設定（statsDataId リスト、閾値）** — 置き場所は `.claude/config/`。commit する
- **state（最終実行時刻、累積カウンタ）** — 置き場所は `.claude/state/`。commit する（履歴を残す）
- **中間生成物（`tmp/raw/`, `tmp/rendered/`）** — 置き場所は `tmp/`。commit しない（gitignore）
- **人間向け週次レポート** — 置き場所は `docs/03_週次運用/メトリクス/YYYY-Www.md`。commit する

`tmp/` を間違えて commit すると `node_modules` 級の肥大化が起きるので、`.gitignore` に必ず `tmp/` を入れておきます。逆に `.claude/state/` の commit を忘れると、Actions が「前回の続き」を判断できなくなります。コミット粒度は「人間が読み返す週次レポート + state JSON」を 1 コミットにまとめるのがおすすめです。


## 動作確認｜初回実行はローカルで

いきなり cron に乗せると、失敗時のデバッグが GitHub の Web UI 越しになって辛いです。**初回はローカルで `act` または `claude --skill weekly-refresh --headless` を叩いて、4 段が通ることを確認**してから cron を有効化します。

```bash
# ローカルで Skill 単体実行
claude --skill fetch-estat-data --headless \
  --prompt "statsDataId=0003448237 で実行"

# 上位 Skill 実行
claude --skill weekly-refresh --headless \
  --prompt "stage=all で実行"

# act で Actions ワークフローをローカル実行
act schedule -W .github/workflows/weekly-refresh.yml
```

`act` は GitHub Actions を Docker 上でローカル実行するツールです。Secrets は `.secrets` ファイルに別途記述する必要がありますが、CI 上で初めて失敗するパターンを 1 つ前に潰せます。

ローカル確認 → workflow_dispatch で手動実行 → cron 有効化、の 3 段階で慣らしていくと事故が減ります。本記事で扱った ICT 関連の指標も、こうしたパイプラインで最新化したものを [ICT カテゴリのランキング一覧](https://stats47.jp/category/ict) として公開しています。


## 次回予告｜Cloudflare Pages にデプロイする

ここまでで、データの自動更新パイプラインは完成です。最終回となる [Part 20](https://stats47.jp/blog/cc-estat-20-publish) では、**生成されたチャートを Cloudflare Pages にデプロイ**し、世界中に配信する流れを書きます。

- `next build` の Output 設定（Static Export vs SSR）
- Cloudflare Pages の wrangler.toml と環境変数
- カスタムドメインと CDN キャッシュ戦略
- Lighthouse スコアを 95+ で維持するチェックリスト
- 全 20 本のシリーズ振り返り（自動化前後で運用時間がどう変わったか）

Skill チェーン × Actions × Pages の三点セットで、**「個人が 47 都道府県統計サイトを 1 人で回せる時代」**の作り方をシリーズ全体で示します。最終回までお付き合いください。


## データ出典

- 本記事で自動更新の対象としている統計値は、政府統計の総合窓口（e-Stat）API 経由で取得した各府省の調査データです（総務省統計局・e-Stat 経由で整備）。
- 取得・整形・配信のパイプラインおよびチャートの実例は [stats47.jp](https://stats47.jp/) で公開しています。

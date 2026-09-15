---
name: audit-ogp-images
description: OGP / note カバー / サイト内リンクカード画像 (light/dark) を種別タブ付きの 1 枚 HTML で目視確認し、供給欠落を棚卸しする (read-only)。Use when user says "OGP画像を確認", "OGPギャラリー", "カバー画像監査", "リンクカード画像チェック", "画像の棚卸し".
disable-model-invocation: true
primary_agent: image-prompt-curator
co_agents: [ui-reviewer, note-manager, ranking-publisher]
---

# /audit-ogp-images

OGP 画像 (Satori 動的生成)・note カバー・サイト内リンクカード画像 (light/dark) を
**種別ごとに 1 枚の自己完結 HTML** に一覧化して目視確認し、供給の欠落・破損を棚卸しするスキル。
`.claude/rules/ogp-image-standards.md` を基準とする。**read-only** (画像生成・R2 書き込みをしない)。

## 実行

### note公開記事のカバー設定（最初に実行）

noteのカバー未設定・設定状況を調べる場合は、次のGET専用監査を使う。

```bash
npm run note:covers:audit
npm run note:covers:test
```

- 公開一覧の全ページとgit TSカタログの和集合を、v3記事詳細APIで全件確認する。
- 判定元は詳細の`data.eyecatch`のみ。一覧の`eyecatch`には本文先頭画像が入る場合があるため、設定済みの根拠にしない。
- `configured` / `missing` / `unknown`を分ける。取得失敗・フィールド欠損・帰属不一致は`unknown`、一覧の件数不一致・途中失敗は`incomplete`にする。
- 終了コード: `0`=全件設定済み・カタログ集合一致、`1`=未設定または集合差分、`2`=取得失敗・不完全。`--report-only`による成功扱いは用意しない。
- 出力は`.claude/state/metrics/note-cover-audit-latest.json`（毎回置換、時刻・完全性・記事別URL・根拠・都道府県別家計調査の集計付き）。`--output /tmp/note-cover.json`で保存先を指定できる。
- 公開前の下書き・画像の見た目・画像URLの到達性・R2保存状況はこの判定に含めない。画像の保存状況は下記ギャラリーで別途確認する。
- 既存`note-circulation-audit-weekly.yml`にも接続し、失敗を既存アラートとartifactへ渡す。外部公開・画像生成はしない。

### 保存画像と配信画像のギャラリー

```bash
# 全タブ (ranking はサンプル 30) → /tmp/ogp-image-gallery.html
node .claude/scripts/ogp/build-image-gallery.mjs

# 特定タブだけ・件数を絞る
node .claude/scripts/ogp/build-image-gallery.mjs --tabs blog-ogp,blog-card --limit 20

# 欠落を GET で確定 (stdout に tab: entries/images/ok/missing 集計 + missing 一覧)
node .claude/scripts/ogp/build-image-gallery.mjs --tabs ranking-card --check

# 全種別を棚卸し → .claude/state/ogp/inventory.json (既定サンプリング、全量は --all 併用)
node .claude/scripts/ogp/build-image-gallery.mjs --audit
```

タブ (真実源は `gallery-collectors.mjs` の `OGP_TABS`): `blog-ogp` `ranking-ogp` `theme-ogp`
`category-ogp` `areas-ogp` (静的 R2・**県シルエットカード** ogp-image-standards.md §5.7) /
`blog-card` `ranking-card` (リンクカード light/dark) / `note-cover` (note カバー) /
`pref-silhouette` (県シルエット SNS 素材 5比率×blue/dark)。

`note-cover`タブのOK/MissingはR2公開URLの到達性を表す。note上でのカバー設定件数として報告しない。

- OGP タブは各ページの `og:image` meta から**実際に配信されている URL**を解決する (静的フォールバック・
  ランタイム 500 をそのまま反映 = 真実を映す監査)。
- ranking 系はデフォルト 30 件サンプル、`--all` で全量 (~2000)。他タブは全量。
- blogは`blog-ogp`と`blog-card`を別契約として判定する。OGPは大きなタイトル・ブランドが必要、
  cardは640×336 light/darkで画像内テキストが無いことを確認する。
- blog manifestの`background.source`は`ai`または`shared`を正とし、`shared`は記事prefixに
  `ogp/background.jpg`を持たない。背景欠落と共有の非複製を混同しない。

## 目視 (クラウド / ローカル)

- **ローカル**: `open /tmp/ogp-image-gallery.html` (macOS)。タブ切替・検索・「欠落のみ」フィルタ・
  ダーク切替・light/dark 横並びで確認。
- **クラウド (Claude Code on the web)**: 生成 HTML を `SendUserFile` (display:render) でユーザーに渡し、
  ブラウザで開いて確認してもらう。**`Artifact` は使わない** — Artifact の CSP が外部ホスト画像
  (stats47.jp / storage.stats47.jp) を一律ブロックするため、ライブ画像が表示されない。

## 報告 (Output Contract Template A)

stdout の集計を 1 表で報告する。前置き文・section header は禁止。

```
OUTPUT FORMAT: 1 markdown table only.
Columns: Tab | Source | Entries | OK | Missing | Note
Cell content: ≤ 10 words each.
```

- 欠落が見つかったら該当種別と件数を Missing 列に記す。改善候補は
  `.claude/todo/improvements.md` への追記を **提案** する (書き込みは `improvement-triage` に委譲)。
- 供給是正の実行は種別ごとの既存 agent に委譲: blog=`blog-editor` / ranking=`ranking-publisher` +
  `snapshot-exporter` / note=`note-manager`。デザイン妥当性の目視評価は `ui-reviewer`。

## File Boundary

- 読み取り専用 (本番 URL・R2 公開 URL・state JSON の read のみ)。
- 書き込みは自分の成果物のみ: 生成 HTML (`/tmp/`) と `.claude/state/ogp/inventory.json` (`--audit` 時)、note専用監査の`.claude/state/metrics/note-cover-audit-latest.json`。

## 自動化との関係

生成漏れは **`ogp-image-audit-weekly.yml` (週次) が自動修復** し、`sync-snapshots.yml` の公開時フックが
新規 ranking を即生成する (トークン消費ゼロ・決定的)。本スキルは**人手での目視レビュー / 臨時監査**用途
(デザイン確認・特定種別の詳細確認)。決定的な欠落ゲートは `generate-ogp-images.ts --audit` /
`build-image-gallery.mjs --audit --all` (欠落>0 で exit 1)。

## 関連

- 基準 SSOT: `.claude/rules/ogp-image-standards.md`
- スクリプト: `.claude/scripts/ogp/build-image-gallery.mjs`
- 棚卸し state: `.claude/state/ogp/inventory.json`
- OGP コンポーネント: `apps/web/src/features/ogp/`

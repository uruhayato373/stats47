---
type: note-draft-index
vertical: koumuin-estat-claude-code
created: 2026-05-26
status: ready-to-publish
total_drafts: 12
free_count: 3
paid_count: 9
magazine_price_jpy: 1480
individual_price_jpy: 300
mvp_picks: [00, 03, 08, 01, 04]
tags: [koumuin, claude-code, estat, statistics, note-draft-index]
---

# 公務員 × Claude Code × e-Stat note 記事ドラフト INDEX

新バーティカル「自治体職員のための Claude Code × e-Stat 統計データ実務」量産プロジェクト。**全 12 本 (無料 3 + 有料 9)、全本 `ready-to-publish`**。

stats47 (47 都道府県統計サイト) 開発で使い込んだ既存スキル群 (`/search-estat` `/inspect-estat-meta` `/fetch-estat-data` および `.claude/skills/db/*`) を、自治体職員が「他自治体比較」「議会答弁の根拠」「県民向け資料」「補助金申請の裏付け」に転用するための実務ガイド。

## 親計画

- 戦略プラン: [../../30_note記事企画/koumuin-estat-claude-code/strategy.md](../../30_note記事企画/koumuin-estat-claude-code/strategy.md) (本ヴァーティカル用)
- 既存ヴァーティカル: [../koumuin-claude-code/INDEX.md](../koumuin-claude-code/INDEX.md) (33 本、Claude Code 全般)
- 関連スキル: `.claude/skills/estat/{search-estat,inspect-estat-meta,fetch-estat-data}/`

## 12 本一覧

| # | slug | カテゴリ | 区分 | 文字数目安 | SVG | MVP |
|---|---|---|---|---|---|---|
| 00 | estat-claude-code-intro | intro | 無料 | 7,000 | 2 | ★ |
| 01 | estat-api-key-setup | setup | 有料 ¥300 | 8,500 | 3 | ★ |
| 02 | search-estat-statsdataid | search | 有料 ¥300 | 9,000 | 3 | |
| 03 | fetch-prefecture-ranking | fetch | 無料 | 8,000 | 3 | ★ |
| 04 | excel-download-and-parse | excel | 有料 ¥300 | 9,500 | 3 | ★ |
| 05 | pandas-duckdb-derived-metrics | analysis | 有料 ¥300 | 9,500 | 3 | |
| 06 | prefecture-code-and-merge | analysis | 有料 ¥300 | 8,500 | 3 | |
| 07 | year-on-year-diff | analysis | 有料 ¥300 | 8,500 | 3 | |
| 08 | benchmark-table-5min | output | 無料 | 7,500 | 3 | ★ |
| 09 | assembly-chart-generation | output | 有料 ¥300 | 9,000 | 3 | |
| 10 | claude-skills-routinize | skills | 有料 ¥300 | 9,000 | 3 | |
| 11 | mcp-sqlite-search | mcp | 有料 ¥300 | 9,500 | 3 | |

## 課金モデル

- **個別記事**: 有料 9 本は各 ¥300、無料 3 本は ¥0
- **買い切りマガジン**: ¥1,480 (有料 9 本をバンドル)
- 全部買うと ¥300 × 9 = ¥2,700 → マガジンなら ¥1,480 (46% OFF)

## ペルソナ・想定読者

| ペルソナ | 課題 | 主要記事 |
|---|---|---|
| 企画課・政策担当 | 他自治体比較資料 / 政策エビデンス | #02, #08, #09 |
| 統計担当 | e-Stat → Excel → 集計の属人化 | #04, #05, #06, #07 |
| 議会事務局 | 答弁資料の図表作成 | #03, #08, #09 |
| 財政課 | 補助金申請の裏付けデータ | #04, #05, #07 |
| 情報システム | 月次定型集計の自動化 | #10, #11 |

## 推奨読書順

```
#00 (intro) → #01 (setup) → #02 (search) → #03 (fetch)
  ↓
分析編 (#04 → #05 → #06 → #07)
  ↓
出力編 (#08 → #09)
  ↓
運用編 (#10 → #11)
```

無料記事は等間隔配置: #00 (入口) / #03 (W1 集客) / #08 (W3 拡散)

## ストレージ (2026-06-19 更新)

**docs/31_note記事原稿/ は ephemeral outbox**。記事の SSOT は R2 `note/koumuin-estat-claude-code/<slug>/`。
このファイル (INDEX.md) と MAGAZINE.md は `.claude/skills/note/koumuin-estat-claude-code/` に移動済み。

- 記事編集: `bash .claude/scripts/note/restore-from-r2.sh <slug>` → docs/31 に展開 → push → CI 削除
- ドラフト一覧: `.claude/state/note-draft-index.json`
- 公開済み一覧: `.claude/state/note-published-urls.json`

## ディレクトリ構成 (R2 上)

```
R2 note/koumuin-estat-claude-code/<slug>/
├── draft.md
├── MAGAZINE.md                         ← マガジン設定 (note.com 入稿用、skills/ 配下に移動済み)
├── strategy.md                         ← 公開順 / 集客 / KPI / 撤退条件
├── magazine-cover-1280x670.svg         ← マガジン用カバー
├── magazine-cover-1280x670.png         ← PNG 変換版 (note 入稿)
├── 00-estat-claude-code-intro/
│   ├── draft.md
│   ├── captions.md
│   ├── hashtags.txt
│   └── images/
│       ├── cover-1280x670.svg + .png
│       ├── flow-1-*.svg + .png
│       └── infographic-1-*.svg + .png
├── 01-estat-api-key-setup/ ...
...
└── 11-mcp-sqlite-search/
```

## 回遊設計

note マガジン方式 (`koumuin-claude-code` と同じ運用)。

- 各記事末尾に `<!-- circulation-footer:v2 -->` フッタ + マガジン誘導
- マガジン URL は `{{ESTAT_MAGAZINE_URL}}` プレースホルダー
- 公開後に `inject-magazine-url.cjs --vertical koumuin-estat-claude-code` で一括置換

## 公開フロー

1. note でマガジン「公務員 × Claude Code × e-Stat」を作成 → URL 取得
2. `{{ESTAT_MAGAZINE_URL}}` を実 URL に一括置換
3. `/publish-note` で公開 (Phase 0 ガードが未注入を検知)
4. 公開した 12 本をマガジンに追加

## 守秘・倫理ガード (`koumuin-claude-code` から継承)

- 「私は」「自分は」など発信者一人称は使わない (虚偽記載リスク回避)
- 具体的な自治体名・部署名・職員名は出さない (「人口 N 万人規模の市役所」等の第三者視点)
- 過剰な煽り表現 (神 / 爆速 / 劇的の連発) は避ける
- 個人情報を含むファイルを Claude に投げる手順は記載しない
- e-Stat の利用規約 (商用利用可・出典明記必須) は冒頭で必ず注記

## 集計サマリ

| 指標 | 値 |
|---|---|
| 総ドラフト数 | 12 |
| 総文字数 (目安) | 約 103,000 字 |
| 無料記事 | 3 本 (#00, #03, #08) |
| 有料記事 | 9 本 (個別 ¥300 均一) |
| 課金モデル | 個別 ¥300 / 買い切りマガジン ¥1,480 |
| MVP ピック | 5 本 (#00, #03, #08, #01, #04) |
| カバー画像 | 12 枚 + マガジン用 1 枚 |
| 本文 SVG | 35 枚程度 |

## 関連

- 戦略: [../../30_note記事企画/koumuin-estat-claude-code/strategy.md](../../30_note記事企画/koumuin-estat-claude-code/strategy.md)
- マガジン設定: [MAGAZINE.md](MAGAZINE.md)
- 既存ヴァーティカル: [../koumuin-claude-code/INDEX.md](../koumuin-claude-code/INDEX.md)
- 既存スキル: `.claude/skills/estat/`, `.claude/skills/note/publish-note/`

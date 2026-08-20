---
name: x-viral-research
description: X で stats47 関連キーワード (統計/ランキング/地図/GIS/データ可視化) を検索し、伸びている投稿の型・フック・画像フォーマットを収集して台帳化する。Use when user says "Xリサーチ", "バズ投稿調査", "伸びてる投稿を集めて", "viral research". 投稿単位のパターン収集 (アカウント単位の月次観測は /competitor-scan)。
disable-model-invocation: true
argument-hint: "[--axis stats|map|dataviz|all] [--days 7] [--min-faves 500]"
primary_agent: trend-scout
---

# /x-viral-research — X バズ投稿の型・画像リサーチ

X 上で stats47 の題材圏 (都道府県統計・ランキング・日本地図・GIS・データ可視化) の**伸びている投稿**を
検索し、**投稿の型 (フック構造・画像フォーマット) を台帳に収集**する。目的は自社カタログ
(`sns-content-standards.md` §2 / `buzz-map-standards.md` §1) の改善材料集めであり、投稿の丸写しではない。

> **SSOT**: Xの投稿単位競合リサーチは本スキルを唯一の運用正典とする。独立したPlaywright collectorは
> 採択・実装されていないため、その存在を前提にしない。再提案時も本スキルを拡張し、同義スキルを増やさない。

> **/competitor-scan との棲み分け**: competitor-scan は**アカウント単位**の月次定点観測
> (フォロワー・頻度の diff)。本スキルは**投稿単位**のパターン収集 (何が・どんな型・どんな画像で伸びたか)。
> 両者の示唆はどちらも §2-10 の人間承認ゲート経由でカタログへ反映する。

## 安全・観測契約

- 調査は読み取り専用。投稿、返信、いいね、リポスト、bookmark、follow、削除等のmutationを行わない。
- CAPTCHA、2FA、ログイン要求、rate limitを回避せず、その時点で停止して取得不能と報告する。
- 1回の上限は3軸・各10投稿・合計30投稿。無限scrollや過去全件crawlをしない。
- 非表示・取得不能のmetricは`0`でなく`null`相当として扱い、0件とlogin/selector/rate-limit失敗を区別する。
- 同一投稿の再観測は取得日付きで追記し、過去metricsを上書きしない。
- 第三者の本文・画像・動画は内部調査だけに使い、git、公開R2、自社投稿素材、画像生成入力へ流用しない。
- browser-use終了時は`.Codex/rules/browser-use-cleanup.md`のdaemon停止・タブ閉鎖・一時profile削除を必ず行う。

## 引数

| パラメータ | デフォルト | 説明 |
|---|---|---|
| `--axis` | `all` | 検索軸を絞る (stats / map / dataviz / all) |
| `--days` | 7 | since 窓。パターン研究なので鮮度は 7-14 日で良い (引用RT の 3 日縛りとは別) |
| `--min-faves` | 500 | いいね閾値。0 件が続く軸は 300 まで下げて再検索 |

## 検索軸カタログ (複数走らせて取りこぼしを防ぐ)

`feedback_sns_competitor_search` の教訓どおり、1 つの名乗りだけで検索しない。

| axis | キーワード例 (OR で束ねる) |
|---|---|
| **stats** (統計・ランキング) | `都道府県 ランキング` / `47都道府県` / `統計で見る` / `県民性 データ` / `日本一 県` |
| **map** (地図・GIS) | `日本地図 で見る` / `地図にしてみた` / `白地図` / `市区町村 地図` / `国土数値情報` / `地理院地図` / `ハザードマップ` / `プロット してみた` |
| **dataviz** (可視化・グラフ) | `データで見る` / `可視化してみた` / `グラフにしてみた` / `人口ピラミッド` / `推移 グラフ` |
| **emotion** (感情系・axis=all のみ) | `治安 悪い 県` / `格差 都道府県` / `田舎 あるある` (competitor-scan §検索の名乗り軸と同一。煽り追随はしない) |

クエリの型 (find-quote-rt と同じ文法):
```
(<キーワード OR 連結>) min_faves:<閾値> lang:ja -filter:replies since:<days日前>
```

## 前提条件

- ローカル実行のみ (browser-use + Chrome X ログインセッション Profile 5)。
- クラウド環境では browser-use 不可 → `agent-reach` skill (Twitter/X 検索) か WebSearch に degrade
  (取れる指標が減る旨をレポートに明記する)。

## 手順

### Phase 0: 環境準備 + cleanup trap (★必須)

```bash
export PATH="$HOME/.browser-use-env/bin:$HOME/.browser-use/bin:$HOME/.local/bin:$PATH"
BU="browser-use --headed --profile 'Profile 5'"
```

`.Codex/rules/browser-use-cleanup.md` の 3 段 trap (daemon kill / temp user-data-dir 掃除 /
Chrome タブクローズ) を必ず仕込む。

### Phase 1: 軸別に検索 → 上位投稿を収集

各 axis のクエリで `https://x.com/search?q=<encoded>&f=top` を開き、上位 ~10 件/軸をスクレイプする。
1 投稿ごとに記録する項目:

| 項目 | 内容 |
|---|---|
| `post_url` / `author` / `posted_at` | 投稿の同定 (dedup キーは post_url) |
| `metrics` | likes / reposts / replies / bookmarks / views (表示されるもののみ。取得日を併記) |
| `hook` | 本文冒頭 1-2 行のフック (疑問形 / 対比 / 意外性 / 数字羅列 のどれか) |
| `format` | **型分類** (下記の分類語彙を使う) |
| `image_urls` | 添付画像の pbs.twimg.com URL (無ければ video/none) |
| `image_desc` | 画像の構造メモ (地図種別 / 配色 / 凡例位置 / タイトル配置 / 文字量) |
| `stats47_gap` | stats47 が同じ題材・型を持っているか (buzz-map catalog / metric registry と突合) |

**型分類の語彙は自社カタログに揃える** (突合できるように):
- 地図系 → buzz-map 型 `A` (二値/少区分塗り) / `B` (時系列アニメ) / `C` (点プロット) / `D` (線ネットワーク) /
  `E` (合成) / `F` (メッシュ・未実装) / `other-map`
- キャプション構造 → X template id (`shock` / `versus` / `question` / `paradox` / `number` / …、§2-0)
- どちらにも当てはまらない新型は `new:<自由記述>` として記録 (これが一番価値のある発見)

### Phase 2: 画像の収集

- 画像は **`.local/sns-research/x-viral/<YYYY-MM-DD>/<post_id>-<n>.jpg` にダウンロード** (gitignored。
  git に画像バイナリを commit しない)。
- 台帳 (JSON) には URL + 構造メモを残す。ローカル画像が消えても URL から再取得できる。
- **収集画像は内部参照のみ。転載・再投稿・加工流用は禁止** (著作権。学ぶのは型であって絵ではない)。

### Phase 3: 台帳へ upsert (機械 state)

`.Codex/state/sns/x-viral-posts.json` に post_url キーで upsert (既存エントリの metrics は
取得日付きで追記し、履歴を潰さない):

```jsonc
{
  "updated_at": "YYYY-MM-DD",
  "posts": [
    {
      "post_url": "https://x.com/.../status/...",
      "author": "@...", "posted_at": "...", "axis": "map",
      "metrics": [{ "date": "YYYY-MM-DD", "likes": 12000, "reposts": 800, "views": 1500000 }],
      "hook": "海に面していない都道府県、全部言える?",
      "format": { "map_type": "A", "caption_template": "question" },
      "image_urls": ["https://pbs.twimg.com/..."],
      "image_desc": "淡色海+白地図/該当県のみ塗り/凡例右下件数付き/タイトル左上2行",
      "local_images": [".local/sns-research/x-viral/2026-07-18/xxx-1.jpg"],
      "stats47_gap": "同型あり (buzz-map towns-villages)。未着手題材: ◯◯"
    }
  ]
}
```

### Phase 4: 比較用レポート出力

`.Codex/skills/sns/x-viral-research/reference/reports/YYYY-MM-DD.md`
(frontmatter `type: x-viral-research`):

```markdown
---
type: x-viral-research
date: YYYY-MM-DD
axes: [stats, map, dataviz]
tags: [competitor, sns]
---
## サマリ
<3-4 行: 今回の収集で最も効いていた型・フック>
## 収集投稿テーブル
| 投稿 | axis | いいね | 型 (map/caption) | 画像フォーマット要点 | stats47 gap |
## 型の傾向 (今回分)
<どの型×フックが伸びているか。件数と実測いいねで裏付ける>
## stats47 への示唆 (3-5)
- <buzz-map カタログ / X template への反映候補。§2-10 承認ゲート経由と明記>
```

採択した未完了策だけを `.Codex/todo/improvements.md` へID付きで追加する。

### Phase 5: カタログへの反映 (★人間承認ゲート)

示唆を `sns-content-standards.md` §2 や `buzz-map-standards.md` §4 (curated ideas / テーマ台帳) に
反映するときは **§2-10 の手順に従う** (diff 提案 → ユーザー承認 → 編集 → `x-catalog.cjs --check`)。
本スキルが rules を直接書き換えることは無い。buzz-map の新テーマ案は
`.Codex/scripts/sns/data/buzz-map-curated-ideas.ts` への追加提案として提示する (追加も承認後)。

## やらないこと (意図的)

- **投稿の丸写し・画像の転載** — 学ぶのは型。クリエイティブは自社トークン (`buzz-map` 3 テーマ制) で作る
- **煽り路線への追随** — 差別化軸は信頼性×網羅性 (`sns-content-standards.md` §0)
- **自動投稿・自動カタログ書き換え** — 調査のみ。反映は §2-10 承認ゲート
- **フォロワー数の定点観測** — それは `/competitor-scan` (月次) の責務

## 実行頻度

- 単発 (ユーザー指示時) + `/competitor-scan` の月次に合わせて回すのが目安。台帳は upsert なので
  何度回しても増分蓄積される。

## 関連

- 投稿基盤・検索文法の先行実装: `.Codex/skills/sns/find-quote-rt/SKILL.md`
- アカウント単位の競合観測: `.Codex/skills/sns/competitor-scan/SKILL.md`
- 型の正典: `.Codex/rules/sns-content-standards.md` §2 / `.Codex/rules/buzz-map-standards.md` §1・§4
- cleanup 規約: `.Codex/rules/browser-use-cleanup.md`
- 競合 memory: `project_competitor_riskmap_jp` / `feedback_sns_competitor_search`

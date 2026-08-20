---
name: post-ig-6angles
description: トレンド × 都道府県データから結論/理由/体験/反論/数字/ハウツーの6切り口で Instagram キャプション+カルーセルコピーを一括生成し draft 登録する。Use when user says "IG 6切り口", "インスタ6角度投稿", "Instagram量産".
disable-model-invocation: true
primary_agent: instagram-strategist
---

# /post-ig-6angles — Instagram 6切り口投稿生成スキル

## 概要

最新トレンドスナップショットと stats47 の都道府県データを組み合わせ、**結論・理由・体験・反論・数字・ハウツー**の
6 切り口で Instagram キャプション + カルーセルスライドコピーを一括生成し、
`.Codex/state/sns/posts.json` に draft 登録する。

X 版（`/post-x-batch`。角度×カテゴリ相性は rules §2-8 に統合済）との主な差分:

| 項目 | X | Instagram |
|---|---|---|
| メディア | 単一画像 or 動画 | **カルーセル（複数枚）** or リール |
| キャプション長 | 200 字以内 | 300-600 字推奨（2200 字上限）|
| ハッシュタグ | 0-2 個 | 8-12 個 |
| URL | `{{url}}` 埋め込み | リンク不可 → 「プロフィールから」CTA |
| スライドコピー | 不要 | **必要**（1 スライド 1 メッセージ）|

---

## 呼び出し形式

```bash
/post-ig-6angles                              # 最新スナップショットから自動選定
/post-ig-6angles --key monthly-income-worker  # 指標を指定
/post-ig-6angles --dry-run                    # posts.json に書かない（プレビュー）
```

---

## 実行フロー（5 フェーズ）

```
Phase 1:   ig-scout        ← トレンドスナップ×指標ペアリング（X版scout と共通ロジック）
           ↓ (ranking_key + trend_keyword + angle_affinity)
Phase 1.5: ig-media        ← カルーセル画像 / リール動画の存在確認 → format 決定
           ↓ (format_map: { angle → "carousel"|"reels" }, media_assets)
Phase 2:   ig-writer       ← 6切り口キャプション + スライドコピー一括生成
           ↓ (captions + slide_copies JSON)
Phase 3:   ig-reviewer     ← 品質ゲート（文字数・URL禁止・ハッシュタグ・スライド枚数・数値）
           ↓ (PASS のみ)
Phase 4:   ig-scheduler    ← posts.json 登録（IG は即時投稿のみ → 投稿推奨時刻を記録）
```

---

## Phase 1: ig-scout

X 版 `x-angles-scout` と同一ロジック。`angle-affinity.md` を参照し ranking_key × トレンドペアを上位 3 個出力。

**X 版との唯一の差分**: Instagram は体験・ハウツーもカルーセルで十分展開できるため、
全切り口で affinity △ 以上を生成対象とする（X版は △ をスキップ）。

出力 JSON は `candidates[]` 形式（X 版 `/post-x-batch` の select-candidates と同系統の候補配列）。

---

## Phase 1.5: ig-media

### 役割

切り口ごとに「カルーセル」か「リール」かを決定し、使用するメディア資産を特定する。

### 判定ロジック

```
数字 切り口:
  1. .local/r2/sns/ranking/{key}/instagram/reel.mp4 が存在 → reels
  2. なければ → carousel（数値スライド構成）

その他 5 切り口:
  → 常に carousel
     画像: .local/r2/sns/ranking/{key}/instagram/stills/*.png/webp を使用
     なければ: app/ranking/{key}/{year}/thumbnails/thumbnail-light.webp を表紙に流用
               残スライドは「テキストカード生成が必要」フラグを立てる
```

### 出力形式（JSON）

```json
{
  "ranking_key": "monthly-income-worker",
  "latest_year": "2023",
  "format_map": {
    "数字":   { "format": "reels",    "reel_path": "sns/ranking/monthly-income-worker/reel.mp4", "cover_path": "sns/ranking/monthly-income-worker/instagram/stills/main-1080x1080.png" },
    "結論":   { "format": "carousel", "stills_dir": "sns/ranking/monthly-income-worker/instagram/stills/", "slide_count": 5, "needs_text_cards": false },
    "理由":   { "format": "carousel", "stills_dir": "sns/ranking/monthly-income-worker/instagram/stills/", "slide_count": 5, "needs_text_cards": false },
    "体験":   { "format": "carousel", "stills_dir": null, "slide_count": 5, "needs_text_cards": true },
    "反論":   { "format": "carousel", "stills_dir": "sns/ranking/monthly-income-worker/instagram/stills/", "slide_count": 5, "needs_text_cards": false },
    "ハウツー": { "format": "carousel", "stills_dir": null, "slide_count": 5, "needs_text_cards": true }
  }
}
```

`needs_text_cards: true` の場合、`ig-writer` がスライドコピーを生成。
実際の画像生成は `/render-sns-stills` スキルに委譲（本スキル外）。

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only. No prose.
Schema: { ranking_key, latest_year, format_map: { [angle]: { format, reel_path?, cover_path?, stills_dir?, slide_count, needs_text_cards } } }

TASK: Determine Instagram post format for each angle.
ranking_key: {KEY}, latest_year: {YEAR}

Check in this order:
1. .local/r2/sns/ranking/{KEY}/instagram/reel.mp4 → if exists, 数字 angle = reels
2. .local/r2/sns/ranking/{KEY}/instagram/stills/ → list .png/.webp files, count them
   If ≥ 2 files: all other angles get stills_dir, needs_text_cards = false
   If 0 files: needs_text_cards = true (text cards must be generated separately)
3. HEAD https://storage.stats47.jp/app/ranking/{KEY}/{YEAR}/thumbnails/thumbnail-light.webp
   → if 200: usable as fallback cover for carousel Slide 1
```

---

## Phase 2: ig-writer

### 役割

1 つの indicator-trend ペアから 6 切り口の **キャプション + スライドコピー** を一括生成する。

### 出力形式（JSON）

```json
{
  "ranking_key": "monthly-income-worker",
  "trend_keyword": "賃金格差",
  "posts": [
    {
      "angle": "結論",
      "format": "carousel",
      "caption": "【都道府県の手取り格差】答えは「住む場所」ではなく「支出構造」\n\n...\n\n#都道府県 #ランキング ...",
      "caption_char_count": 312,
      "hashtags": ["#都道府県", "#ランキング", "#賃金格差", "#可処分所得", "#家計調査", "#データ可視化", "#統計", "#日本地図", "#インフォグラフィック", "#stats47"],
      "hashtag_count": 10,
      "slide_copies": [
        { "slide": 1, "text": "都道府県の手取り格差\n「住む場所より何に使うか」" },
        { "slide": 2, "text": "物価調整後の実質可処分所得\n東京1位でも北海道との差は1.2%" },
        { "slide": 3, "text": "むしろ差が大きいのは\n❶家賃（2.3倍）❷交通費 ❸外食費" },
        { "slide": 4, "text": "支出構造で見る47都道府県\n（地図スライド）" },
        { "slide": 5, "text": "出典: 家計調査（総務省 2023）\n🔖保存してね\n👆@stats47jpプロフィールから" }
      ],
      "needs_text_cards": false
    },
    {
      "angle": "数字",
      "format": "reels",
      "caption": "都道府県の月収格差、数字で見ると驚く📊\n\n1位 東京 43.1万円...",
      "caption_char_count": 287,
      "hashtags": ["#都道府県", "#ランキング", "#賃金格差", "#バーチャートレース", "#データ可視化", "#統計", "#日本", "#インフォグラフィック", "#動画", "#stats47"],
      "hashtag_count": 10,
      "slide_copies": null,
      "needs_text_cards": false
    }
  ]
}
```

### キャプション生成ルール

| ルール | 詳細 |
|---|---|
| 文字数 | 300-600 字推奨（2200 字以内） |
| URL | **キャプションに URL を入れない**。必ず「👆 @stats47jp プロフィールリンクから」形式 |
| ハッシュタグ | 8-12 個。末尾にまとめて配置 |
| 保存 CTA | 「🔖 保存してね」を必ず入れる |
| 数値 | `data_summary` の実測値のみ使用 |
| NG ワード | 「のはず」「おそらく」「〜だろう」「と思われる」禁止 |

### スライドコピー生成ルール

| ルール | 詳細 |
|---|---|
| 1 スライド | **20 字以内** を目安（一目で読める量）|
| スライド 1 | 必ず「切り口フック + ランキング名/テーマ」|
| スライド 最終 | 必ず「出典 + 🔖保存 + 👆プロフィール誘導」|
| 総スライド数 | 5-6 枚（最大 10 枚だが簡潔さ優先） |
| リール | `slide_copies: null`（動画なのでスライドコピー不要）|

### 切り口別スライド構成

```
結論: [断言表紙] → [根拠データ①] → [根拠データ②] → [意外性補足] → [CTA]
理由: [疑問表紙] → [理由①] → [理由②] → [理由③] → [CTA]
体験: [仮体験表紙] → [上位県の生活感] → [下位県の生活感] → [あなたの県は？] → [CTA]
反論: [通説表紙] → [実際のデータ] → [通説との差] → [解説] → [CTA]
数字: carousel時: [数値インパクト表紙] → [TOP5] → [下位5] → [格差サマリ] → [CTA]
      reels時: slide_copies = null
ハウツー: [活用シーン表紙] → [Step①] → [Step②] → [Step③] → [CTA]
```

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only.
Schema: { ranking_key, trend_keyword, posts: Array<{ angle, format, caption, caption_char_count, hashtags, hashtag_count, slide_copies, needs_text_cards }> }
No prose outside JSON.

TASK:
Generate Instagram captions + slide copies for ranking_key={KEY}, trend={TREND}.
Use data: {DATA_SUMMARY}
Format map: {FORMAT_MAP}

Generate posts for ALL 6 angles: 結論 / 理由 / 体験 / 反論 / 数字 / ハウツー

Caption rules:
- 300-600 chars recommended (2200 max)
- NO URLs in caption — use "👆 @stats47jp プロフィールリンクから" instead
- Hashtags: 8-12, at the end of caption
- Must include "🔖 保存してね"
- Must include "@stats47jp プロフィール" reference
- NG words: のはず / おそらく / だろう / と思われる

Slide copy rules (carousel only, null for reels):
- Slide 1: angle hook + ranking theme (≤ 20 chars per line)
- Slide 2-4: angle-specific content (see structure guide)
- Final slide: 出典 + 🔖保存 + 👆プロフィール誘導
- Max 6 slides, 5 recommended

Slide structure per angle:
- 結論: [断言] → [根拠①] → [根拠②] → [意外性] → [CTA]
- 理由: [疑問] → [理由①] → [理由②] → [理由③] → [CTA]
- 体験: [仮体験] → [上位県の生活感] → [下位県の生活感] → [あなたの県は？] → [CTA]
- 反論: [通説] → [実データ] → [通説との差] → [解説] → [CTA]
- 数字 carousel: [数値表紙] → [TOP5] → [下位5] → [格差] → [CTA]
- ハウツー: [活用シーン] → [Step①] → [Step②] → [Step③] → [CTA]

Hashtag base (always include):
#都道府県 #ランキング #統計 #データ可視化 #stats47
+ format: carousel→#インフォグラフィック, reels→#バーチャートレース #動画
+ theme: use category from {CATEGORY} to add 3-4 topic-specific tags

Numbers must match data_summary exactly (no fabrication).
Reference templates: .Codex/skills/sns/post-ig-6angles/reference/ig-angle-templates.md
```

---

## Phase 3: ig-reviewer

### チェックリスト

```
□ キャプション文字数 ≤ 2200 字（推奨 300-600 字）
□ キャプションに http:// https:// が含まれていない（URL 禁止）
□ 「@stats47jp プロフィール」への誘導が入っているか
□ 「🔖 保存してね」または「保存して」が入っているか
□ ハッシュタグ 8-12 個
□ #stats47 が含まれているか
□ 数値が data_summary と一致
□ NG ワード不在: 「のはず」「と思われる」「おそらく」「〜だろう」
□ スライドコピー（carousel のみ）:
  - slide_count が 5-6 枚
  - Slide 1 に切り口フックがあるか
  - 最終スライドに出典 + CTA があるか
  - 各スライドのテキストが 20 字/行以内か（警告のみ）
□ リール形式のとき slide_copies が null か
```

### 出力形式

```json
{
  "results": [
    { "angle": "結論", "format": "carousel", "verdict": "PASS", "issues": [] },
    { "angle": "数字", "format": "reels",    "verdict": "PASS", "issues": [] },
    { "angle": "体験", "format": "carousel", "verdict": "REVISE", "issues": ["URLがキャプションに含まれている"] }
  ],
  "approved_count": 5,
  "requires_revision": ["体験"]
}
```

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only.
Schema: { results: Array<{ angle, format, verdict: "PASS"|"REVISE", issues: string[] }>, approved_count, requires_revision }

TASK: Quality-gate review for Instagram posts.
Input posts: {POSTS_JSON}
Reference data: {DATA_SUMMARY}

For each post, check ALL of:
1. caption_char_count ≤ 2200 (warn if > 600)
2. No URL pattern (https?://) in caption
3. Contains "@stats47jp" and "プロフィール"
4. Contains "保存"
5. hashtag_count is 8-12, includes "#stats47"
6. Numbers match data_summary
7. No NG words: のはず / と思われる / おそらく / だろう / と考えられる
8. If format=carousel: slide_copies is not null, has 5-6 slides, slide[0] has hook, last slide has CTA
9. If format=reels: slide_copies is null
```

---

## Phase 4: ig-scheduler

### 役割

PASS 投稿を `posts.json` に draft 登録する。
IG は即時投稿のみのため `scheduled_for` は「推奨投稿時刻」として記録。実際の投稿タイミングは手動 or cron で `/post-instagram` を呼ぶ。

### 投稿推奨時刻（切り口別）

| 切り口 | 推奨時刻 | 理由 |
|---|---|---|
| **数字**（リール）| 平日 21:00-23:00 | リールはゴールデンタイムにリーチ最大 |
| **結論** | 平日 12:00-13:00 | 昼休み・共感・賛否を誘発 |
| **反論** | 平日 7:00-8:30 | 朝の知的刺激、保存率高 |
| **理由** | 平日 19:00-21:00 | 帰宅後のじっくり読み時間帯 |
| **体験** | 平日 21:00-23:00 | 感情共感が起きやすい夜間 |
| **ハウツー** | 土日 9:00-11:00 | 実用・保存率が週末朝に高い |

### posts.json エントリ形式

```json
{
  "id": "ig-6a-{ranking_key}-{angle}-{timestamp}",
  "platform": "instagram",
  "post_type": "angle-post",
  "domain": "ranking",
  "content_key": "{ranking_key}",
  "caption": "...",
  "media_format": "carousel",
  "media_path": "sns/ranking/monthly-income-worker/instagram/stills/",
  "slide_copies": [...],
  "needs_text_cards": false,
  "post_url": null,
  "status": "draft",
  "angle": "結論",
  "trend_keyword": "賃金格差",
  "scheduled_for": "2026-06-09T12:00:00",
  "posted_at": null,
  "impressions": null,
  "likes": null,
  "reposts": null,
  "replies": null,
  "bookmarks": null
}
```

### `needs_text_cards: true` のとき

スライド画像が未生成の場合は、`/render-sns-stills` に委譲してテキストカード画像を生成する必要がある。
本スキルは draft を登録するだけで、画像生成は別ステップ。

---

## posts.json スキーマ変更点

既存エントリとの後方互換を保つため、新フィールドはオプション:

| フィールド | 型 | 既存エントリ | 新規エントリ |
|---|---|---|---|
| `angle` | `string \| null` | `null` | `"結論"` 等 6 値 |
| `trend_keyword` | `string \| null` | `null` | トレンドワード |
| `media_format` | `"carousel"\|"reels"\|"image"\|null` | `null` | `"carousel"` or `"reels"` |
| `slide_copies` | `Array\|null` | `null` | カルーセルスライドコピー配列 |
| `needs_text_cards` | `boolean\|null` | `null` | 画像生成が必要かどうか |
| `scheduled_for` | `string \| null` | `null` | ISO 8601 推奨投稿時刻 |

---

## 検証コマンド

```bash
# dry-run でプレビュー（posts.json 書き込みなし）
/post-ig-6angles --dry-run

# 指標を固定して生成
/post-ig-6angles --key annual-precipitation

# draft 登録後に確認
jq '[.posts[] | select(.platform=="instagram" and .angle!=null)]' \
  .Codex/state/sns/posts.json

# draft から投稿（推奨時刻になったら）
/post-instagram {ranking_key} --type carousel  # または --type reels
```

---

## 既存スキルとの関係

| スキル | 関係 |
|---|---|
| `/post-instagram` | 本スキルで登録した draft を実際に投稿する下流スキル |
| `/render-sns-stills` | `needs_text_cards: true` の場合にテキストカード画像を生成 |
| `/bar-chart-race --step render` | 数字切り口のリール動画がない場合に生成 |
| `/push-r2` | 投稿前に画像/動画を R2 公開 URL へ push（`/post-instagram` の前提）|
| `/post-x-batch` | X 版の量産スキル。角度×カテゴリ相性は rules §2-8 で共用 |
| `instagram-strategist` | 本スキルの呼び出し判断を担う戦略レイヤー |

---

## 参照ファイル

| ファイル | 用途 |
|---|---|
| `.Codex/skills/sns/post-ig-6angles/reference/ig-angle-templates.md` | IG 切り口別キャプション + スライドコピー文例集 |
| `.Codex/rules/sns-content-standards.md` §2-8 | カテゴリ × 切り口アフィニティマップ（X/IG 共用 SSOT。旧 post-x-6angles から統合）|
| `.Codex/state/sns/posts.json` | 投稿 registry（draft 追記先）|
| `.Codex/skills/blog/trends-snapshots/trends-all-<date>.md` | トレンドスナップショット |

---

## 関連

- `.Codex/agents/instagram-strategist.md` — 戦略レイヤー（参照元）
- `.Codex/skills/sns/post-x-batch/SKILL.md` — X 版の量産スキル（角度×カテゴリ相性は rules §2-8 で共用）
- `.Codex/todo/improvements.md` — SNS-IG-01（Instagram リーチ拡大施策）

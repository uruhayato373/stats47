---
name: post-x-6angles
description: トレンド × 都道府県データから結論/理由/体験/反論/数字/ハウツーの6切り口で X キャプションを一括生成し draft 登録する。Use when user says "X 6切り口", "6角度ツイート", "X量産投稿".
disable-model-invocation: true
primary_agent: x-strategist
---

# /post-x-6angles — X 6切り口投稿生成スキル

## 概要

最新トレンドスナップショットと stats47 の都道府県データを組み合わせ、**結論・理由・体験・反論・数字・ハウツー**の
6 切り口で X (Twitter) キャプションを一括生成し、`.claude/state/sns/posts.json` に draft 登録する。

既存の `post-x` スキルが shock/versus/question/paradox の 4 テンプレートを持つのに対し、本スキルは
**ナラティブの深さ（物語角度）**を軸にした 6 種のフレームで量産を実現する。

---

## 呼び出し形式

```bash
/post-x-6angles                              # 最新スナップショットから自動選定
/post-x-6angles --key monthly-income-worker  # 指標を指定
/post-x-6angles --dry-run                    # posts.json に書かない（プレビュー）
```

---

## 実行フロー（5 フェーズ）

```
Phase 1:   x-angles-scout        ← トレンドスナップ×指標ペアリング
           ↓ (ranking_key + trend_keyword + angle_affinity)
Phase 1.5: x-angles-media        ← R2 メディア存在確認 → media_asset 決定
           ↓ (media_asset: { type, path, angle_override })
Phase 2:   x-angles-writer       ← 6 切り口キャプション一括生成（最大 9 本）
           ↓ (captions JSON + media_asset)
Phase 3:   x-angles-reviewer     ← 品質ゲート審査（文字数・数値・NG ワード・メディア整合）
           ↓ (PASS captions のみ)
Phase 4:   x-angles-scheduler    ← posts.json 登録 + スケジュール決定
```

---

## Phase 1: x-angles-scout

### 役割

最新のトレンドスナップショットから「投稿に適した指標×トレンドペア」を選定する。

### 入力

- トレンドスナップ: `.claude/skills/blog/trends-snapshots/trends-all-<最新日>.md`
- 指標一覧（カテゴリ判定用): `packages/data-configs/src/metrics/*.ts` から category を確認

### 処理手順

1. スナップショット内の **cross-source 出現**（🎯 マーク付き）を優先抽出
2. 各トレンドキーワードに対し、stats47 のどの `ranking_key` が対応するか判定
3. `angle-affinity.md` を参照し、各ペアに「推奨切り口リスト」を付与
4. 上位 3 ペアを出力（cross-source 数 → トレンドスコア → affinity ◎ 数の順で選定）

### 出力形式（JSON）

```json
{
  "candidates": [
    {
      "ranking_key": "monthly-income-worker",
      "trend_keyword": "賃金格差",
      "trend_sources": ["hatena", "yahoo"],
      "category": "laborwage",
      "angle_affinity": {
        "数字": "◎", "反論": "◎", "結論": "◎",
        "体験": "○", "理由": "○", "ハウツー": "○"
      },
      "priority_angles": ["数字", "反論", "結論"],
      "data_summary": {
        "rank1": "東京 43.1万円",
        "rank47": "青森 26.8万円",
        "ratio": "1.61倍",
        "latest_year": "2023"
      }
    }
  ]
}
```

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only. No prose before/after.
Schema: { candidates: Array<{ ranking_key, trend_keyword, trend_sources, category, angle_affinity, priority_angles, data_summary }> }
Max 3 candidates. Each data_summary must use observed values from ranking data (no fabricated numbers).

TASK:
1. Read the latest trends snapshot: .claude/skills/blog/trends-snapshots/trends-all-<DATE>.md
2. Find ranking_keys that match each trend keyword (use packages/data-configs/src/metrics/ to verify keys exist)
3. Apply angle-affinity rules from .claude/skills/sns/post-x-6angles/reference/angle-affinity.md
4. Output top 3 (ranking_key, trend_keyword, category) pairs with angle_affinity scores

Selection priority:
- cross-source hits (🎯) first
- then trend_score desc
- then count of ◎ affinity angles desc

If --key <ranking_key> is specified, skip steps 1-2 and use that key directly.
```

---

## Phase 1.5: x-angles-media

### 役割

`ranking_key` に対応するメディア資産（静止画 / 動画）が R2 または `.local/r2/sns/` に存在するか確認し、
切り口別に最適なメディアタイプを割り当てる。

### 優先順位

```
1. 動画 (.mp4)    — R2 sns/{ranking_key}/*.mp4 または video/{ranking_key}/*.mp4
                    → 数字・結論・反論 に優先割り当て（視覚インパクト最大）
2. 静止画 (.webp) — R2 app/ranking/{key}/{year}/thumbnails/thumbnail-light.webp
                    → 全切り口に使える汎用資産
3. SNS 生成済み画像 — .local/r2/sns/ranking/{key}/*.{png,webp}
                    → ローカルにある場合は静止画として扱う
4. なし           — テキストのみ投稿（体験・ハウツーは許容、数字・反論は再生成推奨）
```

### 切り口別メディア推奨

| 切り口 | 推奨タイプ | 代替 |
|---|---|---|
| **数字** | 動画（BCR / ランキングアニメ）| 静止画サムネイル |
| **結論** | 静止画サムネイル | 動画 |
| **反論** | 静止画サムネイル | 動画 |
| **理由** | 静止画サムネイル | テキストのみ |
| **体験** | テキストのみ推奨 | 静止画（補足程度）|
| **ハウツー** | テキストのみ推奨 | 静止画（補足程度）|

### 処理手順

1. R2 公開 URL `https://storage.stats47.jp/app/ranking/{key}/{latest_year}/thumbnails/thumbnail-light.webp` に HEAD リクエスト → 200 なら静止画あり
2. `.local/r2/sns/ranking/{key}/` ディレクトリを確認 → `.mp4` があれば動画、`.webp`/`.png` があれば静止画
3. 動画優先で `media_asset` を構築し、切り口ごとに `type` を割り当て

### 出力形式（JSON）

```json
{
  "ranking_key": "monthly-income-worker",
  "latest_year": "2023",
  "media_assets": {
    "video": "sns/ranking/monthly-income-worker/bar-chart-race.mp4",
    "image": "app/ranking/monthly-income-worker/2023/thumbnails/thumbnail-light.webp"
  },
  "angle_media_map": {
    "数字":   { "type": "video", "path": "sns/ranking/monthly-income-worker/bar-chart-race.mp4" },
    "結論":   { "type": "image", "path": "app/ranking/monthly-income-worker/2023/thumbnails/thumbnail-light.webp" },
    "反論":   { "type": "image", "path": "app/ranking/monthly-income-worker/2023/thumbnails/thumbnail-light.webp" },
    "理由":   { "type": "image", "path": "app/ranking/monthly-income-worker/2023/thumbnails/thumbnail-light.webp" },
    "体験":   { "type": "none",  "path": null },
    "ハウツー": { "type": "none",  "path": null }
  }
}
```

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only. No prose.
Schema: { ranking_key, latest_year, media_assets: { video, image }, angle_media_map }

TASK: Check media availability for ranking_key={KEY}, latest_year={YEAR}.

Check in this order:
1. HEAD https://storage.stats47.jp/app/ranking/{KEY}/{YEAR}/thumbnails/thumbnail-light.webp
   → if 200: image = "app/ranking/{KEY}/{YEAR}/thumbnails/thumbnail-light.webp"
2. List .local/r2/sns/ranking/{KEY}/ for .mp4 files
   → if found: video = "sns/ranking/{KEY}/{filename}"
3. List .local/r2/sns/ranking/{KEY}/ for .webp/.png files
   → if found and no image yet: image = "sns/ranking/{KEY}/{filename}"

Assign angle_media_map using these rules:
- 数字: video preferred → image fallback → none
- 結論/反論/理由: image preferred → video fallback → none
- 体験/ハウツー: none preferred (text-only) → image only if explicitly available
```

---

## Phase 2: x-angles-writer

### 役割

1 つの indicator-trend ペアから 6 切り口のキャプションを一括生成する。
アフィニティ ◎ 上位 3 切り口には強調バリアントを +1 本追加（最大 9 本）。

### 入力

- x-angles-scout の出力（1 候補）
- x-angles-media の出力（`angle_media_map`）
- テンプレート集: `.claude/skills/sns/post-x-6angles/reference/angle-templates.md`

### 生成ルール

| ルール | 詳細 |
|---|---|
| 文字数 | 200 字以内（URL `{{url}}` は除く） |
| URL | `{{url}}` プレースホルダー 1 本のみ |
| ハッシュタグ | 0-2 個 |
| 数値 | `data_summary` の実測値のみ使用。推測・捏造禁止 |
| NG ワード | 「のはず」「おそらく」「〜だろう」「と思われる」禁止 |
| 切り口固有 | 体験=一人称/仮体験、反論=通説反証、ハウツー=ステップ感、数字=3数値以上 |

### 出力形式（JSON）

```json
{
  "ranking_key": "monthly-income-worker",
  "trend_keyword": "賃金格差",
  "captions": [
    {
      "angle": "結論",
      "variant": "main",
      "text": "【結論】格差の正体は住む場所ではなく支出構造。\n\n東京の可処分所得でも物価調整後は北海道と1.2%の誤差。\n数字が示す答えは意外だった。\n\n{{url}}",
      "char_count": 67,
      "hashtags": ["#都道府県格差"],
      "url": "https://stats47.jp/ranking/monthly-income-worker",
      "media": { "type": "image", "path": "app/ranking/monthly-income-worker/2023/thumbnails/thumbnail-light.webp" }
    }
  ]
}
```

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only.
Schema: { ranking_key, trend_keyword, captions: Array<{ angle, variant, text, char_count, hashtags, url, media }> }
text must be ≤ 200 chars (excluding {{url}}). No prose outside JSON.

TASK:
Generate X (Twitter) captions for ranking_key={KEY}, trend={TREND}.
Use data: {DATA_SUMMARY}
Media map: {ANGLE_MEDIA_MAP}

Generate captions for ALL 6 angles: 結論 / 理由 / 体験 / 反論 / 数字 / ハウツー
For top 3 priority angles ({PRIORITY_ANGLES}), also generate 1 "variant" with a different emphasis.
Total: up to 9 captions.

Angle structure guide (from .claude/skills/sns/post-x-6angles/reference/angle-templates.md):
- 結論: 断言フック → 根拠2行 → 同意/驚きCTA
- 理由: 疑問提起 → 理由3層（短く） → URL
- 体験: 「もし〇〇に住んでいたら」→ データ感情描写 → リプライ誘導
- 反論: 通説提示 → 反証データ → 保存CTA
- 数字: 3つの数値リスト → 最大差を強調 → URL
- ハウツー: 活用シーン → ステップ①②③ → 実用CTA

Media rules:
- Attach media from angle_media_map for each angle
- When media.type="video", shorten text slightly (video carries visual weight — 120 chars is enough)
- When media.type="none", text must be self-sufficient (all numbers in plain text)

Rules:
- Numbers must match data_summary exactly (no fabrication)
- NG words: のはず / おそらく / だろう / と思われる
- URL placeholder is {{url}} (1 only per caption)
- Hashtags: 0-2 per caption
```

---

## Phase 3: x-angles-reviewer

### 役割

生成されたキャプションを品質ゲートで審査し PASS/REVISE を判定する。

### チェックリスト

```
□ 文字数 ≤ 200 字（URL 除く）
  └ media.type="video" の場合は ≤ 140 字を推奨（警告のみ、REVISE にはしない）
□ {{url}} が 1 本のみ
□ ハッシュタグ 0-2 個
□ 数値が data_summary と一致（捏造数値の検出）
□ NG ワード不在: 「のはず」「と思われる」「おそらく」「〜だろう」「〜と考えられる」
□ メディア整合:
  - media.type="none" のとき: 数値 3 個以上が本文に含まれているか（視覚補完がないため）
  - media.type="video" のとき: 本文が動画に誘導するフレーミングになっているか
□ 切り口固有チェック:
  - 体験: 「もし/あなた/住んで」等の仮体験語が入っているか
  - 反論: 「実は/ところが/意外にも/通説」等の反証語が入っているか
  - ハウツー: ①②③ or 1./2./3. のステップ感があるか
  - 数字: 数値が 3 個以上含まれるか
```

### 出力形式（JSON）

```json
{
  "results": [
    { "angle": "結論", "variant": "main", "verdict": "PASS", "issues": [] },
    { "angle": "体験", "variant": "main", "verdict": "REVISE", "issues": ["仮体験フックが弱い: 「もし〜に住んでいたら」形式に修正"] }
  ],
  "approved_count": 7,
  "requires_revision": ["体験-main"]
}
```

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: JSON only.
Schema: { results: Array<{ angle, variant, verdict: "PASS"|"REVISE", issues: string[] }>, approved_count, requires_revision }
No prose. Verdict must be PASS or REVISE (no other values).

TASK: Quality-gate review for X captions.
Input captions: {CAPTIONS_JSON}
Reference data: {DATA_SUMMARY}

For each caption, check ALL of:
1. char_count ≤ 200 (count again from text, excluding {{url}})
2. {{url}} appears exactly once
3. hashtags count is 0-2
4. All numbers in text match data_summary values exactly
5. No NG words: のはず / と思われる / おそらく / だろう / と考えられる
6. Angle-specific: 体験→仮体験語, 反論→反証語, ハウツー→ステップ記号, 数字→3+数値

Be strict. If any check fails, verdict = REVISE with specific issue description.
```

---

## Phase 4: x-angles-scheduler

### 役割

PASS キャプションを `posts.json` に draft 登録し、切り口別の最適時間帯でスケジュールを決定する。

### 時間帯ルール（`angle-affinity.md` 参照）

| 切り口 | 最適時間帯 |
|---|---|
| 数字 | 平日 7:00-9:00（通勤） |
| 結論 | 平日 12:00-13:00（昼休み） |
| 理由 | 平日 18:00-19:30（帰宅） |
| 反論 | 平日 10:00-11:30（業務中） |
| 体験 | 平日 21:00-23:00（夜間） |
| ハウツー | 土日 9:00-11:00（週末午前） |

### posts.json エントリ形式

```json
{
  "id": "x-6a-{ranking_key}-{angle}-{timestamp}",
  "platform": "x",
  "post_type": "angle-post",
  "domain": "ranking",
  "content_key": "{ranking_key}",
  "caption": "...",
  "media_path": "app/ranking/monthly-income-worker/2023/thumbnails/thumbnail-light.webp",
  "media_type": "image",
  "post_url": null,
  "status": "draft",
  "angle": "数字",
  "trend_keyword": "賃金格差",
  "scheduled_for": "2026-06-09T07:30:00",
  "posted_at": null,
  "impressions": null,
  "likes": null,
  "reposts": null,
  "replies": null,
  "bookmarks": null
}
```

`media_path` / `media_type` が `null` の場合はテキストのみ投稿として `publish-x` が扱う。

### `--dry-run` 時の動作

`posts.json` への書き込みをスキップし、スケジュール表のみ Markdown で出力する。

### Agent プロンプトテンプレート

```
OUTPUT FORMAT: 2 sections only.
Section 1: Markdown table: | Date | Time | Angle | Variant | Caption (first 50 chars) |
Section 2: JSON array of new post entries (posts.json append format).
No other prose.

TASK:
1. Read existing drafts from .claude/state/sns/posts.json to find already-occupied slots
2. Assign PASS captions to optimal time slots using angle-time rules:
   数字=平日7-9時, 結論=平日12-13時, 理由=平日18-19時30分, 反論=平日10-11時30分, 体験=平日21-23時, ハウツー=土日9-11時
3. Space posts ≥ 3 hours apart
4. Generate post IDs: "x-6a-{ranking_key}-{angle}-{YYYYMMDDHHmm}"
5. Output schedule table + JSON entries

If --dry-run: output schedule table only, no JSON entries.

Input PASS captions: {PASS_CAPTIONS_JSON}
ranking_key: {RANKING_KEY}
trend_keyword: {TREND_KEYWORD}
```

---

## 参照ファイル

| ファイル | 用途 |
|---|---|
| `.claude/skills/sns/post-x-6angles/reference/angle-templates.md` | 切り口別の文例集（各 5 例）|
| `.claude/skills/sns/post-x-6angles/reference/angle-affinity.md` | カテゴリ × 切り口アフィニティマップ + 時間帯ルール |
| `.claude/state/sns/posts.json` | 投稿履歴（draft 追記先） |
| `.claude/skills/blog/trends-snapshots/trends-all-<date>.md` | トレンドスナップショット |

---

## posts.json スキーマ変更点

既存エントリとの後方互換を保つため、新フィールドはオプション:

| フィールド | 型 | 既存エントリ | 新規エントリ |
|---|---|---|---|
| `angle` | `string \| null` | `null` | `"数字"` 等 6 値 |
| `trend_keyword` | `string \| null` | `null` | `"賃金格差"` 等 |
| `scheduled_for` | `string \| null` | `null` | ISO 8601 datetime |
| `media_path` | `string \| null` | `null` | R2 key または `.local/r2/` 相対パス |
| `media_type` | `"image" \| "video" \| null` | `null` | `"image"` または `"video"` |

---

## 検証コマンド

```bash
# dry-run でキャプションプレビュー（posts.json 書き込みなし）
/post-x-6angles --dry-run

# 指標を固定して生成
/post-x-6angles --key annual-precipitation

# draft 登録後に確認
jq '[.posts[] | select(.status=="draft" and .angle!=null)] | length' \
  .claude/state/sns/posts.json
```

---

## 既存スキルとの関係

| スキル | 関係 |
|---|---|
| `/post-x` | 並列運用。shock/versus/question/paradox テンプレートはそのまま残す |
| `/discover-trends` | x-angles-scout の入力を提供する上流スキル |
| `publish-x` | 本スキルで登録した draft を実際に投稿する下流スキル |
| `x-strategist` | 本スキルの呼び出し判断を担う戦略レイヤー |

---

## 関連

- `.claude/agents/x-strategist.md` — 戦略レイヤー（参照元）
- `docs/02_実装計画/03_改善バックログ.md` — SNS-X-01（Organic Social 回復施策）
- `.claude/state/sns/posts.json` — 投稿 registry

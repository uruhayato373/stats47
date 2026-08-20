---
name: update-x-profile
description: X (Twitter) のプロフィール (bio・ヘッダー・名前) + 固定ポスト + ぶら下げリプライツリー (L1-L3) を一括更新する。Use when user says "Xプロフィール更新", "固定ポスト変更", "X bio 書き換え", "リプライツリー更新". 月次レビュー (`review`) も対応。
disable-model-invocation: true
argument-hint: "[review | bio | pin | replies | all] [--dry-run]"
primary_agent: x-strategist
---

X プロフィール (@stats47jp373) の bio・固定ポスト・リプライツリーを Playwright で一括更新する。複数 CTA を「固定ポスト 1 件 + 自分のリプライ 3 件」のツリーで実質 4 CTA 化する運用を支える。

## 用途

- bio の文言差し替え (variants A/B/C を切替)
- 固定ポストの作成 + pin (旧 pin は unpin) + リプライツリー (L1-L3) 添付
- L2/L3 リプライの月次差し替え (本体 pin は触らず)
- 月次レビュー (`review` モード): 過去 30 日の impression/CTR/ER を取り、L2/L3 ローテーションを判断

## 真実源

- **文案カタログ + 現在 live**: `docs/10_SNS戦略/05_SNSプロフィール.md` (人間が読み返す)
- **live state (agent 用詳細)**: `.Codex/skills/sns/update-x-profile/state.json` — 最終更新日・各 CTA の UTM・実 URL・tweetId
- **永続プロファイル**: `.local/playwright-x-profile/` (publish-x と共用)

## 引数

```
$ARGUMENTS — [mode] [--dry-run] [--magazine-url <URL>] [--bio-variant A|B|C] [--pin-variant 1|2|3]
  mode:
    review   過去 30 日のメトリクスを取得 → state.json 更新 → ローテーション提案 (実投稿なし)
    bio      bio のみ更新
    pin      固定ポストのみ作成 + pin (旧 pin は unpin)
    replies  既存 pinned post に L1-L3 リプライを追加 (既存 reply は触らない)
    all      bio + pin + replies (デフォルト)
  --dry-run     ブラウザは起動するが publish 直前で停止 (検証用、初回必須)
  --magazine-url L2 リプライに埋め込む note 有料マガジン URL (initial run 時必須)
  --bio-variant   docs/10_SNS戦略/05_SNSプロフィール.md の bio 案 A/B/C を選択 (デフォルト state.json の current)
  --pin-variant   同上、pinned ①②③ (デフォルト state.json の current)
```

## 前提

- `.local/playwright-x-profile/` に X ログイン済み (publish-x で初期化済み)
- L1/L2/L3 リプライテンプレートは `docs/10_SNS戦略/05_SNSプロフィール.md` の「リプライツリー」セクション
- L3 の TOP3 記事はスクリプトが GA4 (last30d pageviews) または GSC clicks から自動選定 → state.json にキャッシュ

## 手順 (all モード)

### Step 1: state.json 読み込み

```javascript
const state = JSON.parse(fs.readFileSync(STATE_PATH, "utf-8"));
// state.json の例:
// {
//   "last_updated": "2026-05-26T...",
//   "bio": { "variant": "A", "live_text": "...", "set_at": "..." },
//   "pinned": { "variant": "2", "tweet_id": "...", "live_text": "...", "set_at": "..." },
//   "replies": {
//     "L1": { "tweet_id": "...", "url_to_note_home_utm": "...", ... },
//     "L2": { "tweet_id": "...", "magazine_url": "...", ... },
//     "L3": { "tweet_id": "...", "top_articles": [...], ... }
//   },
//   "metrics_snapshot": { "fetched_at": "...", "pinned": {...}, "L1": {...}, ... }
// }
```

### Step 2: 文案組み立て

- bio: docs から `--bio-variant` 該当パターンを抽出
- pinned 本体: docs から `--pin-variant` 該当パターンを抽出
- L1/L2/L3: docs から固定テンプレを抽出し、`{{MAGAZINE_URL}}` `{{TOP1_*}}` 等を実値で置換
- L3 の TOP3 は `--top-source` (gsc / ga4) で取得元を選択可。デフォルト ga4 last30d pageviews 降順

### Step 3: UTM 付与

`docs/10_SNS戦略/05_SNSプロフィール.md` の「UTM 設計」表に従って各リンクに付与:

| 位置 | utm_source | utm_medium | utm_campaign | utm_content |
|---|---|---|---|---|
| pinned 本体 → site | x | pinned | profile_2026q2 | site_intro |
| pinned 本体 → note | x | pinned | profile_2026q2 | note_home |
| L1 → note | x | pinned_reply | profile_2026q2 | note_home_l1 |
| L2 → magazine | x | pinned_reply | profile_2026q2 | magazine_koumuin |
| L3 → article | x | pinned_reply | profile_2026q2 | top_{slug} |

### Step 4: Playwright 操作

```javascript
const ctx = await chromium.launchPersistentContext(PROFILE_DIR, { ... });
// 4a. bio 更新: /settings/profile → 編集 → save
// 4b. 旧 pin 解除: /stats47jp373 → 旧 pinned tweet の "..." メニュー → "Unpin from profile"
// 4c. 新規ポスト作成: /compose/post → text 入力 → メディア添付 → 投稿
// 4d. 投稿直後の URL から tweet_id を取得 → ピン留め
// 4e. 自分の新規ポストに reply で L1/L2/L3 を投稿
```

`--dry-run` のとき、各 step で実書込み直前に screenshot を保存して停止。

### Step 5: state.json 更新

成功した step だけ state.json に反映 (失敗した step は前回値を残す)。

```javascript
state.bio = { variant: "A", live_text: "...", set_at: now };
state.pinned = { variant: "2", tweet_id: "20...", live_text: "...", set_at: now };
state.replies.L1 = { tweet_id: "20...", ... };
// ...
fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
```

### Step 6: 結果サマリ + 次回レビュー予定

```
✅ bio: 案 A → live (https://x.com/stats47jp373)
✅ pinned: 案 ② tweet_id=20... → pin 完了
✅ L1 reply: tweet_id=20...
✅ L2 reply: tweet_id=20... (magazine: <URL>)
✅ L3 reply: tweet_id=20... (top3: <slug1> / <slug2> / <slug3>)

次回レビュー推奨: 2026-06-26 (1ヶ月後)
  /update-x-profile review で過去30日のメトリクスを取得
```

## 手順 (review モード)

実投稿はせず、以下を実行:

1. `/fetch-x-data last28d tweets 100` で過去 28 日のメトリクスを取得
2. state.json の `pinned` / `L1` / `L2` / `L3` の tweet_id を引いて impression / ER を更新
3. L3 の TOP3 を最新 GA4 / GSC から再計算し、現状の L3 と diff
4. 「L2/L3 を update すべきか?」を判定:
   - 現状 L3 の article ranks が更新後 TOP3 と一致 → 据え置き OK
   - 不一致 → 「ローテーション推奨」を出力
5. state.json の `metrics_snapshot` を更新

## 安全策・注意事項

- **初回必ず `--dry-run`** — UI が壊れていると bio が空更新される可能性。screenshot で目視確認
- **旧 pin の unpin 失敗時は実投稿を中断** — 古い pin が残ったままだと新ポストが pin にならず混乱
- **リプライ間隔は最低 5 秒** — 連続投稿で X の rate limit に当たることがある
- **state.json のバックアップ** — 更新前に `state.json.{epoch}.bak` を作成
- **DRY RUN screenshot** は `.local/playwright-x-profile-debug/` に保存

## 関連

- `.Codex/skills/sns/publish-x/SKILL.md` — 通常の予約投稿スキル (Playwright 永続プロファイル共用)
- `.Codex/skills/sns/generate-utm-url/SKILL.md` — UTM 付与の共通ロジック
- `.Codex/skills/analytics/fetch-x-data/SKILL.md` — review モードで使用
- `.Codex/rules/browser-use-cleanup.md` — Playwright 終了時の cleanup 規約
- `docs/10_SNS戦略/05_SNSプロフィール.md` — 文案カタログと運用ルール

## 履歴

| 日付 | mode | bio | pinned | 備考 |
|---|---|---|---|---|
| 2026-05-26 | bio | A | (未) | bio 案 A 適用（note.com/stats47 誘導追加）。pin/replies は未実施 |

## OGP 注意事項

- note プロフィール (`/stats47`) は `twitter:card=summary` → 小サムネ表示。リッチカード期待時は使わない
- note マガジン (`/m/m512ad7023815`) は `summary_large_image` だがカバー画像 1024×1024 (正方形) のため X 側で大カード生成に失敗するケースあり
- 対策: (1) UTM 付与で URL を新規扱いさせ再 fetch を促す (2) note マガジン編集でカバーを 1200×630 横長に差し替え (3) どうしても出ない場合はカバー画像を X に直接添付 + 本文に URL

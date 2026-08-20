---
name: post-x-batch
description: X (Twitter) ランキング定型投稿を N 本まとめて生成し posts.json に draft 登録する量産スキル。Use when user says "X量産", "X投稿まとめて", "X週次バッチ", "post-x-batch". 候補選定→画像→キャプション執筆→lint→draft登録の5フェーズ。投稿はしない (publish-x --from-queue が消化)。
disable-model-invocation: true
primary_agent: x-strategist
---

# post-x-batch — X 定型投稿の量産 (候補選定 → 画像 → 執筆 → lint → draft 登録)

1 コマンドで N 本のランキング定型投稿を生成し、`posts.json` に `status=draft` (`template` /
`scheduled_at` 付き) で積む。**このスキルは投稿しない** — 投稿は別途ローカルで
`publish-x --from-queue` が消化する (クラウド生成 → ローカル投稿の受け渡しは posts.json のみ)。

> **型・画像・頻度の SSOT は `.Codex/rules/sns-content-standards.md`** (§1 quota / §2-0 templates /
> §2-8 相性 / §2-9 画像)。本スキルはテンプレ本文を持たず、必ずそこを参照する。カタログは
> `.Codex/scripts/lib/x-catalog.cjs` が機械参照する。

## 引数

| 引数 | 既定 | 説明 |
|---|---|---|
| `--count N` | 10 | 生成する本数。週次目安は §1 `X_WEEKLY_TARGET_MIN..MAX` (14-21) |
| `--start YYYY-MM-DD` | 翌日 (JST) | 予約割付の開始日。省略時は翌日から |
| `--rebuild-index` | off | metric 索引を作り直す (metric 追加後) |

## 実行環境

- **フェーズ ①②③④⑤ (生成〜draft 登録) はクラウド可**。R2 公開 URL を読むだけで完結する。
- **投稿 (publish-x --from-queue) はローカル専用** (Playwright headless:false)。本スキルの範囲外。

## 5 フェーズ (フェーズ間の分担: ①②④⑤=決定的スクリプト / ③=LLM 執筆のみ)

### ① 候補選定 (決定的)

```bash
node .Codex/skills/sns/post-x-batch/scripts/select-candidates.cjs --count <N> [--start YYYY-MM-DD]
# → .local/r2/sns/_queue/candidates.json
```

- 冒頭で `x-catalog.selfCheck()` が走り、カタログ md のドリフト・アンカー欠落を検出する (失敗で停止)。
- 公開済み ranking キー ∩ metric 索引を母集団に、季節性 (当月テーマ語)・category ローテ・
  dedup (同 key 30日 / 同 key×template 90日) で決定的にスコア → 上位 N 件を選定。
- 各候補に §2-8 相性表で `template` (§2-0) を割付、§1 quota (1 日上限) を守って `scheduledAt` を割付。
- 出力の各要素: `{ key, domain, category, title, unit, template, imageKind, scheduledAt, structure, charMax }`。
  **キャプションは無い** (③で書く)。

### ② 画像バッチ (決定的)

各候補の `imageKind` に応じて画像を生成する。**既定 `ranking-card` は quick-still で数秒生成**:

```bash
# candidates.json の key ごとに (ranking-card):
node -e 'const c=require("./.local/r2/sns/_queue/candidates.json"); c.filter(x=>x.imageKind==="ranking-card").forEach(x=>console.log(x.key))' \
  | while read k; do npx tsx .Codex/scripts/sns/quick-still.ts --key "$k"; done
```

- 出力は §2-9 の out_path (`.local/r2/sns/ranking/<key>/x/stills/<key>.png`)。publish-x が読む正典パス。
- `tile-map` / `scatter` / `compare` を割り当てた候補は Remotion (`/render-sns-stills`) が必要 (重いので
  量産の主軸は ranking-card。多様性で一部だけ tile-map を混ぜる場合に使う)。
- **画像はローカル R2 ミラーに出るだけで git に載らない**。publish 時に `--from-queue` が media 不在を
  検知して quick-still を再生成するため、クラウドで①③⑤だけ実行してもよい (画像は publish 時に確定)。

### ③ キャプション執筆 (LLM — このフェーズだけが判断)

`candidates.json` を読み、各要素に `caption` を足した `captions.json` を書く
(`.local/r2/sns/_queue/captions.json`)。**執筆の唯一のフェーズ**。以下を厳守:

- **型は §2-0 の該当 `template` の `structure` に従う** (本スキルに型本文は無い。rules を読む)。
- **数値は R2 の実データのみ** (quick-still の出力 `caption.txt` / `source.json` に上位5・下位5・倍率がある)。
  推測値を書かない (`evidence-based-judgment.md`)。
- **URL は書かず `{{url}}` トークンを 1 個だけ置く** (register が §4 の UTM URL に決定的置換する。URL を
  LLM が書くと捏造・UTM 不整合になる)。
- **ハッシュタグ 3-5 個**。本文 (URL・改行除く) は `charMax` 以下。
- **勝ちパターンを反映**: `.Codex/state/sns/x-winning-patterns.json` があれば、confidence hi/mid の
  featureSignal (効く template / フック) を優先する (無ければ §2-8 相性の既定でよい)。
- 既存・同バッチと似すぎない (④の類似度ゲートで弾かれる)。

captions.json の 1 要素例:
```json
{
  "key": "lowest-temperature", "template": "question", "category": "landweather",
  "imageKind": "ranking-card", "scheduledAt": "2026-07-09T19:00:00+09:00",
  "caption": "なぜ北海道はここまで冷えるのか?\n\n最低気温の記録は本州と別次元。\n放射冷却が効く内陸盆地の宿命です。\n続きは👇\n\n{{url}}\n\n#都道府県 #気温 #統計"
}
```

### ④ lint ゲート (決定的)

```bash
node .Codex/skills/sns/post-x-batch/scripts/lint-x-captions.cjs --in .local/r2/sns/_queue/captions.json
```

- 検査: 文字数 (≤ charMax) / ハッシュタグ 3-5 / `{{url}}` ちょうど 1・生 URL 禁止 / NG 語 / 既存・同バッチ類似度 < 0.8。
- **FAIL があれば exit 1**。指摘行を ③ で修正して再 lint。全 PASS まで ⑤ に進めない。

### ⑤ draft 登録 (決定的)

```bash
# まず dry-run で確認
node .Codex/skills/sns/post-x-batch/scripts/register-drafts.cjs --in .local/r2/sns/_queue/captions.json --dry-run
# 問題なければ本登録
node .Codex/skills/sns/post-x-batch/scripts/register-drafts.cjs --in .local/r2/sns/_queue/captions.json
```

- `{{url}}` を §4 UTM URL に置換し、`store.insert` で `status=draft` (`template` / `scheduled_at` /
  `media_path` / `utm_url` / `metric_keys` 付き) を積む。冪等 (同 key×template×scheduled_at はスキップ)。

## 投稿 (このスキルの範囲外・ローカルで実行)

生成した draft は **ローカルで** 消化する:

```bash
node .Codex/scripts/sns/check-x-post-budget.cjs          # 週次の残枠を確認
npx tsx .Codex/skills/sns/publish-x/publish-x.ts --from-queue --dry-run   # 初回必須 (予約モード確認)
npx tsx .Codex/skills/sns/publish-x/publish-x.ts --from-queue             # 予約投稿 → status=scheduled
```

## 完了報告 (Output Contract)

登録した draft の一覧を 1 テーブルで報告する:
`key | template | scheduledAt | imageKind`。前置き文なし。lint FAIL があれば FAIL 件数と理由も併記。

## 関連

- 型・画像・頻度 SSOT: `.Codex/rules/sns-content-standards.md` §1/§2
- カタログ API: `.Codex/scripts/lib/x-catalog.cjs`
- 画像最短経路: `.Codex/scripts/sns/quick-still.ts`
- 投稿 (ローカル): `.Codex/skills/sns/publish-x/`
- 勝ちパターン: `.Codex/scripts/sns/analyze-x-winning-patterns.mjs` → `.Codex/state/sns/x-winning-patterns.json`
- オーナー agent: `.Codex/agents/x-strategist.md`

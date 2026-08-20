---
name: post-x
description: X (Twitter) 投稿を 1 本だけ生成して posts.json に draft 登録する。Use when user says "X投稿1本", "ツイート1件作成". 量産は /post-x-batch を使う。
disable-model-invocation: true
primary_agent: x-strategist
---

# post-x — X 投稿を 1 本生成 (post-x-batch の N=1 薄いラッパー)

指定した 1 つのランキングキーから X 投稿を 1 本生成し `posts.json` に draft 登録する。
**量産 (週次 N 本) は `/post-x-batch` を使う** — post-x はそのN=1 版。

> **型・画像・頻度・UTM の SSOT は `.Codex/rules/sns-content-standards.md`** (§1/§2)。
> テンプレ本文はこのスキルに持たない (過去に 4 箇所へドリフトした反省。必ず rules を読む)。

## 引数

| 引数 | 必須 | 既定 | 説明 |
|---|---|---|---|
| `--key <rankingKey>` | ✅ | — | 対象ランキングキー |
| `--template <id>` | - | 相性表の既定 | §2-0 の template id (`shock`/`versus`/`question`/`paradox`/`number`/`angle-experience`/`angle-howto`) |
| `--date YYYY-MM-DDThh:mm` | - | 翌日の best_time | 予約日時 (JST) |

## 手順 (post-x-batch の 5 フェーズを 1 件で回す)

1. **候補 1 件を作る**: `--template` 未指定なら、その key の category を metric 索引で引き、§2-8 相性表の
   ◎ から template を 1 つ選ぶ。`{ key, domain:"ranking", template, imageKind, scheduledAt }` を
   `.local/r2/sns/_queue/candidates.json` (1 要素配列) として書く。
2. **画像**: `npx tsx .Codex/scripts/sns/quick-still.ts --key <key>` (ranking-card, §2-9 の正典パスへ)。
3. **執筆 (LLM)**: §2-0 の該当 template の `structure` に従い caption を書く。URL は `{{url}}` トークン 1 個、
   ハッシュタグ 3-5、本文 ≤ charMax、数値は quick-still の `caption.txt`/`source.json` の実データのみ。
   `.local/r2/sns/_queue/captions.json` (1 要素) に書く。
4. **lint**: `node .Codex/skills/sns/post-x-batch/scripts/lint-x-captions.cjs --in .local/r2/sns/_queue/captions.json` (PASS まで修正)。
5. **登録**: `node .Codex/skills/sns/post-x-batch/scripts/register-drafts.cjs --in .local/r2/sns/_queue/captions.json`。

## 投稿 (ローカル)

```bash
npx tsx .Codex/skills/sns/publish-x/publish-x.ts --from-queue --dry-run --limit 1   # 初回必須
npx tsx .Codex/skills/sns/publish-x/publish-x.ts --from-queue --limit 1
```

引用RT・ニュース瞬発は `/find-quote-rt` / `/react-to-news` → `publish-x` を使う (量産系統とは別)。

## 関連

- 量産版: `.Codex/skills/sns/post-x-batch/SKILL.md`
- 型・画像・頻度 SSOT: `.Codex/rules/sns-content-standards.md` §1/§2
- オーナー agent: `.Codex/agents/x-strategist.md`

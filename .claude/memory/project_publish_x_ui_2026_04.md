---
name: publish-x の UI 変更対応（2026-04）
description: X compose の date picker が 12時間制→24時間制に刷新、scheduleOption click は DOM `el.click()` 必須
type: project
originSessionId: 2bc66982-343e-4ee4-94d0-b5d2f6bf449c
---
2026-04 に X の compose modal の予約 UI が刷新され、`.claude/skills/sns/publish-x/publish-x.ts` を改修した（2026-04-20）。

**Why**: 4/18 の即時投稿事故後の初稼働で dry-run が失敗し、原因調査の結果、X 側 UI の変更が判明。

**How to apply**:
- date picker のセレクト 5 個は **`data-testid` なし・インデックス順**: `[0]=月 [1]=日 [2]=年 [3]=時(24h) [4]=分`。旧 `scheduledDatePickerMonths` 等は使えない
- **scheduleOption は DOM `el.click()` で呼ぶ**。Playwright の `click({force:true})` は画像添付後に pointer event が別要素に intercept され silently 成功（date picker が開かない、fail-safe が発動して投稿中止）
- posted_at を JST で保存するときは `toISOString()` 直使用不可（UTC 変換で前日になる）。`(d.getTime() + 9*60*60*1000)` してから ISO 変換

**関連ファイル**:
- `.claude/skills/sns/publish-x/publish-x.ts`（実装）
- `.claude/skills/sns/publish-x/SKILL.md`（セレクタ表と注意事項）

**2026-04-20 の成功実績**: 7 件（annual-income-per-household 等）を 04-21〜04-27 の毎日 08:00 JST で予約成功。

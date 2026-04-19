---
name: publish-x
description: Playwright で X の予約投稿を自動実行する。Use when user says "X投稿", "X予約投稿", "ツイート予約". キャプション生成済みコンテンツをブラウザ自動操作で投稿. **初回実行時 or セレクタ更新後は必ず `--dry-run` で事前検証すること**.
disable-model-invocation: true
argument-hint: "<rankingKey> <YYYY-MM-DDTHH:MM> [<rankingKey> <date> ...] [--domain ranking|blog] [--dry-run]"
---

Playwright（永続プロファイル）で X のコンポーザを自動操作し、予約投稿を設定する。

## ⚠️ 重要: 初回 / セレクタ更新後は `--dry-run` で事前検証

X の UI は頻繁に変わるため、セレクタが壊れていると **予約投稿のつもりが即時投稿になる** 事故が発生する（2026-04-18 実際に発生、Sprint 1 Day 2-5 が 4 件同時即時投稿）。対策として:

1. **初回投稿 or 前回から 1 週間以上空いた場合**:
   必ず `--dry-run` で予約モード到達を確認してから実投稿する:
   ```bash
   npx tsx .claude/skills/sns/publish-x/publish-x.ts <rankingKey> 2026-04-20T21:00 --dry-run
   ```
   - Chromium で予約ダイアログまで到達し、予約モード（`tweetButton` に「予約設定」or「Schedule」）が検出できるか確認
   - 成功: `.local/playwright-x-debug/<ts>_<key>_dry-run-scheduled-mode.png` に screenshot 保存
   - 失敗: `schedule-mode-not-confirmed.png` を確認してセレクタ修正

2. **dry-run が成功したら** 本番予約投稿を実行（`--dry-run` を外す）。

3. **セレクタ検出失敗時の挙動**:
   - 予約モード未確認なら `Escape` で投稿中止（fail-safe、即時投稿を絶対に発火させない）
   - 失敗時 screenshot は `.local/playwright-x-debug/` に自動保存
   - ログに `🚨 予約モード未確認、投稿中止` が出る → セレクタ更新が必要なサイン

## 用途

- `/post-x` または `/post-sns-captions` でキャプション生成済みのコンテンツを X に予約投稿したいとき
- scheduled 状態のストックをまとめて消化したいとき

## 引数

```
/publish-x <rankingKey> <YYYY-MM-DDTHH:MM> [<rankingKey> <date> ...] [--domain ranking|compare|correlation]
```

| パラメータ | 必須 | デフォルト | 説明 |
|---|---|---|---|
| **contentKey** | 必須 | - | ランキングキー（複数指定可） |
| **date** | 必須 | - | 予約日時 JST（`2026-04-15T08:00` 形式） |
| **--domain** | - | `ranking` | `ranking` / `compare` / `correlation` |
| **--immediate** | - | - | 予約ではなく即時投稿 |

**複数投稿の例:**
```bash
npx tsx .claude/skills/sns/publish-x/publish-x.ts \
  annual-income-per-household 2026-04-12T08:00 \
  divorces-per-total-population 2026-04-14T08:00 \
  disposable-income-worker-households 2026-04-16T08:00
```

## 前提条件

1. **Playwright Chromium がインストール済み**:
   ```bash
   npx playwright install chromium
   ```
2. **キャプション・画像が生成済み**（`/post-x` or `/post-sns-captions` で生成）:
   - `.local/r2/sns/<domain>/<contentKey>/x/caption.txt`
   - `.local/r2/sns/<domain>/<contentKey>/x/stills/*.png`
3. **永続プロファイル**: `.local/playwright-x-profile/` に X ログインセッションが保存されている
   - 初回実行時はブラウザが開き、手動ログインが必要（5分以内）
   - 2回目以降は自動的にログイン済み状態で起動

## 実行

```bash
npx tsx .claude/skills/sns/publish-x/publish-x.ts <args>
```

スクリプトが自動で以下を実行する:
1. Playwright で Chrome を起動（永続プロファイル使用）
2. X.com のログイン状態を確認（未ログインなら手動ログイン待機）
3. 各投稿について:
   - `x.com/compose/post` を開く
   - clipboard API でテキストを貼り付け（日本語対応）
   - `primaryColumn` 内の `fileInput` で画像アップロード
   - 予約ダイアログで日時設定
   - 予約投稿ボタンをクリック
4. DB（`sns_posts`）を自動更新（status → posted, caption 保存）

## 実証済みの Playwright セレクタ（2026-04-20 更新）

X の compose ダイアログは `#layers` 内の `[role="dialog"]` に生成される。**2026-04 に UI が刷新され、date picker が 12時間制 + data-testid → 24時間制 + testid なしに変更された。**

| 操作 | セレクタ | 備考 |
|---|---|---|
| テキスト入力 | `page.getByRole("textbox").first()` | clipboard API + Meta+V で入力 |
| 画像アップロード | `page.locator('input[data-testid="fileInput"]').first()` | テキスト入力より先に実行すること |
| 予約ボタン | `page.locator('[role="dialog"] [data-testid="scheduleOption"]').first()` | modal dialog 内に scope（inline composer 側の誤クリック回避）。**DOM レベル `el.click()` で呼ぶ**（Playwright click は画像添付時に intercept されて silently 失敗する） |
| 日時セレクト (5個) | `page.locator('[role="dialog"] select')` | dialog 内に scope。**`options` 内容からロール判定**（month: "1月"〜 と max=12、year: `/^20\d{2}$/` の text、day: max=28-31（月により可変）、hour: max=23、minute: max=59）。インデックス順に依存しない |
| 確認ボタン | `page.getByTestId("scheduledConfirmationPrimaryAction")` | text="確認する"、クリック後に予約モード切替を待つ |
| 予約モード検証 | `[data-testid="tweetButton"]:has-text("予約設定")` | 確認後にボタンテキストが "ポストする" → "予約設定" に変わる |
| 投稿ボタン | `page.getByTestId("tweetButton").first()` | 予約モード確認後は `force` 不要 |

**堅牢化の狙い**: select のインデックス順、要素の個数、ロケール（"月" vs "Month"）、選択中月の日数（28/29/30/31）に依存しない形でロールを判定している。X が UI を更新しても、options 内容が同パターンなら動作する。

## 実装上の注意点

### clipboard API によるテキスト入力
`pressSequentially` は日本語で不安定。`navigator.clipboard.write()` + `Meta+V` が確実:
```typescript
await page.evaluate(async (text: string) => {
  const item = new ClipboardItem({
    "text/plain": new Blob([text], { type: "text/plain" }),
  });
  await navigator.clipboard.write([item]);
}, caption);
await page.keyboard.press("Meta+v");
```

### クリック方法の使い分け
compose ダイアログは `#layers` 内に生成され、画像添付時にポインタイベントが別要素に intercept される。

- **予約ボタン（カレンダーアイコン）**: **DOM レベル `el.click()` 必須**。Playwright の `click({force:true})` は silently 成功するが date picker が開かない（intercept 先が別要素のため）
- **投稿ボタン（予約設定後）**: `force: true` **不要**。まず通常クリックを試み、失敗時のみ `force` にフォールバック

```typescript
// 予約ボタン: DOM 直 click（画像添付時の pointer intercept を回避）
await scheduleBtn.evaluate((el: HTMLElement) => el.click());

// 投稿ボタン: 予約モード確認後は force 不要
try {
  await postBtn.click({ timeout: 5000 });
} catch {
  await postBtn.click({ force: true });
}
```

### 予約モードの確認（重要）
確認ボタン（`scheduledConfirmationPrimaryAction`）クリック後、ボタンテキストが「予約設定」に変わるのを待ってから投稿ボタンをクリックする。**この待機を省略すると即時投稿になる。**

```typescript
await confirmBtn.click();
await page.locator('[data-testid="tweetButton"] span span:text-is("予約設定")').waitFor({
  state: "visible",
  timeout: 5000,
});
```

### 画像アップロードの待機
画像アップロード後はサムネイル生成に時間がかかる。最低 5 秒の待機が必要。

### 永続プロファイルのパス
`.local/playwright-x-profile/` に Chrome プロファイルが保存される。このディレクトリを `.gitignore` に追加済み（`.local/` が対象）。

## DB 更新

スクリプトが自動で `sns_posts` テーブルを更新する:
- `status` → `posted`
- `posted_at` → 予約日（YYYY-MM-DD）
- `caption` → caption.txt の内容（未設定の場合のみ）

手動でメディアファイルを削除する場合は `/mark-sns-posted` を使用。

## エラーハンドリング

- **未ログイン**: ブラウザが開き、手動ログイン待機（5分タイムアウト）
- **要素不在**: `waitFor` で最大 10-15 秒待機後、エラーで停止
- **画像なし**: 画像なしでテキストのみ投稿
- **セレクタ変更**: X の UI 変更でセレクタが壊れた場合、本ファイルの「実証済みセレクタ」表を更新すること

## 参照

- キャプション生成: `.claude/skills/sns/post-x/SKILL.md`
- 画像生成: `.claude/skills/sns/render-sns-stills/SKILL.md`
- 投稿完了処理: `.claude/skills/sns/mark-sns-posted/SKILL.md`
- 永続プロファイル: `.local/playwright-x-profile/`
- スクリプト本体: `.claude/skills/sns/publish-x/publish-x.ts`

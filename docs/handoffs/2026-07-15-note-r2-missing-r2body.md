---
type: handoff
date: 2026-07-15
status: active
topic: note R2 未保存記事の可視化 (r2Body 是正) + 本文復元は要ローカル
tags: [note, r2, catalog, handoff]
---

# ハンドオフ: note の「R2 未保存記事」是正 (2026-07-15)

「note で R2 に保存できていない記事がある」の調査・是正。データ整合の修正まで完了、**本文復元は未着手**（クラウドセッションでは実行不可）。

## 背景 / 判明したこと

- note カタログ SSOT 化 (commit b4d67c7) で「note.com に公開済みだが R2 に本体 (draft.md/画像) が無い」記事が可視化された。
- 実測: 公開 203 件中 **165 件が R2 未保存**（stats47-note 159 + koumuin 6、うち有料 50）。全て `recovered-*` / `paid-*` 回収スタブで、r2Path は note ID から機械生成しただけで 404。**docs/31 にもローカル本文が無い**（push し忘れではない）。
- 根本原因: `generate-note-catalog.ts` が全公開記事を無条件 `status: "r2_ready"` にし、404 の r2_path を「保存済み」と偽っていた。

## やったこと (PR #583・draft・base develop)

- `catalog/types.ts`: `NoteArticle` に `r2Body?: boolean` 追加（false=note.com のみ・要復元、省略=true）。
- `catalog/data/*.ts`: r2Path が noteID の公開記事 165 件を `r2Body: false` でマーク。
- `catalog/data/koumuin-gis.ts`: 実体が `koumuin-gis-01-depopulation-medical` で R2 にある重複スタブ `recovered-n686dcc017bbe` を削除（240→239 記事）。
- `catalog/generate-note-catalog.ts`: `r2Body===false` を `status:"note_only"`+`r2_body:false` で出力。R2 本体ありのみ `r2_ready`。
- `note-published-urls.json` 再生成: **r2_ready 37 / note_only 165**（旧: 全 203 が偽 r2_ready）。
- `.claude/state/note/r2-missing-inventory.md`: 要本文復元 165 件（有料 50）の一覧を追加。
- README に復元運用（復元後 `r2Body:true` へ更新→再生成）を記載。

## 検証状態

- `validate-note-catalog.ts`: error 0 / warn 7（既存の title 重複疑い、surface 設計どおり）。
- `generate-note-catalog.ts --apply`: 公開 202 件 → r2_ready 37 / note_only 165。
- 消費側（sync-note-r2 / restore-from-r2 / gallery-collectors / generate-ogp-images）は r2_path・vertical のみ参照し派生 status 文字列に分岐しないため非破壊。
- PR #583 に CI は付かない（このリポジトリの CI は develop→main PR でのみ発火）。監視購読中、1時間ごとの自己チェックイン仕込み済。

## 残タスク ★次セッションの核心（ローカル/creds 必須）

1. **本文復元 (165 件・note.com → R2)**: browser-use + note ログイン（有料 50 件は所有者アカウント）が必要 = **creds/ブラウザを持つローカルセッションで実施**。一覧は `.claude/state/note/r2-missing-inventory.md`。復元 → `diff-push-r2.ts --prefix note` → 該当カタログエントリを `r2Body: true` に更新 → `generate-note-catalog.ts --apply`。
2. **title 重複の統廃合（次段）**: `validate` の warn 7 が surface する proper と recovered/paid の同題ペアは noteUrl が異なり機械で断定できない。note.com 本文照合の上で人手統廃合（README「次段」）。
3. **PR #583 の develop マージ**（レビュー後）。

## 次セッションへの注意

- 165 件は「push し忘れ」ではなく本文がローカルに一切無い。安易に空 push しない。復元は必ず note.com 本文取得を伴う。
- 真実源はカタログ `catalog/data/*.ts` の `r2Body`。`note-published-urls.json` は派生（手編集しない）。

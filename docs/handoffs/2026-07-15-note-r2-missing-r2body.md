---
type: handoff
date: 2026-07-15
status: active
topic: note R2 未保存記事の可視化 (r2Body 是正) + 本文復元は要ローカル
tags: [note, r2, catalog, handoff]
---

# ハンドオフ: note の「R2 未保存記事」是正 (2026-07-15)

「note で R2 に保存できていない記事がある」の調査・是正。データ整合の修正 (PR #583) に続き、**無料 115 件の本文復元・R2 反映・`r2Body: true` 化までローカルセッションで完了** (2026-07-15)。**残るは有料 50 件のみ** — 所有者 (stats47) アカウントでの note ログインが要る。

> [!done]
> **2026-07-15 追記 (ローカルセッション)**: 無料 (recovered-*) 115 件を復元完了。
> - 復元スクリプト新規: `.claude/scripts/note/catalog/restore-from-notecom.py` (note API v3 → HTML→md 変換 + 画像 DL → `.local/r2/<r2_path>/` staging)。
> - R2 反映: `diff-push-r2.ts --prefix note` で 550 オブジェクト (draft.md 115 + 画像 435) push・全件成功。旧 404 → 200 を実測確認。
> - カタログ更新: 該当 115 エントリを `r2Body: true` 化 → `generate-note-catalog.ts --apply` 再生成。**r2_ready 37→152 / note_only 165→50**。
> - inventory `r2-missing-inventory.md` を残 50 件 (全て有料) に更新。
> **残タスクは有料 50 件のみ** (下記「残タスク」1 を参照)。有料は所有者ログイン後に同スクリプトを `--include-paid` で実行する。

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

1. **本文復元 (残 有料 50 件・note.com → R2)**: 無料 115 件は完了済み。残る 50 件は**すべて有料**で、本文取得に**所有者 (stats47) アカウントの note ログインが必要**。**現状どの Chrome プロファイルも stats47 でログインしていない** (Profile 1/7 は `dobokunote`、Profile 5 は `_note_session_v5` が失効し認証エラー)。手順:
   1. Chrome のいずれかのプロファイルで note.com に stats47 としてログインする (パスワードは所有者のみ)。
   2. `restore-from-notecom.py --include-paid` を実行する。スクリプトが Chrome から stats47 の cookie を自動抽出し (`get_cookie_from_chrome` が `urlname==stats47` を検証)、`can_read=true` の有料本文を取得する。cookie を明示するなら `--cookie <_note_session_v5値>`。
   3. `diff-push-r2.ts --prefix note` で R2 反映 → 該当 50 エントリの `r2Body: false` を `true` に (無料分と同じ python 一括置換) → `generate-note-catalog.ts --apply` 再生成 → inventory 再生成。
   - 一覧は `.claude/state/note/r2-missing-inventory.md` (残 50 件・全有料)。
2. **title 重複の統廃合（次段）**: `validate` の warn 7 が surface する proper と recovered/paid の同題ペアは noteUrl が異なり機械で断定できない。note.com 本文照合の上で人手統廃合（README「次段」）。

## 次セッションへの注意

- 残 50 件は「push し忘れ」ではなく本文がローカルに一切無い。安易に空 push しない。復元は必ず note.com 本文取得を伴う。
- 有料本文は `price` があっても `can_read=false` なら無料エリアしか取れない。`restore-from-notecom.py` は can_read=false を skip する (偽の本文を保存しない)。
- 真実源はカタログ `catalog/data/*.ts` の `r2Body`。`note-published-urls.json` と `r2-missing-inventory.md` は派生（手編集しない）。
- 復元本文の frontmatter は `restored_from: note.com` / `restored_at` を持つ (生成記事と区別できる)。画像は note assets から DL し `images/image-NN.png` に相対参照化済み (R2 自己完結)。

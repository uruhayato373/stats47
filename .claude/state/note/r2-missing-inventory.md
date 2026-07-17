# note: R2 未保存の公開記事インベントリ (要本文復元)

> 派生物 (手編集しない)。真実源はカタログ (`.claude/scripts/note/catalog/data/*.ts`) の `r2Body: false` エントリ。
> 再生成: `npx tsx .claude/scripts/note/catalog/generate-note-catalog.ts` 後、status=note_only を抽出。

## サマリ (0 件)

**R2 未保存の公開記事は 0 件。** 全 202 公開記事が `r2_body: true` (R2 に本体 `draft.md` + 画像あり)。

- 2026-07-15: 無料 (recovered-*) 115 件を `restore-from-notecom.py` で復元・R2 反映・`r2Body: true` 化。
- 2026-07-16: 残りの有料記事 50 件 (koumuin-claude-code 1 / koumuin-estat-claude-code 1 / koumuin-gis 1 / stats47-note 47) の同期完了を R2 公開 URL で実測確認 (全件 `draft.md` + `images/cover-1280x670.png` が 200)。カタログ `data/*.ts` の `r2Body` を `true` に更新し、`generate-note-catalog.ts --apply` で `note-published-urls.json` を再生成 (note_only 0 / r2_ready 202)。

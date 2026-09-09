---
name: project_source_vault_expanded_layout
description: 参考文献 vault は 2026-09-10 に tar bundle を廃止し Drive の版 folder へ展開配置 (1 資料 1 directory = PDF + pages/ + md/ + figures/)。マウント解決・readback・pending 台帳・_移行前 の扱いと、移行時に見つかった不完全スキャン
metadata:
  node_type: memory
  type: project
  originSessionId: 01a2132e-0f2f-4b92-861e-56d18cd90dfc
  modified: 2026-09-10T00:00:00.000Z
---

2026-09-10 に `stats47/参考文献/<資料名>/<版>/` を tar bundle (`r<N>.tar.gz.part-*`) から展開配置へ移行した。
doboku-note の `原資料PDF/書籍/{id}__{書名}/{source,pages,ocr,crops}/` と同じ考え方で、stats47 は `<資料名>/<版>/` を外側に残し
その直下に PDF・`pages/`・`transcripts/`・`md/`・`figures/`・補助 file・manifest 複製を置く。12 profile (既存 5 + 新規 7) が展開済み。
正典は `.claude/rules/reference-source-standards.md` §2/§3、CLI は `source-vault.mjs` の `create / upload / verify --vault / restore / vault-root`。

**Why:** tar 分割の唯一の根拠は Drive MCP の 1 file 100MB 上限だったが、運用はローカルマウント経由に移っていて無関係になっていた。
ストリーミングマウント上では巨大 blob より個別 file の方が堅牢で (bundle 5 資料が `du` で 8KB/0B のプレースホルダだった)、
訂正のたびに `r<N>` で全量複製するのも無駄 (家計調査は 25MB の本が r1〜r3 で約 400MB)。展開形なら Drive コネクタの
`read_file_content` でページ画像を直接読める。

**How to apply:**
- マウントは `resolveVaultRoot()` が `~/Library/CloudStorage/GoogleDrive-<account>/{マイドライブ,My Drive}/stats47` → Windows `G:\…` の順に探す。
  日本語ロケールの Drive アプリは **`マイドライブ`** を作る (`My Drive` は存在しない)。別環境は `STATS47_SOURCE_VAULT_ROOT` で上書き。
- `upload` は sha256 一致 file を触らず差分だけ複製し、複製後に vault を読み戻して照合する。マウントへの書き込みとクラウド同期は別なので、
  ローカルコピーを消す前に Drive 側の件数を見る。`verify --vault` は manifest に無い file (`.DS_Store`・`stats47-*.manifest.json` 以外) も拒否する。
- Git manifest は schemaVersion 2 (`storage.layout: expanded`, `contentSha256`)。`revision` は manifest の世代番号で Drive のコピーを増やさない。
  processing workspace の `sourceBundleSha256` には `contentSha256` が入る (field 名は互換のため据え置き)。
- `source-inventory check-all` は S4 未到達 profile (inventory.json 無し) を `pending` として列挙する (失敗にしない)。
- `extract --mode image` はページ画像だけを書く (S1 専用。transcripts/ を作らないので stage-status の S2 判定を汚さない)。
- 旧 bundle 37 file と直下に散らばっていた生 PDF 16 本は `参考文献/_移行前/` に退避 (README あり)。全 profile の `verify --vault` 通過を
  確認済みなので削除してよいが、削除はオーナー判断。
- 新規 7 冊 (Kindle 画面スキャン) は版が奥付で確認できず `edition: unknown` / `版不明`。うち『やばい県民ランキング』は表紙が 20 ページ重複し
  本文 62% で終わる (一意ページ 28/50)、『都道府県別平均年収ランキング』は 84% で終わる不完全スキャン。統計根拠にしない。
- 関連: [[project_kakei_marketing_book_pipeline]]

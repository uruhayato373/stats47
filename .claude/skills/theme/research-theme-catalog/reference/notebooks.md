# NotebookLM 白書ノートブック台帳 (テーマ調査用)

`/research-theme-catalog` の Stage 1a で参照する NotebookLM ノートブックの登録簿。
テーマの指標調査時、対象テーマに対応する白書ノートブックが**未登録なら増設し、この台帳を更新する**。

> 増設: `node .claude/scripts/notebooklm-notebook-builder.mjs find-or-create "<名前>"` →
> `add-source --notebook "<名前>" --file <白書PDF> --title "<白書名>"` → 下表に追記。
> クエリ: `node .claude/scripts/notebooklm-cross-query.mjs --notebooks "<名前>" "<質問>"`。

## 登録済みノートブック

| ノートブック名 | ID | 収載白書 | 対応テーマ (theme key) |
|---|---|---|---|
| 最新の白書 | `2bf7f0dd-3935-49be-8cef-2d428c59eaa9` | 令和6-8年度の各種白書 (GX/AI/DX 等) | ict / energy / (横断) |
| 国土交通白書 | `19206d1e-53c0-4648-ae22-5efe9b710d5b` | 国土交通白書 (社会基盤・インフラ) | roads / railway / ports / living-housing |

## 増設候補 (テーマ別に対応する主要白書 — 調査時に必要なら作る)

| テーマ (theme key) | 対応白書 (proposedBy 候補) | 発行元 |
|---|---|---|
| manufacturing | ものづくり白書 | 経産省/厚労省/文科省 |
| labor-wages / occupation-salary | 労働経済白書 / 厚生労働白書 | 厚労省 |
| healthcare | 厚生労働白書 (医療) | 厚労省 |
| aging-society / population-dynamics | 高齢社会白書 / 少子化社会対策白書 | 内閣府 |
| tourism | 観光白書 | 観光庁 |
| local-economy / local-finance | 地方財政白書 | 総務省 |
| safety | 犯罪白書 / 交通安全白書 / 防災白書 | 法務省/内閣府 |
| education-culture | 文部科学白書（公式資料は evidence source 登録済／NotebookLM ID 未登録） | 文科省 |
| consumer-prices / real-income | 経済財政白書 / 消費者白書 | 内閣府/消費者庁 |
| fishery-marine | 水産白書 | 水産庁 |
| foreign-residents | 出入国在留管理 / 多文化共生 関連 | 出入国在留管理庁/総務省 |

> 白書 PDF は各府省の公式サイトから取得し出典 URL を `selection.sourceUrl` に記録する
> (`.claude/rules/evidence-based-judgment.md`: 出典 URL + アクセス日を必須)。

## 運用メモ

- 白書は**引用付き回答だけ**受け取り、PDF 全文をコンテキストに載せない (トークン節約)。
- 認証期限切れ (cross-query 終了コード 2) のときは `notebooklm` CLI の再認証が必要。
- 1 テーマ 1 ノートブックが基本だが、横断白書 (「最新の白書」) は複数テーマで共用してよい。

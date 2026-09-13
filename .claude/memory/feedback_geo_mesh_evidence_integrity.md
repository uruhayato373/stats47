---
name: feedback_geo_mesh_evidence_integrity
description: Geo分析の途中地図は、メッシュコード由来の境界・実際に判定へ寄与する点・丸め前の保存則で検証する。都道府県bboxと表示値だけでは離島や境界で誤る
type: feedback
---

**問題**: 1km人口メッシュ×駅800m分析の途中地図で、離島メッシュのポリゴンが潰れ、東京都の表示対象駅に関東本土の駅が混入した。また、メッシュ単位の表示値を先に丸めると都道府県集計との保存則が1人ずれた。

**原因**: 入力TopoJSONの一部geometryだけを境界の正典として扱い、駅候補を都道府県全体のbounding boxで切っていた。集計前に人口を整数化したため、表示用丸めが計算へ混入した。駅別乗降客数は説明に有用だが、800m到達判定の計算入力ではない。

**対策**: 8桁JIS地域メッシュコードから第三次メッシュ境界を決定的に復元する。駅は「少なくとも1メッシュの800m判定に寄与した点」だけをartifactへ残す。人口は丸め前の値で判定・集計し、丸めは表示時だけ行う。各分析manifestにlayer roleと`usedInCalculation`を持たせ、47県すべてで`inside + outside = total`を監査する。

**証拠**: `packages/gis/src/geo-analysis/geo-analysis-core.ts`、`packages/gis/src/geo-analysis/station-access.ts`、`packages/gis/src/geo-analysis/__tests__/mesh1000-bounds.test.ts`、`packages/gis/src/geo-analysis/__tests__/station-access.test.ts`、`.claude/rules/geo-analysis-standards.md`（2026-08-30）。

**原典属性の問題（2026-09-08）**: W09/05湖沼の形状は描画できても、湖名に置換文字が混入していた。

**原因**: CPGがない旧ShapefileをUTF-8として読み、従来のShift_JIS分岐もDBFを既定文字コードで読み直していた。形状・件数だけでは日本語属性の損傷を検出できない。

**対策・証拠**: `registry.ts`の`shapefileEncoding`を`downloader.ts`の初回DBF読取へ渡し、CP932の別名は`resolveShapefileEncoding`で正規化する。原典ZIPから再生成して556件と非文字属性の一致、湖名の置換文字不存在を実測。回帰検証は`packages/gis/src/mlit-ksj/__tests__/downloader-path.test.ts`と、選択ファイルのURL・属性・描画を照合する`apps/web/scripts/audit-geo-source-pages.ts`。規約は`.claude/rules/gis-data.md`。

**同日の別経路**: L01/26・L02/25では、設定された`UTF-8/`が原典ZIPになく、同梱GeoJSONを見落としてCPGなしDBFへ進んでいた。指定ディレクトリがなければ同梱の非Shift_JIS GeoJSONを探し、UTF-8を厳格検証して使用する。ZIP fixtureで日本語を含むフォールバック経路をテストし、原典の25,565/21,431地点から再生成して文字化け不存在を確認した。

**区域データでの追加確認（同日）**: A42/A43/A44は拡張子がGeoJSONでも本文がUTF-8でなかった。明示したDBF文字コードがある場合だけ同梱Shapefile全体へ切り替える回帰テストを追加。A38は文字化けで「道央」「道南」が同じ文字列になり、小島も既存の簡略化で潰れていたため、文字列置換・近傍地名・bbox推定で修復しない。原典Shapefileの行政コード・県名から各医療圏を47県へ再分割し、量子化なしで全地物を保持する `rebuild-medical-areas.ts` を正典とした。元の配布索引に欠けていたファイルも、SHA検証付きの再生成manifestから索引へ戻す。

---
name: feedback_geo_mesh_evidence_integrity
description: Geo分析の途中地図は、メッシュコード由来の境界・実際に判定へ寄与する点・丸め前の保存則で検証する。都道府県bboxと表示値だけでは離島や境界で誤る
type: feedback
---

**問題**: 1km人口メッシュ×駅800m分析の途中地図で、離島メッシュのポリゴンが潰れ、東京都の表示対象駅に関東本土の駅が混入した。また、メッシュ単位の表示値を先に丸めると都道府県集計との保存則が1人ずれた。

**原因**: 入力TopoJSONの一部geometryだけを境界の正典として扱い、駅候補を都道府県全体のbounding boxで切っていた。集計前に人口を整数化したため、表示用丸めが計算へ混入した。駅別乗降客数は説明に有用だが、800m到達判定の計算入力ではない。

**対策**: 8桁JIS地域メッシュコードから第三次メッシュ境界を決定的に復元する。駅は「少なくとも1メッシュの800m判定に寄与した点」だけをartifactへ残す。人口は丸め前の値で判定・集計し、丸めは表示時だけ行う。各分析manifestにlayer roleと`usedInCalculation`を持たせ、47県すべてで`inside + outside = total`を監査する。

**証拠**: `packages/gis/src/geo-analysis/geo-analysis-core.ts`、`packages/gis/src/geo-analysis/station-access.ts`、`packages/gis/src/geo-analysis/__tests__/mesh1000-bounds.test.ts`、`packages/gis/src/geo-analysis/__tests__/station-access.test.ts`、`.claude/rules/geo-analysis-standards.md`（2026-08-30）。

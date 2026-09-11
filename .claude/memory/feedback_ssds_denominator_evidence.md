---
name: feedback_ssds_denominator_evidence
description: SSDSの件・人unitを実数の根拠にしない。公式算式とsubtitle/labelで分母を確認する。
type: feedback
---

**問題**: 全テーマの構成見直しで、人口当たりの外国人人口・医療資源・刑法犯認知数を実数と説明する誤りが生じた。

**原因**: 配信 payload の unit が「人」「件」であることを実数の根拠にしていた。既存設計は分母を subtitle / label、unit を素の単位に分けている。公式 SSDS 算式では #A01601 は外国人人口/総人口×10万、#I0920101 は医師数/総人口×10万、#K06101 は認知件数/総人口×千。キーの per-* だけでも raw/率は判定できない。

**対策**: 指標の表示変更前に pinned cdCat01 と公式算式を照合する。分母は subtitle・shortLabel・章説明・chart label に保持し、unit の形式を理由に削らない。既に算式で正規化した率・指数・平均には汎用人口/面積の追加正規化を付けない。公式算式に基づく回帰テストで、率の分母が残ることと raw 系列を率へ変えないことを両方向で検証する。

**証拠**: 2026-09-08、`.claude/rules/unit-semantics-standards.md` §4、`packages/data-configs/src/theme-catalog/`、[e-Stat人口算式](https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/A)、[健康・医療算式](https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/I)、[安全算式](https://www.e-stat.go.jp/koumoku/sihyo_keisansiki/K)。

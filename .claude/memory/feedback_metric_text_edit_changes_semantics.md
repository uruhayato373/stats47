---
name: feedback-metric-text-edit-changes-semantics
description: 指標定義の subtitle・description の文言を変えると、分母と期間の判定 (classifyMetric) が黙って変わる。直す前後で判定を比べ、packages/ranking のテストも流す (2026-11-24 に 24 指標で崩れた)
metadata:
  node_type: memory
  type: feedback
  originSessionId: fae2ff18-38cc-41cf-a1d4-da5ca88aed81
  modified: 2026-11-24T11:35:23.978Z
---

指標定義 (`data/metrics/*.ts`) の `title`・`subtitle`・`description` は表示の文言であると同時に、`packages/data-configs/src/display-semantics/index.ts` の `classifyMetric` が「当たり」「年平均1か月」「年間」などの語で分母 (rate / total / unknown) と期間を決める入力でもある。

**事象 (2026-11-24)**: 家計調査の 25 指標の subtitle から調査方法の定型文を外したとき (a3c942343)、同じ文にあった「1世帯当たり」「年平均1か月」も消え、24 指標の判定が変わった (支出額・貯蓄負債は rate → unknown、構成比は monthly → null)。サブエージェントは data-configs の vitest と validate:config だけを流して通し、`packages/ranking` の `build-ranking-item-from-metric.test.ts` の 11 件の失敗に気づかないまま develop へ push された。

**Why:** 文言の整理は見た目の変更に見えるが、正規化の選択肢・単位の扱い・記事の定義シートが同じ語を読んでいる。検査が文言の印に頼っている限り、印を消すと判定が変わる。

**How to apply:**
- 指標定義の文言を一括で変えるときは、変更前 (`git archive <sha>^ data/metrics`) と変更後で `classifyMetric` の `basis`・`period` を比べ、変わる指標が 0 件であることを確かめる。印を subtitle から外すなら description へ移す。
- 指標定義を変えたら `packages/data-configs` に加えて `packages/ranking` の vitest も流す。サブエージェントに指標定義を触らせるときは、この 2 つを完了条件に書く。
- 関連: [[feedback-metric-display-state]]

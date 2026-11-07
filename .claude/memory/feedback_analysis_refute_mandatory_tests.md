---
name: feedback-analysis-refute-mandatory-tests
description: 反証の指示は「確かめる」では効かない。手順を書いた必須試験にすると、作り直す前の M01 の誤りを Codex が検出した
metadata:
  type: feedback
---

問いの分析の反証は、観点を並べるだけでは効かず、計算の手順まで書いた必須試験にする。

**Why:** 2026-11-07 に作り直す前の M01 の結論へ反証を掛けた。「全体の割合を一部の町の答えにしていないか」と書いた版は weak が並ぶだけで、段ごとの差も裾切りも検出しなかった。「段に分けて隣の差を要素に分ける」「定義を読み、その要素を使わない組み替えで残るかを計算する」と手順で書いた版は、段の試験を broken、測定の試験を weak にした。
**How to apply:** 新しい誤りの型が見つかったら `.claude/scripts/analysis/prompts/refute.md` に手順つきの試験として足し、誤った結論の fixture で検出できることを確かめる。[[project_ai_content_headless_claude_batch]] と同じく、審査の PASS は機械の床として扱う。

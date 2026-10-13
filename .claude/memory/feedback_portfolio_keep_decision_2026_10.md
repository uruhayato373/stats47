---
name: feedback_portfolio_keep_decision_2026_10
description: 2026-10-11 オーナー判断。SNS・Remotion、テーマ/Geo/調査、商品ファクトリーは流入・収益が小さくても継続する。流入シェアだけで系統の撤退を提案しない
metadata:
  type: feedback
---

2026-10-11 の簡素化監査で「W40 GSC クリックの 97% が blog/ranking/areas/municipalities、SNS 由来セッション 0.4%、商品売上 ¥0」を根拠に 4 系統の停止を提案したが、オーナーは SNS・Remotion を「残す」と明言し、テーマ/Geo/調査と商品ファクトリーも継続を選んだ。止めると決めた「残置パッケージ」も、実測すると area・category・station-passengers・migration-flow は web と Remotion が使っており、apps/ges は SNS 動画の道具、packages/database は web のテスト基盤 (CLAUDE.md が残置可と明記) で、消せるものは無かった。

**Why:** 流入シェアや直近の収益は計測が止まっている系統ほど小さく出る (商品は認証切れで判定不能、SNS は 10K 戦略の途中)。オーナーは系統の継続を短期の数字だけで決めない。

**How to apply:** 簡素化は「系統の撤退」ではなく、系統の中の未使用依存・死んだ台帳・誤報する検査・失敗し続ける workflow の是正で進める。系統の停止を提案するときは、計測が止まっていないことと、package/skill を消す前に importer を全 workspace で数えた結果を先に示す。「参照が少ない」を行数や agent からの参照数で判断しない。関連: [[project_sns_10k_roadmap]] [[project_monetization_contract]]

---
name: feedback_no_feature_specific_components
description: 「〇〇専用の部品」は作らない・残さない。同じ役割はランキング等の既存の部品を 1 つだけ使い、使われない部品は消す (2026-10-30 オーナー指示)
metadata:
  node_type: memory
  type: feedback
  originSessionId: dc8df5f2-4696-45c2-be9c-3bf1dbb0b505
  modified: 2026-10-30T07:39:22.812Z
---

ページや feature ごとの「専用の部品」という考え方をやめる。同じ役割 (地図と表・数値タイル・記事カードなど) は 1 つの部品を全ページで使い、
違いは部品の設定 (題名・強調する県など最小の口) で吸収する。使われていない部品・死んだ経路は残さずに消す。

**Why:** 2026-10-30、テーマの「都道府県の分布」がテーマ専用の地図と表で描かれ、ランキングと凡例の丸め方までずれていた。
共通化したあと「専用の部品は別の画面が使うので残した」と報告したら、オーナーが「専用の部品という考え方はやめてほしい」
「不要なコンポーネントも全て削除」と指示した。

**How to apply:** 新しい UI を作る前に既存の部品 (部品の台帳 `data/design/components.json`・`@/features/ranking/widgets` など) で
満たせるか探す。共通化したら旧部品はその場で消し、`npx knip --workspace apps/web --include files` で未使用ファイルが 0 になるまで繰り返す
(OGP の画像生成スクリプトから使う `features/ogp/*` は knip の入口外なので誤検知。名前で全リポジトリを検索してから消す)。
関連: [[feedback_page_semantic_dedup_contract]]

2026-11-03 の再発: テーマの品目の表を `MetricTableCard` として専用に作り、card-census に止められて名前を `MetricTable` に変えただけで通そうとした。
同じ役割の表 (1 つの地域の指標を値と順位で並べる) が市区町村データブックに直書きであった。名前で検査を避けず、作る前に
「同じ役割の表・タイル・枠がどこかにないか」を grep (`<Table`・`StatTile`・`*Card`) で探し、あれば共通の層へ上げて両方を寄せる (`MetricRowTable`)。

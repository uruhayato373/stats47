---
slug: cc-estat-18-cache-r2
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-13
---
## 評価サマリ
Claude Code 連載 Part 18 の技術解説記事。「e-Stat 直叩きが月10万PVで約27時間 API に張り付く」という具体的な痛点を冒頭で提示し、R2 キャッシュ・URL 単位の JSON 分割・命名規約・isolate 落とし穴・ETag/Cache-Control まで一貫した設計ストーリーで回収しており、読者価値が床を明確に超えている。人口データの上位5・下位5チャートは「キャッシュする JSON の中身」「rank と value を両方持たせる理由」という設計上の論点に直結しており、装飾でも水増しでもない。コードブロックは prompt 例・exporter 実装・reader アンチパターンと正パターンを対比して提示し、各 Step に「なぜそうするか」の解釈段落が厚く付いている。文体は全文ですます調で統一、数値は data/*.json と完全整合、title/seoTitle に NG_PATTERN なし。技術記事として完成度が高い。

## 指摘
- [minor] storage-cost.svg（line 56）直下に source-link が無いが、これはコスト比較チャートでありランキングではないため /ranking source-link は不要で妥当。同セクション内（line 58）に /category/ict をインライン配置済みで回遊性は確保されている。修正不要。
- [minor] `archetype: A`（単一指標深掘り）と宣言されているが実体は技術チュートリアルで、A 型の「なぜ上位/下位か」必須視点とは構造が異なる。ただし連載技術記事という性質上 A-E のどれにも厳密には当てはまらず、人口チャート部分では地理的集中の説明（戦後の産業集積・通勤圏）を入れて A 型視点を部分的に満たしている。実害なし。
- [minor] 数値検証はすべて整合（東京1,346万/神奈川894万/鳥取53万/福井72万、1-2位差約450万、43-47位差約19万、月27時間=100,000秒、S3 egress \$0.90、上位5県は下位5県合計の14.1倍で「大きく上回る」妥当）。data/storage-cost.json の \$1.13/\$1.00/\$0.00 も本文と一致。矛盾なし。

## 判定理由
文体崩壊（常体混在）なし: である調 copula 0 件、動詞終止形の常体も 0 件で全文ですます調。数値/集計矛盾なし: 本文の全数値・順位・倍率・集計主張が data/japanese-population.json および storage-cost.json と完全整合。title NG_PATTERN 残存なし: bare「N位」・「X倍格差」連結いずれも不在で、curiosity gap 型タイトル（月27時間の壁）が本文で完全回収されている。図表重複・水増しなし: 2 図とも設計上の論点に load-bearing で、prose ~8,378字/2図=約4,189字/図と図あたり字数の床を大きく上回る。markdown 表 0、callout 3（NOTE/WARNING/TIP、いずれも記事固有の読み違い防止知識）、内部リンク 4、H2 13。重大欠陥が無く読者価値が床を超えるため PASS。

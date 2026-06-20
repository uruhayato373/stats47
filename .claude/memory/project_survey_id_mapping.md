---
name: ranking_items survey_id マッピング状況
description: ranking_items の survey_id 修正履歴と残りの ssds 172件の内訳。2026-03-13 に533件を一括修正済み。
type: project
---

## 修正済み（2026-03-13）

533件を一括修正:
- soumu 10件: local-finance → local-public-employee-salary
- NULL 32件: cdCat01 プレフィックスから census/ssds に振り分け
- ssds 491件: # prefix / non-# prefix から具体的調査名にマッピング

## 残り ssds 172件の内訳

固有の調査名に直接対応しないため ssds のまま残留:

| prefix | 件数 | 内容 |
|---|---|---|
| #B01 | 9 | 自然環境（面積・土地） |
| #G01〜#G05 | 22 | 文化・スポーツ施設、旅行 |
| #J01〜#J06 | 50 | 福祉・社会保障施設 |
| #K01〜#K03 | 13 | 消防・火災 |
| #K05,#K07〜#K10 | 22 | 警察官数・災害・保険 |
| B1,B2,B4 | 25 | 自然環境・気象 |
| C6 | 1 | 売上金額 |
| (null cdCat01) | 4 | 将来推計人口等（ipss由来） |
| その他残余 | 26 | 上記に該当しない分 |

## 未対応

- ipss 2件（future-population, future-population-change-rate-2050）: surveys に「国立社会保障・人口問題研究所」を新規登録すれば修正可能

---
slug: prefecture-salary-gap-career
reviewer: blog-critic
mode: expert
verdict: PASS
date: 2026-06-21
---

## 評価サマリ

「全国平均は当てにならない」という読者の素朴な疑問を、職種×県の相場差（最大2.65倍）で具体化し、転職時の打ち手（県選びのレバレッジ）まで落とし込んだ読者価値の高いアーキタイプD記事です。前回 REVISE の唯一の BLOCK だった SVG データ系譜（.source.json）が両図とも整備され（kind/rankingKey/year/source/restore/upstream + verifiedMatchRate 100 を完備）、quality-gate.mjs は pass:true・blockers:[]・svgLineageMissing:0・svgSizeViolations:0 を返します。本文の全数値・順位・倍率は data/*.json および SVG テキストと完全一致し、倍率計算（1.51/2.65/2.54/1.52/1.33）も検算で一致しました。図あたり解釈2,134字と厚く、callout 4個はいずれも独立した価値（額面定義・母数ぶれ警告・レバレッジ示唆・無料の仕組み＋PR明示）を持ち、ですます調も一貫しています。読者価値・機械フロアともに公開水準に達したため PASS とします。

## 指摘

- [解消] (旧BLOCK) SVG データ系譜欠落 → software-engineer-rankings.source.json / salary-gap-by-job.source.json が整備済。quality-gate svgLineageMissing:0、blocker なし。
- [解消] (旧MINOR) 薬剤師・介護職員の県内訳が本文未記載 → 本文に「薬剤師1.52倍（広島706.0万円・徳島463.7万円）」「介護職員1.33倍（広島411.3万円・大分308.6万円）」を追記済で、図と本文の情報量が揃った。
- [MINOR] システムコンサル1位「秋田952.5万」は母数が小さく外れ値の可能性が高い旨を本文・WARNING・ランキング誘導で適切にヘッジ済み（図単体では伝わらないが本文で補足）。改善は任意・公開ブロックではない。

## 判定理由

意味品質（curiosity gap の真正性・図あたり解釈の厚み・callout の情報量・ですます調の一貫性・内部リンクの妥当性・アーキタイプDの必須視点=内訳分解＋生活含意・数値の事実整合）はすべて充足。前回 REVISE の根拠だった BLOCK（SVG データ系譜欠落）は3点セット整備で解消され、quality-gate.mjs が pass:true を返すため公開を構造的にブロックする要因はありません。残る MINOR 1件は任意改善であり、公開の必須条件を満たすため PASS に更新します。

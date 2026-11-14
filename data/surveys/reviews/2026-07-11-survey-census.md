---
type: seo-audit
date: 2026-07-11
status: completed
tags: [survey, census, seo, content-cluster]
---

# 国勢調査コンテンツクラスター監査・実装結果

> 2026-07-13 に旧レビュー保管場所から本skill referenceへ移設・改名
> (survey ポートフォリオ運用の .claude 一本化)。本書は監査日付時点の証跡であり、最新状態の SSOT は
> `.claude/state/surveys/portfolio.json`、census 実験の台帳は `.claude/state/surveys/experiments.json`。

## 結論

`/survey/census` を初回実証対象に確定し、調査固有の編集情報とランキング導線を実装した。
国勢調査に属する配信ランキングは R2 `app/survey/census/items.json` で300件あり、未婚率、単独世帯、
高齢単身世帯、生産年齢人口、昼夜間人口の5論点はいずれも実在することを確認した。

対応する既存ブログ記事はローカルの公開ソース・下書きから確認できなかった。検索意図と根拠を監査せずに
薄い記事を追加することは戦略に反するため、今回の実装では記事を新規生成していない。

## 実装したもの

- `census` 専用の編集情報をgit TSで定義
- 「この調査で分かること」4項目
- 自然文の問いから実在rankingへ移動する5導線
- 母数、5年周期、因果解釈に関する注意3項目
- metadata descriptionをcensus固有の説明へ変更
- 定義のないsurveyは従来UIへフォールバック
- R2のsurvey master / items snapshotとranking↔survey導出は無変更

## 採用したランキング

| 問い                                   | rankingKey                                     |
| -------------------------------------- | ---------------------------------------------- |
| 30代前半男性の未婚率が高い都道府県は？ | `unmarried-ratio-male-30-34`                   |
| 一人暮らし世帯が多い都道府県は？       | `single-person-household-ratio`                |
| 高齢者の一人暮らしが多い都道府県は？   | `single-person-household-old-population-ratio` |
| 生産年齢人口の割合が高い都道府県は？   | `production-age-population-ratio`              |
| 昼間に人口が集まる都道府県は？         | `day-time-population-ratio`                    |

ページ描画時にも取得済みrankingKeyとの一致を確認し、R2側から対象が外れたリンクは表示しない。

## 検証

- `npx vitest run apps/web/src/features/survey/survey-editorial.test.ts`: 2 tests passed
- `npm run type-check --workspace apps/web`: passed
- `git diff --check`: passed
- フルbuild: 未実行（survey単一画面と型定義の小変更のため、規約に従い対象テスト＋type-checkを優先）
- 本番表示・GSC/GA4効果: 未検証（未デプロイのため）

## デプロイ後の測定

デプロイ後4〜8週で `/survey/census` の impressions、CTR、平均順位と、surveyからrankingへの内部遷移を確認する。
実装前baseline（GSC W27 snapshot、直近28日）は **23 impressions、0 clicks、CTR 0%、平均順位25.43**。
page filter付きGSC API（2026-06-12〜2026-07-09）で開示されたqueryは7 impressions分だった。

- `人口 ランキング`: 2 impressions / position 55
- `国勢調査 都道府県 人口`: 2 impressions / position 27.5
- `47都道府県 人口ランキング`: 1 impression / position 52
- `国勢調査人口`: 1 impression / position 33
- `都 道府県 人口 最新`: 1 impression / position 47

検索意図は未婚率ではなく、現状は「国勢調査を使った都道府県人口」の一般探索が中心。開示queryは総impressionsの
一部に限られるため、残りを推測で補完しない。

全surveyの相対優先順位は `../audits/2026-07-11-survey-portfolio-audit.md` を参照する。

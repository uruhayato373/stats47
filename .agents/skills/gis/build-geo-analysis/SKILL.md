---
name: build-geo-analysis
description: >
  Geo分析を入力レイヤーから県別途中artifact、空間演算、保存則、lineage manifest、最終aggregateまで生成・監査する。
  Use when user says "Geo分析を作る", "GIS掛け合わせ", "途中地図", "メッシュ分析", "人口×駅".
primary_agent: geo-analysis-curator
co_agents: [gis-curator, gis-pipeline-runner]
argument-hint: '[population-station-access]'
---

# build-geo-analysis

## フロー

`/fetch-mlit-ksj` → ★`/build-geo-analysis` → Web `/geo/<slug>` → `/operate-geo-content` → 明示時のみR2/公開

Geo分析を最終順位だけにせず、入力、途中地図、空間演算、検算、aggregateを再現可能なbundleにする。
数値・距離・交差・順位は決定的コードだけで計算し、モデルは説明文と限界の判断に限定する。

## 現在の対応分析

| slug                        | 入力                           | operation                                                 | context-only |
| --------------------------- | ------------------------------ | --------------------------------------------------------- | ------------ |
| `population-land-price`     | 1km将来人口 + L01地価地点      | 住宅地点の人口メッシュ包含判定→地価上昇×人口減少の地点割合 | なし         |
| `population-flood-risk`     | 1km将来人口 + A31b洪水ポリゴン | メッシュ中心点のポリゴン包含判定                          | なし         |
| `population-station-access` | 1km将来人口 + S12駅形状        | 駅代表点とメッシュ中心点の800m距離判定                    | 駅別乗降客数 |

地価は`pointMeshIds`と`land-price-mesh-join`段階を必須とする。旧県別併置bundleはWeb parserで拒否する。
地価だけの再生成は`npx tsx packages/gis/src/mlit-ksj/scripts/build-geo-cross-snapshots.ts --land-price-only`。
洪水だけの再生成は`npm run geo:build-flood-analysis`。河川区分10/20の両方を使い、
公式一覧・承認済み入力集合・manifest入力・source段階出力を完全一致で検査する。
ZIP内部の災害規模20と河川区分20を混同しない。旧片区分bundleはWeb parserで拒否する。
新設地点の前年比と未接続人口を0扱いせず、比較可能地点を分母にする。詳細はGeo分析標準を参照。

## 手順

1. `.claude/rules/geo-analysis-standards.md`と分析定義の`sourceLayers`を読む。
2. 各レイヤーの`role`と`usedInCalculation`、版、geometry、公式出典を照合する。
3. `license-policy.ts`で元データpublic mirrorと公開構造化artifactの両方を照合する。
   `non-commercial`/一部制限/未判定は、書面許諾IDまたは商用可ソースへの置換が無ければ停止する。
4. 原典が無ければ`gis-pipeline-runner`へ戻す。推測データや別年度で代替しない。
5. 県別途中artifactとmanifestを生成する。

   ```bash
   npm run geo:build-station-access
   ```

6. 生成コマンド内でSHA、bytes、47県coverage、重複ID、stage件数、保存則まで監査する。既存artifactだけを再監査する場合は次を使う。

   ```bash
   npm run geo:audit-analysis
   npm run type-check --workspace packages/gis
   npm run test:run --workspace packages/gis -- src/geo-analysis/__tests__/station-access.test.ts
   ```

7. Web parser/type-check/testを通し、`/geo/<slug>?pref=13&stage=population`、`overlap`、`audit`をlocalhostで確認する。
8. 管理画面`/strategy`で計算入力、補助レイヤー、47県artifact、保存則を確認する。
9. R2反映は検証結果とexact keyを提示して`r2-publisher`へ委譲する。本skillから直接pushしない。
10. SNSはmanifest合格後だけ`/operate-geo-content`へ渡す。

## 出力契約

- aggregate: `.local/r2/app/geo/<slug>/item.json`
- lineage: `.local/r2/app/geo/<slug>/manifest.json`
- details: `.local/r2/app/geo/<slug>/pref/<NN>.json`
- site: X着地=`/geo/<slug>/<NN>/population|overlap|audit`、ページ内共有=`/geo/<slug>?pref=<NN>&stage=...`

## 停止条件

- calculation inputが2層未満
- context-onlyが計算へ混入
- 47県の欠損、重複、座標異常、artifact上限超過
- detailとaggregateの件数・人口・比率が不一致
- manifestまたはcanonical着地が無い
- source mirrorまたは公開構造化artifactのライセンスが未許可

## Output Contract

`Analysis | Inputs/context | Stages | Coverage | Conservation | Artifact bytes | Site | R2/deploy status`
の1表で返す。未実行のgateをPASSと報告しない。

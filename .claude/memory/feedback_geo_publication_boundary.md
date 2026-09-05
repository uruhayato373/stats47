---
name: feedback_geo_publication_boundary
description: Geo公開集合はbaselineを含めず、2計算入力層・細粒度geometry・snapshot/manifest/県別artifactを機械ゲートする
type: feedback
---

**洪水入力の追加教訓（2026-09-05）**: 保存則47/47でも入力完全性は保証しない。
ZIP名の河川区分20とZIP内部の想定最大規模20を混同し、区分10の全107入力を落としていた。
`flood-inputs.ts`で公式一覧の承認済み集合を固定し、生成・監査・Web parserで欠落と同件数差替を拒否する。
原典キーは`source/{riverClass}/{mesh}.zip`へ分離し、重複区域の人口は和集合で1回だけ数える。
全量回収で巨大GeoJSONのJSON.parseが2GBヒープを超えたため、`flood-source-reader.ts`で逐次解析する。
証拠: 同名の入力集合・包含・逐次解析の各回帰テストと`.claude/rules/geo-analysis-standards.md`。

**配信の教訓（2026-09-05）**: ローカル生成、原典R2保存、分析bundle切替、コードdeploy、派生媒体の更新は別の状態。
201原典の保存成功だけでは、旧94入力の集計を配信するサイトや予約済みXは更新されない。
`publish-geo-portfolio`の媒体別gateで、exact keyのSHA読戻し、canonicalの実応答、Xの実本文・画像・予約日時、
noteの価格・有料境界・ZIPの版をそれぞれ確認する。原典取得日時が残らない旧入力は未記録と明記し、生成日から推定しない。
商品は未コミット生成コードを公開済みrevisionと扱わず、`products:geo:validate`で配布を拒否する。

**問題**: `/geo/2050-population`が、単一指標の都道府県コロプレスと順位比較だけをGeo分析として公開していた。Geoハブとテーマ導線もこのbaselineを空間分析の1件として数え、ランキングページと責務が重複した。

**原因**: データ定義は`analysisKind: 'baseline'`と正しく分類していたが、`BUSINESS_PLAN_M1_GEO_ANALYSES`がbaselineとspatial-crossを同じ配列に保持し、公開UIが全件を無条件に列挙していた。さらにbaselineだけ専用static routeを持ち、snapshot・lineage manifest・県別途中artifactを必須にする共通Geo routeを迂回していた。当時の受入条件も「地図・上位下位・県比較」を完了条件にしており、空間演算の有無を検証していなかった。

**対策**: Geo公開用`BUSINESS_PLAN_M1_GEO_ANALYSES`はspatial-crossだけを保持し、baselineを含む全系列は別の`BUSINESS_PLAN_M1_ANALYSES`で管理する。validatorとunit testで、Geo公開対象に計算入力2層以上、都道府県より細かいgeometry、R2 snapshot、evidence manifest、47県別artifact契約を要求する。単一指標baselineのcanonicalはランキングとし、旧Geo URLはUTMを保持して301する。ハブ・テーマ・関連分析はGeo公開集合だけから生成する。

**証拠**: `packages/data-configs/src/business-plan/m1.ts`、`packages/data-configs/scripts/validate-business-plan.ts`、`packages/data-configs/src/business-plan/__tests__/catalog.test.ts`、`apps/web/src/app/geo/page.tsx`、`apps/web/src/middleware.ts`、`.claude/rules/geo-analysis-standards.md`（2026-09-05）。

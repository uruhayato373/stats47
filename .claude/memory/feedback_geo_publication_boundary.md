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

**実操作の教訓（2026-09-05）**: HTTP・型・unitの成功だけで地図操作を完了にしない。
Leafletはズーム直後のunmountで遅延callbackが破棄済みpaneへ触れた。私有APIでzoomを完了させる修正も
Canvas再描画の副作用を生んだため、公開optionでアニメーションだけを止め、ズーム・ドラッグを維持した。
受入では47県の切替、各段階、mobile/desktop、ズーム直後の検算切替、描画完了後のタイルとbrowser例外を実測する。
note商品添付は無料説明文中の同名言及へ誤着地し得るため、完全一致する一意H2とDOM順序で検証する。
一時保存で有料境界が保持されると推定せず、再読込で確かめる。保持されない場合は、公開する同じセッションで
境界を再設定し、スクリーンショットを目視してから確定する。担当者は`publish-note/references/scheduling.md`
の更新済み運用規則に従い、agentによる目視確認後の確定も可能。旧human-only記述だけで未完了に戻さない。

**ライセンス再公開の教訓（2026-09-05）**: 生成時gateだけでは、旧ローカルstagingを汎用publisherで再公開できた。
diff/exact/wranglerで全候補をPUT前に`ksj-publication-guard.ts`へ通す。元GISと派生JSONの可否は既存license SSOTから
導出し、混在バッチは1件もPUTしない。証拠はguardとexact publisherの回帰テスト。
GISのrankingConfigだけでなく全metricの実sourceを走査する（別系列の漁港を含め旧対象11本）。
商用一次資料への置換後も同じkeyには旧stagingが残るため、現config recipe・原典SHA・版日付・47県・全国合計を検査する。
公開禁止原典の撤去後にカタログが「不足」と再取得を促さないことも回帰テストする。
公開終了後の復活を防ぐ対象は観測値だけでなくranking画像・全国派生・相関の専用keyも含む。
画像bundle専用publisherも同じgateをlock取得前に通し、混在planはPUTゼロで止める。
撤去は原本backupのexact key/size/ETagを固定してから行い、共有一覧・逆向き相関は無関係レコードを保持する。

**画像の出典・実描画（2026-09-06）**: 新版itemの出典は`sourceConfig.source.name`を優先する。
旧`source`だけを読むと国交省・水産庁の資料をe-Statと誤表示する。さらに画像生成用tsconfigの
includeがscriptsだけだと輸入したOGP TSXへautomatic JSX設定が適用されず、React未定義で
タイトルだけのfallbackになることがある。OGP componentもincludeし、通常描画・出典表示を確認する。

**原典の母集団・時点（2026-09-06）**: `port-count`の旧699件は、2010–2023年を含む甲乙種の
メタを港コードだけで重複排除した数だった。同コードが別港を指す7組があり、表示年2024も固定値だった。
表を跨ぐコード同一性や、有値行の存在を単年の指定対象と推定しない。施行日付き公式指定一覧を使い、
甲乙別の件数・全国合計・県別合計・共同港の公式帰属を別々に検査する。調査対象港と全国の全港湾を
名称で区別し、定義変更前の系列は新しい年へ接続しない。原典はe-Gov港湾調査規則別表と国交省みなと一覧。

**出典カタログの教訓（2026-09-05）**: 固定パスのR2依存pageは`revalidate`だけでは静的生成を防げない。
ローカルでは出典が読めても、CIではnullの代替表示が焼き付いてHTTP200のまま本番に残り得る。
`/geo/data-catalog`をpage単位の`force-dynamic`とし、既存R2-route SSG guardで静的化への後退を拒否する。
公開検証はstatus/canonicalに加え、3分析の出典・版・ライセンス表示と欠損メッセージ不在を確認する。

**出典の接続後の整合（2026-09-06）**: 辞書訂正でIPSSのactive2指標が調査へ接続すると、
それまでactive0を前提にしていたsurvey本文の問いが不足する。接続だけで完了にせず、実在する
active指標へのreaderQuestionsと対象年の説明を更新し、`build-survey-portfolio.ts`で派生件数を再生成する。
`survey-editorial-validator.test.ts`は本文の不足とportfolioのdriftを別々に拒否する。閾値を緩めない。

**削除直前の集合検査（2026-09-06）**: 退避した125キーをHEADで再確認するだけでは、
その後追加されたAI解説1件を検出できない。`listLicenseRetentionObjects`で対象prefixを全列挙し、
`assertUnchangedRetentionInventory`で集合・size・ETagを照合してから削除する。既存125件が不変でも
126件に増えていればバッチ全体を停止し、追加を退避して承認境界を再確認する。孤立した追加1件を
黙って残して「撤去完了」とせず、許可集合を広げて通過させることもしない。

**共有索引の公開後検証（2026-09-06）**: 専用assetが全件一致していても、後続writerの
`app/blog/all.json`更新で終了記事や旧surveyIdsが戻ることがある。SHA差を「別記事の正常更新」と
推測せず、現行S3と公開bodyの一致・終了slug不在・対象記事の出典を意味検証する。修復では現在の
一覧を退避し、canonical resolverによる出典再計算と終了slug除外だけをCASで反映する。
別記事の更新日・行を保持し、旧一覧を丸ごと復元しない。writer未特定・再発防止未検証は残件にする。

**共有索引の生成基底（2026-09-06）**: 巻き戻りの実行元は`blog-auto-publish.yml` run34002167867。
修正前checkoutが共有一覧を再生成し、生成時刻00:53:34と保存した不具合bodyの時刻が一致した。
PUT直前のHEADだけを条件にしても、生成後の別更新は検出できない。生成器・出典辞書のfingerprintと
生成時R2の内容hashをsnapshotへ焼き、`blog-publication-guard.ts`で終了slug・基底一致・ETag条件を検査する。
旧stagingへ印だけ後付けしない。guardを持たない旧checkoutは保護できないため、mainだけでなく
developを読む公開workflowにも変更を届け、競合時は最新R2から再生成する。

**問題**: `/geo/2050-population`が、単一指標の都道府県コロプレスと順位比較だけをGeo分析として公開していた。Geoハブとテーマ導線もこのbaselineを空間分析の1件として数え、ランキングページと責務が重複した。

**原因**: データ定義は`analysisKind: 'baseline'`と正しく分類していたが、`BUSINESS_PLAN_M1_GEO_ANALYSES`がbaselineとspatial-crossを同じ配列に保持し、公開UIが全件を無条件に列挙していた。さらにbaselineだけ専用static routeを持ち、snapshot・lineage manifest・県別途中artifactを必須にする共通Geo routeを迂回していた。当時の受入条件も「地図・上位下位・県比較」を完了条件にしており、空間演算の有無を検証していなかった。

**対策**: Geo公開用`BUSINESS_PLAN_M1_GEO_ANALYSES`はspatial-crossだけを保持し、baselineを含む全系列は別の`BUSINESS_PLAN_M1_ANALYSES`で管理する。validatorとunit testで、Geo公開対象に計算入力2層以上、都道府県より細かいgeometry、R2 snapshot、evidence manifest、47県別artifact契約を要求する。単一指標baselineのcanonicalはランキングとし、旧Geo URLはUTMを保持して301する。ハブ・テーマ・関連分析はGeo公開集合だけから生成する。

**証拠**: `packages/data-configs/src/business-plan/m1.ts`、`packages/data-configs/scripts/validate-business-plan.ts`、`packages/data-configs/src/business-plan/__tests__/catalog.test.ts`、`apps/web/src/app/geo/page.tsx`、`apps/web/src/middleware.ts`、`.claude/rules/geo-analysis-standards.md`（2026-09-05）。

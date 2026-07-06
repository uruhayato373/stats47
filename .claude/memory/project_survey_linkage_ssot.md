---
name: project_survey_linkage_ssot
description: "ranking↔統計調査(survey)紐付けSSOT再設計(2026-07-06 PR#535)。/survey空prerender固着解消、サイドバーを出典調査のみに、item.jsonにsurveyIds焼き込み、orphan調査8件削除、継続管理agent+skill"
metadata: 
  node_type: memory
  type: project
  originSessionId: fe123946-90e4-4044-aa73-e28061792715
---

ranking ↔ 統計調査 (survey) 紐付けの SSOT 再設計 (feature/survey-linkage-redesign, 2026-07-06 PR#535 マージ・本番稼働確認済)。

## 直した2症状 (本番実測で解消確認)
- **/survey が空ページ (調査リンク0件)**: build時にR2読めず空prerender→ISR効かず永久固着 (nextjs-ssg-preservation の既知パターン)。
  → `app/survey/page.tsx` に `force-dynamic` + all.json に itemCount 焼き込みで1 fetch化。本番で調査74件表示に。
- **サイドバーに全41調査の先頭5件が無関係表示**: `load-ranking-page-model.ts` が readSurveysFromR2() 全件を渡していた + item の surveyId 全null。
  → config.source から機械導出した「この統計の出典調査」1-2件のみ表示に。annual-sunshine-duration→気象統計 のみ。

## SSOT 設計 (辞書導出が既定)
- 紐付けは config.source から provenance 辞書で**決定的導出** (metrics 2,124件を backfill しない、88.9%機械導出)。
  導出優先: `config.surveyId`(手動オーバーライド) > 辞書導出 > 空(未分類=非表示)。
- 導出実装 `resolveSurveyLinkage` (`packages/ranking/src/builders/build-ranking-item-from-metric.ts`)。
  item.json に `surveyIds: string[]`(SSDS複数調査対応) + `originalSurveys: {id,name}[]` を焼き込み。
- surveys マスタ SSOT = `packages/ranking/src/data/surveys.json`。導出辞書 = ssds-provenance/estat-provenance.generated.json。
- R2反映は順序厳守: generate-ranking-items (item.json) → export-master-snapshots (survey items.json/all.json)。逆だとmaster がstale item読む。

## orphan 削除 + 継続管理
- items 0件の調査8件を物理削除 (83→75、擬似調査ssds含む、git履歴で復活可)。未分類241件はフォールバック作らず非表示。
- 継続管理: rules `.claude/rules/survey-linkage-standards.md` (正典) + agent `survey-curator` + skill `/audit-survey-linkage`
  (本番生成と同一導出コードで監査・乖離ゼロ)。未分類回収は「provenance辞書に statsDataId追記→再監査」ループ。
- validate:config に「config.surveyId が surveys.json 実在」lint 追加。
- ★時限バグも解消: 2026-06-07 に surveyId 全null化しており、次に master exporter を回すと kakei-chousa 675件等のバケットが全滅する寸前だった。

[[project_ranking_publish_pipeline_gap]] [[feedback_generatestaticparams_r2_notfound_stuck]] [[project_survey_id_mapping]]

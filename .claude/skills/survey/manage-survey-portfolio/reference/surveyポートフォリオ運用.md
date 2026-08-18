---
type: implementation-plan
date: 2026-07-13
status: active
tags: [survey, portfolio, agent, governance]
---

# survey ポートフォリオ運用 (survey-curator 拡張設計)

75 survey を「紐付けメタの管理対象」から一歩進め、**surveys.json を SSOT としたまま、survey ごとの
検索需要 (GSC)・流入 (GA4)・ランキング在庫・編集品質を継続計測し、編集ハブ化する survey の選別と
実験の効果測定を回す**ための運用設計書。**新規 agent は作らず、既存 `survey-curator` を survey
ポートフォリオの単一オーナーへ拡張する** (オーナー指示 2026-07-13)。state
`.claude/state/surveys/{portfolio,experiments}.json` を新設する。

> **正典の役割分担**: ranking↔survey **紐付け**の SSOT 構造・導出優先順位・禁止事項は
> `.claude/rules/survey-linkage-standards.md`、survey ハブの**編集文法**・構成・横展開判定は
> `.claude/rules/survey-content-standards.md` が持つ (どちらも変更しない)。本書はそれらを**回すための
> 計測・判定・記録レイヤ** (ポートフォリオ管理) だけを新設し、既存正典を重複定義しない。
> 前例パターン = theme-portfolio-manager (`.claude/skills/theme/manage-theme-portfolio/reference/テーマポートフォリオ運用.md`)。

---

## 1. PR-0 監査結果 (2026-07-13)

### 1.1 既存機能との重複マップ

| 提案責務 | 既存の担い手 | 重複度 | 判定 |
|---|---|---|---|
| surveys.json lifecycle / provenance 辞書監査 / 未分類回収 / orphan 検出 | **survey-curator + `/audit-survey-linkage`** (稼働中) | full | **変更しない**。portfolio は監査スクリプトの実測値を read するだけ (導出ロジックの別実装禁止) |
| survey-editorial.ts の編集品質管理 | **survey-curator** + `survey-content-standards.md` | full | 変更しない (editorialStatus として状態だけ台帳化) |
| survey 別の需要・在庫・編集状態の**状態台帳** | なし (docs/04 に単発監査 3 本のみ・状態管理なし) | none | **新設の中核** = portfolio.json |
| GSC・GA4 の /survey/* 別集計 | なし (週次 snapshot に行はあるが survey 集計なし) | none | PR-3 で集計スクリプト新設 (取得は gsc/ga4-analyst の既存 cron を read) |
| 改善実験の baseline・期日・verdict 管理 | なし (handoff 文書に census baseline が手書きされていた) | none | **新設の中核** = experiments.json |
| effect/* ラベル・改善バックログ | improvement-triage (排他 writer) | full | 引き渡しのみ (直接書かない) |
| 四半期監査レポート | なし | none | 新設 (reference/audits/) |

**結論: 新規 agent は作らない。** theme で新 agent を切った理由は「設計者 (theme-designer) に自己評価
させない」分離だったが、survey では (a) 編集ハブの効果判定は決定的 validator + GSC/GA4 実測 snapshot
(analyst が取得・survey-curator は read のみ) + improvement-triage の effect 排他で拘束される、
(b) 紐付け・編集・評価は既に survey-curator が単一オーナーであり分割すると境界が増えるだけ、のため
**既存 survey-curator の責務拡張**で足りる。

### 1.2 既存文書のカバレッジと空白

| 文書 | カバー済み | 空白 (本設計が埋める) |
|---|---|---|
| `survey-linkage-standards.md` | 紐付け SSOT・導出・監査・禁止事項 | 紐付け結果の時系列追跡 |
| `survey-content-standards.md` | 編集文法・ハブ構成・横展開の判定基準・禁止事項 | 「次にどの survey を編集ハブ化するか」の状態管理 |
| 旧 docs/04 監査 3 本 (2026-07-11) | 優先順位・census 実装・wage-structure 事前監査 | 単発証跡のみ → reference へ移設し evidenceRefs 化 (§1.4) |
| handoff `2026-07-11-survey-content-cluster.md` | census 実験の baseline 手書き | experiments.json へ移行して削除 (PR-2) |
| 旧 survey 別コンテンツクラスター計画 | — | **2026-07-12 に `.claude/rules/survey-content-standards.md` へ統合済・削除済**（旧版は Git 履歴。追加処置不要） |

空白 = ①全 survey の状態台帳 ②計測の継続追跡 ③実験の期日・重複管理 ④月次/四半期の監査ループ。

### 1.3 機械取得の現況 (2026-07-13 実測)

- **調査マスタ**: surveys.json **75 件**。**R2 `app/survey/all.json` は 74 件** —
  `population-projection` (監査導出で item 7 件) が R2 に無い。**= R2 master snapshot が stale**
  (surveys.json 追加後に `export-master-snapshots` 未実行)。是正は CI `sync-snapshots`
  (`ranking-items` → `master` の順) へ委譲 (本運用は R2 push をしない)。
  > **訂正 (2026-07-14)**: 上記「stale」は誤診。実態は 7 指標すべて isActive:false (未公開) で、
  > R2 は active のみ配信するため不在は**正常 (inactive-only)**。根治として監査に active/total 区別
  > (`perSurveyActive`) + `--compare-r2` (焼き込み実測突合) を追加、linkageStatus を 4 値化した。
  > 正典: `survey-linkage-standards.md` §監査の 2 層。
- **紐付け監査** (`audit-survey-linkage.ts --json`, 2026-07-13): metrics **2,235** / resolved **1,984
  (88.8%)** / unresolved **251** (estat-uncovered 56 / ssds-synthetic-only 134 / external 61)。
  辞書未カバー statsDataId **50** 件。**orphan 0 / config.surveyId 不正 0**。
- **item 在庫**: 上位 = kakei-chousa 694 / census 312 / population-estimates 219 / local-finance 133 /
  prefectural-settlement-survey 122 / social-life-basic-survey 99 / wage-structure-survey 76 /
  school-basic-survey 74。**item ≤ 3 の調査が 13 件** (hospital-report 2, minimum-wage 1 等) —
  編集ハブ化の除外条件「ranking 在庫がほぼない」に該当し得る層。
- **GSC 2026-W28 snapshot**: `/survey/` 行 **41 件**。トップ = wage-structure-survey (435 imp / 1 click /
  pos 10.13)。**GA4 2026-W28**: `/survey/` 行 **30 件**。→ PR-3 の集計素材は揃っている。
- **編集ハブ**: survey-editorial.ts に実装済みは **census のみ** (readerQuestions 5 件)。本番 live を
  実測確認 (2026-07-13 curl で「この調査で分かること」を検出)。デプロイ = PR #567 merge **2026-07-12**。
  wage-structure-survey は事前監査完了 (audit-ready)・未実装。残り 73 件は fallback。
- **drift 検出**: `survey-content-standards.md` は survey-editorial.ts に `relatedArticleSlugs[]` が
  あると記すが、**実装は summary / whatYouCanLearn / readerQuestions / caveats の 4 フィールドのみ**
  (2026-07-13 時点・census は関連記事 0 で未使用)。portfolio の `relatedArticleCount` はフィールド実装
  まで null とする。

### 1.4 旧surveyレビュー文書の棚卸しと処置 (2026-07-13 実施)

| 旧ファイル | 処置 | 継続利用箇所 |
|---|---|---|
| `2026-07-11-survey-portfolio-audit.md` | → `reference/audits/` へ移設 | 優先順位表 → portfolio.json の lifecycleStatus/editorialStatus 初期値の根拠 (evidenceRefs) |
| `2026-07-11-survey-census-cluster-audit.md` | → `reference/reviews/2026-07-11-survey-census.md` へ移設・改名 | census baseline (W27: 23imp/0clicks/pos25.43) → experiments.json SURVEY-EXP-001 |
| `2026-07-11-survey-wage-structure-audit.md` | → `reference/reviews/2026-07-11-survey-wage-structure-survey.md` へ移設・改名 | 実装時の受入条件・代表 5 ranking (audit-ready の根拠) |

- reviews/ の命名規則 = `YYYY-MM-DD-survey-<surveyId>.md` (builder が surveyId へ機械対応付けするため)。
- GSC/GA4 の過去 snapshot 値は運用ルール本文へ固定値として複製しない。skill referenceとstateの
  baselineだけが持ち、未完了策は `.claude/todo/` へ統合する。

---

## 2. アーキテクチャ (SSOT 分離)

```
packages/ranking/src/data/surveys.json               ← 調査マスタ SSOT (linkage-standards §1・不変)
survey-linkage-standards.md + provenance 辞書        ← 紐付け SSOT (resolveSurveyLinkage に一本化・不変)
apps/web/src/features/survey/survey-editorial.ts     ← 編集本文 SSOT (content-standards・不変)
.claude/state/surveys/portfolio.json                 ← survey 別評価 (派生・再構築可能・手編集禁止)
.claude/state/surveys/experiments.json               ← 改善実験台帳 (baseline / 期日 / verdict)
  ↑ 書き込み: survey-curator が builder スクリプト経由でのみ
.claude/skills/survey/manage-survey-portfolio/reference/  ← 運用設計 (本書) + reviews/ + audits/ (日付付き証跡)
.claude/todo/improvements.md                       ← 書き込みは improvement-triage のみ (不変)
```

- 計測値 (GSC/GA4) は **snapshot への参照 (`gscSnapshotRef` 等) + 集計値のコピー**を portfolio.json に
  持ち、surveys.json / survey-editorial.ts には一切書かない。
- portfolio.json は **surveys.json + 監査スクリプト + R2 all.json + survey-editorial.ts + 計測
  snapshot + レビュー文書から常に再構築できる派生物** (theme portfolio / blog remediation-queue と同思想)。

### 責務境界 (survey-curator は統括・実装は既存オーナー)

| 工程 | 担当 | survey-curator の関与 |
|---|---|---|
| 観測値投入 (metric config / e-Stat → R2) | data-ingester | 投入後の紐付け確認のみ |
| R2 push (item.json / master 再生成) | CI (sync-snapshots) / r2-publisher | 順序 (ranking-items → master) の段取り指示のみ |
| 公開パイプライン (KNOWN/SITEMAP/deploy) | ranking-publisher | 行わない |
| survey ページ UI 変更 | ranking-ui-manager | 行わない |
| GSC / GA4 snapshot 取得 | gsc-analyst / ga4-analyst (既存 cron) | read のみ (page filter query 等の追加取得は analyst へ依頼) |
| 改善バックログへの登録・effect/* 判定 | **improvement-triage (排他 writer)** | 所定形式で引き渡すのみ |
| 編集本文の執筆・紐付け是正 | survey-curator (従来責務) | 本人 (ポートフォリオ評価と同一 agent だが、効果判定は実測 + validator + triage が拘束) |

## 3. 判定規律 (state README `.claude/state/surveys/README.md` が schema 正典)

- 観測期間: **7 日 = インデックス/canonical/404/計測異常の検知のみ** (効果判定に使わない) /
  **28 日 = 暫定判定** / **56 日 = 基本判定**。
- **GSC impressions < 100 / 観測期間 なら CTR 効果を確定しない** (カウント値のみ保存可 = measured-low)。
  GA4 は pageViews < 100 / 観測期間 で同様。取得不能・未集計は insufficient-data、未計装
  (survey→ranking 内部遷移クリック等) は not-instrumented として保存し、推測値を入れない。
- **週次 snapshot は各週 last-28d 窓**のため、期間が重複する複数 snapshot を合算しない
  (56d = 非重複 2 窓の合算。2026-07-11 監査の訂正記録で実証済みの失敗パターン)。
- query 非開示分 (プライバシーしきい値) を推測で補完しない。
- 季節性 (例: 転入転出は 1-3 月需要) とサイト全体変動は experiments.json の `notes` に注記必須。
- merge-candidate / retire-candidate は **evidenceRefs ≥ 2 + GSC/GA4 両方の集計済み (measured |
  measured-low) かつ windowDays ≥ 56** が無いと validator が弾く (データ不足を需要不足と混同した
  廃止判定の機械的禁止)。

## 4. 編集ハブ化の選別基準 (candidate 判定)

**候補条件 (全て満たす)**:
1. 検索表示が観測されている (GSC で /survey/<id> に impressions 実測)
2. ranking 在庫が十分にある (目安: item ≥ 20。在庫だけでは採用しない)
3. 調査固有の検索意図がある (page filter query で実測 — 取得は gsc-analyst へ依頼)
4. 一次出典と注意点 (母数・定義・年次) を説明できる
5. 既存テーマ・ブログとの責務を分けられる (survey = 一次統計への入口 / blog = 解釈)
6. 薄い自動生成ページにならない (people-first)

**除外条件 (どれか該当で除外)**:
orphan survey / linkage 未解決が多い / ranking 在庫がほぼない (item ≤ 3) / 一次出典を確認できない /
他 survey との重複が大きい / 検索需要も内部利用も観測できない / **YMYL 領域 (医療系等) で品質監査が未完了**
(例: hospital-report・患者調査は監査完了まで candidate にしない)。

**75 survey を一括で AI 長文化しない。** 1 survey ずつ実証 → 効果確認 → 次へ (content-standards §横展開)。

## 5. improvement-triage への引き渡し形式

```markdown
### [SURVEY-<ID>-NN] <施策タイトル>
- survey: <surveyId> / 種別: <editorial-hub|linkage|title-meta|structure|計装>
- 根拠: <実測値 + snapshot ref + レビュー文書 ref>
- 想定効果: <定量 + 根拠> / 検証: <コマンド or snapshot 参照> / 期日: <YYYY-MM-DD>
- 実験: <experimentId (experiments.json に登録済み)>
```

## 6. 実装順 (PR 分割)

| PR | 内容 | 状態 |
|---|---|---|
| PR-0 | 既存監査・重複判定・全 survey 機械取得・docs/04 棚卸し・本設計書 | ✅ 本書 (2026-07-13) |
| PR-1 | survey-curator 拡張 / skill `manage-survey-portfolio` / state README + schema / builder + validator / agents README・自動化インベントリ更新 / audit-survey-linkage との役割分離明記 | ✅ 2026-07-13 |
| PR-2 | 75 survey の初期 portfolio.json 生成 (surveys.json × 監査 × R2 × editorial の決定的突合)・census 実験の experiments.json 登録・handoff 消化・初回監査 (reference/audits/2026-07-13) | ✅ 2026-07-13 |
| PR-3 | GSC/GA4 snapshot の /survey/* 集計 → baseline 保存 (非重複窓・不足は insufficient-data)・editorial 候補の根拠付き選定 | ✅ 2026-07-14 (`aggregate-survey-metrics.ts`。★56d = 非重複 2 窓 W24+W28。結果: 表示/流入あり 47/75。GSC measured 3/75 = wage-structure-survey 809imp / kakei-chousa 142 / natural-park-area 112、GA4 measured 0/75 (最大 kakei 90pv)。survey は現状ロングテールの入口面であることが実測で裏付き。natural-park-area は 2026-07-11 監査に無かった新シグナル → query 実測 (gsc-analyst) 後に candidate 判断) |
| PR-4 | 月次監査コマンド・実験 7/28/56 日判定・四半期ポートフォリオ監査・triage 引き渡し・CI (schema/drift/orphan/linkage のみ検証。本文生成・R2 push・deploy はしない) | ✅ 2026-07-14 (`run-survey-portfolio-audit.sh` = build→aggregate→validate→実験期日→drift / `evaluate-survey-experiments.mjs` (--check で期日到達分に 56d 実測を記録・--verdict で確定。d7 は異常検知のみ) / CI: pr-quality-check.yml **Survey Portfolio State Guard** = validator のみ実行) |

## 7. 成功条件

- [ ] surveys.json の全 75 survey が portfolio.json に一意に存在する (双方向一致)
- [ ] orphan / 未分類 / editorial 未実装を区別できる (linkageStatus / editorialStatus)
- [ ] survey-editorial.ts との drift を validator が検出できる
- [ ] GSC・GA4 の参照元 snapshot を追跡できる (gscSnapshotRef / ga4SnapshotRef)
- [ ] 同一 survey の重複実験を防止できる (surveyId × changeType の pending 一意)
- [ ] 最新状態は `.claude/state/surveys/` から確認でき、docs は履歴・証跡として扱われる
- [ ] audit-survey-linkage / validator / 対象テストが通る
- [ ] R2 push・deploy を行っていない

## 関連

- 紐付け正典: `.claude/rules/survey-linkage-standards.md` / 編集正典: `.claude/rules/survey-content-standards.md`
- agent: `.claude/agents/survey-curator.md` / skill: `.claude/skills/survey/manage-survey-portfolio/SKILL.md`
- state schema: `.claude/state/surveys/README.md`
- builder: `.claude/scripts/surveys/build-survey-portfolio.ts` / validator: `.claude/scripts/surveys/validate-survey-portfolio.ts`
- 紐付け監査 skill: `.claude/skills/db/audit-survey-linkage/SKILL.md` (紐付け層の是正はそちら)
- 前例パターン: theme-portfolio-manager (`.claude/skills/theme/manage-theme-portfolio/`)

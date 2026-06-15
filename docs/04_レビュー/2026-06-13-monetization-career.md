---
type: critical-review
topic: monetization
date: 2026-06-13
status: active
related_strategy: docs/00_プロジェクト管理/02_収益化戦略.md
related_masterplan: docs/02_実装計画/01_収益化マスタープラン.md
scope: 転職アフィリエイト特化
tags: [収益化, affiliate, 転職, career, 年収, ユニットエコノミクス]
---

# stats47 収益化戦略分析 — 転職アフィリエイト特化

> 本レビューは収益化マスタープラン (`docs/02_実装計画/01_収益化マスタープラン.md`、SSOT・Fable 改訂) の
> **判断5「アフィは文脈一致のみ / 属性(年収)→転職」** と **P2「高単価アフィ特化記事(転職×都道府県年収)」** を、
> 転職領域に限定して具体化した従属ドキュメント。Phase ゲート・全体数値目標は **マスタープランが優先**する。
> 本書はその中の「転職レーン」の実行詳細（クラスタ分割・単価別優先順位・記事供給・配置・計測）を扱う。

## 現状サマリー (2026-06-12〜13 実測)

| 指標 | 実測値 | 出典 |
|---|---|---|
| アフィリエイト収益 | ¥0 継続 | `.claude/state/ads/ga4-affiliate-2026-06-07.json` |
| アフィ在庫 / クリック | 68枠28社・28日で8クリック (CTR 0.107%) | `.claude/state/ads/inventory-latest.json` |
| アフィ計測ループ | **未稼働** (OAuth + GA4 custom dimension 未登録、人間タスク・期日 W25) | マスタープラン §9 |
| 転職系広告の登録 | STRATEGY CAREER (priority 80, blog-bottom)・af_labor_banner_001・af_agent_camp_labor_001 | `apps/web/scripts/affiliate-ads-data.ts` |
| 転職クリック計測 | `tracked-affiliate-link.tsx` で GA4 `affiliate_click` 実装済 (集計ループが未稼働なため値は ¥0/0件) | 同 features/ads |
| 賃金データ資産 | 賃金構造基本統計調査 `0003445758`・39職種 × 47都道府県 × 2020-2023 登録済 | `reference_estat_wage_survey` / data-configs |
| 年収ranking 流入 (W23) | school-teacher 227imp / 県別所得-gdp 196imp / police 152imp / 公務員給与 survey 359imp 等 | gsc snapshot 2026-W23 |
| 転職テーマ blog | 実質 `pharmacist-income-prefecture-gap` / `dentist-income` / `doctor-income` / `highschool-starting-salary-gap` 程度。**転職 framing の記事は未整備** | `.local/r2/app/blog/` |
| ASP 提携 (高単価転職) | 未申請 (人間タスク・P1 中) | マスタープラン §9 |

### 核心診断 4 点

1. **転職は stats47 で最も「単価×データ適合」が高い領域**。賃金構造基本統計調査の 39職種 × 47都道府県データは、
   競合 (todo-ran/uub) が持たない粒度。転職ASP の報酬単価 (無料登録 ¥1,500〜、医療専門職 ¥10,000〜) は
   AdSense RPM ¥50 の **30〜400 倍/件**。レバーは「トラフィック」ではなく「高単価×高intent×文脈配置」。
2. **勝てる土俵は head term ではなく `[職種]×[都道府県]` long-tail**。「看護師 年収」では大手転職メディアに負けるが、
   「看護師 年収 県別」「薬剤師 平均年収 [県]」は stats47 がデータで勝てる唯一の土俵。既存ガードレール
   (02 の「高単価アフィの SEO 勝負はやらない」) と矛盾しない — head term を避け 47都道府県 long-tail に限定する。
3. **医療・福祉専門職クラスタが最優先**。薬剤師 (¥10,000〜20,000/件)・看護師 (¥3,000〜5,000)・介護 (¥3,000〜10,000) の
   特化ASP は一般総合エージェント (¥1,500) の 2〜13 倍。stats47 は薬剤師/歯科/医師/介護の年収記事・ranking を **既に保有**。
   ここに転職 framing と文脈CTA・高単価ASP を載せるのが最短の ROI。
4. **「枠はあるが計測も文脈もない」が ¥0 の真因**。68枠 CTR 0.107% はバナーが無視されている水準。
   バナー増設ではなく (a) 計測ループ稼働 (人間タスク)、(b) 本文中インライン文脈CTA、(c) 高単価ASP提携 の 3 つが効く。

---

## 戦略の核心 (ウェッジ)

> **「賃金構造基本統計調査の [職種]×[都道府県] long-tail を、医療・福祉専門職から攻め、
> 本文中インライン文脈CTAで高単価転職ASPへ橋渡しする」**

- 情報クエリ (勝てるデータ記事) → 自県・自職種への気づき (「自分の県は下位だ／上位県との差は◯万円」) →
  該当 H2 内インライン CTA (転職エージェント無料登録)。この「データ→感情的気づき→CTA」ファネルは
  02 の YMYL お金柱と同形。**助言記事は書かない** (E-E-A-T で大手に負けるため)。
- バナーは補助。主役は記事本文 H2 内の `tracked-affiliate-link`。

---

## 収益化候補 (転職レーン内サブ戦略・5 案)

### 1. 医療・福祉専門職クラスタ（推奨: ★★★★★）

- **仕組み**: 薬剤師・看護師・介護士・医師・歯科衛生士・理学療法士の `[職種]年収×都道府県` ranking + B/D archetype 記事に、
  各職種の特化転職ASP を本文 H2 内インライン配置。既存資産 (`pharmacist-income-prefecture-gap` / `doctor-income-prefecture-gap` /
  `dentist-income-prefecture-gap` / ranking `nurse/care-worker/physical-therapist-annual-income`) を起点に brushup + 新規 3-4 本。
- **報酬単価 (業界一般値・要ASP管理画面で確定)**: 薬剤師 ¥10,000〜20,000/件、看護師 ¥3,000〜5,000、介護 ¥3,000〜10,000。
- **収益レンジ (月・記事クラスタ全体、根拠式は末尾§ユニットエコノミクス)**:
  - 悲観 ¥2,000 / 標準 ¥12,000 / 楽観 ¥40,000
- **実装コスト**: M (既存記事 brushup 3-4 本 + 新規 3-4 本 + ASP提携)。
- **UX影響**: 低 (本文 H2 内インライン、バナー増設しない)。
- **リスク**: (a) 医療職ASP は提携審査がある場合あり (実績要求)、(b) YMYL 健康隣接だが「年収データ」は情報クエリで SEO リスク低、
  (c) 薬機法は職種年収には非該当。
- **検証実験**: ASP提携完了 + 計測稼働後、4 週で affiliate_click とCV件数を実測。成功基準 = クラスタ月 ¥5,000 / 失敗 = 月 ¥1,000 未満で配置・訴求文 見直し。

### 2. IT・エンジニア転職クラスタ（推奨: ★★★★☆）

- **仕組み**: `software-engineer-annual-income` / `system-consultant-annual-income` ranking + 「県別エンジニア年収／リモートで地方在住でも東京水準」記事に IT特化ASP (レバテック等)。STRATEGY CAREER 広告 (登録済) の文脈最適化も含む。
- **報酬単価 (一般値)**: IT転職エージェント ¥4,000〜8,000/件。
- **収益レンジ (月)**: 悲観 ¥1,000 / 標準 ¥6,000 / 楽観 ¥20,000。
- **実装コスト**: M (新規 2-3 本 + ASP提携)。STRATEGY CAREER は配置済のため文脈移設のみで先行可。
- **UX影響**: 低。
- **リスク**: head term は大手レッドオーシャン → 「地方在住×リモート×年収」「県別エンジニア年収」long-tail に限定。
- **検証実験**: 既存 STRATEGY CAREER を blog-bottom から該当記事 H2 内へ移設し、計測稼働後 4 週で CTR 改善を実測 (現 0.107% → 目標 1%+)。

### 3. 県別平均年収・労働市場クラスタ（推奨: ★★★★☆）

- **仕組み**: `平均年収`・`有効求人倍率`・`完全失業率`・`実質手取り(物価込み)` ranking + 「物価込み実質手取りで逆転する県」記事に総合大手エージェント (リクルートエージェント/doda/マイナビ)。流入最大・intent 広めの入口クラスタ。
- **報酬単価 (一般値)**: 総合エージェント無料登録 ¥1,000〜2,000/件 (CVR は高い)。
- **収益レンジ (月)**: 悲観 ¥1,000 / 標準 ¥5,000 / 楽観 ¥15,000。
- **実装コスト**: S-M (af_labor_banner / af_agent_camp 既登録の文脈移設 + 記事 2-3 本)。
- **UX影響**: 低。
- **リスク**: 単価が低い → 件数で稼ぐ。流入が最大なので件数は出やすい。
- **検証実験**: `prefectural-income-gdp-ranking` (196imp/週) 等の既存流入記事に H2 内CTA を入れ、4 週で affiliate_click を実測。

### 4. ハイクラス／管理職クラスタ（推奨: ★★★☆☆）

- **仕組み**: `manager-annual-income` (管理的職業従事者) + 年収上位県 ranking に ビズリーチ/JAC 等ハイクラスASP。
- **報酬単価 (一般値)**: ビズリーチ ¥5,000〜、JAC ¥6,000〜/件。単価高だが母数小。
- **収益レンジ (月)**: 悲観 ¥0 / 標準 ¥3,000 / 楽観 ¥12,000。
- **実装コスト**: S (記事 1-2 本)。
- **UX影響**: 低。
- **リスク**: 年収帯ターゲットが狭く CVR が読みにくい → 標準ケースを保守的に。
- **検証実験**: クラスタ 1-3 が月 ¥5,000 安定後に 1 本だけ投下し EPC を比較。

### 5. 計測・配置インフラ層（推奨: ★★★★★・enabler）

- **仕組み**: (a) OAuth + GA4 custom dimension 登録で `affiliate_click`→CV 集計ループ稼働 (**人間タスク・W25**)、
  (b) 本文中インライン文脈CTA を `tracked-affiliate-link` で標準化 (バナー依存からの脱却)、
  (c) ASP管理画面の成約レポート週次取得 → 記事別 EPC 計測。
- **収益レンジ**: 直接収益なし。**これが無いとサブ戦略 1-4 の効果判定が不能** (evidence-based-judgment 準拠で effect が付けられない)。
- **実装コスト**: 計測は人間 OAuth に依存 (S・ただしブロッカー)、配置標準化は M。
- **UX影響**: 無〜低。
- **リスク**: OAuth が遅れると 1-4 の CV 検証が全て後ろ倒し → **配置・記事・提携 (計測非依存の作業) を先行**し、計測稼働と同時に効果測定へ移る。
- **検証実験**: 計測稼働後、テスト1件で GA4 に `affiliate_click` が記録され ASPレポートと突合できるかを確認。

---

## 優先度マトリクス

| 戦略 | 収益ポテンシャル | 実装容易性 | UX影響 | 単価 | 推奨順位 |
|---|---|---|---|---|---|
| 5. 計測・配置インフラ | enabler (前提) | S(人間依存)/M | 無 | — | **0位 (前提)** |
| 1. 医療・福祉専門職 | ★★★★★ (月¥2-40K) | M | 低 | 高 (¥3-20K) | **1位** |
| 3. 県別平均年収・労働市場 | ★★★★ (月¥1-15K) | S-M | 低 | 低 (¥1-2K)・件数 | **2位** |
| 2. IT・エンジニア | ★★★★ (月¥1-20K) | M | 低 | 中高 (¥4-8K) | **3位** |
| 4. ハイクラス／管理職 | ★★★ (月¥0-12K) | S | 低 | 高・母数小 | 4位 (1-3後) |

---

## 推奨アクション

1. **インフラ層 (5) を先行**: ASP提携申請 (医療専門職・IT・総合) と本文中インラインCTA 標準化は計測非依存。今から着手。
   OAuth/GA4 custom dimension (人間タスク W25) が計測の鍵 → 完了次第サブ戦略の effect 判定を開始。
2. **医療・福祉専門職 (1) から記事供給**: 既存 pharmacist/doctor/dentist 記事を brushup + 看護師/介護/理学療法士を新規。
   各記事 H2 内に該当職種の高単価ASP を 1 つだけインライン (CTA 過多禁止)。
3. **県別平均年収 (3) で入口流入を刈る**: 既存流入記事 (`prefectural-income-gdp-ranking` 等) に総合エージェントCTA を移設。
4. **計測稼働後に EPC で勝ち記事を特定 → 横展開**。負け記事は商材・訴求文を入替 (evidence-based-judgment §状況1)。

---

## 検証ロードマップ（マスタープラン P0-P2 に整合）

| 期日 (週) | 施策 | 担当 | 成功基準 | 検証コマンド/方法 |
|---|---|---|---|---|
| W25 | OAuth + GA4 custom dimension 登録 (計測稼働) | **人間** | `affiliate_click` が GA4 に集計 | `/fetch-ga4-data last28d eventName,pagePath` で affiliate_click>0 |
| P1 中 | ASP提携申請 (医療専門職・IT・総合) | **人間** | 提携承認 (最低 各1社) | ASP管理画面 |
| W27-W29 | 本文中インラインCTA 標準化 + 医療3-4本 brushup/新規 | Sonnet/Opus | quality-gate PASS + critic PASS | `node .claude/scripts/blog/quality-gate.mjs <slug>` |
| W29 | 県別平均年収 記事に総合CTA 移設 | Sonnet | affiliate_click/週 増 | GSC page filter + GA4 affiliate_click |
| W36 (P2) | 高単価アフィ特化記事 (転職×都道府県年収) 量産 | Sonnet | アフィ発生額 実測 | ASPレポート × GA4 突合 |
| +4週 (各記事) | クラスタ別 EPC 判定 | Fable | クラスタ月 ¥5,000 / 失敗 月¥1,000未満 | EPC = 成果額 ÷ クリック (週次) |

**ゲート (マスタープランに従う)**: P1→P2 は RPM ¥100+ かつ AdSense カバレッジ 50%+。
転職アフィの本格量産 (P2) は計測稼働 (W25) が前提。計測未稼働の間は **提携・記事・配置のみ先行**し、effect ラベルは付けない。

---

## ユニットエコノミクス（根拠式・保守的）

1 記事 (医療専門職・標準ケース) の月次:

```
月CV件数 = 月GSCクリック × アフィCTR × CVR(無料登録)
        = 200 × 3% × 6% = 0.36 件/月
月収益   = 0.36 件 × 単価¥10,000 = ¥3,600/月/記事 (標準)
```

- **月GSCクリック 200**: 既存年収ranking/記事の実測 (W23 で 152-359 imp/週 = 月600-1400imp 級が複数)。
  brushup + [職種]×[県] long-tail で 200clicks/月 は到達可能レンジ。悲観は 50、楽観は 300。
- **アフィCTR 3%**: 現バナー 0.107% に対し、本文 H2 内インライン文脈CTA は 2-4% が一般値 (banner の 20-40倍)。
  [仮説] 文脈一致CTA で 3% 到達。**検証**: 計測稼働後 4 週で実測 / **検証期日 W31** / 期日後 2% 未満なら訴求文・配置を見直し。
- **CVR 6%**: 転職エージェント「無料登録/転職相談」は申込ハードルが低く高CVR (一般値 5-8%)。**要 ASPレポートで確定**。
- **単価 ¥10,000**: 薬剤師特化ASP の業界一般値 (¥10,000-20,000)。総合は ¥1,500、IT は ¥4,000-8,000。**要 ASP管理画面で確定**。

クラスタ合算 (標準): 医療 5本×¥3,600 ≈ ¥18,000 を上限に、計測不確実性を割り引いて **月 ¥12,000** を標準置きとする。
これはマスタープラン 2026-12 のアフィ目標 ¥7,500/月 を上回るが、**計測未稼働・CVR未実証のため確定値ではない**。
W25 計測稼働後の初4週実測で標準値を固定する。

---

## 人間 (オーナー) にしかできないタスク

| タスク | ブロックしているもの | 期日 |
|---|---|---|
| OAuth 認可 + GA4 custom dimension 登録 | 転職アフィの CV 計測全体・effect 判定 | W25 |
| ASP提携申請: 医療専門職 (薬剤師ファルマスタッフ/マイナビ薬剤師・看護roo!・介護系) | サブ戦略1 の高単価収益 | P1 中 |
| ASP提携申請: IT (レバテック等)・総合 (リクルート/doda/マイナビ) | サブ戦略2・3 | P1 中 |
| ASP管理画面の成果確認 (週次/月次) | EPC・発生額の真値 | 継続 |

---

## リスクと前提

- **計測が稼働するまで effect を主張しない** (evidence-based-judgment §状況1・5)。¥0 の現状で「効くはず」と書かない。
- **head term の SEO 勝負はしない** (02 ガードレール踏襲)。47都道府県 long-tail に限定。
- **CTA 過多禁止**。1 記事 H2 内に商材 1 つ。blog-critic が読者価値を審査 (blog-quality-standards)。
- **医療職ASP の提携審査・薬機法**: 年収データ記事は情報クエリで薬機法非該当。提携が通らない場合は総合/IT に重心を移す。
- **マスタープランが SSOT**。本書の数値・ゲートはマスタープラン §3/§4/§8 に従属。矛盾時はマスタープラン優先。
  本書の結論をマスタープラン本体へ吸収する改訂は **Fable** が行う (Opus/Sonnet は本書まで)。

---

## 実行キット (Step 0: 計測非依存で着手可・2026-06-13 検証済)

> 以下の ranking key / blog slug は `packages/data-configs/src/metrics/` と GSC snapshot で**実在を検証済**。
> ASP 案件名は一般名 (要 ASP 管理画面で検索・単価は業界一般値・要確定)。a8mat コードは提携後に付与。

### A. ASP 提携申請リスト（人間タスク・申請するだけ）

| 優先 | クラスタ | 代表案件 (一般名・要ASP検索) | 探すべきASP (候補) | 想定単価 | 状態 |
|---|---|---|---|---|---|
| 1 | 薬剤師 | マイナビ薬剤師 / ファルマスタッフ / 薬キャリ | A8.net・もしも・レントラックス・直 | ¥10,000-20,000 | 未提携 |
| 1 | 看護師 | 看護roo! / マイナビ看護師 / レバウェル看護 | felmat・レントラックス・直 | ¥3,000-5,000 | 未提携 |
| 1 | 介護 | レバウェル介護 / カイゴジョブ / きらケア | A8.net・レントラックス・直 | ¥3,000-10,000 | 未提携 |
| 1 | リハビリ(PT/OT) | PTOT人材バンク / マイナビコメディカル | 直・felmat | ¥3,000-8,000 | 未提携 |
| 2 | 総合 | リクルートエージェント / doda / マイナビエージェント | A8.net・もしも・バリューコマース | ¥1,000-2,000 | 未提携 (件数で稼ぐ) |
| 3 | IT追加 | レバテックキャリア / マイナビIT AGENT / Geekly | A8.net・もしも | ¥4,000-8,000 | 一部稼働(下記B) |
| 4 | ハイクラス | ビズリーチ / JAC / リクルートダイレクトスカウト | A8.net・もしも | ¥5,000-15,000 | 未提携 |

> 医療専門職は **レントラックス / felmat / 直案件** に高単価案件が多い傾向 (一般傾向・要確認)。A8.net は既にアカウント保有。

### B. 既に稼働可能な広告（提携済・本物の A8 URL）

| 広告 | id | A8 URL | 現配置 | 即できる打ち手 |
|---|---|---|---|---|
| STRATEGY CAREER｜エンジニア転職 | (8件登録) | `px.a8.net/...4B5LK5+5YC2K2+5P1E+5ZEMP` | blog-bottom (CTR 0.107%) | エンジニア年収記事/ranking の **H2内インライン**へ移設 |
| 転職サイト バナー | af_labor_banner_001 | `px.a8.net/...4AZCG4+9Z0EK2+5UK0+5YZ75` | laborwage / blog-bottom | 県別平均年収記事の H2内へ移設 |

→ **IT クラスタは新規提携ゼロで今日から着手可**。最初の打ち手は「blog-bottom バナー依存 → 本文中文脈CTA」への移設。

### C. 記事 × 配置マッピング（実在 slug/key 検証済）

**即着手可（IT・新規提携不要）**

| ページ (実在) | 種別 | 配置先 H2 | CTA (STRATEGY CAREER) |
|---|---|---|---|
| `ranking/software-engineer-annual-income` | ranking | 「年収を上げるには」相当の解説下 | エンジニア転職で県またぎ年収アップ |
| `ranking/system-consultant-annual-income` | ranking | 同上 | 同上 |
| (新規) `blog/engineer-income-prefecture-remote` | blog B/D型 | 「地方在住×リモートで東京水準」H2内 | 同上 |

**提携後着手（医療・福祉・総合）**

| ページ (実在) | 種別 | 推奨ASP | 配置先 H2 |
|---|---|---|---|
| `blog/pharmacist-income-prefecture-gap` (docs/21に原稿有) | blog | 薬剤師特化 | 「年収が高い/低い県」解説の H2内 |
| `blog/doctor-income-prefecture-gap` (R2公開済) | blog | 医師特化/総合 | 同上 |
| `blog/dentist-income-prefecture-gap` (R2公開済) | blog | 歯科/総合 | 同上 |
| `ranking/nurse-annual-income` / `nurse-salary` | ranking | 看護師特化 | チャート解釈の H2内 |
| `ranking/care-worker-annual-income` / `care-manager-annual-income` | ranking | 介護特化 | 同上 |
| `ranking/physical-therapist-annual-income` (GSC流入有) | ranking | リハビリ特化 | 同上 |
| `ranking/dental-hygienist-annual-income` | ranking | 歯科衛生士特化 | 同上 |
| (新規) `blog/nurse-income-prefecture-gap` 等 専門職別 | blog B/D型 | 各特化 | 「なぜ上位/下位県か」H2内 |
| `ranking/avg-salary-all-prefecture` / `regular-cash-salary-male` | ranking | 総合 | 県別差の解説 H2内 |
| `blog/prefectural-income-gdp-ranking` (196imp/週) | blog | 総合 | 実質手取りで逆転する県の H2内 |

### D. 着手順（今週〜W25）

1. **(人間・今すぐ)** A表の医療4案件 (薬剤師・看護師・介護・リハビリ) を A8/レントラックス/felmat で提携申請。
2. **(人間・W25)** OAuth + GA4 custom dimension 登録 → `affiliate_click` 集計ループ稼働（effect 判定の前提）。
3. **(私が次にできる・承認後)** B表の STRATEGY CAREER を `affiliate-ads-data.ts` で blog-bottom → エンジニア年収 ranking/記事の H2内インラインへ移設（IT は提携不要で先行可）。デプロイは `publish-affiliate-ads.yml`（develop push 発火）を伴うため**オーナー承認後に実施**。
4. **(私・並行)** C表の医療記事 brushup（pharmacist 既存原稿に文脈CTA枠を準備、doctor/dentist を docs/21 へ取り込み）。CTAリンクは提携承認後に差し込み。quality-gate + blog-critic 必須。

> **effect 判定は計測稼働 (W25) 後**。それまでは提携・記事・配置のみ進め、effect ラベルは付けない (`evidence-based-judgment.md`)。

### E. 配置ターゲティングの制約と必要な改修（★2026-06-13 検証で判明・最重要）

「STRATEGY CAREER をエンジニア年収ページへ移設」を準備する中で、**転職戦略の急所**が判明した。

- **配置の粒度は categoryKey (17軸) 止まり**。`AffiliateAd` 型に ranking-key 単位のターゲティング項目は無い
  (`apps/web/src/features/ads/types/index.ts:5-33`、`targetCategories` は string・全件 null)。
- **39職種すべてが categoryKey=`laborwage`**。`software-engineer-annual-income` の item.json も `categoryKey:"laborwage"`。
- **チャート直下の native 枠は location を無視し categoryKey + banner のみで解決**
  (`readActiveBannersByCategoryKeysFromR2`・`affiliate-ad-snapshot.ts:124-135`)。
- 結果: **STRATEGY CAREER (エンジニア転職) は既に全 laborwage ランキングの native 枠に表示されている** —
  看護師・介護士・調理師・教員・警察官の年収ページにもエンジニア転職広告が出ている **文脈ミスマッチが本番で発生中**。
  masterplan 判断5「アフィは文脈一致のみ」に反する。`blog-bottom` という locationCode はサイドバー枠に出ないだけで、native 枠の漏れは止めていない。
- **帰結**: データ編集だけでは「職種別ランキングに、その職種の転職ASP」を出せない。**転職クラスタ戦略 (医療/IT/総合の文脈一致配置) の前提として、per-ranking-key ターゲティングの改修が必要**。

**必要改修 (推奨・foundational enabler)**: `AffiliateAd` に `targetRankingKeys?: string[]` を追加し、ranking ページの
native/sidebar 解決時に「`targetRankingKeys` 未設定なら従来通り (後方互換)、設定済なら現 rankingKey が含まれる時のみ表示」でフィルタ。

- 影響ファイル: `types/index.ts` (型) / `resolve-affiliate-ad.ts` (`resolveAffiliateBanners` に rankingKey を thread) /
  `affiliate-ad-snapshot.ts` (`readActiveBannersByCategoryKeysFromR2` に rankingKey フィルタ追加) /
  ranking `page.tsx:223-224` (resolveAffiliateBanners に rankingKey を渡す) / `affiliate-ads-data.ts` (STRATEGY CAREER に
  `targetRankingKeys:["software-engineer-annual-income","system-consultant-annual-income","architect-annual-income","designer-annual-income"]`)。
- 効果: (1) エンジニア転職の文脈漏れを停止、(2) 医療各職種に専門ASPを正しく出す土台、(3) 後方互換 (既存広告は無変更で従来挙動)。
- デプロイ: コード変更 (PR develop→main) + `affiliate-ads-data.ts` push で `publish-affiliate-ads.yml` 発火。**承認後に実施**。

> この改修は転職に限らず全カテゴリの「文脈一致」配置の土台。医療クラスタ着手より前にこれを入れるのが順当。

#### 実装状況 (2026-06-13・ローカル実装済 / 未デプロイ)

`targetRankingKeys` ターゲティングを実装し、型チェック (apps/web tsc 0 error) + テストで検証済。**まだ develop/main には push していない**。

- 型: `AffiliateAd.targetRankingKeys?: string[] \| null` (`types/index.ts`)。exporter は `AFFILIATE_ADS` を丸ごと JSON 化するため R2 snapshot に自動反映 (`AffiliateAdRow = AffiliateAd`)。
- フィルタ: `matchesRankingTarget(ad, rankingKey)` を `affiliate-ad-snapshot.ts` に追加。意味論は **非対称**「未設定→無制限 / 設定済+rankingKey一致→表示 / 設定済+rankingKey一致せず→除外 / rankingKey無し(blog等)→適用しない」。
- thread: `resolveAffiliateBanners` (native) / `resolveAffiliateBannersByCategoryKey` (sidebar) → `AffiliateAdSlot`(rankingKey prop) → ranking `page.tsx` が rankingKey を供給。
- データ: STRATEGY CAREER バナー 8 件に `targetRankingKeys: ["software-engineer-annual-income","system-consultant-annual-income"]` (建築技術者/デザイナーは IT 文脈外のため除外。汎用「転職サイトバナー」は全 laborwage で文脈OKのため無変更)。
- テスト: `repositories/__tests__/affiliate-ad-snapshot.test.ts` 新規 3 件 (一致表示 / 非一致除外=看護師ページ漏れ防止 / blog後方互換)。`__tests__/resolve-affiliate-ad.test.ts` の呼出シグネチャを 3 引数に更新。全 green。
- **デプロイ済 (2026-06-13)**: PR #466 で本番反映 (main 9418f78f)。CDN purge 実行済。snapshot バナー (`5ZEMP`) は targeting で非エンジニア ranking から除外を確認 (全ページ 0)。

#### 本番検証で判明した積み残し (★targeting 未完・follow-up)

STRATEGY CAREER は **3 経路**で表示されており、今回の targeting は (1) のみカバー。エンジニア転職を本当に該当 ranking だけに限定するには (2)(3) も対処が必要:

1. ✅ **snapshot バナー** (`af_strategy_career_*_001` / a8mat `5ZEMP` / adType=banner) → `targetRankingKeys` で限定済。
2. ✅ **snapshot テキスト広告** (`af_strategy_career_text_*` / a8mat `5YJRM` / adType=text) → **完了 (PR #469)**。`readActiveTextAdsByCategoryFromR2` に rankingKey フィルタ + text 9 件に `targetRankingKeys`。
3. ✅ **コード直書きの hardcoded promo** (`sidebar-banners.ts` の `SidebarPromoBanner`・a8mat `5YZ75`) → **完了 (PR #469)**。`SidebarBannerConfig.targetRankingKeys` + `selectPromoBannerIndexForRanking` で ranking 文脈に応じ出し分け。IT 職以外は汎用 recruit バナー (`4B3RUY`) にフォールバック。

**本番検証 (2026-06-13・PR #469 deploy bf1fd7e7 + CDN purge 後)**: software-engineer ページ = STRATEGY CAREER 表示 / nurse・cook ページ = STRATEGY CAREER **0**・汎用バナー表示。**3 経路すべて文脈一致を達成し、職種年収ページへのエンジニア転職漏れを完全停止**。

---

## 関連

- SSOT: `docs/02_実装計画/01_収益化マスタープラン.md` (判断5・P1/P2・§9 人間タスク)
- 戦略narrative: `docs/00_プロジェクト管理/02_収益化戦略.md` (YMYL お金柱)
- アフィ広告 SSOT: `apps/web/scripts/affiliate-ads-data.ts` / 計測: `apps/web/src/features/ads/components/tracked-affiliate-link.tsx`
- 賃金データ: `reference_estat_wage_survey` (memory) / 賃金構造基本統計調査 `0003445758`
- 記事品質: `.claude/rules/blog-quality-standards.md`
- 実証判定: `.claude/rules/evidence-based-judgment.md`
- 収益化方針の正典: `docs/02_実装計画/01_収益化マスタープラン.md` (旧 YMYL 3本柱レビューはマスタープランに吸収)

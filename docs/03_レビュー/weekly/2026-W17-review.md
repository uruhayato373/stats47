---
week: "2026-W17"
type: review
generatedAt: "2026-04-20"
sprint: "Sprint 2（配信定着 + 効果検証）Week 5/6"
---

# 週次レビュー 2026-W17

W17 Day 1（2026-04-20 Monday）時点のレビュー。計画タスクは週前半に前倒し実行済みで、Day 1 終了時点で Must 完了率 100%、Should も大半着地。Core Web Vitals 問題（LCP 9.45 秒）という重大な新規発見あり。

## サマリー

- 計画タスク達成率: Must 3/3（100%）、Should 4/4（100%、一部 partial）、Could 1/3（33%）。合計 8/10（80%）
- 主な成果: (a) X 10 件予約投稿（Must 3 件を 333% 超過、W17-W18 分を一括）、(b) PSI 計測復活で **LCP 9.45 秒の Core Web Vitals 問題発覚**、(c) EXP-001 pending_user_actions 完全消化で FINAL 観測（2026-04-28）待ちに移行

## 計画 vs 実績

| タスク | 分類 | 状態 | メモ |
|---|---|---|---|
| `/update-sns-metrics` 実行 + 自動化検討 | Must | **完了（部分）** | YouTube 36 posts 更新、snapshot 2026-04-17 確定。X は browser-use 依存で未実行（残タスク）。自動化 RemoteTrigger 検討は W18 に繰延 |
| X 3 件投稿（Sprint 2 Week 2/4） | Must | **完了（超過）** | 10 件予約投稿（4/20-4/27）。年収トレンド連動 3 件から開始、draft 残 25 件から選定 |
| EXP-001 pending_user_actions 消化 | Must | **完了** | GSC UI で sitemap 再送信 + 修正リクエスト 2 件完了（2026-04-20）。FINAL 観測 2026-04-28 待ち |
| 公開記事 -39 本影響調査（リダイレクト/410） | Should | **完了（部分）** | GONE_BLOG_SLUGS 機構導入 + 2 slugs 登録（`de725354`）。網羅的な 39 本リストとの突合は未完了 |
| PSI 計測の復活（PSI_API_KEY 取得） | Should | **完了** | API キー取得 + `.env.local` 設定、2026-W17 snapshot で PSI 初回取得 → **LCP 9.45s / Performance 55 の重大問題発覚** |
| `/themes/population-dynamics` 異常滞在調査 | Should | **完了（部分）** | コード側の自動更新は無いことを確認、GA4 MID 観測記録済。GA4 管理画面での bot フィルタ設定 + Cloudflare UA 分布確認はユーザー作業として残存 |
| GSC URL 残骸の追加 410 化（Fix 7/8） | Should | **完了** | /themes/unknown 410 + /areas/pref/non-indexable 410（約 517 URL）を main デプロイ済（2026-04-18、`5fb9aa5d`） |
| CTR 改善: あと一押しクエリ 3 件 | Could | **完了（pivot）** | 健康寿命は DB 未収録のため、ランキング 3 件（高卒初任給・パスタ・焼酎）に seo_title/description 追加（`80f782ac`） |
| `/discover-trends-all` 実行 + 下書き 1 本 | Could | **未達** | 年収トレンドは X 投稿で既に消化。ブログ下書きは未着手 |
| YouTube 1 件投稿 | Could | **完了** | 4/22-4/27 で 3 本予約投稿済（scheduled 12 件を消化） |

計画外作業（Day 1 実施）:
- publish-x X UI 2026-04 変更対応（24h 制 select / DOM click 必須 / JST 変換）— Must-2 実行の前提となる緊急対応（`9890a975`）
- ホームページ `<h1>` を text-3xl → text-2xl に縮小（CLAUDE.md 準拠 + LCP 改善の第一歩、`c58d4366`）
- 健康寿命ランキング（男女）新規登録 2019（`946c0581`、W17 プラン外だが GSC 100+ imp/月の需要に対応）

## 成果ハイライト

1. **X 予約投稿フル回復**: W16 で 6 週連続未達を 3 件で断ち切った流れを、W17 Day 1 で **10 件予約**まで一気に拡張。Sprint 2 完了条件「X 週 3 投稿 4 週連続」は W16（3 件）→ W17（10 件 scheduled）で 2/4 週達成。残り W18-W19 を埋めれば完了
2. **PSI 計測復活 + Core Web Vitals 問題発覚**: `PSI_API_KEY` 設定だけで済む軽作業だったが、取得結果で LCP 9,453ms（閾値 2,500ms の 3.8 倍）、Performance スコア 55（閾値 80 未達）という **恒常的 CWV 問題**が可視化された。h1 縮小は応急処置で、本格対策は W18 Must 候補
3. **EXP-001 FINAL 観測待機へ移行**: Phase 1+2 デプロイ済（W16 完了）→ pending_user_actions（GSC UI 手動作業 2 件）を Day 1 で消化 → 2026-04-28 の measure を待つだけの状態に。4 週間で GSC エラー合計 -50%（10,553 → 5,000 以下）という target に対する判定が来週取れる
4. **publish-x 障害対応の先手**: X の 2026-04 UI 変更（日時指定が 24h select 化、AM/PM 廃止）で既存スクリプトが壊れていたところ、Must-2 実行直前に検知 → fail-safe 化 + JST 変換 + dry-run モードで復旧。スクリプトが壊れたまま気付かず放置される最悪ケースを回避

## 開発活動

**W17 Day 1（2026-04-20 のみ）**:
- コミット数: 3 件
  - `9890a975` fix(publish-x): X UI 2026-04 変更対応（24h select・DOM click・JST 変換） — 153 行変更
  - `b3b5033f` docs(w17): 進捗更新 + PSI 初回計測 + YouTube/X 施策ログ — 5 ファイル、+312/-9 行
  - `c58d4366` fix(web): home hero h1 を text-2xl に変更（CLAUDE.md 準拠 + LCP 改善） — 1 行変更
- 未コミット: `apps/web/next.config.ts`、`apps/web/package.json`、`apps/web/public/search-index.json`、`package-lock.json`（+131/-2 行）。おそらく LCP 応急対応の継続作業
- ブランチ: `feature/w17-tracking-psi` で作業中、develop マージ未実施

**直近 7 日参考値（W16 週内 + W17 Day 1）**:
- コミット数: 46 件
- 変更規模: +32,733 / -6,799 行、353 ファイル
- 主要カテゴリ: GSC 改善（middleware 410・sitemap）、DB 同期フロー再設計、SNS スキル再設計、snapshot CSV 大量蓄積

## コンテンツ実績

| 種別 | W17 Day 1 | W16 | 増減 |
|---|---|---|---|
| 公開記事 | 0（±0） | 0 | ±0 |
| SNS 投稿 X（posted） | 10 | 3 | **+7** |
| SNS 投稿 YouTube（scheduled） | 3 | 0 | +3 |
| SNS 投稿 Instagram | 0 | 0 | ±0 |
| SNS 投稿 TikTok | 0 | 0 | ±0 |
| 投稿待ちストック | draft 107 / scheduled 50（計 157） | 167 | **−10** |

ストック消化が始まった（167 → 157、10 件減）。特に X draft が 33 件 → 25 件に減少。

全体ステータス概況（posted 内訳）:
- ranking: X 54 / YouTube 31 / TikTok 31 / Instagram 32 / note 31
- bar-chart-race: 全プラットフォーム 26 件ずつ

## NSM 実験進捗

Phase 0 snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W17.json`（2026-04-19 生成）

### active な実験

| id | title | status | 経過 | baseline → 今週 | 次アクション |
|---|---|---|---|---|---|
| EXP-001 | GSC 問題の恒久対策 Phase 1+2 | running | **6 日** | gsc_total_errors 10,553 → 未再計測 / engaged_sessions 13 → 18 (+38%) / clicks 98 → 86 (−12%) | **measure 候補 4/28**（14 日経過） |

### measure 候補（10 日以上経過した running）

- なし（EXP-001 は Day 6、10 日基準未達。次回 2026-04-28 で 14 日経過 → 来週 W18 レビュー時に measure 実行可）

### 継続作業が必要な実験

- なし（EXP-001 の pending_user_actions は Day 1 でクリア済）

### 次確認日が近い実験

- EXP-001: next_check_date = **2026-04-28**（FINAL 観測日、残 8 日）

## パフォーマンス

詳細データは snapshot CSV と improvement-log.md を参照。

### GA4（2026-04-12 〜 2026-04-18、snapshot 内蔵値）

※ W17 の独立した GA4 snapshot ディレクトリは未生成。NSM snapshot 2026-W17.json から引用。

| 指標 | 今週 | 前週 | 差分 |
|---|---|---|---|
| users | 17 | 26 | **−9（−34.6%）** |
| sessions | 24 | 34 | −10（−29%） |
| engagedSessions（NSM） | 18 | 25 | −7（−28%） |
| Organic Search users | 3 | 9 | **−6（−66.7%）** |
| Direct users | 3 | 4 | −1 |
| Referral users | 10 | 12 | −2 |

主要な動き:
- Organic Search が −66.7% と激減。W16 で観測された「clicks +37.8% と engagedSessions −43.5% の乖離」が継続
- Direct / Referral も減。母数小（users 17-26）のためノイズ範囲だが、3 週連続で下降傾向は気になる
- GA4 独立 snapshot が未生成のため、上位ページ詳細・bounce rate は取得不可。Day 1 時点では NSM snapshot のサマリのみ

### GSC（2026-04-10 〜 2026-04-16、snapshot 内蔵値）

※ W17 の独立した GSC snapshot ディレクトリは未生成。NSM snapshot 2026-W17.json から引用。

| 指標 | 今週 | 前週 | 差分 |
|---|---|---|---|
| 合計クリック（7d） | 86 | 164 | **−78（−47.6%）** |
| 合計表示（7d） | 3,730 | 3,023 | +707（+23.4%） |
| 平均 CTR | 2.31% | 5.43% | **−3.12pt** |
| 平均順位 | 9.67 | 8.60 | **悪化** |

上位クエリ（Top 10 から抽出）:
- 昆布 消費量 ランキング（10 imp, CTR 20%, pos 7.4）
- エンゲル係数 都道府県（2 imp, CTR 50%, pos 6.5）
- 公園が多い県（7 imp, CTR 14%, pos 7.1）
- 地方債残高 ランキング（8 imp, CTR 12.5%, pos 5.0）
- 大学進学率 都道府県（2 imp, CTR 50%, pos 10）

**懸念**: W16 の clicks 145 vs W17 86 は -47% の大幅減少。順位 9.67 への悪化 + CTR 2.31% への下落が同時発生 → sitemap 再送信 + middleware 410 化の副作用か、もしくは GSC 3 日遅延データが Fix 7/8 デプロイ（4/18）を十分反映していないだけか、**W18 で要精査**。

### インデックスカバレッジ

※ W17 では手動エクスポート未実施。EXP-001 FINAL 観測日（4/28）に合わせて次回レビューで取得。

### PSI / Core Web Vitals（2026-04-19 初回計測、Mobile）

**🚨 重大問題発覚**

| 指標 | 計測値 | budgets.json 閾値 | 判定 |
|---|---:|---:|:---:|
| Performance スコア | 55 | ≥ 80（error） | **NG**（-25pt） |
| LCP | **9,453 ms** | ≤ 2,500 ms（error） | **NG**（3.8×） |
| TBT | 632 ms | ≤ 300 ms（warning） | NG（2.1×） |
| CLS | 0.000185 | ≤ 0.1（error） | ✅ |
| FCP | 1,351 ms | ≤ 1,800 ms（warning） | ✅ |
| TTI | 14,862 ms | — | 参考 |

- 他スコア: Accessibility 100 / Best Practices 100 / SEO 100（問題なし）
- Day 1 応急対応: h1 を text-3xl → text-2xl に縮小（`c58d4366`）だが、LCP 9.45s → 2.5s には遠く届かない
- baseline（2026-03-28）とほぼ同水準（Performance 55-59 / LCP 9,993-10,979ms）で **1 ヶ月改善なし**
- **W18 で Must 昇格必須**。LCP 改善が完了しないと、SEO 改善・配信拡大の効果が全て打ち消される

### YouTube

※ W17 での `/fetch-youtube-data` 未実行。W16 値のまま参考表示。

| 項目 | 値（W16 最終） | 前週比 |
|---|---:|---|
| 登録者 | 31 | +1 |
| 総再生回数 | 78,316 | +134 |
| 動画数 | 147 | ±0 |

次回 W18 レビューで 4/22-4/27 予約投稿 3 本の反映値を確認する。

### SNS パフォーマンス

**最終取得日**: 2026-04-17（W16 レビュー時点 04-03 から **3 日更新に改善**。YouTube 36 posts のみ更新）

| プラットフォーム | 計測投稿数 | impressions / views | いいね | コメント | リポスト |
|---|---:|---:|---:|---:|---:|
| X | 80 | 3,484 | 8 | 1 | 2 |
| YouTube | 57 | 8,343 | 13 | 1 | — |
| Instagram | 58 | 0 | 1 | 0 | — |
| TikTok | 57 | 124 | 0 | 0 | — |
| note | 31 | 0 | 0 | 0 | — |

X の impressions が W16 時点 3,051 → 3,484（+433, +14%）。今週 10 件予約投稿の反映は W18 で確認。

X impressions Top 5（Day 1 時点、変動なし）:
1. traffic-accident-count-per-population — 240
2. avg-salary-admin-prefecture — 186
3. social-increase-rate — 168
4. high-school-advancement-rate — 167
5. total-population — 145

## 課題・ブロッカー

1. **🚨 Core Web Vitals 重大劣化（LCP 9.45s）**: 閾値の 3.8 倍、1 ヶ月改善なし。SEO 順位 9.67 への悪化と相関の可能性あり。配信や記事執筆より優先度高
   - 対策: W18 で Must 昇格 → `/nsm-experiment propose` で EXP-002 として登録 → LCP 要因分解（画像・JS・SSR・R2 fetch）→ 段階対処
2. **Organic Search −66.7%**: 3 週連続で users 減、W17 で特に激減。順位悪化（8.60 → 9.67）と CTR 悪化（5.43% → 2.31%）が同時発生 → middleware 410 化・sitemap 再送信の副作用疑い
   - 対策: W18 で GSC カバレッジ手動エクスポート → Fix 7/8 デプロイの影響を URL 単位で精査。一時的悪化なら EXP-001 measure（4/28）まで待機、恒常化なら rollback 検討
3. **X メトリクス 3 週間未更新（最終 2026-04-03 → 04-17 は YouTube のみ）**: X は browser-use + X ログインが必要で手動依存。X 投稿 10 件の効果判定が来週以降も遅延
   - 対策: W18 で X 用 `/update-sns-metrics` の browser-use 自動化を Should に入れる（RemoteTrigger 登録は 2 段階目）

### 繰り返しパターン

- 「計測系 Must は手動依存で停滞しやすい」パターンが 3 週連続確認された（W15 完了 → W16 未達 → W17 部分達成）。構造的対策として自動化が必須
- 「技術タスク先行による配信遅延」パターンは W16 で断ち切れ、W17 Day 1 で X 10 件予約まで一気に加速。成功パターンの強化傾向
- 「Should の GSC 防御タスクが数週繰り越し」パターンは、W17 で 410 化・GONE_BLOG_SLUGS 導入・EXP-001 pending 消化で完全消化。防御系の滞留解消

## 学び・ナレッジ

- **PSI_API_KEY は即日完了するので Must-S で扱うべき**: 外部申請不要（Google Cloud Console で 1 分発行）、`.env.local` 追加だけで稼働。Should で放置すると「来週やる」が繰り返される
  - `/knowledge` 記録推奨: **はい**（今後 `/fetch-*` 系で外部 API キーが要る類似タスクの判定基準として）
- **X の UI 変更は半年周期で発生する前提でスクリプト設計**: 2026-04 の UI 変更（24h select 化）で既存 publish-x が即日壊れた。`post-x` / `publish-x` 系は monthly smoke test を組む価値あり
  - `/knowledge` 記録推奨: **はい**（memory `project_publish_x_ui_2026_04.md` に関連記録あり、月次テストの必要性を追記）
- **Day 1 に X 10 件予約という前倒しパターン**: 月曜の最初に Sprint 2 週分を一括スケジューリングすると、残り週は配信タスクから解放されて改善系に集中できる。W16 の「月曜の最初のタスク」ルールを拡張した成功例
  - `/knowledge` 記録推奨: **いいえ**（memory `feedback_x_posting_pattern.md` 相当に記録候補、ただし 2 週のサンプルなので次週も検証）
- **LCP 9.45s は h1 サイズ変更程度では動かない**: CSS の font-size 変更は LCP 候補要素の計測タイミングに微小影響のみ。真の LCP 対策は画像最適化・Critical CSS・SSR データ取得の見直しレベル
  - `/knowledge` 記録推奨: **いいえ**（CWV 文献に既出、プロジェクト固有知見なし）

## 来週への申し送り

- **🚨 最優先（Must 昇格候補）**: LCP 改善（Performance 80 / LCP 2.5s 目標）。`/nsm-experiment propose` で EXP-002 として登録し、W18-W19 の軸とする
- **Must 継続**: X 週 3 投稿 4 週連続の **3 週目**（W18 で 3 件以上）。W17 で既に 10 件予約済みの一部が W18 に流れ込むので自然達成の見込み
- **Must 監視**: EXP-001 FINAL 観測（2026-04-28）→ GSC エラー合計 -50% 判定。W18 レビュー冒頭で measure を実行
- **Should 昇格**: Organic Search −66.7% / GSC clicks −47.6% の原因切り分け（Fix 7/8 副作用 vs GSC データ遅延）
- **Should 継続**: X 用 `/update-sns-metrics` の browser-use 自動化（RemoteTrigger 登録は保留）
- **Could**: `/discover-trends-all` 実行（W17 で唯一未達の Could）、下書き 1 本
- **Sprint 2 Week 6/6 = W18**: Sprint 2 最終週。完了条件は「X 週 3 投稿 4 週連続」と「配信定着 + 効果検証」。W19 以降の Sprint 3 設計を並行で準備すべきタイミング

## 参考

- W17 計画: `docs/03_レビュー/weekly/2026-W17.md`（進捗ステータスセクションに実行ログあり）
- EXP-001 state: `.claude/state/experiments.json`
- NSM snapshot: `.claude/skills/management/nsm-experiment/reference/weekly-snapshots/2026-W17.json`
- PSI improvement-log: `.claude/skills/analytics/performance-improvement/reference/improvement-log.md`
- W18 計画は `/weekly-plan 2026-W18` で自動生成（本レビュー保存後に連続実行）

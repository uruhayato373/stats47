# AdSense 改善ログ (agent 用詳細)

一覧・status の真実源は `.claude/todo/04_改善バックログ.md`。ここは検証コマンド・仮説・期日の詳細ログ。
記入テンプレ: `.claude/rules/evidence-based-judgment.md` §改善ログ記入テンプレ。

## [ADSENSE-PAUSE-01] 全AdSense表示の一時停止

- **判断日**: 2026-08-16（オーナー明示判断）
- **デプロイ日**: 未（コード実装済、効果計測の開始前）
- **ベースライン**: 2026-W32 finalized7d は earnings ¥130、page views 4,469、page RPM ¥29、impressions 4,152、viewability 51.7%、ad requests 16,508、coverage 36.1%。出典: `.claude/state/metrics/adsense/LATEST.md`
- **変更**: `apps/web/src/lib/google-adsense/constants.ts` の `ADSENSE_DISPLAY_ENABLED=false` をSSOTとし、環境変数の値にかかわらず script / preconnect / Auto ads / 手動枠 / AdSense fallback / 広告用の空カード・予約高を全ページで生成しない。アフィリエイト広告は対象外
- **想定する機会費用**: 現状と同程度なら AdSense 収益を週約¥130失う。UX・速度・回遊・代替収益の改善幅は未確定で、実測前に効果を主張しない
- **検証**: デプロイ直後に本番HTMLとnetworkで `pagead2.googlesyndication.com` / `adsbygoogle` / AdSense用空枠が0件であることを確認。28日後に重複しない期間で Core Web Vitals、engagement、affiliate CTR、商品導線クリック、AdSense減収を比較する
- **再開条件**: 28日実測を確認し、オーナーが明示承認した場合のみ全体スイッチを `true` へ戻す。個別ページから先に戻さない
- **判定**: in-progress（未デプロイ。判定日はデプロイ日+28日へ更新する）

---

## 診断ベースライン (2026-07-03, W26 実測)

「アクセス数の割に収益が少ない」の実測診断。データ源: `.claude/state/metrics/adsense/LATEST.md` / `snapshots/2026-W26/{overview,units,devices}.csv`。

- 収益 ¥139/週・RPM ¥53・viewability 67.7%。GSC clicks は W16→W26 で 5.5 倍 (354→1,947) だが収益は追随せず
- **原因①: 広告表示率が低い** — imp/PV 全体 0.71 (1,856/2,616)。デスクトップ 0.89、モバイル **0.37** (337/910)。lazy-load 発火が画面手前 100px + モバイル LCP 6.7s で表示前に離脱
- **原因②: モバイル収益化の欠落** — モバイル CTR 5.64% (デスクトップ 0.33%) と需要は高いのに RPM ¥30 (デスクトップ ¥66)
- 副次: footer 系ユニット viewability 49.1% / 26.2%。pages.csv 空 (ページ別収益不可視)

対応施策: ADSENSE-ANCHOR-01 / ADSENSE-LAZYLOAD-01 / ADSENSE-FOOTER-02 (multiplex化) / ADSENSE-PAGES-DATA-01。
**交絡について**: INCONTENT-01 (判定 7/12 予定だった) と ANCHOR-01 / LAZYLOAD-01 を同時投入することをオーナーが 2026-07-03 に了承 (効果分離より収益改善の速度を優先)。モバイル系統は 2026-08-02 に一括判定する。

---

### [ADSENSE-ANCHOR-01] モバイル アンカー広告の有効化 (Auto ads: アンカーのみ)

- **デプロイ日**: 未 (人間タスク: AdSense 管理画面設定のみ、コード変更なし)
- **設定手順**: AdSense 管理画面 → 広告 → サマリー → stats47.jp → 編集 → Auto ads ON → フォーマット「アンカー」のみ ON (オーバーレイ / 自動インコンテンツ / サイドレール OFF)。`AdSenseScript.tsx` は client= 付き adsbygoogle.js を既にロード済のため追加コード不要
- **想定効果**: モバイル imp/PV 0.37 → 0.8+、モバイル RPM ¥30 → ¥50+ [根拠: W26 実測でモバイル CTR 5.64% と需要は既に高く、表示回数だけが欠けている (`snapshots/2026-W26/devices.csv`)]
- **検証コマンド**: 週次 snapshot 自動取得後に `cat .claude/skills/analytics/adsense-improvement/reference/snapshots/<week>/devices.csv` — High-end mobile 行を W26 基準 (¥27 / 910PV / 337imp / CTR 5.64% / RPM ¥30) と比較
- **判定**: effect/pending (中間 2026-07-19、判定 2026-08-02)
- **未確定 / 仮説**: [仮説] アンカーは Google 側最適化で fill されるため手動枠との共食いは限定的。検証期日 2026-08-02、High-end mobile 収益が +50% 未満なら手動 in-content との共食いを units.csv で確認する

### [ADSENSE-LAZYLOAD-01] lazy-load 発火の前倒し (rootMargin 100→600px)

- **デプロイ日**: 2026-07-03 (feature/adsense-revenue-optimization)
- **変更**: `apps/web/src/lib/google-adsense/components/AdSenseAd.tsx` rootMargin デフォルト 100→600。`types.ts` JSDoc 更新
- **想定効果**: 全体 imp/PV 0.71 → 0.9+ [根拠: W26 実測 imp/PV デスクトップ 0.89 / モバイル 0.37。発火前倒しで「スクロール到達前に描画済み」となり、離脱前の imp 計上が増える]
- **検証コマンド**: `cat .claude/skills/analytics/adsense-improvement/reference/snapshots/<week>/overview.csv` — IMPRESSIONS / PAGE_VIEWS 比を W26 基準 (1856/2616 = 0.71) と比較。viewability (67.7%) の悪化有無も併記
- **判定**: effect/pending (2026-08-02、ANCHOR-01 とモバイル系統一括)
- **未確定 / 仮説**: [仮説] viewability は「表示後に見られたか」の指標のため発火前倒しの悪影響は限定的。2026-08-02 に viewability が 60% を割っていたら rootMargin を 400px に戻して再計測

### [ADSENSE-FOOTER-02] footer 低効率枠の Multiplex 化

- **デプロイ日**: 2026-07-03 (全て)
- **変更**: `types.ts` に `multiplex` format + AD_SIZES 追加、`AdSenseAd.tsx` に `data-ad-format="autorelaxed"` 描画分岐 (minHeight 300px 予約で CLS 防止)、`AdSensePlaceholder.tsx` flexible 扱い、`constants.ts` の `RANKING_PAGE_FOOTER` / `CONTENT_FOOTER` を Multiplex (slot 6137206504・横長・レスポンシブ) に差し替え。両 footer は同一ページに同時表示されないため 1 slot 共用
- **想定効果**: footer 系 viewability 49.1% / 26.2% → 60%+ [根拠: コンテンツ末尾は「読み終えた読者」が滞留する位置で、関連コンテンツ型グリッドは通常レクタングルより滞在・操作を誘発する形式 (定量根拠なし=仮説)]
- **検証コマンド**: `cat snapshots/<week>/units.csv` — footer 系ユニット行の viewability / 収益を before (W26: content-footer ¥3/49.1%、stats47-ranking ¥2/26.2%) と比較
- **判定**: pending (差し替えデプロイ後 4 週)

### [ADSENSE-PAGES-DATA-01] ページ別収益データの取得修正 (pages.csv 空)

- **デプロイ日**: 2026-07-03
- **原因 (実証済)**: PAGE_URL breakdown はページ毎に最低インプレッション閾値未満の行を返さない仕様 (Google 公式: https://support.google.com/adsense/answer/11988478 アクセス 2026-07-03)。API はエラーでなく 0 行を返すため気づかれなかった。週 1,856 imp を多数ページに分散する現状では 7 日窓で全ページ閾値未満
- **変更**: `.claude/scripts/metrics/fetch-adsense-snapshot.mjs` — pages ジョブのみ 30 日窓 (`days: 30`)、他ジョブは 7 日窓のまま
- **検証コマンド**: 次回週次 cron (`fetch-metrics-weekly.yml`、日曜 JST 20:00) 後に `wc -l .claude/skills/analytics/adsense-improvement/reference/snapshots/<week>/pages.csv` — 行数 > 1 (ヘッダのみ=1) を確認
- **判定**: effect/pending (2026-07-12)
- **未確定 / 仮説**: [仮説] 30 日窓でも 0 行なら現在のトラフィック規模で閾値未達が確定。その場合はページ別最適化は units.csv (テンプレート別) を代理指標として継続し、トラフィック増後に再確認

---

### [ADSENSE-LAZYLOAD-02] lazy-load 発火閾値のデバイス別化 (LAZYLOAD-01 の部分ロールバック)

- **デプロイ日**: 未 (実装 2026-07-12・feature ブランチ、未デプロイ)
- **背景 (実証済)**: ADSENSE-LAZYLOAD-01 で rootMargin を全デバイス一律 600px にしたが、W26→W27 実測 (`snapshots/2026-W27/devices.csv`) で逆効果が確定:
  - モバイル: imp 337→724 (+115%)・viewability 57.3%→39.1%・earnings ¥27→¥29 (+7%) = 倍増した imp はほぼ無価値
  - 全体: imp 1856→2675 (+44%)・earnings ¥139→¥128 (-8%)・RPM ¥53→¥45・viewability 67.7%→60.9% = impression dilution
  - デスクトップ: RPM ¥66→¥50・earnings ¥110→¥95 (imp は 1502→1844 に増えたのに収益減)
- **変更**: `apps/web/src/lib/google-adsense/components/AdSenseAd.tsx` — rootMargin 未指定時にデバイス別デフォルト (`DESKTOP_ROOT_MARGIN_PX=600` / `MOBILE_ROOT_MARGIN_PX=250`、判定は effect 内で `window.matchMedia("(max-width:767px)")`)。明示指定時はその値を優先。`types.ts` JSDoc 更新。呼び出し元で rootMargin を明示している箇所は無い (全 AdSense ユニットが対象)
- **想定効果**: モバイル viewability 39.1% → 55%+ [根拠: 250px は LAZYLOAD-01 前の閾値で、当時 (W25/W26) モバイル viewability は 57.3%]。viewable-CPM 回復で全体 RPM の下げ止まり〜W24 ピーク (¥55) 復帰
- **検証コマンド**: デプロイ 2 週後に `cat .claude/skills/analytics/adsense-improvement/reference/snapshots/<week>/devices.csv` — High-end mobile 行の viewability を W27 (39.1%) と比較。全体は `overview.csv` の viewability を W27 (60.9%) と比較。imp/PV が下がりすぎ (< 0.7) ていないかも監視
- **判定**: pending (モバイル系統一括で 2026-08-02。本施策は LAZYLOAD-01 の部分ロールバックのため交絡群に含める)
- **未確定 / 仮説**: [仮説] viewability 回復で CPM が戻り earnings が改善する。2026-08-02 に viewability が W27 の 39% から回復していなければ、モバイルのアンカー広告 (ANCHOR-01) との共食いを units.csv で確認する

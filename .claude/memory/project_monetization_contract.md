# 収益化の恒久判断 (2026-09-20)

収益モデルの正典は `docs/00_プロジェクト管理/02_収益化戦略.md`、広告実装の正典は
`.claude/rules/affiliate-ads-standards.md`。ここには「次のセッションが知らないと誤る」恒久事実だけを置く。

## 1. AdSense は恒久停止 (再開しうる前提で設計しない)

- **問題**: 停止中という一時状態として書かれた成果物が 14 件あり、週次で無駄に計測手順が回り、
  「いつ再開するか」の判断が毎週持ち越されていた。
- **原因**: 金額の規模を確認せずに「広告収益レーン」として扱い続けたこと。停止直前の通常週
  (2026-W33) は収益 ¥118 / 3,152 PV でページ RPM ¥37。現在のトラフィック (GA4 週 11,090 PV) に
  当てても月 ¥1,400〜1,800 にしかならない。
- **対策**: オーナー判断 (2026-09-20) で恒久停止。`ADSENSE_DISPLAY_ENABLED`
  (`apps/web/src/lib/google-adsense/constants.ts`) は false 固定。再開を前提とした配置原則・
  週次計測手順・改善ループは撤去する。
- **証拠**: `.claude/state/metrics/adsense/history.csv` の 2026-W33 / W34 行。本番反映は
  2026-08-29 (PR #849)。

## 2. NSM は週次収益であって PV ではない

- **問題**: 2026-09 に検索流入が 4 週で倍増した一方、収益がいくらかを言える状態になかった。
- **原因**: アフィリエイト観測が 2026-08-28 で止まり、週次 cron は緑のまま observation を
  残していなかった。誰も見ない state ファイルの中でだけ止まっていたため 3 週間気づかなかった。
- **対策**: 週次メトリクス Issue に「週次収益 (NSM)」節を出し、欠測は 0 円ではなく
  「判定不能」と印字する。PV は先行指標であって NSM ではない。
- **証拠**: `.claude/state/ads/ga4-affiliate-history.csv`、`docs/00_プロジェクト管理/02_収益化戦略.md` §1。

## 3. アフィリエイトの評価は確定収益 / 1,000 viewable impression

- **問題**: 2026-08-10〜09-06 の 28 日で impression 26,674・click 13 (CTR 0.049%)。
  impression / pageview は 0.76 で、出稿量ではなく出し方が失敗していた。
- **原因**: デスクトップの右レールが impression の大半を消費し CTR 0.0197% (モバイル 0.137% の
  7 分の 1)。加えて意図が解決しない面でもカテゴリ写像へフォールバックして広告を出していた。
- **対策**: 在庫を増やさず表示量を減らし、意図が解決しない面では配信しない。評価はクリック数では
  なく確定収益 / 1,000 viewable impression。priority は期待収益順 (A8 の `epcYen × confirmRatePct`
  は初期値で、自サイトの確定収益が溜まったら置き換える)。
- **証拠**: `.claude/state/metrics/affiliate-placement-baseline-2026-09-08.json`、
  `.claude/state/ads/a8-catalog.json` (登録済み 120 件中 118 件に epcYen と confirmRatePct)。

## 4. GA4 の `affiliate_vertical` は広告自身の vertical を送る

- **問題**: impression の約 29% が `other`、約 31% が `economy` として記録され、意図軸別 CTR で
  配置判断ができなかった。
- **原因**: 描画コンポーネントがページ文脈の prop を計測値として送り、広告自身の vertical を
  捨てていた (加えて blog 手動バナーの category 未指定と楽天カードの economy 固定)。
- **対策**: 解決層が vertical を確定させ描画側はそれを渡す。契約テスト
  `apps/web/src/features/ads/__tests__/affiliate-vertical-label-contract.test.ts` が
  components 全件を静的走査して再発で落とす。是正日を境に vertical 別の時系列は連続しない。
- **証拠**: 上記契約テストと `.claude/rules/affiliate-ads-standards.md` §6.1。

## 5. 収益の本線は広告ではなく行政実務向け商品

広告レーンを全部うまくやっても月 1〜2 万円が上限である (上記 1・3 の実測から)。伸びしろは
`ADMIN-STAT-PILOT-01` の行政資料商品にあり、その読者はすでに来ている
(`/blog/assembly-answer-chatgpt-5steps` は CTR 13.1%、`/blog/local-government-debt-burden` は
28 日で 425 clicks)。**広告の改善を商品検証の前提条件にしない。**

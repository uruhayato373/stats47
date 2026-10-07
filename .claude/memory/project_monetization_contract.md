# 収益化の恒久判断 (2026-09-20、2026-10-07 更新)

収益モデルの正典は `docs/00_プロジェクト管理/02_収益化戦略.md`、広告実装の正典は
`.claude/rules/affiliate-ads-standards.md`。ここには「次のセッションが知らないと誤る」恒久事実だけを置く。

## 1. AdSense は 9/20 に恒久停止 → 9/28 に維持費の相殺として再開を決定 (新アカウントの審査待ち)

- **2026-09-28 の決定 (現行)**: オーナーは恒久停止を改め、Cloudflare の維持費 (月 ¥1,556〜1,846) を相殺する目的で再開する。
  個人のお支払いプロファイルで新アカウントを申請中で、承認まで `ADSENSE_DISPLAY_ENABLED` は false。承認後も自動広告は
  オフで手動枠だけ。手順と停止条件は backlog `ADSENSE-RESTART-01`。**「AdSense は恒久停止」と答えない** (2026-10-07 に
  収益化戦略 §3.1 の古い記述だけを見てそう答え、オーナーの決定と食い違った)。
- **見込みの注意**: AdSense の「ページ RPM ¥37」は AdSense 自身が数えた PV (GA4 の 54〜78%) が分母。GA4 の PV で割り直すと
  停止前 W30〜W33 は 1,000 PV あたり ¥22、W31 の手動枠分だけなら ¥6.7。GA4 の PV 目標の換算に ¥37 を使わない
  (2026-10-07 に「月¥1万 = 27万PV」と誤算した。正しくは約45万 PV、手動枠だけなら約150万 PV)。KPI は `site-pageviews` と `ad-yield`。
- **経緯**: 9/20 の恒久停止は、停止直前の W33 (¥118 / AdSense の数えた 3,152 PV) から上限金額が読者体験に見合わないと
  判断したもの。凍結記録は `data/adsense/history.csv`、本番から外したのは 2026-08-29 (PR #849)。

## 2. NSM は週次収益であって PV ではない

- **問題**: 2026-09 に検索流入が 4 週で倍増した一方、収益がいくらかを言える状態になかった。
- **原因**: アフィリエイト観測が 2026-08-28 で止まり、週次 cron は緑のまま observation を
  残していなかった。誰も見ない state ファイルの中でだけ止まっていたため 3 週間気づかなかった。
- **対策**: 週次メトリクス Issue に「週次収益 (NSM)」節を出し、欠測は 0 円ではなく
  「判定不能」と印字する。PV は先行指標であって NSM ではない。
- **証拠**: `data/affiliate/ga4-affiliate-history.csv`、`docs/00_プロジェクト管理/02_収益化戦略.md` §1。

## 3. アフィリエイトの評価は確定収益 / 1,000 viewable impression

- **問題**: 2026-08-10〜09-06 の 28 日で impression 26,674・click 13 (CTR 0.049%)。
  impression / pageview は 0.76 で、出稿量ではなく出し方が失敗していた。
- **原因**: デスクトップの右レールが impression の大半を消費し CTR 0.0197% (モバイル 0.137% の
  7 分の 1)。加えて意図が解決しない面でもカテゴリ写像へフォールバックして広告を出していた。
- **対策**: 在庫を増やさず表示量を減らし、意図が解決しない面では配信しない。評価はクリック数では
  なく確定収益 / 1,000 viewable impression。priority は期待収益順 (A8 の `epcYen × confirmRatePct`
  は初期値で、自サイトの確定収益が溜まったら置き換える)。
- **証拠**: `data/affiliate/affiliate-placement-baseline-2026-09-08.json`、
  `data/affiliate/a8-catalog.json` (登録済み 120 件中 118 件に epcYen と confirmRatePct)。

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

## 6. 雑学の情報そのものは売れない。回収は 3 経路 (2026-10-07 オーナー整理)

- **問題**: 雑学 (食べ物の消費量・意外な 1 位) は検索流入の最大のかたまり (W40 の 28 日でクエリが分かるクリックの 31%) なのに、
  note のランキング型有料記事 47 本は通算売上 ¥0、ブログ 64 記事から Kindle への案内は 28 日 3,901 PV で 1 クリックだった。
- **原因**: 検索で来た読者は 1 つの事実を確かめて離れ、同じ事実にお金を払う理由がない。SNS のフォロワーという関係もない
  (1 投稿の中央値は X の表示 70、Instagram のリーチ 45)。支払いの実績は Claude Code の実務記事 3 件 (¥900) だけ。
- **対策**: 回収経路を (a) アクセス集客の換金 (AdSense の再開と文脈一致の物販) (b) AI×公的統計の実務ノウハウ商品
  (note で販売) (c) コンテンツ販売 = KDP の 3 つに絞る。商品の集客は販売先の中 (note・Amazon) で行い、stats47 の
  雑学の流入を商品へ誘導する前提を置かない。ノウハウ商品で「稼げる」を売り文句にしない (収益実績が無く情報商材と同じになる)。
- **証拠**: 収益化戦略 §3.5、`data/note/dashboard/`、`data/ga4/snapshots/2026-W40/`、backlog `KNOWHOW-PRODUCT-PILOT-01` /
  `NOTE-FREE-DEFAULT-01` (note は無料が基本・有料はノウハウだけ。2026-10-07 オーナー決定) / `KDP-EXPANSION-01`。

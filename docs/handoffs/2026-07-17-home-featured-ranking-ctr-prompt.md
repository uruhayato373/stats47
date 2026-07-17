---
type: session-handoff
date: 2026-07-17
status: active
tags: [home, featured-ranking, ctr, claude-code, implementation-prompt]
---

# Claude Code実装プロンプト: ホーム注目ランキングCTR改善

以下のコードブロック全体を、stats47リポジトリのルートで開いたClaude Codeへ渡す。

````text
Output Format:
- 最初に「成功条件 / 変更対象 / 変更しない対象 / 検証計画」を20行以内で提示する。
- Phaseごとに「完了 / 検証済み / 残り」を短く報告する。
- 最終報告は「結果 / 主な変更 / 実験仕様 / 検証結果 / 未実行・残リスク / 変更ファイル」の順にする。
- 失敗した検証、fallback、未検証、本番未反映を隠さない。

BEHAVIOR CONTRACT:
- 結論先行: 最初に何を実装するかを明示する。
- 即行動: 必読資料と現行コードを確認したら、計画だけで終了せず実装する。
- 進捗の実証: PASSの主張はcommand結果またはlocalhost実測と突合する。
- スコープ規律: ホーム注目ランキングCTR改善に不要なrefactorやdependency追加をしない。
- ターン終了規律: 「次に実装します」で終わらず、受入条件まで進める。
- 境界: R2 write、commit、push、PR、deploy前に停止する。

TASK:
stats47.jpホームの「注目のランキング」を、問い・比較・勢力図・TOP3を使った
editorial cardへ改善し、現行表示との50/50実験とカード単位のGA4計測を実装してください。

外部の画像生成AI、Gemini、Remotion、静的PNG/WebPは不要です。使用する可視化は、
既存R2観測値から決定的に生成されるタイル地図SVGだけです。新しい画像R2 keyや
画像生成pipelineを作らないでください。

最初に必ず全文を読む:
1. `CLAUDE.md`
2. `.claude/memory/MEMORY.md`
3. `.claude/rules/coding-standards.md`
4. `.claude/rules/ui-components.md`
5. `.claude/rules/chart-component-standards.md`
6. `.claude/rules/local-environment.md`
7. `.claude/rules/branch-workflow.md`
8. `.claude/rules/browser-use-cleanup.md`
9. `.claude/rules/docs-vs-issues.md`
10. `.claude/rules/agent-output-contract.md`（Agent toolを使う場合）
11. `docs/01_技術設計/07_情報設計.md` Part 3
12. `docs/01_技術設計/12_完全DBレス設計.md`
13. `docs/01_技術設計/15_デザインシステムSSOT.md`
14. `docs/02_実装計画/28_ホーム注目ランキングCTR改善仕様.md`

現行コードを必ず読む:
- `apps/web/src/app/page.tsx`
- `apps/web/src/features/ranking/components/FeaturedRankings/index.tsx`
- `apps/web/src/features/ranking/components/FeaturedRankingCard/index.tsx`
- `apps/web/src/features/ranking/components/FeaturedRankings/RankingThumbnail.tsx`
- `apps/web/src/features/ranking/utils/resolve-thumbnail-variant.ts`
- `apps/web/src/features/ranking/utils/__tests__/resolve-thumbnail-variant.test.ts`
- `apps/web/src/components/surface/SurfaceCard.tsx`
- `apps/web/src/lib/analytics/events.ts`
- `apps/web/src/lib/analytics/__tests__/events.test.ts`
- `apps/web/src/features/ads/components/VariantAdSlot.tsx`（sticky割当の参考のみ）
- `apps/web/src/features/ads/components/AdImpressionTracker.tsx`（impression条件の参考のみ）
- `packages/data-configs/src/types.ts`
- `packages/data-configs/src/index.ts`
- `packages/data-configs/src/registry.ts`
- `packages/ranking/src/types/ranking-item.ts`
- `packages/ranking/src/exporters/ranking-items-per-url-snapshot.ts`
- `packages/ranking/src/repositories/ranking-item/read-ranking-items-snapshot.ts`
- `packages/ranking/src/scripts/export-master-snapshots.ts`

開始前:
- `git status --short`を確認し、既存の未コミット変更を記録する。
- 他セッションの変更を修正、削除、整形、stash、commitしない。
- 特に本タスク以前から存在する`.claude/state/`、note、blog draft、buzz-map関連差分へ触れない。
- 現行ホームをdesktopと390pxで確認し、controlのスクリーンショットは`/tmp/`へ保存する。
- browserを使った場合は終了時にdaemonとtabをcleanupする。

成功条件:
- `docs/02_実装計画/28_ホーム注目ランキングCTR改善仕様.md`のPhase 1〜4を実装する。
- ホーム専用のgit TS設定を追加し、metric title/seoTitleとは別にhookとvariantを管理する。
- variantは`question / comparison / territory / top-three`の4種類。
- 現行`map/number`はcontrolとして維持する。
- 同一browserを`home-featured-v1`のcontrol/editorialへ50/50でsticky割当する。
- mount前は固定高さplaceholderを表示し、CLSを発生させない。
- `home_featured_impression`と`home_featured_click`を正しいparameterで送る。
- impressionは50%以上・1秒表示・cardごとに1回だけ。
- 旧R2 snapshotで壊れず、必要payload不足ならcontrolへfallbackする。
- 新snapshotではホーム表示時の追加values fetchが0になる設計。
- 新規PNG/WebP、画像URL、AI画像生成、Remotion実行が0。
- mobile/desktop/light/dark、keyboard focus、console error 0を確認する。
- unit test、type-check、design-system checkを通す。

実装順:

Phase 1: 計測
1. `events.ts`へ`trackHomeFeaturedImpression`と`trackHomeFeaturedClick`を追加する。
2. payloadは`ranking_key / card_variant / slot / experiment_id /
   experiment_variant / link_position=home_featured`。
3. gtag未定義時はnoop。
4. ranking feature内にIntersectionObserver trackerを作る。
5. 50%・1秒・1回・離脱timer解除・unmount cleanupをunit testする。
6. 現行controlでもimpression/clickが取れる状態にする。

Phase 2: configとsnapshot
1. `packages/data-configs/src/home-featured-rankings.ts`を追加する。
2. `HomeFeaturedCardVariant`と`HomeFeaturedRankingDefinition`を型定義する。
3. 現行8指標を同じ順番で登録し、仕様書§4.3のhook/variantを使う。
4. hookへ未算出の数値や年度を固定埋め込みしない。
5. key/order/registry/isActive/prefecture/hook lengthを決定的にvalidateするtestを追加する。
6. `FeaturedRankingItem`へoptionalの`featuredBottom / featuredTopThree /
   homeFeatured`を追加する。旧snapshot互換を壊さない。
7. exporterを`HOME_FEATURED_RANKINGS`順にし、1回のvalues readからtop/bottom/top3/mapを作る。
8. null除外、tieの実rank保持、3件未満、map生成失敗をtestする。
9. exporterの派生処理をpure helperへ切り出し、R2を書かないfixture testで検証する。

Phase 3: UI
1. card外枠は`SurfaceLinkCard`を使う。独自card border/shadowを再実装しない。
2. presentational visualを`question / comparison / territory / top-three`へ分ける。
3. hook最大2行、数値は`font-mono tabular-nums`、年度・単位・実rankを表示する。
4. comparisonはtop/bottomを表示し、初期実装でratioを出さない。
5. territoryは既存`tileMapSvg`だけを使い、色だけで意味を伝えない。
6. top-threeは表彰台画像ではなく3行の順位リストにする。
7. payload不足時は現行controlへfallbackする。
8. `dangerouslySetInnerHTML`には既存trusted SVG generatorの文字列だけを渡す。
9. 2列mobile/4列desktopの基本gridはV1で変えない。テーマとレイアウトを同時に変えない。

Phase 4: experiment
1. ranking feature内に`FeaturedRankingExperimentGrid`をClient Componentとして追加する。
2. localStorage keyは`stats47_exp_home_featured_v1`。
3. 初回50/50、以後sticky。localStorage例外時もcrashしない。
4. SSR/初期mountは固定高さplaceholderでgrid領域を確保する。
5. cookie参照でhomeをdynamic化しない。`suppressHydrationWarning`で隠さない。
6. control/editorial双方でexperiment parameterを送る。
7. assignment純関数、sticky再利用、例外耐性をtestする。

後方互換:
- `homeFeatured`欠損はcontrol。
- questionはfeaturedTop必須。
- territoryはtileMapSvg + featuredTop必須。
- comparisonはfeaturedTop + featuredBottom必須。
- top-threeは3件必須。
- localhostが旧snapshotの場合のみ不足itemをvalues fetchでin-memory補完してよい。
- 新snapshot反映後は追加fetch 0になることをコード/testで保証する。

実装しないもの:
- Experiment V2のGSC需要テーマへの入れ替え（仕様書§10は次の実験候補のみ）
- AI画像、写真、イラスト、OGP、SNS素材
- `apps/remotion`変更
- ranking詳細ページ変更
- category/surveyカード再設計
- 新CMS、DB、JSON SSOT
- dependency追加
- 無関係なrefactor

必須test:
- config validation
- exporter derived values
- old snapshot fallback
- visual resolver全variant
- click/impression payload
- impression 50%/1秒/cleanup
- sticky experiment assignment
- localStorage例外
- card hrefとfallback

検証command:
```bash
npm run test:run --workspace packages/ranking -- <対象test>
npm run test:run --workspace apps/web -- <対象test>
npm run type-check --workspace packages/ranking
npm run type-check --workspace apps/web
npm run design-system:check --workspace apps/web
```

localhost確認:

- `npm run dev:web`をbackgroundで起動し、Readyをpollingする。
- `http://127.0.0.1:3000/`が200になること。
- control/editorialをそれぞれ表示する。QAのためのoverrideを作る場合はdevelopment限定にする。
- desktopと390px、light/darkを確認する。
- browser console error 0。
- card link先が200。
- networkに本施策由来のPNG/WebP fetchがない。
- gridの高さがvariant確定前後で変わらない。
- screenshotは`/tmp/`に保存し、リポジトリへ追加しない。
- 終了時にdev server/browser daemon/tabを停止する。

R2と外部操作:

- `export-master-snapshots.ts`はR2 writeするため実行しない。
- R2 snapshot反映はunit fixtureで代替検証し、未実行と報告する。
- GA4 custom dimension登録は管理画面の人間タスクとして報告するだけ。
- commit、push、PR、deployを行わない。
- 本番ページを変更しない。

ドキュメント更新:

- ranking featureの近接READMEへ、home設定SSOT、variant、fallback、event名を追記する。
- `docs/todo/02_機能バックログ.md`の`HOME-FEATURED-CTR-01`を実装結果に合わせて更新する。
- `docs/02_実装計画/28_ホーム注目ランキングCTR改善仕様.md`は、全受入条件を満たした場合だけstatusをcompletedへ変更する。
- R2未反映・本番未deployは、コード実装が完了しても明記する。

Agent toolを使う場合:

- modeは`bypassPermissions`。
- prompt冒頭へOutput FormatとBehavior Contractを置く。
- 同じファイルを複数agentへ同時編集させない。
- reviewerへは差分レビューを依頼し、無関係な修正を許可しない。

完了条件を満たすまで実装と検証を反復してください。最終報告後は、R2 write、
commit、push、PR、deployをせず停止してください。

````

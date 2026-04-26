# GSC 改善ログ

GSC（Google Search Console）の継続的追跡と改善施策の記録。

> **2026-04-25**: 推測ベース判定の根絶ルール（`.claude/rules/evidence-based-judgment.md`）に基づく rewrite 後の新しい log。旧版は `archive/improvement-log-until-2026-04-21.md` 参照。

**運用ルール:**
- Append-only。過去エントリは改変しない
- 日付は絶対日付（YYYY-MM-DD）
- 数値はソース明示（例: 「URL Inspection 2026-04-25 取得 / `.claude/state/metrics/gsc/url-inspection/2026-04-25.csv`」）
- 施策とコミット hash をペアで記録
- snapshot ディレクトリは本ログと一緒にコミット
- **想定効果は必ず根拠を併記**（過去事例 / Google 公式ガイド / 計算式）
- **実測値は取得コマンドへのリンク併記**

## 新規エントリテンプレ（必ず参照: `.claude/rules/evidence-based-judgment.md`）

```markdown
### [PHASE-NN] タイトル
- **デプロイ日**: YYYY-MM-DD / コミット: <hash>
- **想定効果**: <定量値> [根拠: <データ源 or 過去事例リンク>]
- **検証コマンド**: <curl / wrangler / API 呼び出し>
- **実測 (before)**: <値 + 取得日 + 取得コマンド>
- **実測 (after)**: <値 + 取得日 + 取得コマンド>
- **判定**: effect/* [根拠: 実測 / 想定 = X%、経過 N 日]
- **未確定 / 仮説**: <あれば「[仮説] 〜 / 検証期日 YYYY-MM-DD」形式>
```

## 実証チェックリスト（effect/* ラベルを付ける前に必須）

参照: `.claude/rules/evidence-based-judgment.md`

- [ ] URL Inspection API daily で coverageState 別件数の前後比較を取った
- [ ] 仕様主張がある場合、Google 公式ドキュメント URL を引用した
- [ ] 比較対象（before / after / baseline）が明確
- [ ] NG ワード（「のはず」「兆候」「浸透待ち」等）を使っていない
- [ ] 効果が想定の 80% 未満なら、未達理由仮説と次の検証コマンドを書いた

未満なら effect/full / effect/partial を付けない。effect/pending のままにすること。

---

## Action Log

### [PHASE-9] middleware + sitemap ゼロベース再構築

- **デプロイ日**: 2026-04-26 / コミット: `b4b7a31c` (P0) + `bb4303e9` (P1) + `4dec30e5` (P2-A) + `0ec26659` (P2-B+C) + `e97b6db7` (smoke-test fix)
- **PR**: #121 (本体 4 commit) + #122/#123/#125 (hotfix)
- **背景**: 9 個の累積 Fix で middleware/sitemap の整合性が破綻、Google から「設計が定まっていないサイト」と判定。批判レビュー (2026-04-26) で 7 致命傷を特定:
  1. `gone()` の `Cache-Control: no-store` がクロール予算を 410 群に吸収
  2. 削除シグナルが 410/200+noindex/200 に分裂
  3. 301→410 リダイレクトチェーン
  4. sitemap 重複 URL 3 件 (manufacturing-net-value-added-private 等)
  5. lastmod が bulk timestamp で全件同一 → Google が無視
  6. INDEXABLE_AREA_CATEGORIES が middleware [population, economy] vs sitemap [population] で乖離
  7. KNOWN_*_KEYS が 28 日古い、自動同期なし

- **施策内容**:
  - **P0**: `gone()` を `public, max-age=86400, s-maxage=604800` + `X-Robots-Tag: noindex` / sitemap 重複排除
  - **P1**: UrlPolicy データ層導入 (`apps/web/src/lib/url-policy.ts`) + middleware 4 セクション再構築 + 301→410 解消 + lastmod 戦略変更（ranking 削除 / blog は published_at 固定 / tag は集計）
  - **P2-A**: KNOWN_*_KEYS 自動同期 workflow (`.github/workflows/sync-known-keys.yml`、毎日 JST 07:00)
  - **P2-B**: middleware で RSC 以外の Vary を `Accept-Encoding` のみに最小化
  - **P2-C**: sitemap index 化、8 segment (static/themes/areas/ranking/blog/categories/surveys/tags) 分割

- **想定効果**: クロール予算 -40%（業界実績、CDN cacheable 410 化）→ 1 ヶ月で「クロール済み未登録」-3,000 〜 -5,000 件
  [根拠: Google 公式 https://developers.google.com/search/docs/crawling-indexing/http-caching + Phase 6 既存施策の URL Inspection API 観測パターン]

- **検証コマンド**:
  ```bash
  # P0: 410 cache control
  curl -sI https://stats47.jp/dashboard/13000 | grep -iE "cache-control|x-robots"

  # P1: 301→410 解消
  curl -s -L -o /dev/null -w "%{http_code} hops:%{num_redirects}\n" \
    https://stats47.jp/ranking/prefecture/non-existent-key

  # P2-B: Vary 最小化
  curl -sI https://stats47.jp/ | grep -i "^vary:"

  # P2-C: sitemap index
  curl -s https://stats47.jp/sitemap.xml | head -15

  # 全体効果: URL Inspection daily の coverageState 別件数推移
  cat .claude/state/metrics/gsc/url-inspection/LATEST.md
  ```

- **実測 (before, 2026-04-25 baseline)**:
  - URL Inspection 301 URL サンプル: PASS 206 / クロール済未登録 27 / 検出未登録 16 / 404 40
    取得: `.claude/state/metrics/gsc/url-inspection/2026-04-25.csv`
  - GSC 全体 (W17): Clicks 424 / Impressions 14,373 / CTR 2.95% / Avg Pos 10.50
    取得: `.claude/state/metrics/gsc/LATEST.md`
  - 登録済み 1,860 / 未登録 16,628 / 5xx 2,047 (W17 snapshot)

- **実測 (after, デプロイ直後 2026-04-26)**:
  - **本番動作確認**: 全 5 項目想定通り動作（PR #121 コメント参照）
    - `cache-control: public, max-age=86400, s-maxage=604800`
    - `x-robots-tag: noindex`
    - `vary: Accept-Encoding`
    - sitemap index 8 segment 完備
    - sitemap 重複 0 件
  - **GSC 効果反映**: URL Inspection daily で観測予定（4/27 早期警戒 / 5/02 中間判定 / 5/09 W18 終了判定）

- **判定**: effect/pending [根拠: デプロイ直後、Google 反映観測未完]
  - 早期警戒: 4/27-28 で再クロール件数 / 日 > 5
  - 5/02 cutoff 目標: 登録済 > 2,000 (+140) / 未登録 < 14,500 (-2,128)
  - 5/09 cutoff 目標: 登録済 > 2,300 / 未登録 < 12,000

- **未確定 / 仮説**:
  - **[仮説]** Cache-Control: public 化により Google のクロール頻度が下がり、新コンテンツへ予算が回る
    検証コマンド: `node .claude/scripts/gsc/url-inspection-daily.cjs` で再クロール件数の日次推移
    検証期日: 2026-05-09
    期日後判定: 再クロール件数 > 50/日 なら仮説支持、< 10/日 なら仮説棄却

  - **[仮説]** sitemap index 化により Google が segment ごとに submission を認識し、ranking 338 / blog 121 / areas 141 のうちどこが詰まっているか分離可能
    検証: GSC ダッシュボードの「サイトマップ」セクションで各 sitemap-{n}.xml の登録進捗を観測
    検証期日: 2026-05-02

### [PHASE-9-FOLLOWUP] Cloudflare token 集約 + Smoke Test cascade fix

- **対応日**: 2026-04-26 / コミット: `e97b6db7`
- **内容**:
  - Cloudflare API token を「stats47」1 個に集約（D1 Edit + R2 Storage Edit + Pages Edit + Account Settings Read）
  - 旧 token 7 個を Cloudflare ダッシュボードから削除
  - GitHub Actions の PR 作成 permission を有効化（`gh api -X PUT /repos/.../actions/permissions/workflow`）
  - Phase 9 デプロイで smoke-test の `/areas/01000/landweather` 200 期待が 410 仕様と矛盾し失敗 → smoke-test を 410 期待に修正 + `population` ケース新設

- **教訓**: middleware 仕様変更時は **post-deploy smoke test を事前更新** すること（→ knowledge 記録: 「Phase 9 deploy が smoke-test を破壊した cascade」）

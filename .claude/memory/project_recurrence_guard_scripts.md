---
name: 再発防止 guard スクリプト一覧
description: stats47 プロジェクトの過去事故由来 guard スクリプト群。新規スキル / refactor / デプロイ時に参照する
type: project
originSessionId: dfec608a-a637-4fdf-b949-56d68f37fcb8
---
過去に発生した事故の再発を機械的に防ぐため、`.claude/scripts/lib/check-*.cjs` に guard スクリプトを置いている。`/deploy` Step 2 で自動実行されるほか、関連スキルからも個別に呼ばれる。

**Why**: SKILL.md の手順や CLAUDE.md の規約だけでは Sonnet/Opus がうっかり破るリスクが残る。検出可能なパターンは exit 1 で止める方が確実。

## 現在のスクリプト

| スクリプト | 検出対象 | 由来 (knowledge エントリ) | 呼び出し元 |
|---|---|---|---|
| `check-cover-overlap.cjs` (note配下) | note 記事 cover SVG の CJK テキスト bbox 重なり | 「note 記事 cover SVG で大きな数字テキストがリード文と重なる」(2026-04-18) | `edit-note-draft` 品質チェックリスト |
| `check-analytics-tag-strategy.cjs` | `GoogleAnalytics.tsx` の `<Script strategy="lazyOnload">` 混入 | 「GA4 の Script strategy を lazyOnload にすると PV が約 1/10 に収縮する」(2026-04-18) | `/deploy` Step 2 |
| `check-skill-required-sections.cjs` | 重要 SKILL.md からの platform セクション欠落 | 「SKILL.md からセクションを削除すると静かに機能が消える」(2026-04-18) | `/deploy` Step 2 |
| `check-ga-bot-anomalies.cjs` | GA4 pages.csv の bot 疑い行 (pv/user≥20 or avgDur≥600s) を `pages_suspicious.csv` に隔離 | 「GA4 の既知 bot フィルタは IAB リスト依存で独自スクレイパーを捕まえない」(2026-04-18) | `ga4-improvement` mode=observe |
| `check-youtube-post-budget.cjs` | `.claude/state/youtube-pause.json` が未来なら exit 1。投稿数上限: 既定は月1 (シャドウバン再発防止)、`.claude/state/youtube-experiment.json` があれば monthlyLimit/dailyLimit で上書き (2026-07-11〜量産実験 = 1日1本を JST 日/月枠で機械強制。`--schedule` 予約は公開予定日の枠で判定) | 「2026-03-24 以降の YouTube シャドウバン、2026-04-24 の復帰対応 (#88)。2026-07-11 量産実験モード」 | `/post-youtube`, `.claude/scripts/youtube/upload.js` main 先頭, `.github/workflows/youtube-upload.yml` (upload.js 経由) |
| `check-yearcode-format.cjs` | 同一 statsDataId 内で `ranking_items.latest_year.yearCode` の桁数が混在したら exit 1 | 「Phase 1 で漁業 11 件を 11 桁形式 (`"2023100000"`) で投入し、同 statsDataId の他指標 (4 桁) と不整合 → `/themes/fishery-marine` の map が silent failure (2026-04-26)」 | `/deploy` Step 2、`/register-ranking` Phase 6 |
| `check-published-drafts.cjs` | contents/blog/<slug> が存在し公開 SSOT `.local/r2/app/blog/<slug>/article.md` も存在 = 公開済み下書きの取り残しを exit 1（SSD 非接続時は skip） | 「publish-article 手順6（公開後の下書き削除）の skip で公開済み 6 件が contents/blog に残存し live(R2) と drift・退行リスク (2026-05-30)」 | `/deploy` Step 2、`/publish-article` 手順6 |
| `check-ad-placement.cjs` | 広告 7 検査: ①生 `AdSenseAd` 直叩き ②広告どうしの隣接（**条件付きブロックは隔てるものに数えない**）③`RailAdSlot` の rail 外使用 ④fluid はページ 1 枠 ⑤右レールの独立 scroll 禁止 ⑥右レール PR は登録済み画像バナーのみ ⑦参照ゼロの slot 定数 | 「2026-07-29 全 23 ルート広告棚卸し」+「2026-08-02 右レールに独立 scroll / 独自テキストPRが混在」 | `apps/web/scripts/pre-commit-checks.sh` §2.2.1、`pr-quality-check.yml` static-gates |

## レールの幅を外枠だけで検査しない (2026-11-11)

**問題**: 総人口・日照時間・ブログの右レールは外枠 316px のまま、通常カードが内容依存で 84〜294px に縮んだ。既存の本文/外枠の幅比テストは通っていた。

**原因**: shell 988px で grid から flex-col に変えると、残った `items-start` が縦の上揃えから横の左揃えに変わる。見出しの inline-size containment と truncate もカードを広げない。親の align-items だけを stretch にする A/B 操作で全カード 316px に戻ることを確認した。

**対策・証拠**: 列幅は `PageShell.tsx` の共通グリッド、表示境界は `globals.css` の `rail:` に一本化し、ArticleShell のレール内も grid のままにする。`apps/web/tests/smoke/rail-layout.spec.ts` は内側カードの実幅・広告原寸・横 overflow を、全レール利用テンプレートと各境界の前後、左メニュー開閉で測る。`rail-contract-audit.mjs` は個別の表示境界と RailCard の固定幅を検出する。正典は `docs/01_技術設計/04_デザインシステム.md` のレール UI 契約。

## 単一選択の切り替えが別の見た目になる (2026-11-11)

**問題**: 計算方法と地図の塗り方が同じ ToggleGroup を使っていても、選択背景・寸法が異なっていた。

**原因**: `RankingMapChartClient` の `data-pressed:bg-primary` など呼び出し側の上書きと、Button を並べる別実装が併存していた。プリミティブの共用だけでは使い方を統一できない。

**対策・証拠**: `SingleSelectToggleGroup` が標準の見た目と必須単一選択を所有する。既存 `design-system:check` から `selection-control-audit.mjs` を呼び、直接の組み立て・通常 Button の選択式・見た目の上書きを検出する。意図的な違反 fixture、操作テスト、`ranking-controls.spec.ts` の画面幅ごとの計算後スタイル比較で逆戻りを検査する。仕様はデザインシステムの「表示条件の単一選択」を参照。

## ページ出典と図の補足を重複させない (2026-11-11)

**問題**: ランキングの地図直下と本文末に同じ出典が出て、共通の出典一覧が上の線と余白も重ねていた。

**原因**: 旧 `SourceAttribution` の表示経路がページの `DataSourceList` 導入後も残り、編成統計と地図の出典メタもコードに直書きされていた。

**対策**: 図の下は条件・更新日、ページ出典は `DataSourceList` に集約する。調査は `surveys.master`、編成統計・地図は `provenance.reference-sources` のJSONをID参照する。既存 `data-source-contract.test.ts` に直書き・重複表示の検知、`ranking-controls.spec.ts` に境界幅での出典一意性・余白検査を追加した。指標→調査の配線は新しい対応表を作らず既存辞書・共通resolverを使う。

**補助出典の漏れ**: 主出典の紐付け監査が100%でも、年別 `supplementalSources` は保証されない。出典辞書の生成器が `metric.source` だけを読んでいたため、総人口の2025年分などが調査名に解決されなかった。生成入力に補助出典も含め、既存 `data-source-entries.test.ts` で全補助出典のIDが実在調査に解決することを検査する。

## カードの gap と子の margin を重ねない (2026-11-12)

**問題**: 商品詳細で導入文は左右余白なし、ヘッダーは16px、見本は20px、購入案内は24pxになり、本文・図・購入ボタンの間も24〜48pxへ膨らんだ。

**原因**: `SurfaceSection` は標準で16pxの内側余白と `gap-4` を持つ。ページ側の `p-5/p-6` と子の `mt-*` が重なっていた。また、説明文と複数カードを包む `space-y-6` の div は、`PanelGrid` の「カードを含むセルにはpaddingを付けない」条件に該当し、説明文だけ余白がなくなっていた。

**対策・証拠**: 商品共通ページから外側divと余白上書きを除き、文章とカードを共通格子の直接のセルにする。実寸は `responsive-layout.spec.ts` の商品3種 (見本あり/財政補足あり/書籍) × 4画面幅で、見出しとの左端一致と、子同士の距離が共通gapに一致することを検査する。`apps/web/src/app/products/[slug]/page.tsx` / `packages/components/src/surface/surface.tsx` / デザインシステムの Surface が正典。

## guard を書かない領域 (CodeQL が担う)

**正規表現の ReDoS は guard スクリプトにしない。** 2026-07-29 に掲載価値スコアで
polynomial ReDoS を 3 件出し、guard 化を検討したが**形状ベースの検出は成立しないと実測で確定**した:

- 「開き区切り + 否定クラス*」という同じ形状は repo 全体で **203 箇所**ある
  (`\[[^\]]*\]\([^)]*\)` の markdown リンク、`<tag[^>]*>` の HTML 走査など)。
  ほぼ全部が正当なので、形状で弾くと baseline が 200 件になり guard の意味が消える
- CodeQL は 3 件だけを報告し、同形状の残り約 200 件は報告していない。**その選別基準は未特定**。
  解析範囲の絞り込みではない (`languages: javascript,typescript` のみ・paths 設定なし)。
  「export された関数の引数だから」と一度書いたが**実測で否定した** — `.claude/scripts/**` は
  285 ファイル中 75 が export を持ち同形状も含むのに報告されていない。
  CodeQL のデータフロー解析の内部判断であり `check-*.cjs` では再現できない

### ★ゲートの実体を取り違えない (2026-07-29 に実際に取り違えた)

PR の check には **同名で別物の CodeQL が 2 つ**ある。`gh api repos/<o>/<r>/commits/<sha>/check-runs`
の `app` フィールドで判別する。

| check 名 | app | 挙動 |
|---|---|---|
| `CodeQL` | `github-advanced-security` | **これが落とす。** repo 設定側の code scanning で workflow ファイルは repo に無い |
| `Security Scan` | `github-actions` | `security-scan.yml`。CodeQL step は **`continue-on-error: true`**（「警告のみ、失敗させない」）なので**落とさない** |

PR #650 の high 3 件を止めたのは前者。`security-scan.yml` は同じ PR で success だった。
`docs/01_技術設計/06_自動化インベントリ.md` は後者しか載せず、トリガーも
「push to main + 毎週日曜」と書いている（実体は `pull_request: branches:[main]` も含む）。
**台帳を読んでも本当のゲートには辿り着けない。**

**関連する構造的な穴**: `lint` script を持つ workspace は **`apps/web` だけ**。
eslint 設定ファイルは `apps/admin` にもあるが lint script が無く `turbo run lint` で走らない。
`packages/**` は設定も script も無い。今回 ReDoS が入った `packages/data-configs/` も対象外なので、
`eslint-plugin-regexp` 等を足してもこの穴を埋めない限り同じ場所は守れない。

**移設時の注意**: 今回の 3 件は新規に書いたのではなく、旧 `home-featured-rankings.ts` で
既に CodeQL に flag されていた正規表現を移設で運んだもの。
**コードを別ファイルへ移すときは、移設元に open な code-scanning alert が無いか先に見る。**

## 配置場所

- 共有 (複数スキルから呼ぶ): `.claude/scripts/lib/check-*.cjs`
- スキル固有: `.claude/scripts/<domain>/check-*.cjs` (例: `.claude/scripts/note/check-cover-overlap.cjs`)

## How to apply

- 新しい事故が起きたら: (1) `/knowledge` に問題・原因・対策を記録 (2) 検出可能なら guard スクリプトを追加 (3) `/deploy` Step 2 や対象スキルから呼ばれるよう導線を整える
- guard が exit 1 で失敗したら: 修正してから再実行。デプロイ判断としては `/knowledge` の関連エントリを必ず参照
- 新スキル / refactor を書くときは、対象エリアの guard が存在するか先に確認する (本ファイルが索引)

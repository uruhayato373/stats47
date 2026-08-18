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
| `check-published-drafts.cjs` | docs/21_ブログ記事原稿/<slug> が存在し公開 SSOT `.local/r2/app/blog/<slug>/article.md` も存在 = 公開済み下書きの取り残しを exit 1（SSD 非接続時は skip） | 「publish-article 手順6（公開後の下書き削除）の skip で公開済み 6 件が docs/21 に残存し live(R2) と drift・退行リスク (2026-05-30)」 | `/deploy` Step 2、`/publish-article` 手順6 |
| `check-ad-placement.cjs` | 広告 7 検査: ①生 `AdSenseAd` 直叩き ②広告どうしの隣接（**条件付きブロックは隔てるものに数えない**）③`RailAdSlot` の rail 外使用 ④fluid はページ 1 枠 ⑤右レールの独立 scroll 禁止 ⑥右レール PR は登録済み画像バナーのみ ⑦参照ゼロの slot 定数 | 「2026-07-29 全 23 ルート広告棚卸し」+「2026-08-02 右レールに独立 scroll / 独自テキストPRが混在」 | `apps/web/scripts/pre-commit-checks.sh` §2.2.1、`pr-quality-check.yml` static-gates |

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

# ランキングページ コンテンツ標準 (ranking-content-standards)

`/ranking/<key>` ページの**コンテンツ構成・品質フロア・AI 解説文の生成パイプライン**の運用正典。
ranking の ai-content (考察/構造解釈/時系列/相関/FAQ/県別解説) を生成・是正する agent (`ranking-content-author`) /
critic (`ranking-content-critic`) / 人間はこれに従う。2026-07-12 に旧ランキング品質改修計画の
運用スペック（コンテンツ仕様・パイプライン・分業）を本 rule へ抽出し、運用 SSOT を `.claude/` に一本化した。旧版が必要な場合は Git 履歴を参照する。

> **役割分担**: 戦略・KPI 目標は `docs/00_プロジェクト管理/03_マーケティング戦略.md`
> （T1〜T4・成長レバー）。
> Wave 進捗・生成の状態は **ai-content 是正キュー** (`.claude/state/ai-content/` + `build-ai-content-queue.mjs`、
> memory `project_ai_content_remediation_queue`) と backlog (AICONTENT-02 / RANK-WAVE) が持つ。
> 本 rule は「どう構成し・どの品質床で・どう生成するか」の運用正典。

## 層別処方の原則 (全ページ一律にしない)

GSC 表示のあるランキングは全キーの ~40% で、imp の大半は Head 層 (imp≥50) に集中しかつ CTR が最低、という偏りがある。
**全ページ一律の「品質向上」は誤り。imp 層で処方を変える**:

| 層 | 目安 | 処方 |
|---|---|---|
| Head (imp≥50 & pos4-15) | 順位・CTR の問題 | §2 コンテンツ仕様をフル適用 (構造解釈フル) + seoTitle/description の CTR 改修 (1 件ずつ query 確認・一括禁止) |
| Torso (imp10-49) | 露出の問題 | 構造解釈は短縮版 (~200字) + 内部リンク強化 (category/theme/area 導線) |
| Zero (imp=0) | インデックス以前 | 内部リンク監査・thin metric は noindex 候補 (URL Inspection で index 率×thin 該当を検証) |

## コンテンツ仕様 (「データ表」から「解説付きリファレンス」へ)

1 ページあたりの固定セクション仕様:

| # | セクション | 字数目安 | データ源 |
|---|---|---|---|
| 1 | リード文 | 120-200字 | values.json (1位/最下位/格差倍率) + curiosity gap 1 文 |
| 2 | **構造解釈** ★最重要 | **300-500字** (Torso は ~200字) | 地理・産業・歴史で「なぜこの分布か」を説明 (blog archetype A の分析視点を移植) |
| 3 | 時系列ハイライト | 100-200字 | R2 `app/stats/<key>/values.json` 全年から「N年で◯倍」「順位逆転」抽出 |
| 4 | 相関の言語化 | 100-150字 | `app/correlation/by-ranking-key/<key>.json` の上位相関 + 相関≠因果 caveat |
| 5 | FAQ 6 Q&A | 既存 | `ai-content.json` (Q-DESIGN-01) |
| 6 | 定義・出典 | — | metric config `description`/`note` 整備 (`validate:config` 準拠) |

- **CTR 側 (title 不変)**: `metric-config-standards.md` 準拠で **title は正準名のまま** (年・注釈の焼き込みは lint error)。
  改修は `seoTitle` に curiosity gap パターン (なぜ/意外/倍率/vs)、`seoDescription` に緊張感セットアップ。
- **品質フロア (決定的 gate)**: ①数値 factual 照合 (本文の数値が R2 values と一致) ②構造解釈 ≥300字 (Torso ≥200字)
  ③NG ワードなし (`evidence-based-judgment.md`) ④ですます調 (`blog-quality-standards.md` 準拠)。
  検査は `audit-ai-content.mjs` (決定的ゲート)。

## 生成パイプライン (完全DBレス)

```
R2 values.json + correlation + metric config
  → Sonnet 生成 (既定はローカル CLI npm run ai:gen = haiku、TOKEN-AICONTENT-01)
  → 決定的 factual gate (生成文中の数値を R2 実値と照合・audit-ai-content.mjs)
  → critic (ranking-content-critic) 監査 → review.md
  → R2 app/ranking/<key>/ai-content.json (CI push: publish-ai-content.yml、develop push で発火)
```

- blog の `quality-gate.mjs` / blog-critic / `review.md` モデルを流用 (実装パターン再利用・drift 防止)。
- スクリプト配置は `.claude/scripts/ranking/` (`skill-code-placement.md` 準拠)。R2 書き込みは CI 専用 (`r2-storage-design.md`)。
- 「次に何を生成するか」の真実源は **ai-content 是正キュー** (`build-ai-content-queue.mjs` → `.claude/state/ai-content/`)。
  高流入 incomplete 優先。done は R2 の auditRow 通過で毎回再導出 (R2 が真実源・キューは派生)。

## Agent 分業

| 工程 | 担当 | 成果物 |
|---|---|---|
| 仕様・基準設計 / サンプル監査 / effect 判定 | Fable / improvement-triage | 仕様書・判定 |
| パイプライン実装・factual gate | Opus | スクリプト |
| 解説文生成・GSC 集計・内部リンク監査 | `ranking-content-author` (Sonnet/haiku) | ai-content.json・集計 |
| 意味レビュー (重複/読者価値/トーン) | `ranking-content-critic` | review.md |
| 数値照合・文字数床・リンク数 | 決定的スクリプト (audit-ai-content.mjs) | gate 結果 |

- トークン原則: 1 ページ生成 = 1 call + critic batch (10 件単位)。

## リスクと対処

| リスク | 対処 |
|---|---|
| AI 量産文の thin/doorway 判定 | パイロットで順位悪化も監視。下落時は即 rollback (R2 旧 ai-content 上書き push) |
| BLOG-WAVE と計測期間が重複し効果分離不能 | ranking と blog は URL 種別が違うため GSC page filter (`/ranking/`) で分離集計 |
| CTR 改修の seoTitle が検索意図とズレ pos 下落 | Head 層は 1 件ずつ query レポート確認後に改修 (一括禁止) |

## 関連

- 戦略・KPI: `docs/00_プロジェクト管理/03_マーケティング戦略.md`（T1〜T4・SEO品質レバー）
- ai-content 是正キュー: memory `project_ai_content_remediation_queue` / `.claude/scripts/ranking/build-ai-content-queue.mjs`
- 決定的ゲート: `.claude/scripts/ranking/audit-ai-content.mjs`
- 公開: `.github/workflows/publish-ai-content.yml` (自動化インベントリ参照)
- agent: `ranking-content-author` (生成) / `ranking-content-critic` (審査) / `ranking-publisher` (公開) / `ranking-ui-manager` (UI)
- 関連 rule: `.claude/rules/metric-config-standards.md` (title/seoTitle) / `blog-quality-standards.md` (ですます調・archetype A) / `evidence-based-judgment.md`

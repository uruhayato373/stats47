---
type: implementation-plan
status: phase-2-prep
created: 2026-05-24
target_period: 2026-W45 〜 2027-W20 (6 ヶ月)
related_files:
  - docs/02_実装計画/100x-pv-strategy.md
  - docs/02_実装計画/phase-2-authority-content-plan.md
---

# Phase 2 被リンク獲得施策

> 100x-pv-strategy.md Phase 2 (×3 倍率) における外部被リンク獲得計画。
> 「公務員 × AI × 統計」権威化と連動し、site-wide ranking を底上げする。

## Context

### 現状 (2026-W21 推定)

- 推定被リンク domain 数: < 50 (未計測、要 ahrefs / GSC 確認)
- 被リンクの主要源: 個人ブログ、SNS 共有、Wikipedia (一部)
- 高権威リンク (.gov.jp / .ac.jp / 大手メディア): 不明、おそらく少数

### Phase 2 目標

- referring domains: 50 → **300+** (6 倍)
- 高権威リンク (.gov / .ac / メディア): 0-5 → **30+**
- 被リンク経由の流入: 不明 → 月 5K+

## なぜ被リンクが重要か

- Google ranking factor として E-E-A-T シグナルに直結
- Authority Score 向上 → 既存ページ全体の position 改善
- Phase 2 全体 +300K PV のうち **+50K-100K を被リンク経由 + halo effect** で達成

---

## 戦術 4 本柱

### 戦術 1: linkable asset の制作 (5-10 個)

**定義**: 「他サイトが引用したくなる」高権威 asset。一度作れば数年間被リンクを生み続ける。

| Asset | 内容 | 想定被リンク数 (1年) |
|---|---|---|
| L1: 47 都道府県統計データベース (CSV ダウンロード可) | データ提供サイトとしての絶対基準 | 30 |
| L2: 「公務員のための統計用語事典」(300 語) | 教育系で永続被リンク | 50 |
| L3: 47 都道府県年表 (政治・経済・社会) インタラクティブ | 唯一性の高い resource | 20 |
| L4: 都道府県別 SDGs 達成度ランキング (国連指標準拠) | 政策研究・大学研究での引用 | 15 |
| L5: 公務員 AI 活用事例 100 選 (47 都道府県悉皆調査) | メディア・コンサル引用 | 25 |
| L6: 「データで見る 47 都道府県」白書 (PDF + Web版) | 自治体 / 研究機関での引用 | 20 |

### 戦術 2: メディア露出 (記者・ライター向け配布)

**ターゲット**: 統計データを記事に使う媒体

| 媒体カテゴリ | 例 | アプローチ |
|---|---|---|
| 経済メディア | ダイヤモンド、東洋経済 | データ提供 + 取材協力 |
| 自治体専門誌 | 自治日報、自治実務セミナー | 著者プロフィール訴求 (元県庁職員) |
| AI / DX メディア | ASCII.jp、Impress Watch | AI × 自治体特集での引用元 |
| 地方紙 | 47 ニュース、地方紙連合 | 地域別ランキング記事提供 |
| アカデミア | J-STAGE、Researchmap | データ引用元として確立 |

### 戦術 3: HARO 系プラットフォーム活用

「メディアが求める情報源」プラットフォームで stats47 を露出:

- **Mediator** (国内)
- **企業 PR の支援サービス**: PR TIMES, @Press
- **Help A Reporter Out** (海外): 英語 Phase 4 で本格活用

月 5-10 件のメディア記者問い合わせに回答 → 被リンク獲得。

### 戦術 4: 自然リンク誘発 (記事本体の最適化)

各 Phase 2 高品質記事に以下の「リンクされやすい」要素を必ず含める:

1. **オリジナル data viz**: 他にない統計図 (引用しやすい)
2. **CSV / Excel download**: 「データの出典: stats47」が付きやすい
3. **明確な引用 license**: CC BY 4.0 で「引用大歓迎」を明示
4. **embed コード**: チャートを iframe で他サイトに埋め込み可能に
5. **専門家コメント**: 著者 (元県庁職員) のコメントを記事内に明記

---

## Stage 別実装計画

| Stage | 期間 | 作業 |
|---|---|---|
| **2-B-S1: linkable asset 制作 #1** | W45-W48 | L1 (47 都道府県統計データベース CSV 公開) + L2 (統計用語事典 50 語パイロット) |
| **2-B-S2: メディア配布** | W49-2027W4 | 100 媒体に「使えるデータ集」紹介メール送付 |
| **2-B-S3: linkable asset 拡張** | 2027W5-W8 | L3 (47 都道府県年表) + L4 (SDGs ランキング) 公開 |
| **2-B-S4: 自然リンク最適化** | 2027W9-W20 | 既存記事に embed コード / CSV download 追加、L5 / L6 公開 |

---

## 計測 KPI

### 月次トラッキング

- Referring domains 数 (Ahrefs / Moz / GSC Search Console Links レポート)
- .gov.jp / .ac.jp / メディア由来リンク数
- 被リンク経由の流入 (GA4 Referral channel)
- DR (Domain Rating) スコア推移

### Phase 2 完了基準 (2027W20)

- referring domains 300+ ✅
- 高権威ドメイン (.gov / .ac / 大手メディア) 30+ ✅
- 被リンク経由月間流入 5K+ ✅
- DR score 30+ (現状 推定 15-20)

---

## リスクと対処

| リスク | 影響 | 対処 |
|---|---|---|
| linkable asset を作っても誰もリンクしない | 投資回収できず | 制作前にメディア 5 社に相談 (need 確認) |
| メディア配布が無反応 | 露出ゼロ | 業界別キュレーション、専門 PR 会社に外注検討 |
| スパム被リンクで Google ペナルティ | site 全体 ranking 下落 | Disavow ツールで月次クリーンアップ |
| Wikipedia 編集禁止 (利益相反) | 高権威リンク機会失う | 引用される形 (= 他人が編集) を待つ |

---

## 関連ドキュメント

- 親計画: `docs/02_実装計画/100x-pv-strategy.md` Phase 2
- 兄弟計画: `docs/02_実装計画/phase-2-authority-content-plan.md`
- 兄弟計画: `docs/02_実装計画/phase-2-note-monetization-plan.md`
- マーケティング戦略: `docs/00_プロジェクト管理/03_マーケティング戦略.md`

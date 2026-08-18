---
type: note-strategy
vertical: koumuin-estat-claude-code
created: 2026-05-26
status: active
target_articles: 12
free_count: 3
paid_count: 9
mvp_picks: [00, 03, 08, 01, 04]
target_followers_m6: 1500
target_revenue_m6_jpy: 80000
magazine_price_jpy: 1480
tags: [koumuin, claude-code, estat, note-strategy]
---

# 公務員 × Claude Code × e-Stat note 戦略

新ヴァーティカル「自治体職員が e-Stat 統計データ業務を Claude Code で効率化する」の note 量産戦略。全 12 本のドラフトは `docs/31_note記事原稿/koumuin-estat-claude-code/` に格納済み (`ready-to-publish`)。

## 親プラン

- 既存ヴァーティカル戦略: `docs/30_note記事企画/koumuin-claude-code/strategy.md`
- ドラフト群: `docs/31_note記事原稿/koumuin-estat-claude-code/`
- 既存 note 全体戦略: `docs/30_note記事企画/note戦略.md`

## 1. 公開順 (12 本の優先順位)

### MVP 5 本 (Week 1-3、撤退判定の材料)

CVR / 集客 / 継続性を検証する最小ロット。無料 3 本で集客 → 有料 2 本で課金転換を測る。

| 順位 | # | slug | 区分 | 公開週 | 役割 |
|---|---|---|---|---|---|
| 1 | 00 | estat-claude-code-intro | 無料 | W1 | 入口記事。e-Stat 業務の自治体職員に「Claude Code でこう変わる」を伝える |
| 2 | 03 | fetch-prefecture-ranking | 無料 | W1 | SNS 拡散ターゲット。「1 コマンドで 47 県データ」のインパクト訴求 |
| 3 | 01 | estat-api-key-setup | 有料 ¥300 | W2 | 入口商品。読者が「やってみる」最大の壁を解消 |
| 4 | 08 | benchmark-table-5min | 無料 | W2 | 議会答弁・議事用「他自治体比較」の需要を可視化 |
| 5 | 04 | excel-download-and-parse | 有料 ¥300 | W3 | Excel 集計需要の本命課金記事 |

MVP 5 本公開後、`/fetch-note-metrics` で CVR と PV を測定し、未完了の次アクションだけを `.claude/todo/04_改善バックログ.md` にID付きで記録する。

### Series A (Week 4-12、MVP 合格時のみ展開)

| 公開週 | # | slug | 区分 | カテゴリ |
|---|---|---|---|---|
| W4 | 02 | search-estat-statsdataid | 有料 ¥300 | search |
| W5 | 05 | pandas-duckdb-derived-metrics | 有料 ¥300 | analysis |
| W6 | 06 | prefecture-code-and-merge | 有料 ¥300 | analysis |
| W7 | 07 | year-on-year-diff | 有料 ¥300 | analysis |
| W8 | 09 | assembly-chart-generation | 有料 ¥300 | output |
| W10 | 10 | claude-skills-routinize | 有料 ¥300 | skills |
| W12 | 11 | mcp-sqlite-search | 有料 ¥300 | mcp |

## 2. 集客導線 (無料 3 本 → 有料 9 本)

### 無料 3 本の役割分担

| # | slug | 主導線 |
|---|---|---|
| 00 | estat-claude-code-intro | → 01 (API key 取得) / 03 (47 県取得) / 04 (Excel) |
| 03 | fetch-prefecture-ranking | → 02 (search) / 05 (pandas/DuckDB) / 09 (チャート) |
| 08 | benchmark-table-5min | → 09 (議会答弁チャート) / 06 (コード変換) / 10 (skills 化) |

### 記事内 CTA 設計

各無料記事の末尾に以下の固定 CTA を設置:

1. **マガジン購読**への導線 (「12 本セットで ¥1,480」)
2. **同カテゴリの有料記事 1-2 本**へのリンク
3. **stats47.jp への送客**: 本ヴァーティカルは統計データが主題なので、`koumuin-claude-code` と違い stats47 送客を全記事末尾に置く (「自治体向け統計ダッシュボードのサンプルとして」)
4. **姉妹マガジン**: `koumuin-claude-code` (Claude Code 全般 33 本) への相互送客

## 3. KPI (マイルストーン)

| 時点 | フォロワー | 月総収益 | 累計記事 |
|---|---|---|---|
| M1 (Week 4) | 50 | ¥3,000-5,000 | 5 (MVP) |
| M3 (Week 13) | 200 | ¥20,000-30,000 | 12 (全公開) |
| M6 (Week 26) | 1,500 | ¥50,000-80,000 | 12 + 姉妹マガジンとのバンドル訴求 |

### 各 KPI の根拠

- 姉妹マガジン (`koumuin-claude-code`) よりニッチ (e-Stat 業務に絞っているため) なので、フォロワー目標は控えめ
- 月総収益はマガジン購入が主軸 (M6 で 40 件 × ¥1,480 = ¥59,200) + 単体記事課金 ¥20,000 で試算
- e-Stat 業務をする自治体職員は「企画課・統計担当・財政課・議会事務局」など限定的だが、業務上の必要性が高いため CVR は姉妹マガジンより高い (2-3%) 見込み

## 4. 撤退条件

| タイミング | 条件 | アクション |
|---|---|---|
| MVP 5 本公開後 (Week 3) | 有料 CVR < 0.5% | 単体販売停止、姉妹マガジン側に統合 |
| Week 13 (M3) | 月収益 < ¥5,000 が 3 ヶ月連続 | 撤退、stats47 ブログ側に統合 |
| Week 26 (M6) | 月収益 < ¥30,000 | 単体マガジン廃止、姉妹マガジンへの bundle 化 |

撤退判定は本書の条件と実測を突合し、続行時の未完了策だけを `.claude/todo/04_改善バックログ.md` に記録する。撤退・完了履歴はGitに委ねる。

## 5. SNS 連携

- X 投稿: 各記事公開時 + 1 週間後追い投稿 (計 24 投稿)
- ハッシュタグ: `#Claude` `#ClaudeCode` `#公務員` `#自治体DX` `#eStat` `#統計データ` `#オープンデータ`
- Instagram: 月 2-4 本のフィード投稿 + リール

各記事の `captions.md` に X / Instagram キャプションを格納済。

## 6. 守秘・倫理ガード

- 「私は」「自分は」など発信者一人称は使わない
- 具体的な自治体名・部署名・職員名は出さない
- 「典型例」「人口 N 万人規模」「ある自治体では」など第三者視点で書く
- 個人情報を含むデータを Claude に投げる手順は記載しない (e-Stat は公開データのため基本問題ないが、自前 DB 連携 (#11) では明示的に注意喚起)
- **e-Stat 利用規約**: 出典「政府統計の総合窓口 (e-Stat)」を必ず明記する手順を全記事に含める

## 7. stats47 との関係

本ヴァーティカルは stats47 開発で使い込んだスキルを公務員向けに転用する。

- ✅ stats47.jp は「動いている実例」として全記事末尾で言及 (姉妹マガジン `koumuin-claude-code` と違い、本ヴァーティカルは送客 OK)
- ✅ 47 都道府県データのサンプル (人口・財政・健康など) は stats47 のランキングを例示
- ❌ stats47 の D1 schema は公開しない (本記事は読者の自前 DB を想定)

## 8. 関連ファイル

- ドラフト本体: `docs/31_note記事原稿/koumuin-estat-claude-code/<NN>-<slug>/draft.md`
- SNS キャプション: `docs/31_note記事原稿/koumuin-estat-claude-code/<NN>-<slug>/captions.md`
- 画像: `docs/31_note記事原稿/koumuin-estat-claude-code/<NN>-<slug>/images/*.svg`
- 月次判定: `/fetch-note-metrics` のreference履歴 + `.claude/todo/04_改善バックログ.md` (M1 / M3 / M6)
- 既存 e-Stat スキル: `.claude/skills/estat/{search-estat,inspect-estat-meta,fetch-estat-data}/`
- 既存 note スキル: `.claude/skills/note/{publish-note,write-note-section,design-note-structure}/`

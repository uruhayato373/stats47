# Phase 2 Authority 30 本 アウトライン INDEX

`docs/02_実装計画/phase-2/authority-content-plan.md` の 30 本企画 (Series A-D) のアウトライン集。各記事 1 ファイル。

2026-05-25 一括生成。フル draft 化は順次実施。

## 進捗状況

| ID | タイトル | 状態 | note 参照 | 想定 PV/月 |
|---|---|---|---|---:|
| A1 | 都道府県別「Claude Code 普及率」を AI で測定 | outline | — | 1,500 |
| A2 | 公務員が ChatGPT で議会答弁を 10 倍早く書く 5 ステップ | **✅ draft 済** ([.local/r2/app/blog/assembly-answer-chatgpt-5steps](../../../../../.local/r2/app/blog/assembly-answer-chatgpt-5steps/article.md)) | note 05 | 3,000 |
| A3 | e-Stat API + Claude で議会向け統計レポート 3 分 | outline | note 14/15 | 2,500 |
| A4 | 公務員の AI 使用ガイドライン 47 都道府県比較 | outline | — | 4,000 |
| A5 | 自治体 RPA 導入率と業務時間削減 (回帰分析) | outline | — | 1,500 |
| A6 | AI で議事録要約: 47 議会の地域課題 TOP 10 | outline | note 04 | 3,500 |
| A7 | 公務員 AI 倫理ガイドライン 米 EU 日比較 | outline | — | 1,000 |
| A8 | 自治体 chatbot 導入失敗事例 | outline | note 03 | 2,000 |
| B1 | e-Stat の「使えない」を「使える」7 テクニック | **✅ draft 済** ([.local/r2/app/blog/estat-7-techniques-from-unusable-to-usable](../../../../../.local/r2/app/blog/estat-7-techniques-from-unusable-to-usable/article.md)) | note 15 | 5,000 |
| B2 | 自治体予算要望書グラフ 10 種 (テンプレ付) | outline | note 17 | 4,500 |
| B3 | 議会説明で「数字が嘘をつく」3 パターン | outline | — | 3,000 |
| B4 | 国勢調査だけでわかる課題 5 つの読み方 | outline | — | 3,500 |
| B5 | 平均値より中央値を使うべき自治体統計 10 | outline | — | 2,000 |
| B6 | 都道府県オープンデータ公開度ランキング | outline | — | 3,500 |
| B7 | 公務員のための統計用語 30 | outline | — | 2,500 |
| B8 | EBPM 入門: 47 都道府県取り組みランキング | outline | — | 2,000 |
| C1 | 財政力指数 47 都道府県 5 年推移 | outline | note 17 | 3,000 |
| C2 | 自治体 DX 推進度 (5 指標複合) | outline | — | 2,500 |
| C3 | 公務員 1 人あたり住民数 効率性 | outline | — | 2,000 |
| C4 | ふるさと納税 47 都道府県 実質収支 | outline | — | 4,000 |
| C5 | 議員報酬と議会活動度 (相関分析) | outline | note 09 | 3,500 |
| C6 | 公共施設マネジメント長期戦略 | outline | — | 1,500 |
| C7 | 自治体 SDGs 達成度 (国連指標) | outline | — | 2,000 |
| C8 | 地方創生交付金 費用対効果 (5 年検証) | outline | — | 2,500 |
| D1 | AI で予測する 2030 消滅可能性都市 | outline | — | 6,000 |
| D2 | 47 都道府県 AI 産業集積度ランキング | outline | — | 2,500 |
| D3 | 地方創生 AI 活用事例 30 | outline | — | 4,000 |
| D4 | データドリブン自治体 TOP 10 の共通点 | outline | — | 2,000 |
| D5 | 47 都道府県 AI 人材育成施策比較 | outline | — | 1,500 |
| D6 | 地方創生 AI ツール 20 選 | outline | note 00/13 | 3,000 |

**合計**: 30 outlines + 2 fully drafted = **想定月 PV 76,000** (達成時)

## 戦略上の位置付け

- Two-track Axis B (公務員 AI 業務効率化) の主軸コンテンツ
- 2 軸戦略: [`docs/00_プロジェクト管理/04_ターゲットペルソナ.md`](../../../../00_プロジェクト管理/04_ターゲットペルソナ.md)
- 100x-pv-strategy Phase 2 (W45-2027W20、×3 倍率): [`docs/02_実装計画/phase-2/authority-content-plan.md`](../../../../02_実装計画/phase-2/authority-content-plan.md)

## blog ↔ note 戦略

すべての記事に **note 該当記事への送客 CTA** を含む方針:
- blog = SEO 入口 (検索キーワード狙い、無料、4,000-7,000 字)
- note = 詳細 hack / 体験談 / 有料 (¥300、blog の続きを読みたい人向け)
- 横断送客は UTM 規約 ([`generate-utm-url`](../../../../../.claude/skills/sns/generate-utm-url/SKILL.md)) で計測

note 33 本のうち 11 本が blog 30 本と関連 (A2, A3, A6, A8, B1, B2, B3, C1, C5, D6 等)。

## draft 化の優先順位 (PV ポテンシャル順)

| 優先 | ID | 月 PV |
|---|---|---:|
| 1 | D1 消滅可能性都市 | 6,000 |
| 2 | B1 e-Stat 7 テクニック (✅ draft 済) | 5,000 |
| 3 | B2 予算要望書グラフ 10 | 4,500 |
| 4 | A4 AI ガイドライン 47 比較 | 4,000 |
| 5 | C4 ふるさと納税 実質収支 | 4,000 |
| 6 | D3 地方創生 AI 事例 30 | 4,000 |
| 7 | A6 議事録要約 47 議会 | 3,500 |
| 8 | B6 オープンデータ公開度 | 3,500 |
| 9 | C5 議員報酬と活動度 | 3,500 |
| 10 | B4 国勢調査 5 読み方 | 3,500 |

## 次の作業候補

1. 残 28 outlines のうち高 PV の 5-10 件を順次 draft 化 (月 5-10 本ペース)
2. draft 完成後の publish フロー: `.local/r2/app/blog/<slug>/article.md` → `npm run articles:sync-from-r2` → `/sync-snapshots` → develop → main
3. note ↔ blog の UTM 計測は Phase 2 W45 で正式運用開始

---
type: agent-reference
date: 2026-07-29
status: operational
tags: [theme-catalog, metrics, charts, editorial-workflow]
---

# テーマ指標×チャート改善の実行契約

テーマレビューで採択された指標・チャート改善を `ThemeCatalog` へ反映する際のエージェント向け
実行契約。進捗と優先度は `.claude/todo/05_機能バックログ.md` の
`THEME-CATALOG-QUALITY-01`、カタログの恒久規約は
`.claude/rules/theme-catalog-standards.md` を正典とする。

## 責務分離

```text
Theme brief
  → 公式資料・統計実在調査
  → proposal（採用/不採用、role、chart、順序）
  → 人間承認
  → ThemeCatalog編集
  → codegen
  → 決定的検証
  → localhost視覚QA
  → 別承認でR2/deploy
  → d28/d56効果判定
```

- 調査・提案は `theme-researcher`、採択後のカタログ設計は `theme-designer` が担当する。
- チャートpropsは `theme-component-builder`、新しい描画型は `chart-component-builder` に渡す。
- `theme-portfolio-manager` は実測評価と実験台帳を持ち、カタログやUIを直接実装しない。
- 新規metric候補は `.claude/todo/06_指標バックログ.md` へ分離し、未検証IDを投入しない。

## Theme brief

実装前に1テーマにつき次を固定する。

- 主読者と、ページを見終えた時に答える主問1つ
- 比較軸（地域差・時系列・内訳・関係・将来推計）
- 誤読リスク（実数と率、分母、年度差、因果と相関、予測と実績）
- primary 1〜3、secondary 3〜8、主要チャート3〜6を目安とし、数合わせをしない

候補指標には `reader question / rankingKey / definition / coverage / freshness / source /
selection / caveat` を揃える。一つでも不明なら採用しない。

## チャート選択

| 読者の問い | データ形状 | 第一候補 |
|---|---|---|
| 現在値はどれくらいか | 1指標×1時点 | `kpi-card` |
| どう変わったか | 1〜2指標×時系列 | `line-chart` |
| 規模と率はどう動くか | 異単位2指標×時系列 | `mixed-chart` |
| 何で構成されるか | 複数segment×時系列 | `composition-chart` |
| 最新年の内訳は何か | 複数segment×1時点 | `donut-chart` |
| 男女×年齢構造はどうか | 年齢階級×性別 | `pyramid-chart` |

既存rendererで表現できない場合は未定義の `componentType` や近似表現を入れず、新コンポーネント
として分離する。チャート型の許可集合は `.claude/rules/theme-catalog-standards.md` を参照する。

## proposalと採択ゲート

proposalは `.claude/skills/theme/manage-theme-portfolio/reference/reviews/` または
`reference/audits/` の対象テーマ文書へ保存し、次の3表を含める。

1. 現行指標: `keep / change-role / replace / remove`
2. 現行チャート: `keep / revise-props / replace / remove / new-component`
3. 不採用候補: `rankingKey / reason / reconsider condition`

各提案に主問、一次情報URL、利点、誤読リスク、想定実装差分を書く。人間の採択前に
ThemeCatalogを編集しない。実装へ進める時は `experiments.json` にbaselineを登録する。

## Claude Code実装契約

```text
対象: <theme-key>
採択根拠: <review-or-audit-path>
編集先: packages/data-configs/src/theme-catalog/<key>.ts
禁止: indicator-sets/*.ts / page-components/*.json の手編集
要件:
- metrics の role/selection を採択どおり反映
- 不採用候補を rejectedCandidates へ記録
- chart の componentType/componentProps/relatedRankingKeys/source/sortOrder を反映
- 既存型で表現できない場合は停止して新componentタスクへ分離
完了条件:
- codegen後の生成物を同時反映
- 対象テーマのcatalog warning 0、全体warningを増やさない
- config/type/対象testが成功
- localhostで視覚QA
```

## 検証

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run validate:years --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
```

`--strict` が既存warningで落ちる場合も、対象テーマのwarningを0にし、全体warningを増やさない。
変更範囲に応じて対象testを実行する。

## 視覚QA

375 / 768 / 1024 / 1280 / 1440px で次を確認する (shell は 1280px 上限なので 1700px は不要。
**1280px が xl 境界** = 左レール `ThemeSideNav` の出現点なので、その前後を必ず見る)。

- h1からprimaryまでに主問が分かり、最初の3チャートで結論の骨格を理解できる
- 凡例、軸、単位、年度、出典が読める
- xl 以上: 左レールにテーマ一覧 + 地域セレクタが出て、H1 右と本文上部のセレクタは消える
- xl 未満: 左レールが消え、代わりに `ThemeSwitcher` 帯と H1 右の都道府県セレクタが出る
- 色だけに依存せず、SVGにアクセシブルな名前がある
- 欠損を0と誤表示せず、empty/error stateになる
- モバイルでチャートやラベルが横溢れしない
- 相関を因果と断定せず、周辺文がデータ以上の主張をしない

## 完了条件

- primary/secondaryに公式根拠付き `selection` がある
- 不採用候補が `rejectedCandidates` に記録される
- chartごとに主問と `relatedRankingKeys` が明示される
- source、単位、年度、色、sortOrderが明示される
- 対象テーマのcatalog warningが0
- 生成物とSSOTが一致し、型・対象test・視覚QAが成功する
- R2 pushとdeployはユーザー承認後の別工程にする

## 禁止

- 出典調査なしの `selection`
- 見栄えや数合わせだけの指標・チャート追加
- 同じ結論の実数・率・人口当たりをすべてprimary化
- 生成物TS/JSONの手編集
- データ投入、R2 push、deployを同じ実装作業へ混在

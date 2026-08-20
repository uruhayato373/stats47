---
type: theme-catalog-review
date: 2026-07-11
status: proposal-ready
theme: aging-society
tags: [theme-catalog, aging, metrics, charts]
---

# テーマレビュー: aging-society（少子高齢化）

## 結論

このテーマの主問は「高齢者が多いか」だけでなく、**年齢構成がどう変化し、子ども・現役世代との比率がどうなっているか**とする。

読み順は次の4段階に統一する。

1. 高齢化率で現在の水準を見る
2. 年齢3区分と人口ピラミッドで構造を見る
3. 老年化指数・老年人口指数・従属人口指数で「子ども/支え手/高齢者」の比率を見る
4. 高齢世帯、医療・介護、年金は年齢構造の「結果・関連領域」として後段で見る

現行カタログは指標10件に対しチャート15件と多く、婚姻・離婚、自然増減、医療費、年金、ボランティアが同列に並ぶ。年齢構造の主線を残し、関連領域は後段または別テーマへ移す。

## テーマ間の責務境界

| テーマ | 答える問い | 本テーマでの扱い |
|---|---|---|
| `population-dynamics` | 人口がなぜ増減したか | 自然増減・社会増減はcontext/関連導線へ |
| `aging-society` | 年齢構成と支え手の比率はどう変化するか | 高齢化率、年齢3区分、人口指数、高齢世帯が主役 |
| `healthcare` | 健康結果と医療資源はどう異なるか | 医療費は原則healthcare。agingに残す場合は結果の1枚だけ |
| `local-finance` | 給付と負担の財政構造はどうか | 年金総額は人口規模の影響が大きく、主要チャートから外す |

## 公式根拠

### 内閣府「令和7年版 高齢社会白書」

- URL: https://www8.cao.go.jp/kourei/whitepaper/w-2025/zenbun/07pdf_index.html
- 調査日: 2026-07-11
- 高齢化率29.3%、2070年までの将来推計を主要論点とする
- 65歳以上の者がいる世帯、一人暮らし、就業、介護、住まいを別論点として扱う

高齢化率と年齢構造を入口にし、世帯・就業・医療介護を後段に置く構成を支持する。

### 国立社会保障・人口問題研究所「日本の将来推計人口（令和5年推計）」

- URL: https://www.ipss.go.jp/pp-zenkoku/j/zenkoku2023/pp_zenkoku2023.asp
- 調査日: 2026-07-11
- 2021〜2070年の基本推計
- 0〜14歳、15〜64歳、65歳以上の年齢3区分と年齢構造係数を公表

将来推計は重要だが観測値とは別物である。実績/推計の線種、境界年、仮定を示せる専用仕様がない間は通常折れ線に混ぜない。

### 総務省統計局「社会・人口統計体系」

- URL: https://www.stat.go.jp/data/ssds/index.htm
- 調査日: 2026-07-11
- 現行の高齢化率、老年化指数、従属人口指数、年齢3区分、高齢世帯指標の出典

## 現行指標の提案

| rankingKey | 現行 role | 提案 | 理由 |
|---|---|---|---|
| `ratio-65-plus` | primary | **primary keep** | 高齢化水準の入口。人数ではなく総人口に占める割合 |
| `aging-index` | secondary | **primaryへ変更** | 65歳以上と年少人口のバランスを直接示す |
| `dependent-population-index` | secondary | **primaryへ変更** | 生産年齢人口に対する従属人口の比率で「支え手」の主問に合う |
| `total-fertility-rate` | secondary | **secondary keep** | 少子化の中心指標。高齢化率と単純な因果で結ばない |
| `crude-birth-rate` | secondary | **contextへ変更** | 合計特殊出生率と役割が重なる。自然増減はpopulation-dynamicsが主担 |
| `average-age-of-first-marriage-wife` | context | **remove/rejected候補** | 婚姻年齢から少子化への単純な因果推論を招く。婚姻テーマができた場合に再検討 |
| `population-growth-rate` | secondary | **contextへ変更** | population-dynamicsの主指標。本テーマでは背景 |
| `natural-increase-rate` | secondary | **contextへ変更** | population-dynamicsの要因分解。重複チャートは置かない |
| `social-increase-rate` | context | **context keep** | 若年流出の背景。現行2019年までの鮮度注意が必要 |
| `household-ratio-with-65plus` | context | **secondaryへ変更** | 年齢構造が暮らしの単位にどう現れるかを示す |

### 追加指標候補

| 候補 | 判定 | 理由 |
|---|---|---|
| 75歳以上人口比率 | **指標バックログへ** | 2025年問題と医療・介護需要の境界に重要。現在METRICS_REGISTRYに適切なrankingKeyなし |
| `old-population-index` | **secondary追加候補** | 生産年齢人口に対する老年人口の比率。年少人口指数と対で利用 |
| 生産年齢人口比率 | **実在キー確定後secondary** | 「支え手」を直接表す。類似metricの定義・対象区分を確認してから採用 |

## 現行チャートの提案

| componentKey | 提案 | 理由 / 実装 |
|---|---|---|
| `birth-rate-aging-rate-trend` | **replace** | 粗出生率と高齢化率は単位と値域が異なる。単一Y軸折れ線で比較しない。年齢3区分を先頭へ |
| `marriage-divorce-rate-trend` | **remove** | 高齢化の主問から遠く、カタログmetricsとも整合しない |
| `natural-social-increase-trend` | **remove** | 実体は出生数・死亡数。population-dynamicsに統合 |
| `birth-death-rate-trend` | **remove** | population-dynamicsと重複 |
| `theme-age-composition` | **keep・先頭化** | テーマの主問を最も直接表現 |
| `theme-population-pyramid` | **keep** | 男女×年齢階級の詳細構造 |
| `theme-as-aging-index-trend` | **keep・上位化** | 少子化と高齢化の比率を表す |
| `theme-as-youth-old-dep-index` | **keep・上位化** | 生産年齢人口に対する年少/老年人口の比率を表す。relatedRankingKeysを追加 |
| `cmp-pop-elderly-household` | **keep** | 年齢構造の暮らしへの影響。sourceとrelatedRankingKeysを補完 |
| `theme-late-elderly-medical-expense-trend` | **後段keepまたはhealthcareへ** | 結果指標と1枚に限定。カタログmetricに追加するか関連リンクのみにする |
| `theme-pension-benefit-trend` | **remove** | 総額は人口規模の影響が大き、年齢構造比較の主問に不適 |
| `theme-volunteer-participation-trend` | **remove** | 15歳以上全体の指標で高齢社会との直接性が不明。高齢者別データがある場合のみ再検討 |
| markdown 3件 | **統合・再検証** | discussion/related-topicsに重複が多い。解説+FAQの2件までに統合し、数値・年・出典を再確認 |

## 推奨表示順

1. 高齢化率KPI/ランキング導線
2. 年齢3区分人口構成
3. 人口ピラミッド
4. 老年化指数
5. 年少人口指数・老年人口指数
6. 従属人口指数
7. 高齢世帯
8. 医療費（残す場合のみ1枚）
9. 解説 / FAQ
10. 全指標と関連テーマ導線

## 不採用・保留

| 候補 | 判定 | 再検討条件 |
|---|---|---|
| 婚姻率・離婚率 | 不採用 | 婚姻・家族形成を主問とする別テーマで再検討 |
| 出生数・死亡数 / 出生率・死亡率 | 不採用 | population-dynamicsに統合 |
| 年金受給総額 | 不採用 | 1人当たり・受給者当たり等の比較可能な指標が主問に必要になった場合 |
| ボランティア参加率 | 不採用 | 高齢者に限定した指標と問いが定義できた場合 |
| 将来高齢化率折れ線 | 保留 | 実績/推計の区別仕様を先に設計 |
| 75歳以上人口比率 | 保留 | MetricConfigと観測値を作成し47都道府県を検証後 |

## Claude Code実装指示

### PR-1: ThemeCatalogの焦点化

編集SSOT: `packages/data-configs/src/theme-catalog/aging-society.ts`

1. 上表のrole変更を反映
2. `old-population-index`の定義と年を確認しsecondaryに追加
3. primary/secondaryすべてに公式根拠付き `selection`を追加
4. remove対象chartを削除し、年齢構造系chartを推奨順に並べる
5. 残すchartの `relatedRankingKeys/sourceLink/rankingLink`を補完
6. `sortOrder`を一意化
7. 不採用rankingKeyを `rejectedCandidates`に記録
8. markdown内の数値と出典は別コンテンツレビューが終わるまで勝手に更新しない

### PR-2: 新規データと将来推計（別承認）

1. 75歳以上人口比率を `.claude/todo/backlog.md`で調査
2. MetricConfig、47都道府県観測値、R2 snapshotを実装
3. 実績と推計を区別するchart props/UIを別PRで設計
4. 実測・推計の出典と境界年を明示

### 禁止

- 生成物 `packages/types/src/indicator-sets/aging-society.ts`を手編集しない
- 生成物 `apps/web/scripts/data/page-components/theme/aging-society.json`を手編集しない
- 出生率と高齢化率を同一Y軸で比較しない
- 将来推計を実績と同じ線で表示しない
- 高齢化率の高さを「高齢者数が増えたこと」だけで説明しない。分母の若年・生産年齢人口減少も考慮する
- R2 push / deployを行わない

## 検証と完了条件

```bash
npm run generate:catalog --workspace=@stats47/data-configs
npm run validate:catalog --workspace=@stats47/data-configs
npm run validate:years --workspace=@stats47/data-configs
npm run validate:config --workspace=@stats47/data-configs
npm run type-check --workspace=@stats47/data-configs
npm run type-check --workspace apps/web
npm run test:run --workspace apps/web
```

- `aging-society`の `no-selection / dup-sortorder / primary-orphan`が0
- 全体warnが実装前ベースラインから増えない
- 生成物がSSOTと一致
- 最初の3チャートで「水準→年齢構成→支え手の比率」が読める
- 375 / 768 / 1024 / 1280 / 1700pxで軸、凡例、単位、年度、出典を確認
- empty/error stateが0値と区別できる

## 採用決定

**現状: ユーザー承認待ち。**

Claude Codeは承認前にcatalogを編集しない。承認後はまずPR-1のみを実装する。


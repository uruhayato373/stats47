---
type: theme-catalog-review
date: 2026-10-06
status: implemented-pending-release
theme: aging-society
supersedes: 2026-07-11-theme-aging-society.md
tags: [theme-catalog, aging, metrics, charts, sections]
---

# テーマレビュー: aging-society（少子高齢化） 2026-10-06

## 結論

現行ページは「高齢者の割合」と「出生の水準」を最初に見せるが、子ども・現役世代・高齢者の**比率**を示す図が 1 枚も無い。
年少人口指数・老年人口指数は 1977〜2022 年の系列が登録済みで、どちらも context に置かれたまま描画されていない。
これを年齢構造の章にカードとして加え、重複している高齢世帯の折れ線を外し、章の順を「少子の側 → 高齢の側 → 読み方」に並べ直す。
新しい描画型・新しい指標の投入は要らない (既存の指標カードと既存 rankingKey だけで実装できる)。

2026-07-11 版 (`2026-07-11-theme-aging-society.md`) はその後のカタログ変更 (指標 10 → 25 件、チャート 15 → 6 件、章の導入、
2026-09-09 の章追加 3 件) より前の構成を前提にしており、そのまま実装できない。本書が置き換える。

## Theme brief

| 項目 | 内容 |
|---|---|
| 主読者 | 自分の県や移住候補の県で少子高齢化がどこまで進んだかを全国と比べたい人。検索語は「少子高齢化 ランキング」「高齢化率 都道府県」「高齢者 一人暮らし 割合」 |
| 主問 | この県の高齢化はどこまで進み、子ども・現役世代・高齢者のバランスはどう変わってきたか |
| 比較軸 | 地域差 (都道府県順位) と時系列 (1975〜2025)。内訳は年齢 3 区分と男女×年齢階級 |
| 誤読リスク | 高齢化率の上昇は高齢者の増加と若年層の減少の両方で起きる。出生率と高齢化率を因果で結ばない。高齢単独世帯の割合は一般世帯が分母で、高齢者本人の独居率ではない。老人ホーム定員は充足率ではない。人口千人当たりの婚姻率は年齢構成の影響を受ける |
| baseline (GSC 2026-W40, 28 日) | `/themes/aging-society`: クリック 13、表示 1,091、CTR 1.19%、平均掲載順位 8.30 (`gsc-improvement/reference/snapshots/2026-W40/pages.csv`)。テーマページで表示回数が最大 (次点 fishery-marine 199 の約 5.5 倍) |

検索需要の補足 (同 snapshot の `queries.csv`): 「高齢者 一人暮らし 割合」系の 5 クエリで計 293 表示がある。
ページ別の内訳は取得していないため、どのページに着地しているかは未確認。現行指標には「65 歳以上人口に占める一人暮らしの割合」が無く、
この問いには直接答えられない (表 3 で新規指標候補として扱う)。

## 現行の構成 (2026-10-06、`data/themes/catalogs/aging-society.json`)

| 順 | 章 (key) | カード (metricGroups) | チャート |
|---|---|---|---|
| 1 | 出生と高齢化の現在地 (`birth-aging`) | 高齢化率 / 合計特殊出生率 (各 1 枚) | — |
| 2 | 年齢構造はどう変わるか (`age-structure`) | — | 年齢 3 区分人口構成 / 人口ピラミッド |
| 3 | 高齢者はどの世帯で暮らすか (`elderly-households`) | 高齢世帯 3 指標 (1 枚) | 高齢世帯の推移 (同じ 3 指標の折れ線) |
| 4 | 医療アクセスと費用 (`elderly-care`) | 「医療アクセスと費用」= 老人ホーム定員 1 指標 | 後期高齢者医療費の推移 + 埋め込み「過疎×医療」 |
| 5 | 読み方 (`reading`) | — | 数値を比較するときの注意 / よくある質問 |
| 6 | 高齢者の就業 (`candidate-36`) | 「高齢者の就業｜高齢就業者割合」 | — |
| 7 | 婚姻と家族形成 (`candidate-42`) | 「婚姻と家族形成｜婚姻率」/「婚姻と家族形成｜離婚率」(各 1 枚) | — |
| 8 | 過疎地域等の集落と高齢化 (`candidate-48`) | — | 埋め込み「過疎集落」 |

## 表 1: 現行指標

role を変えるものと外すものだけを個別に書く。ここに無い指標は現状維持 (keep)。

| rankingKey | 現行 role | 提案 | 年 | 理由 |
|---|---|---|---|---|
| `ratio-65-plus` | primary | keep | 1980〜2025 (26 年) | 入口の水準。selection は一次資料付きで記入済み |
| `total-fertility-rate` | primary | keep | 1980〜2023 (40 年) | 少子の中心指標。selection 記入済み |
| `old-population-index` | context | **change-role → secondary** | 1977〜2022 (44 年) | 15〜64 歳 100 人当たりの 65 歳以上人口。「支え手」の主問に直接答える |
| `young-population-index` | context | **change-role → secondary** | 1983〜2022 | 同じ分母の年少人口。老年人口指数と 2 本並べると、交わる年が子どもより高齢者が多くなった年になる (分母が同じため) |
| `dependent-population-index` | context | keep (context) | 1975〜2022 (39 年) | 年少 + 老年の合計で、上の 2 本から読める。secondary にすると secondary が 9 件になり目安 (3〜8) を超える |
| `aging-index` | context | keep (context) | 2022 のみ | 7 月版は primary 化を提案したが、1 年分しか無く推移を描けない (表 3) |
| `divorces-per-total-population` | secondary | **change-role → context** | 1975〜2024 | 少子高齢化の主問との関係が弱い。2026-09-09 の章追加の判断 (`theme-feasibility-catalog.json` candidate 42) も「婚姻率・初婚年齢を集約」で、離婚率は含んでいない。全指標一覧とランキングへの導線は残る |
| `marriages-per-total-population` | secondary | keep | 1975〜2024 | 少子の背景 (家族形成の入口)。章の説明に年齢構成の影響を注記する |
| `pension-benefit-total` | context | **remove** | 2022 のみ | 総額は人口規模にほぼ比例し、地域差の比較に向かない (表 3) |
| `volunteer-activity-annual-participation-rate-15plus` | context | **remove** | 1996〜2021 (6 回) | 15 歳以上全体の行動者率で、高齢者に限った値ではない (表 3) |
| `social-increase-rate` | context | keep (context) | 2018〜2019 | 鮮度が古い。population-dynamics にもある。ここでは背景の一覧に残すだけ |

外す 2 指標はこのテーマにしか無いので、外すとどのテーマページからも辿れなくなる。ランキングページ (`/ranking/<key>`) は残る。

新しい secondary 2 件の `selection` は、実装時に一次資料 (内閣府「令和7年版 高齢社会白書」第1章第1節の、65 歳以上 1 人に対する
15〜64 歳人口の記述を想定) を開いて逐語引用を確認してから記入する。確認できなければ `adoptionCriteria` を空のまま残す (定型文で埋めない)。

## 表 2: 現行チャート・カード・章

### チャート

| componentKey | 提案 | 理由 / 実装差分 |
|---|---|---|
| `theme-age-composition` | keep | 主問を最も直接表す。sortOrder 20 → 10 |
| `theme-population-pyramid` | keep | 男女×年齢階級の構造。sortOrder 30 → 20 |
| `cmp-pop-elderly-household` | **remove** | 直上の「高齢世帯」カードと同じ 3 指標の折れ線で、カードのチェックでも同じ線が描ける (規約 §9「同じ指標のカードと詳細図は重複させない」)。evidenceTopics `elderly-household-composition` の `relatedChartKeys` からも外す |
| `theme-late-elderly-medical-expense-trend` | keep | 1 人当たりの比率で比較可能。sortOrder 10 → 30 (章の順に合わせる) |
| `md-aging-discussion` / `md-aging-faq` | keep | 本文は変えない。章ごと末尾へ移す。sortOrder 40 / 50 |

### カード (metricGroups)

| key | 提案 | 内容 |
|---|---|---|
| (新) `support-ratio` | **new** (既存の指標カード部品で描く。新コンポーネント不要) | 題「子ども・高齢者と現役世代の比率」。rankingKeys = 老年人口指数, 年少人口指数。2 件とも初期チェック。単位は同じ「指数」で 1 軸 |
| `elderly-care` | revise | 題「医療アクセスと費用」→「老人ホームの定員」。カードの中身 (老人ホーム定員) と題が合っていない |
| `candidate-42-2` | remove | 離婚率を context にするため。章 `candidate-42` は婚姻率のカード 1 枚になる |
| `candidate-36-1` / `candidate-42-1` | revise | 題の「高齢者の就業｜」「婚姻と家族形成｜」を外す (章見出しの繰り返し。横断修正 X2 と同じ) |

### 章

| 順 | 章 | 提案 |
|---|---|---|
| 1 | 出生と高齢化の現在地 | keep |
| 2 | 年齢構造と支え手の比率 (旧「年齢構造はどう変わるか」) | **改題 + カード `support-ratio` を追加**。説明に「老年人口指数は 15〜64 歳人口 100 人に対する 65 歳以上人口。年少人口指数と分母が同じなので、2 本の線が交わる年に子どもと高齢者の人数が逆転する」を足す |
| 3 | 婚姻と家族形成 | **6 → 3 番目へ移動** (少子の側をまとめる)。説明に「総人口千人当たりの率なので、結婚の多い年齢層が少ない県ほど低く出る」を足す |
| 4 | 高齢者はどの世帯で暮らすか | 重複チャートを外す。説明は現行のまま (分母の注意を含む) |
| 5 | 高齢者の就業 | 7 → 5 番目 |
| 6 | 医療・介護の受け皿と費用 (旧「医療アクセスと費用」) | 改題。中身 (老人ホーム定員・後期高齢者医療費・過疎×医療) は変えない |
| 7 | 過疎地域等の集落と高齢化 | keep |
| 8 | 読み方 | **5 → 末尾へ移動** |

章 key は変えない。`candidate-36` などはページ内リンクの anchor にも出るが、`npm run theme:expansion:check` が `candidate-<id>` を
章の実在確認に使っているため、key の改名は別作業とする。

## 表 3: 不採用候補

| rankingKey / 候補 | reason | reconsider condition |
|---|---|---|
| `aging-index` を primary にする (7 月版の提案) | 登録年が 2022 の 1 年だけで推移を描けない。同じ比率は年少・老年人口指数の 2 本から読める | 2 年以上の系列が metric config に登録されたとき |
| `pension-benefit-total` | 厚生年金受給権者の年金総額で、人口規模にほぼ比例する。2022 の 1 年のみ | 受給者 1 人当たりなど比率の指標ができたとき |
| `volunteer-activity-annual-participation-rate-15plus` | 15 歳以上全体の値で、高齢者の社会参加を表さない | 65 歳以上に限った行動者率が登録されたとき |
| `production-age-population-ratio` (15〜64 歳人口割合) | 2020〜2025 の 3 年分のみ。年齢 3 区分人口構成の図と同じ事実 | 長期系列が登録されたとき |
| 65 歳以上人口に占める一人暮らしの割合 (未登録) | 検索需要はある (上記 293 表示) が、rankingKey が無い。既存の `single-households-age65plus-male/female` は 2020 年の世帯数のみ | 国勢調査の表で 47 都道府県の「65 歳以上単独世帯人員 / 65 歳以上人口」を複数回分解決できたとき。採択されたら backlog に指標追加カードを起票する |
| 75 歳以上人口比率 (未登録) | rankingKey が無い (7 月版と同じ判断) | metric config と 47 都道府県の観測値を作ったとき |
| 将来推計の高齢化率 | 実績と推計を区別する描画仕様が無い (7 月版と同じ判断) | 実績/推計の線種と境界年を示せる chart props ができたとき |

rankingKey が実在する候補は catalog の `rejectedCandidates` にも記録する。

## 横断修正 (aging-society 以外にも同じ問題がある)

aging-society の調査中に、同じ形の問題が他テーマにもあることを確認した。どちらも表示の意味は変えず、並び順と見出しの文字だけを直す。

| ID | 問題 | 範囲 (2026-10-06 実測) | 直し方 |
|---|---|---|---|
| X1 | 「読み方」(考察 + FAQ) の章が、2026-09-09 に追加された章より前にあり、ページの途中に FAQ が出る | 8 テーマ: aging-society, consumer-prices, healthcare, labor-mobility, labor-wages, living-housing, local-economy, population-dynamics | 「読み方」章を `sections` の末尾へ移す |
| X2 | カード見出しが「章名｜指標名」で、直上の章見出しを繰り返している (1 指標カードは群の題をそのまま見出しにする: `SingleMetricCard.tsx` の `heading = title ?? label`) | 28 テーマの 263 カード。263 件すべてで「｜」の前が所属章の題と一致 | 「章名｜」を外す。題の重複は validator `[group-dup-title]` が検出する |

## 想定実装差分と検証

- 編集: `data/themes/catalogs/aging-society.json` (横断修正を採るなら X1 の 8 ファイルと X2 の 28 ファイル)。生成物は `generate:catalog` で更新し、手編集しない。
- 生成物への影響: チャート削除と sortOrder 変更で `page-components/theme/aging-society.json` が、role 変更と指標 2 件の削除で
  `indicator-sets/aging-society.ts` が変わる。章とカード (`sections` / `metricGroups`) は generator を通らないので生成物に出ない。
- 検証: `generate:catalog --check`、`validate:catalog` (aging-society の error 0、全体 warning を増やさない)、`validate:years`、
  data-configs と web の型検査・テーマ関連テスト、`npm run preflight:pr`。localhost で 375 / 768 / 1024 / 1280 / 1440px の表示を確認する。
- 効果測定: 実装時に `experiments.json` へ上記 baseline を登録し、デプロイ日から 28 日・56 日で GSC (クリック・CTR・掲載順位) と
  GA4 (テーマページのエンゲージ率・章内リンクのクリック) を比べる。章構成の変更で効果を測った過去事例が無いため、想定効果の数値は置かない。
- R2 反映とデプロイは別の承認で行う。

## 採用決定

**2026-10-06 ユーザーが全項目を承認し、同日 branch `claude/theme-catalog-optimization` に実装した (未デプロイ)。**
提案から変えた点と、実装で分かったことは次のとおり。

- X2 は 263 件のうち 258 件に適用した。残る 5 件は、章名を外すと同じテーマ内の別カードと見出しが同じになる
  (同じ指標のカードが 2 つの章に出ている)。重複の整理は backlog `THEME-DUP-METRIC-CARD-01`。
- `rejectedCandidates` には rankingKey が実在する 3 件 (年金総額・ボランティア・15〜64 歳人口割合) を記録した。
  未登録の 3 候補は rankingKey が無いので本書の表 3 だけに残す。独居率は backlog `THEME-AGING-LIVING-ALONE-METRIC-01`。
- 新しい secondary 2 件の selection は、backfill の gate (`selection-backfill.mjs apply`) を通して書いた。
  老年人口指数は内閣府「令和7年版 高齢社会白書」第1章第1節1、年少人口指数は総務省統計局 統計FAQ 02A-Q11 の定義。
- 章の順に合わせて `metricGroups` の並びも変えた (カードは章の順に描かれ、テストは定義順と描画順の一致を検査する)。
- 変更した 28 テーマはすべて 9 月の pending 実験 (d56 = 2026-11-06) を持つ。aging-society の実験登録とデプロイは
  その観測の後に行う (backlog `THEME-CATALOG-OPT-RELEASE-01`)。R2 の page-components 反映をデプロイと同時に行わないと、
  外した「高齢世帯の推移」が R2 から読まれてページ末尾に残る (localhost で確認)。

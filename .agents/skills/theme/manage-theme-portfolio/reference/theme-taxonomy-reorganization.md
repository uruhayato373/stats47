---
type: agent-reference
date: 2026-07-12
status: pending
tags: [theme, information-architecture, taxonomy, seo, migration]
---

# テーマ分類再編成方針

> 実装状況と優先度は `.claude/todo/backlog.md` の
> `THEME-TAXONOMY-REORGANIZE-01` を正典とする。本書は `theme-portfolio-manager` が
> 判定・URL影響評価・実装引き渡し時に読む詳細基準であり、進捗台帳として使用しない。

## 結論

公開テーマ数「22」は固定要件にしない。全テーマレビュー完了後、**1ページにつき主問1つ、primary 1〜3指標、主要チャート3〜6件**に収まる単位へ再編する。

テーマ数を増やすこと自体は目的にしない。読者の検索意図、指標の定義、ThemeCatalogの責務、テーマ間重複を基準に、各テーマを次の4判定へ分類する。

- `keep`: 現行テーマを維持
- `split`: 主問が複数あるため分割
- `merge`: 独立ページとして十分な主問・指標がないため統合
- `parent-hub`: 詳細テーマを維持し、上位横断ハブだけ新設

現時点では提案段階であり、URL、ThemeCatalog、R2、本番ページを変更しない。残りのテーマレビューが完了してから最終決定する。

## 再編の判定基準

### split

- 独立した主問が2つ以上ある
- 指標の分母・出典・更新周期・対象読者が大きく異なる
- primary候補が4件以上、主要チャートが7件以上必要
- 異分野を合成すると恣意的な総合点になる

### keep

- 主問を1文で定義できる
- primary 1〜3件、主要チャート3〜6件で結論を説明できる
- 他テーマとの重複を関連導線で解消できる

### merge

- 単独で公式根拠付きprimaryを確保できない
- 独立検索意図が弱く、親テーマの1sectionとして理解しやすい
- 統合しても比較単位・更新周期が矛盾しない

### parent-hub

- 詳細テーマは独立した主問を持つ
- 3テーマ以上を横断する探索需要がある
- 上位ページを要約・比較・詳細導線に限定できる

## 暫定再編案

### `safety`: split + parent-hub候補

| 新テーマ候補 | 責務 |
|---|---|
| `crime-safety` | 刑法犯認知、罪種、検挙 |
| `traffic-safety` | 交通事故、死者、負傷者、重篤度 |
| `fire-emergency` | 火災、火災死傷者、消防・救急需要 |
| `disaster-risk` | 自然災害の曝露・被害・防災 |

- 自殺・不慮の事故死亡は`healthcare`へ移管候補
- 旧`/themes/safety`は検索資産を維持する上位ハブ候補
- 根拠: `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-12-theme-safety.md`

### `education-culture`: split + parent-hub候補

| 新テーマ候補 | 責務 |
|---|---|
| `school-education` | 小中高、児童生徒、教員、学級、学校アクセス |
| `higher-education` | 大学等進学、県内進学、大学収容力 |
| `culture-learning` | 図書館、公民館、博物館、劇場、生涯学習と利用 |

- 旧テーマURLを教育上位ハブにするかはGSCとURL監査後に決定
- 根拠: `.claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-12-theme-education-culture.md`

### `living-housing`: 条件付きsplit候補

| 新テーマ候補 | 責務 |
|---|---|
| `housing` | 住宅、空き家、持ち家、家賃、住宅ストック |
| `living-environment` | 上下水道、生活利便性、住環境 |

現段階では`keep`も有力。全レビュー後まで分割を決めない。

### 境界整理でkeepする候補

| テーマ | 主責務 |
|---|---|
| `local-economy` | 県内総生産、成長、全産業構造 |
| `manufacturing` | 製造品出荷、製造業付加価値、事業所・従業者 |
| `labor-wages` | 最低賃金、初任給、属性別賃金 |
| `labor-mobility` | 求人、失業、就業、離職、労働移動 |
| `occupation-salary` | 職業別給与 |
| `healthcare` | 医療需要・提供体制・健康アウトカム |
| `aging-society` | 高齢人口構造・介護・高齢世帯 |
| `fishery-marine` | 漁獲、養殖、漁業就業・構造 |
| `ports` | 港湾物流、貨物、入港船舶 |
| `roads` | 道路整備・交通量 |
| `railway` | 鉄道利用・駅アクセス |

## 上位カテゴリ案

```text
人口・暮らし
├── population-dynamics / aging-society / foreign-residents
├── housing
└── living-environment

仕事・経済
├── local-economy / manufacturing
├── labor-wages / labor-mobility / occupation-salary
└── real-income / consumer-prices

教育・健康・安全
├── school-education / higher-education / culture-learning
├── healthcare
└── crime-safety / traffic-safety / fire-emergency

交通・地域基盤
├── roads / railway / ports
├── local-finance
└── tourism

自然・産業
├── climate / disaster-risk
└── fishery-marine
```

カテゴリ名・所属・表示順は全レビュー後に再判定する。

## 横断ハブ案

- `transport`: roads / railway / ports / 観光アクセス
- `education`: school-education / higher-education / culture-learning
- `safety`: crime-safety / traffic-safety / fire-emergency / disaster-risk

上位ハブは要約と詳細導線に限定し、詳細ThemeCatalogのchartを重複掲載しない。

## URL・SEO移行原則

実装前に `apps/web/src/lib/url-policy.ts` + config (middleware.ts / sitemap.ts) を更新し、旧新URL、301、canonical、sitemap、パンくず、内部リンク、OGP、構造化データを確定する。

1. 既存URLを理由なく削除しない。
2. 旧テーマが上位ハブとして成立する場合はURLを維持する。
3. 分割ページは検索意図とprimary確定後に公開する。
4. 重複する旧ページと新ページを同時にindexさせない。
5. 301先をすべてテーマ一覧にせず、検索意図に最も近いページへ移す。
6. GSCで旧URLのquery/click/impressionを確認する。
7. R2/deployはユーザー承認後にまとめて1回実施する。

## データ・実装原則

- Authored SSOTは`packages/data-configs/src/theme-catalog/<key>.ts`
- 手編集JSONやD1をSSOTにしない
- 各rankingKey/chartの主責務テーマを1つに決める
- 他テーマでは複製せず関連導線にする
- `ALL_THEMES`の件数を目標値として固定しない

## 件数目安

暫定案では25〜28詳細テーマになる可能性がある。ただし成功条件は件数ではない。

- 上位カテゴリ: 4〜6
- primary: 1〜3/テーマ
- secondary: 3〜8/テーマ
- 主要チャート: 3〜6/テーマ
- 関連テーマ: 2〜5/テーマ

基準を満たさない候補は公開せず、親テーマのsectionまたは将来候補とする。

## 実行手順

### Phase 0: 全テーマレビュー

- 22公開テーマをレビュー
- legacy/別経路の`climate`、`local-finance-city`も個別監査
- この段階ではコード、URL、R2、本番を変更しない

### Phase 1: 重複マトリクス

各rankingKey/chartについて次を一覧化する。

| 項目 | 内容 |
|---|---|
| current theme | 現在の所属 |
| proposed owner | 再編後の主責務テーマ |
| related themes | 関連導線だけを置くテーマ |
| reader question | 答える問い |
| source / denominator | 出典と分母 |
| migration | keep / move / remove |

### Phase 2: 最終判定

- 全テーマを`keep / split / merge / parent-hub`へ分類
- 新slug、title、description、primaryを決定
- 旧新URL、301、canonical、sitemapを決定
- GSC流入がある旧URLはquery単位で移行先を確認

### Phase 3: 実装

- 1PR = 1テーマまたは1上位ハブ
- 共通renderer変更は先に別PR
- ThemeCatalog → 生成物 → route → internal link → metadata → testsの順
- R2 push / deployはローカル検証後の別承認

### Phase 4: 効果検証

- index / canonical / redirect chain / 404
- GSC click・impression・query分布
- 上位ハブから詳細テーマへのCTR
- 孤立ページと主要チャート利用

## Claude Codeへ渡す前提条件

- 全テーマレビューが作成済み
- 重複マトリクスが完成
- 新旧URLが人間承認済み
- 各新テーマの主問とprimaryが確定
- URL構造正典の更新案がある
- redirect/canonical/sitemapテスト仕様がある
- R2 push / deployを実装PRから分離している

## 禁止

- 22という件数を維持するための数合わせ
- 指標数を増やすだけの分割
- 同じrankingKey/chartを複数テーマでprimary化
- レビュー途中のURL変更
- 旧URLの無条件削除やテーマ一覧への一括301
- 異分野指標を恣意的に合成した総合点
- 生成物TS/JSONの手編集
- ユーザー承認なしのR2 push / deploy

## 完了条件

- 全公開テーマが4判定のいずれかに分類される
- 各詳細テーマの主問が1文で定義される
- 各rankingKey/chartの主責務テーマが1つに定まる
- primary 1〜3、主要チャート3〜6の基準を満たす
- 新旧URL、301、canonical、sitemap、内部リンクが検証可能
- ThemeCatalog validatorの対象テーマwarningが0

## 現時点の決定

**`safety`と`education-culture`を分割候補として記録する。ただし全テーマレビューと重複マトリクスが完成するまで、URL・ThemeCatalogの再編実装は開始しない。**

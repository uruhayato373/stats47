# 都道府県公式統計カタログ

47都道府県が公式公開する統計ポータル、可視化ダッシュボード、
オープンデータ、統計年鑑をgit TSで管理する内部調査カタログ。
複数自治体で反復して掲載される指標を、stats47のランキング・テーマ拡充候補へつなぐ。

自治体での掲載は需要シグナルの一つだが、自動採用の根拠にはしない。
複数県での反復、掲載位置、更新性、比較機能、47都道府県データの実在を合わせて判断する。

## 正典と責務

| 対象 | 正典 |
|---|---|
| 公式リンクと分類 | `index.ts` |
| 型・列挙値 | `types.ts` |
| 構造検証 | `packages/data-configs/scripts/validate-prefecture-statistics-catalog.ts` |
| 到達性検証 | `packages/data-configs/scripts/check-prefecture-statistics-links.ts` |
| 未採用の指標候補 | `.claude/todo/backlog.md` |
| 採用済みテーマ構成 | `packages/data-configs/src/theme-catalog/*.ts` |
| 観測値 | R2 snapshot |

カタログはauthored referenceとしてgit TSをSSOTにする。永続D1、手編集JSON、
新しいリンク管理DBは作らない。現段階では内部調査用であり、本番ページは追加しない。

## 現在のカバレッジ

- 都道府県: JIS X 0401順で47/47
- 初期リソース: 各県の`statistics-portal`を1件、計47件
- 初期topic: `general`
- 初期確認日: 2026-07-18
- 発見元: 一橋大学経済研究所附属社会科学統計情報研究センター
  「地方統計へのリンク」

分野別ダッシュボード、オープンデータ、統計年鑑、政策ダッシュボードは
同じ県の`resources`へ追加する。未確認URLを推測で登録しない。

## データモデル

1都道府県を`PrefectureStatisticsCatalogEntry`、1公式資料を
`PrefectureStatisticsResource`で表す。1県に複数resourceを登録できる。

resourceには次を必須とする。

- 安定ID `<都道府県コード>-<用途>`
- 公式名称または内容が分かるtitle
- HTTPSのURL
- `types.ts`で許可されたtype / topics
- 発行主体
- 公式性を確認した発見元URL
- 実際に確認した`lastVerifiedAt`

resource typeとtopicの追加・変更は`types.ts`だけで行い、呼び出し元へ文字列を
直書きしない。

## 公式性ゲート

- 県公式ドメイン、または県公式ページからリンクされた県発行の外部BIだけを登録する。
- 委託事業者のサービス紹介、検索結果スニペット、推測URLだけでは`isOfficial`にしない。
- 外部ドメインの場合は、発行主体が県であることを示す`discoveredFrom`を必須とする。
- ページを開けない場合は確認済みとせず、URLと根拠を再調査する。
- `lastVerifiedAt`は実際にURLまたは内容を確認した日だけ更新する。

## 編集・検証

```bash
npm run validate:prefecture-statistics --workspace packages/data-configs
npm run check:prefecture-statistics-links --workspace packages/data-configs
npm run type-check --workspace @stats47/data-configs
```

構造検証は47県、県コード、resource ID、HTTPS、公式ドメイン、列挙値、
確認日を決定的に検査する。到達性検証は外部サイトの一時障害やbot対策の影響を
受けるため、通常の型チェックと分離する。403、404、5xx、timeoutは結果を
機械的に書き換えず、公式ページとリダイレクト先を人間が確認する。

更新時の規律:

1. リンク移転時はresource IDを維持してURLと確認日を更新する。
2. 同一目的の完全移行なら旧URLを残さず、履歴はgitで辿る。
3. 別目的の資料は新resourceとして追加する。
4. 掲載指標の抽出前に既存metricとThemeCatalogを読み、重複候補を量産しない。

## 指標候補の抽出

1. 各県ポータルから「ダッシュボード」「見える化」「オープンデータ」
   「統計年鑑」を探索する。
2. 原文指標名、定義、単位、地域粒度、年次、更新頻度、表現形式、
   出典調査、掲載位置を記録する。
3. 表記揺れを正規化し、既存`rankingKey`があれば再利用する。
   分母、対象年齢、名目・実質、実数・率が違う指標は統合しない。
4. `existing` / `near-duplicate` / `candidate` / `local-only`へ分類する。
5. `candidate`は一次データで統計表ID、分類コード、47県可否、直近年、
   既存重複を検証してから`.claude/todo/backlog.md`へ追加する。

需要スコアの初期値:

| 要素 | 点数 |
|---|---:|
| 採用都道府県数 | 1県につき3 |
| トップ・主要画面掲載 | 1県につき2 |
| 直近2年以内に更新 | 1県につき1 |
| 市町村比較・時系列比較あり | 1県につき1 |
| stats47既存テーマに適合 | 2 |
| 47都道府県データ取得可能 | 3 |

highは20点以上かつ47県データ確認済み、mediumは10〜19点、lowは9点以下を
目安とする。GSC需要、競合掲載、白書での重要性は別軸で併記し、スコアだけで
自動採用しない。

採用後は既存の`data-ingester`、ThemeCatalog、R2 snapshot経路へ引き渡す。
カタログ自体へ観測値を保存しない。

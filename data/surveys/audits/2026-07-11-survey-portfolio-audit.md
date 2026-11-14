---
type: seo-audit
date: 2026-07-11
status: completed
tags: [survey, seo, gsc, portfolio]
---

# surveyポートフォリオ監査

> 2026-07-13 に旧レビュー保管場所から移設 (survey ポートフォリオ運用の .claude 一本化)。
> 本書は監査日付時点の証跡であり、**最新状態の SSOT は `.claude/state/surveys/portfolio.json`**。

## 監査範囲

- R2 `app/survey/all.json` の公開survey全件
- R2 `app/survey/<id>/items.json` の関連ranking件数
- GSC W27 snapshot（直近28日）の `/survey/*` page実績

公開snapshotには74 surveyがあり、全件を一律に編集ハブ化する根拠はない。検索表示実績とranking在庫を組み合わせ、
需要が観測できるsurveyだけを順次監査する。

全74件の名称・実施主体・ranking件数の台帳はR2 `app/survey/all.json` が配信正典であり、本書へ複製しない。
監査時点の件数は74、ranking在庫上位は家計調査694、国勢調査300、人口推計216、地方財政状況調査129、
都道府県決算状況調122、社会生活基本調査99、賃金構造基本統計調査76、学校基本調査68である。

## 優先順位

| 優先 | survey | 4週imp | clicks | CTR | 順位 | ranking在庫 | 判断 |
|---:|---|---:|---:|---:|---:|---:|---|
| 1 | 賃金構造基本統計調査 | 447 | 1 | 0.22% | 10.38 | 76 | 表示大・CTR極低。次の最優先実証 |
| 2 | 家計調査（品目別） | 59 | 1 | 1.69% | 9.37 | 694 | 在庫最大。既存doc17と統合して展開 |
| 3 | 病院報告 | 39 | 0 | 0% | 9.95 | 要確認 | Top10近辺でクリックなし。タイトル意図を監査 |
| 4 | 社会生活基本調査 | 37 | 0 | 0% | 8.89 | 99 | 生活時間・余暇の独自性がある |
| 5 | 地方財政状況調査 | 36 | 1 | 2.78% | 13.31 | 129 | CTR良好。順位改善と業務利用意図を狙う |
| 6 | 患者調査 | 25 | 0 | 0% | 10.00 | 要確認 | 医療YMYLとして出典・注意を強化 |
| 7 | 国勢調査 | 23 | 0 | 0% | 25.43 | 300 | 初回実装済。順位改善には時間を要する |
| 8 | 個人企業経済調査 | 16 | 0 | 0% | 9.44 | 要確認 | 表示に対してクリックなし |
| 9 | 学校基本調査 | 14 | 0 | 0% | 11.64 | 68 | 教育・若者流出クラスター候補 |
| 10 | 工場立地動向調査 | 13 | 0 | 0% | 10.85 | 要確認 | 産業立地の業務利用意図を監査 |

`local-public-employee-salary` は100 impressionsあるが、survey masterの性質とranking在庫を再確認してから編集対象にする。
単純なimpressions順だけで採用しない。

## 決定

最優先の個別監査 `wage-structure-survey` は完了した。同型UIの横展開実装は国勢調査の本番確認後に判断する。

順序:

1. `wage-structure-survey` — query意図、タイトル、76 rankingの属性軸を監査
2. `kakei-chousa` — doc17の論点カタログを再利用
3. `local-finance` — 行政実務層向けの読み方を設計
4. `social-life-basic-survey` — 生活時間・余暇の独自論点
5. `housing-land-survey` / `school-basic-survey` — 意思決定意図と順位を再比較して選択

## 監査の完了境界

ポートフォリオ監査として必要な次の項目は完了した。

- 公開survey全74件の存在とranking件数をR2で確認
- 最新28日GSCで表示実績のあるsurveyを抽出
- 優先候補を需要・順位・在庫から決定
- 最優先 `wage-structure-survey` のquery×page、在庫、重複、定義を個別監査
- 一括生成を避ける選別ルールを確定

表中の「要確認」は本監査の漏れではなく、そのsurveyを将来実装候補として選んだ時に行う個別監査を意味する。
需要が乏しい残り全surveyへ先回りして長文設計を作ることは、people-first方針と工数配分に反するため実施しない。

## データ上の制約

保存済みGSC snapshotはpage表とquery表が別集計だが、page filter付きGSC APIで個別queryを取得できることを確認した。
ただしプライバシー保護によりquery行のimpressions合計はpage合計より少ない。開示されないqueryを推測で補完しない。

> 訂正記録: 初回監査ではW24〜W27を週次値として合算したが、各CSVはそれぞれ直近28日snapshotで期間が重複していた。
> 本表は最新W27単独値へ訂正済み。今後も複数snapshotを合算しない。

## やらないこと

- 74 surveyの本文を一括生成
- ranking在庫だけを理由に優先順位を決める
- YMYL領域を一般surveyと同じ注意文で処理する
- query×pageデータなしで検索意図を確定する

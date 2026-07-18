---
type: note-draft
vertical: product-sales
category: prefecture-excel-analysis
slug: excel-gap-timeseries-analysis
title: 全国平均との差・時系列・相関を見るExcel分析テンプレート
created: 2026-07-18
status: draft
is_paid: true
price_jpy: 3980
tags: [Excel, データ分析, 時系列, 相関, 都道府県, 統計]
published: false
source: product-factory (deterministic draft — 公開前に critic/人間レビューが必要)
---

# 全国平均との差・時系列・相関を見るExcel分析テンプレート

## こんな作業をしていませんか
自県と全国平均の差や、前年差・成長率・2指標の相関をExcelで分析したい——そんなときに、そのまま使えるテンプレートと手順をまとめました。

## この記事で手に入るもの
- 候補地域の比較表：3〜10地域を選択して横並び比較する
- 自県と全国平均との差分析：偏差・順位・平均差から自県の位置を把握する
- 時系列・前年差・成長率分析：CAGR・指数・前年差で推移を分析する
- 2指標相関・四象限分析：散布図と相関から地域を四象限分類する
- Excel テンプレートなので、47 都道府県ぶんのデータを差し替えるだけで自分のテーマに応用できます。

## 完成イメージ
![完成イメージ：全国平均との差・時系列・相関を見るExcel分析テンプレート](images/completion.png)
（この記事のExcel テンプレートで作れる成果物のイメージです。表紙・図版は images-plan に沿って用意します。）

## 対象者・対象外
- 想定読者: 事業企画・出店担当・自治体・公務員・調査担当・研究者
- 対象外: プログラミングでの自作を前提にする方（本商品はテンプレート提供です）

## データ・出典・動作環境
- 収録データ例: 日本人人口（基準年 2024）
- 出典: 政府統計の総合窓口 (e-Stat) を基に stats47 が集計・可視化しています。
- 国・府省・自治体や e-Stat の公認・推奨を示すものではありません。
- 対応環境: Excel 365 (Windows / Mac)
- 形式: xlsx

## 無料でできること
Excel テンプレートを使わなくても、次のデータは stats47 で無料で確認できます。
- 無料で見られる関連データ: [stats47.jp/ranking](https://stats47.jp/ranking)
- 無料で見られる関連データ: [stats47.jp/compare](https://stats47.jp/compare)
この記事の有料部分では、上記を自分の資料に落とし込むExcel テンプレートと、差し替え・操作の手順を提供します。

## 有料部分に含まれるもの
- Excel テンプレート一式（添付ファイルの version と hash を明記）
- 導入・データ差し替え・Office 操作の手順
- 出典表記のルールと、よくあるエラーの対処

<!-- paid:start -->

## 添付ファイル
- C-05 / SOURCES.csv（csv・約1KB）（実機検証前のため暫定）
- C-05 / LICENSE-ja.txt（plain・約1KB）（実機検証前のため暫定）
- C-05 / data.csv（csv・約2KB）（実機検証前のため暫定）
- C-05 / product.xlsx（vnd.openxmlformats-officedocument.spreadsheetml.sheet・約11KB）（実機検証前のため暫定）
- C-05 / manual.pdf（pdf・約37KB）（実機検証前のため暫定）
- C-06 / SOURCES.csv（csv・約1KB）（実機検証前のため暫定）
- C-06 / LICENSE-ja.txt（plain・約1KB）（実機検証前のため暫定）
- C-06 / data.csv（csv・約2KB）（実機検証前のため暫定）
- C-06 / product.xlsx（vnd.openxmlformats-officedocument.spreadsheetml.sheet・約11KB）（実機検証前のため暫定）
- C-06 / manual.pdf（pdf・約37KB）（実機検証前のため暫定）
- C-07 / SOURCES.csv（csv・約1KB）（実機検証前のため暫定）
- C-07 / LICENSE-ja.txt（plain・約1KB）（実機検証前のため暫定）
- C-07 / data.csv（csv・約2KB）（実機検証前のため暫定）
- C-07 / product.xlsx（vnd.openxmlformats-officedocument.spreadsheetml.sheet・約11KB）（実機検証前のため暫定）
- C-07 / manual.pdf（pdf・約38KB）（実機検証前のため暫定）
- C-08 / SOURCES.csv（csv・約1KB）（実機検証前のため暫定）
- C-08 / LICENSE-ja.txt（plain・約1KB）（実機検証前のため暫定）
- C-08 / data.csv（csv・約2KB）（実機検証前のため暫定）
- C-08 / product.xlsx（vnd.openxmlformats-officedocument.spreadsheetml.sheet・約11KB）（実機検証前のため暫定）
- C-08 / manual.pdf（pdf・約38KB）（実機検証前のため暫定）

## 導入手順
1. 添付ファイルをダウンロードし、任意のフォルダに展開します。
2. Excel で本体ファイルを開きます。
3. サンプルデータの並びを確認し、自分のデータに置き換えます。

## データ差し替え手順
- data.csv または本体のデータ範囲を、47 都道府県ぶん同じ並び順で入れ替えます。
- 都道府県コードで結合しているため、県名の表記ゆれがあってもコードが一致すれば反映されます。

## Excel 固有の操作
- 数値を入れ替えると順位・グラフが再計算されます。
- 一部の地図・グラフは Microsoft 365 の機能が前提です（対応環境を確認してください）。

## 出典と加工の表示
- 成果物には SOURCES.csv の出典（調査名・年・加工方法）を残してください。
- e-Stat を基にした独自集計であり、行政の公認ではない旨を明記してください。

## よくあるエラー
- 図が崩れる: 対応環境外（Web/モバイル版）で開いていないか確認してください。
- 色が変わらない: 画像ではなく図形を選択しているか確認してください。

## 利用許諾・免責
- ライセンス: 1 法人ライセンス（購入した 1 法人内での業務利用可）
- テンプレート・図形・元データ単体の再販売／再配布は禁止です。
- データの正確性・利用結果について保証するものではありません。ご自身で確認のうえご利用ください。

## 更新条件・サポート
- 収録データは基準年固定の買い切りです（自動更新はありません）。
- 不明点は購入者ページからご質問ください（対応範囲は商品により異なります）。

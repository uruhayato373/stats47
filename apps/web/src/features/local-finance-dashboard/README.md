# local-finance-dashboard

`/themes/local-finance`（地方財政｜財政状況）の専用ダッシュボード。総務省「決算カード（地方財政状況調査）」の実データで、デジタル庁 Japan Dashboard の財政状況ページを都道府県＋市区町村で再現する。

> 専用 `app/themes/local-finance/page.tsx` で render（汎用 `[themeSlug]` ではない）。`ThemePageLayout`（地図/相関/ランキングパネル）は使わない。

## 構成

- 都道府県 → 市区町村 のカスケードセレクタ
- **三キーチャート**: 実質収支（額・折れ線）/ 積立金現在高（財政調整・減債・その他の積み上げ棒）/ 地方債現在高（棒）
- **財政指標4**: 財政力指数 / 経常収支比率 / 実質公債費比率 / 将来負担比率（実線=当該団体・破線=比較平均）
- 比較破線: 県全体=全国（都道府県）平均、市区町村=**類似団体平均**（同「市町村類型」の全国平均、無ければ県内平均）
- 歳入歳出の構成比 Sankey: 県全体=`finance-flow`（R2）、市区町村=決算カードの歳入財源→目的別歳出

## データ（完全DBレス: Reference = 総務省 Excel から再生成可能）

| パス | 内容 | 生成 |
|---|---|---|
| `data/finance-cards.json` | 都道府県 47 × 2020-2024 × 12 指標（static import / SSR）| `apps/web/scripts/generate-finance-cards.py` |
| `public/finance-cards/cities/<県コード>.json` | 市区町村 1,741 団体 × 5 年（`type`/`years`/`flow`、client fetch）| `apps/web/scripts/generate-finance-cards-cities.py` |
| `public/finance-cards/similar-averages.json` | 23 類型 × 5 年の平均（=類似団体平均、client fetch）| 同上（市区町村スクリプトが併産）|

> 出典: 総務省 都道府県/市区町村 決算カード xlsx（`https://www.soumu.go.jp/iken/zaisei/card.html`）。年度→ページ: 都道府県は `card.html` 単一 Excel／市区町村は `card-21`〜`card-25.html`（令和2〜6＝2020〜2024）。
> 抽出セル（決算カードレイアウト）: 都道府県=値列 CQ。市区町村=左ブロック CO / 右ブロック CS / 歳入内訳 M / 目的別歳出 BF / 市町村類型 = 「市町村類型」ラベル右。
> **e-Stat には決算カード本体・類似団体区分が無い**（`.claude/rules/estat-api.md` 参照）。

### 再生成手順

```bash
# 都道府県（5 Excel）
cd /tmp && for y_id in "2020:000803850" "2021:000873474" "2022:000937781" "2023:000999084" "2024:001064044"; do \
  y=${y_id%%:*}; id=${y_id##*:}; curl -sA "Mozilla/5.0" -o kessan-$y.xlsx "https://www.soumu.go.jp/main_content/$id.xlsx"; done
python3 apps/web/scripts/generate-finance-cards.py

# 市区町村（card-21..25 から自動スクレイプ＋並列DL＋解析。openpyxl 必須）
python3 apps/web/scripts/generate-finance-cards-cities.py
```

## 残課題

- PBI 元サイトにある **都道府県プロフィール地図**は不要方針のため非掲載。
- 市区町村の年度トレンドは決算カードの取得年（2020-2024）に依存。

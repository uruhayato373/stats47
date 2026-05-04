# Source: note.com 注目記事

クリエイター層が議論しているテーマを発見する。**公式 RSS / トレンド API が存在しない**ため、WebSearch + WebFetch の組み合わせで間接取得する（精度は他ソースより低め）。

## データ取得（3 手法を組み合わせ）

### 1a. WebSearch でテーマ別検索

stats47 のカテゴリに関連するクエリで note.com の人気記事を発見:

```
WebSearch: "site:note.com" 都道府県 ランキング
WebSearch: "site:note.com" 統計 都道府県
WebSearch: "site:note.com" 地域格差
WebSearch: "site:note.com" 人口減少 地方
```

直近 1 ヶ月以内の記事を優先する。

### 1b. note.com の注目カテゴリページを WebFetch

```
WebFetch: https://note.com/topic/society       (社会)
WebFetch: https://note.com/topic/economy       (経済)
WebFetch: https://note.com/topic/lifestyle     (ライフスタイル)
WebFetch: https://note.com/topic/local         (地域)
```

HTML からタイトル・URL・スキ数を抽出。スキ数が多い = 注目度が高い。

### 1c. WebSearch で note トレンドを間接取得

```
WebSearch: note.com 話題 今週 社会
WebSearch: note.com 人気記事 統計 データ
```

note.com 内のまとめ記事 / ランキング紹介から話題を把握する。

## 整理・重複除去

全手法の結果を統合し、URL で重複除去。各記事から:

| フィールド | 抽出元 |
|---|---|
| keyword | タイトルから名詞・固有名詞を抽出（同じテーマで複数記事ある場合は集約） |
| popularity | スキ数（取得できた場合）または検索順位 |
| relatedUrls[] | 記事 URL |
| 補足: title | 記事タイトル |
| 補足: author | 著者名（取得できた場合） |

## 除外対象（ソース固有）

通常の除外ルールに加え、note 特有のものも除外:
- 個人の日記・エッセイ（統計テーマと無関係なもの）
- 創作・小説・ポエム
- 商品レビュー・アフィリエイト記事
- プログラミング・技術記事
- 自己啓発・ビジネスハウツー（統計データと結びつかないもの）

## sourceLabel

- `note`

## 注意

- **公式 API が無い**: WebSearch / WebFetch ベースで精度が落ちる。他ソースの補助として使うのが理想
- **スキ数の取得**: HTML から取り出せないこともある。取得失敗時は popularity を空にして他のメタ情報で重要度を推定
- **ノイズが多い**: 個人の日記やエッセイが多く、Phase 2 の除外フィルタを厳しめに適用すること

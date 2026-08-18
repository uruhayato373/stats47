# Source: all（全ソース統合）

`trends` / `gsc` / `hatena` / `news` / `yahoo` / `note` の 6 ソースを並列実行し、結果を統合する。**複数ソースで同時に話題になっているクロスソースヒット**を最優先候補として扱う。

## データ取得

各ソースの Phase 1 を **並行して** 実行する（順序依存なし）:

| ソース | 参照 |
|---|---|
| Google Trends | `sources/trends.md` |
| GSC | `sources/gsc.md`（サービスアカウント鍵が無い場合はスキップして警告ログを残す） |
| はてブ | `sources/hatena.md` |
| Google News | `sources/news.md` |
| Yahoo!ニュース | `sources/yahoo.md` |
| note.com | `sources/note.md` |

各ソースから返ったトレンドリストを統合フォーマットで束ねる:

```
[
  { keyword, sourceLabel, popularity, relatedUrls, ... },
  ...
]
```

`sourceLabel` はソースを跨いで集約しないこと（後段でクロスソースヒット集計に使う）。

## クロスソースヒット集計

統合後、`keyword` で集約し以下を算出:

```
{
  keyword: "最低賃金",
  sourceLabels: ["google-trends", "google-news", "hatena", "gsc"],
  hitCount: 4,
  popularityAggregate: { ... 各ソースの popularity を保持 ... }
}
```

ヒット閾値:
- `hitCount >= 3` → **クロスソースヒット**（最優先候補）
- `hitCount = 2` → 注目候補
- `hitCount = 1` → 通常候補（単一ソース由来）

## 候補生成の追加フォーマット

`all` モードでは Phase 5 のテンプレに以下を追加:

```
- **ヒットソース数**: {hitCount} / 6
- **検出ソース**: {sourceLabels をカンマ区切り}
- **ソース別注目度**:
  - google-trends: ...
  - hatena: ...
  - ...
```

## サマリーの追加項目

```markdown
## クロスソースヒット (3 ソース以上で出現)

| # | キーワード | ヒット数 | ソース | カテゴリ | マッチ度 |
|---|---|---|---|---|---|
| 1 | 最低賃金 | 4 | trends, news, hatena, gsc | laborwage | ★★★ |
```

## sourceLabel

- `all` モードでは個々のトレンドの sourceLabel は元のまま保持（クロスソースヒット集計で使う）

## 注意

- **GSC の鍵が無い環境**: スキップしてログを残し、5 ソースで継続。停止しない
- **並列実行のレート制限**: WebFetch を短時間に大量実行すると失敗する場合あり。各ソースは 1〜2 並列に絞ると安全
- **クロスソースヒットの優位性**: 単一ソースの偶発的なバズと違い「実際に多面的に話題になっている」=記事化リターンが高い
- **保存ファイル名**: `trends-all-YYYY-MM-DD.md`

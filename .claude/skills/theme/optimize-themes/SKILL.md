---
name: optimize-themes
description: テーマダッシュボードをアクセス状況・競合分析・ギャップ分析で継続的に最適化
argument-hint: "[theme-key] | --all"
allowed-tools: Read, Grep, Glob, Bash, WebSearch, WebFetch, Agent
---

テーマダッシュボードをアクセスデータ・競合調査・コンポーネント監査の3軸で分析し、優先度付き改善アクションを出力する。

## 引数

`$ARGUMENTS` — テーマキー（例: `occupation-salary`）または `--all`（全テーマ一括）

## 手順

### Phase 1: アクセスデータ収集

1. **GSC データ取得** — テーマページへの検索流入を分析:

```
/fetch-gsc-data last3m page,query page=/themes/
```

抽出する情報:
- テーマページ別の Clicks / Impressions / CTR / 平均順位
- 各テーマに流入しているクエリ（検索意図の把握）
- CTR が低い（< 3%）が表示回数が多いページ（タイトル・description 改善候補）
- 順位 5〜20 位のクエリ（チャート追加で順位アップ可能性あり）

2. **GA4 データ取得** — テーマページの滞在・エンゲージメントを分析:

```
/fetch-ga4-data last3m pages page=/themes/
```

抽出する情報:
- テーマページ別の PV / Active Users / 平均滞在時間
- 滞在時間が短い（< 30秒）テーマ（コンテンツ不足の可能性）
- PV が多いが滞在短い = チャートで引き留める余地あり

### Phase 2: 競合調査

3. 主要競合サイトの同テーマページを WebSearch で調査:

**対象テーマ**: Phase 1 で「PV 上位」かつ「改善余地あり」と判定したテーマ（`--all` 時は上位5テーマ）

**調査対象サイト**:
- とどラン (todo-ran.com) — 都道府県ランキング
- RESAS (resas.go.jp) — 地域経済分析システム
- Japan Dashboard — 政府データダッシュボード
- 都道府県データランキング (uub.jp)

**調査項目**:
```
WebSearch: "{テーマキーワード} 都道府県 ランキング site:{competitor}"
```

- 競合が提供しているチャートタイプ（折れ線・棒・地図・散布図）
- 競合にあって stats47 にない指標・切り口
- 競合の情報構造（タブ分け・セクション構成）
- 競合のページタイトル・description（SEO 参考）

### Phase 3: コンポーネント監査

4. `/audit-theme-components` の手順に従い、テーマの page_components を監査:

- panelTab 別のチャート有無
- ThemeDbChartRenderer 対応タイプか
- セクション割当の整合性

### Phase 4: 統合分析・優先度付け

5. Phase 1〜3 の結果を統合し、各テーマにスコアリング:

| 指標 | 重み | 算出方法 |
|---|---|---|
| 検索需要 | 高 | GSC Impressions（表示回数） |
| 改善余地 | 高 | 滞在時間短い × チャート数少ない |
| 競合優位性 | 中 | 競合にない切り口があるか |
| 実装コスト | 低 | source_config が揃っているか |

### Phase 5: 改善アクション出力

6. 以下の形式でレポートを出力:

```markdown
## テーマ最適化レポート

### 実行日: YYYY-MM-DD
### 分析期間: 直近3ヶ月

---

### テーマ優先度ランキング

| 順位 | テーマ | PV | 滞在(秒) | チャート数 | GSC順位 | スコア |
|------|--------|-----|---------|-----------|---------|--------|
| 1 | occupation-salary | 1,200 | 25 | 5 | 8.3 | 85 |
| 2 | safety | 800 | 45 | 4 | 5.1 | 72 |

### テーマ別改善アクション

#### 1. occupation-salary（スコア: 85）

**アクセス状況:**
- PV: 1,200 / 滞在: 25秒（短い）
- 主要クエリ: 「看護師 年収 都道府県」（順位8位, CTR 2.1%）

**競合との差:**
- とどラン: 職種別の年収チャートを個別ページで提供
- stats47 の優位性: 31職種を1ページで比較できる

**推奨アクション:**
1. 🔴 高優先: description にチャート数（31職種）を明記 → CTR 改善
2. 🟡 中優先: mixed-chart 追加（年収 vs 勤続年数）→ 滞在時間改善
3. 🟢 低優先: 散布図追加（年収 vs 地価）→ 差別化

**チャート追加候補:**
- `/design-theme-charts occupation-salary` で設計可能
```

## --all 指定時

全テーマを Phase 1〜2 で一括分析し、スコアリング結果のサマリーと上位5テーマの詳細アクションを出力。

## 注意

- GSC/GA4 データは2〜3日遅延があるため、最新日を含めないこと
- 競合調査は WebSearch を使い、アクセス過多にならないよう対象テーマを絞ること（`--all` 時は上位5テーマまで）
- このスキルは**分析と提案のみ**。チャート追加は `/design-theme-charts` → `/insert-theme-components` で別途実行
- DB は readonly で開くこと

## 参照

- `/fetch-gsc-data` — GSC データ取得
- `/fetch-ga4-data` — GA4 データ取得
- `/audit-theme-components` — テーマ監査
- `/design-theme-charts` — チャート設計
- `.claude/skills/theme/design-theme-charts/reference/chart-patterns.md` — チャート決定木

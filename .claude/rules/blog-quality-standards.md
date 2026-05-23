# ブログ品質基準 (curiosity gap パターン)

stats47.jp の `/blog/{slug}` 記事を新規作成または brushup する際の必須基準。BLOG-CTR-03/04 (2026-05-23) の実測ベースで確立。

## なぜこのルールがあるか

2026-05-23 のブログ品質診断で判明:

- 187 記事中チャート採用は 1% (2 件) → **チャートの有無は CTR の主要因ではない**
- トップパフォーマー (health-life-expectancy-structure, CTR 4.6%) もチャート 0
- 失敗記事 (W19 新規 6 本) は CTR 0% (合計 626 imp / 0 clicks)
- 真の品質ギャップは **タイトルの curiosity gap** にあった

## 必須パターン (タイトル)

### NG: 事実羅列型

```
×「砂糖消費量1位は三重5kg・最下位東京」(CTR 0%)
×「都道府県別 X ランキング｜A が1位、B が最下位」
×「X ランキング 2024｜...XX 倍格差」(数値だけ羅列)
```

### OK: curiosity gap 型

タイトルに以下のいずれかの要素を入れる:

1. **疑問形 / なぜ?**: 「**なぜ**東北が高い?」「**唯一**自立できる47都道府県は」
2. **矛盾 / 逆説**: 「寿命は延びたが**不健康期間も延びた**」「**意外**にも京都が1位」
3. **真因 / 構造**: 「物価格差の**真因**は家賃」「人口密度の**真因**が見える」
4. **比較対比**: 「東京 vs 北海道で44倍」「コロナで半減→**V字回復**で過去最多」
5. **倍率 + 意外性**: 「住居だけ1.6倍格差」「ホタテ99%独占」

### 推奨タイトル構造

```
{主要 fact + curiosity gap}｜{追加情報 (年・対象)}
```

例:
- ✅「中学生の身長は県で3.9cm違う｜秋田163.6cm・高知159.7cm、**なぜ東北が高い?** (2023)」
- ✅「人口密度は東京 vs 北海道で44倍｜**埼玉が昼夜人口比率最下位の意外**、47都道府県」
- ✅「財政力指数ランキング｜東京1.06 vs 島根0.25、**唯一「自立」できる**47都道府県は (2022年度)」

## 必須パターン (description)

冒頭は **緊張感セットアップ** で開始。事実だけ羅列しない。

### NG

```
×「2024年最新版・47都道府県の X ランキング。1位は A (Y)、最下位 B (Z)で N 倍差。」
```

### OK

```
✅「『同じ日本でも住む県で物価が変わる』──2024年消費者物価地域差指数で...」
✅「『面積1位は北海道、人口密度1位は東京』──なぜこの2つが一致しないのか?」
✅「半減した宿泊市場、4年で過去最多に──だが回復は均一ではなく、東京 vs 徳島で54倍差。」
```

### 推奨 description 構造

```
{緊張感セットアップ (1 文)}──{具体的な対比・数値 (1-2 文)}{記事の貢献 (何を可視化するか)}
```

## 推奨パターン (本文)

### コール アウトの活用

`[!NOTE]`, `[!TIP]`, `[!WARNING]` callout を 2-4 個配置:

```markdown
> [!NOTE]
> 本データの定義・調査方法の補足

> [!WARNING]
> 注意点 (調査年度の変遷、定義変更、サンプル偏りなど)

> [!TIP]
> 読み解くコツ・関連指標
```

### 構造テンプレート

```
1. 冒頭 (200-400 字)
   - 緊張感セットアップ
   - 記事の中核質問

2. データの概要 (1-2 H2)
   - 全体トレンド
   - [!NOTE] で定義補足

3. ランキング詳細 (2-3 H2)
   - TOP / 下位の対比
   - 各順位の文脈解説

4. 構造的解釈 (1-2 H2)
   - 「なぜ」の探究
   - [!WARNING] で限界・注意

5. 関連 / まとめ (1 H2)
   - 関連記事リンク 3-5 個
   - 「次に読むべきデータ」誘導
```

### 内部リンク密度

最低 3-5 個の内部リンクを含む:

- `/ranking/{key}` (本テーマのランキング詳細)
- `/areas/{prefCode}` (上位/下位県の area page)
- `/blog/{related-slug}` (関連記事)
- `/category/{key}` (カテゴリ一覧)

## brushup の判断基準

GSC スナップショットで以下に該当する記事は brushup 候補:

- impressions ≥ 200 / 週
- CTR < 2%
- position 5-15 (改修で順位向上の余地大)

特に **impressions ≥ 500 かつ CTR < 1%** は最優先 (1記事あたり +20-50 clicks/週 のリフト見込み)。

検証コマンド (改修候補抽出):

```bash
awk -F',' 'NR>1 && $1 ~ /\/blog\// && $3 >= 200 && ($4+0) < 0.02 && ($4+0) > 0 {print $0}' \
  .claude/skills/analytics/gsc-improvement/reference/snapshots/<week>/pages.csv | \
  sort -t',' -k3 -rn | head -20
```

## デプロイフロー (記録)

1. `.local/r2/app/blog/{slug}/article.md` の frontmatter (title, seoTitle, description) を編集
2. 必要なら本文も編集 ([!NOTE] callout 追加、内部リンク強化)
3. `npm run articles:sync-from-r2 --workspace=packages/database` で D1 articles テーブル更新
4. `bash .claude/skills/db/sync-snapshots/run.sh --only blog` で R2 push
5. 改善ログ `docs/05_改善ログ/gsc.md` に BLOG-CTR-NN として記録
6. feature ブランチで commit → develop merge → PR develop → main → CI green → merge → Cloudflare Pages 自動 deploy

## 実証データ (2026-05-23 ベース)

BLOG-CTR-03 / 04 で 10 記事を curiosity gap 改修:

| Tier | imp 合計 | 改修前 CTR 平均 | 想定 CTR | 想定リフト |
|---|---|---|---|---|
| Top 5 (BLOG-CTR-03) | 5,499 | 1.5% | 3.5% | +101 clicks/週 |
| Tier 2 (BLOG-CTR-04) | 1,307 | 0.69% | 3.0% | +30 clicks/週 |
| **合計 (Top 10)** | **6,806** | 1.31% | 3.4% | **+131 clicks/週 (+645/月)** |

4 週後 (2026-06-20) に GSC snapshot で検証。実測 CTR が想定の 70% 以上なら本パターンは effect/full 確定。

## 違反検知

新規ブログ記事 / brushup で本基準に違反していないか CI で検知する案 (Phase 1 で実装検討):

```bash
# タイトルに curiosity gap 要素が含まれているかチェック
node .claude/scripts/blog/check-quality.mjs --slug <slug>
```

検出パターン (要素のいずれかを含むか):
- `なぜ`, `意外`, `唯一`, `真因`, `vs`, `逆転`, `?`

## 関連ドキュメント

- 親方針: `docs/02_実装計画/100x-pv-strategy.md` Phase 0 (CTR 改修)
- 実測判定ルール: `.claude/rules/evidence-based-judgment.md`
- 改善ログ: `docs/05_改善ログ/gsc.md` BLOG-CTR-03 / BLOG-CTR-04
- 既存スキル: `.claude/skills/blog/brushup-blog-article/SKILL.md` (拡張候補)

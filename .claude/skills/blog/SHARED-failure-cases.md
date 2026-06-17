# Blog 系 skill 共通 failure ledger

ブログ記事 (新規作成 / brushup / publish) で過去に発生した失敗パターンを集約。新規 failure mode を見つけたら必ず append する。

このドキュメントは以下の skill / agent から参照される:
- `brushup-blog` (`--target article` / `--target batch`)
- `draft-from-trend`
- `publish-article`
- `publish-bulk-articles`
- `article-writer` agent
- `fetch-article-data`
- `generate-article-charts`

検出機構: `.claude/scripts/lib/article-factual-check.mjs` (factual cross-check library) と `.claude/scripts/blog/quality-gate.mjs` (formal gate)。

---

## F-001: rice-harvest 失敗 (機械的 curiosity gap)

**検出日**: 2026-04 (修正後 commit にサインあり)
**slug**: `rice-harvest-volume-prefecture-gap`

**症状**: 「新潟 vs 東京で1244倍」を curiosity gap として採用したが、東京は「米作りをやめた」のではなく「そもそも農地が無い」ため比較基準不成立。1244倍は数値として正確だが本質的価値ゼロ。

**根本原因**: agent が **数値倍率の sensationalism** を価値ある insight と誤解した。

**検出機構**: `quality-gate.mjs` NG_PATTERNS で `/\d+,?\d*\s*倍格差/` と `/\d{2,}\s*倍差(?!\s*の|を|は|が|が|・|、)/` をブロック。

**遮断ルール (skill 側)**:
- `brushup-blog/SKILL.md` C-2 「5 案 framing 採点で 30 点未満は skip」
- title / description に「X倍格差」「X倍差 単独」「驚愕の」「衝撃の」「ヤバい」「最大級」を含めない
- 5 案 framing 採点で 30 点未満なら skip

---

## F-002: 数値捏造 / rank 不整合 (memory drift)

**検出日**: 2026-05-25 (一括リライト 62 件検証)

**症状**: AI agent (sonnet) が 5 案 framing 思考の過程で memory から数値を引き、data と不整合な値を本文・SVG に注入。62 件中 8 件 (13%) が真の factual error、17 件 (27%) が WARN 級の軽微ズレ。

**典型例**:
| slug | claim | actual (data) | 誤差 |
|---|---|---|---|
| electricity-demand-gap | 東京 発電量 42M MWh | 5.7M MWh | 7倍誤差 |
| manufacturing-aichi-dominance | SVG rank 4 = 岡山7,335万円 | 愛媛6,639万円 | 県名+値とも捏造 |
| sewerage-water-supply-gap | 47県中15県が70%未満 | 23県 | 8件ズレ |
| overnight-guests-inbound-recovery | 沖縄 5位 2,580万泊 | 千葉 5位 2,607万泊 | 県名+値ズレ |
| agriculture-hokkaido-dominance | 鹿児島 耕地面積 6位 | 12位 | 6位ズレ |
| fertility-fiscal-nexus | 沖縄 財政力指数 41位 (0.33) | 35位 (0.36) | rank+値ズレ |
| savings-balance-gap | 奈良 消費支出 35位 | 13位 | 22位ズレ、framing 破綻 |

**根本原因**: 
1. agent は data ファイルを 1 回 Read した後、5 案 framing 思考の長い chain of thought の中で数値が漂流する
2. SVG chart は agent が手書きするケースがあり、値を memory で書く傾向
3. `quality-gate.mjs` は形式 (callout / 内部リンク / NG word) しか測れず、数値捏造を検出できなかった

**検出機構** (2026-05-25 追加):
- `.claude/scripts/lib/article-factual-check.mjs` で `data/*.json` の rank を ground truth として build
- 本文の「<都道府県> N位」「N位 <都道府県>」を抽出し、data と突合
- 一致しなければ `RANK_MISMATCH` / `INVERSE_RANK_MISMATCH` blocker
- false positive 抑制: rank-gap (「N位の乖離」)、per-capita 記事、unknown ranking (持ち家比率 等 data にない指標)、paired claim (「東京2位・福井県」)

**遮断ルール (skill 側)**:
- `article-writer.md` 絶対遵守: 「data → 書く、の順序を厳守」「数値は data から copy-paste、memory から引かない」
- `brushup-blog/SKILL.md` 絶対遵守 (全 focus 共通): 同上
- `publish-article/SKILL.md` §5.5: publish 前に factual cross-check 必須通過
- `draft-from-trend/SKILL.md` Step 6: 雛形生成後に factual cross-check 必須通過

**学んだ教訓**:
- LLM agent は data を「最初に確認」してもその後の長い思考 chain で漂流する
- 形式 quality-gate だけでは数値捏造を検出できない (これが盲点だった)
- skill design では「data 確認 → 書く」順序を強制し、最後に script で機械検証する必要がある
- 5 案 framing 思考は美しい framing を生むが、factual fidelity を犠牲にする傾向がある
- count 上限 (1 日 5 件) は agent の集中力を保つ意味で重要 (override しないこと)

---

## F-003: SVG chart の値捏造 (inline SVG provenance なし)

**検出日**: 2026-05-25 (F-002 と同じセッション)

**症状**: agent が手書きした inline SVG (article.md 内) で、`<title>` や `<text>` 要素に data に存在しない値・県名を埋め込む。

**典型例**:
- `manufacturing-aichi-dominance`: SVG chart で rank 4 = 岡山 7,335万円, rank 5 = 三重 7,085万円 と書いたが、data の正しい rank 4 = 愛媛 6,639万円, rank 5 = 岡山 6,464万円

**根本原因**: 
- `generate-article-charts.ts` は data から SVG を生成するが、agent はそれを使わず手書きすることがある
- 手書き SVG には provenance がなく、cross-check しにくい

**検出機構** (2026-05-25 追加):
- `generate-article-charts.ts` で生成 SVG の冒頭に `<!-- data-source: <file>.json | generated: <iso> -->` provenance comment を embed
- `article-factual-check.mjs` の `checkInlineSvgProvenance()` で article.md の inline SVG をスキャン
- 直前 200 chars に `data-source` comment がない SVG → `INLINE_SVG_NO_PROVENANCE` warning

**遮断ルール (skill 側)**:
- agent が SVG を inline で書く場合、直前に `<!-- data-source: ... -->` comment を必ず付ける
- 生成 SVG (`![チャート](data/xxx.svg)` 形式) を優先的に使う (generator 経由なら自動で provenance 付き)

---

## F-004: derived ranking の verify 不能 (false positive 源)

**検出日**: 2026-05-25 (F-002 と同じセッション)

**症状**: 記事が「一人当たり」「持ち家比率」など data ファイルに直接含まれない derived ranking を citing しているケースで、`article-factual-check.mjs` の cross-check が誤って blocker を発火することがある。

**典型例**:
- `local-tax-regional-gap`: 「埼玉 39位 (一人当たり地方税)」と書いたが data は総額ベースの rank しかない → cross-check が false positive

**検出機構** (2026-05-25 追加、library 内 filter):
- `PER_CAPITA_SKIP` regex: 「一人当たり」「人口あたり」を含む文脈は skip
- `isCitingUnknownRanking()`: 「持ち家比率」「N指数」など data label に存在しない named ranking は skip
- `isPerCapitaArticle()`: 記事 frontmatter (seoTitle / description) に per-capita 表現があれば全 rank claim を warning に降格

**遮断ルール (skill 側)**:
- derived ranking を書く場合は frontmatter (seoTitle / description) に「一人当たり」等を明示
- 本文中の rank claim 直前 300 chars 以内に derived 表現を入れる

---

## 新規 failure を追記するときのテンプレ

```markdown
## F-NNN: <短いタイトル>

**検出日**: YYYY-MM-DD (どの skill / session で)
**slug** (該当時): xxx

**症状**: <何が起きたか、具体的に>

**典型例**: <数値例、コードスニペット等>

**根本原因**: <なぜ起きたか>

**検出機構**: <どの script / regex で catch するか、新規追加なら追加日付>

**遮断ルール (skill 側)**: <どの SKILL.md でどう遮断するか>
```

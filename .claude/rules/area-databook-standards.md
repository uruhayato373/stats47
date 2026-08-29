# area 県データブック標準 (AreaDatabook SSOT)

`/areas/[areaCode]` ページを「県データブック」(高密度・全国順位付き県プロフィール) として管理する
**カタログ SSOT の単一ソース**。テンプレ・編集コンテンツ・チャートを設計/編集/監査する agent
(`area-databook-designer` / `area-curator` / `chart-component-builder`) / 人間はこれに従う。

> **背景 (2026-07-18)**: private Google Drive `stats47/参考文献/2021都道府県DataBook/2021年版/` の
> source bundle (47 県 × 6 ページの固定テンプレ・全数値に全国順位) を設計図に、47 県同一 6 チャートだった
> area ページを ~130 指標の県データブックへ拡張する。利用時だけ `.claude/rules/reference-source-standards.md` の
> 共通手順でOS一時領域へ復元し、repo内へ原本を置かない。
> 方式は `theme-catalog-standards.md` と同じ「rules に規約カタログ 1 ファイル、agent/skill は参照のみ」。
> 本ファイルを恒久仕様の SSOT とする。

---

## 0. 情報設計上の責務 (混ぜない)

`/areas/[code]` は**県軸・回遊面** (KPI = 直帰率 / pages/session / 滞在。`docs/01_技術設計/03_情報設計.md`)。
全 KPI は「**自県の値 + 全国順位バッジ**」で県軸に閉じる。

| やる | やらない |
|---|---|
| 自県の値・全国順位・全国平均対比・県固有の時系列 | **47 県横並びの地図/コロプレス/散布図** (theme の責務) |
| 気候等の順位を rank badge で表示 | 気候を 47 県棒グラフで並べる (情報設計違反) |
| 比較欲求は `rankingLink` で theme/ranking へ回遊 | area ページ内で 47 県比較を完結させる |

書籍の**指標選定・章立て (アイデア/事実) は参照可**。レイアウト・図案・文言・写真の**複製は禁止**。
source bundle manifestは
`.claude/state/source-inventory/prefecture-databook/2021/source-bundle-manifest.json`を正典とする。

---

## 1. SSOT 構造 (どのデータがどこにあるか)

| 層 | 場所 | 役割 |
|---|---|---|
| **SSOT: テンプレ** | `packages/data-configs/src/area-databook/template.ts` (`AREA_DATABOOK_TEMPLATE`) | 47 県共通のセクション×ブロック構成。数値は rankingKey 参照で県非依存。**ここだけ編集** |
| **SSOT: 編集** | `packages/data-configs/src/area-databook/editorial/<code>.ts` + `editorial/index.ts` (`AREA_EDITORIALS`) | 県別の特産品・県シンボル。area-curator が単一オーナー |
| 型 | `packages/data-configs/src/area-databook/types.ts` | `AreaDatabookTemplate` / `DatabookSection` / `DatabookBlock` / `AreaEditorial` 等 |
| **生成物** (手編集禁止) | `apps/web/scripts/data/page-components/area/<code>.json` | chart ブロックのみを PageComponent 行に codegen (47 県同一・byte 一致) |
| **派生** (焼き込み) | R2 `app/areas/<code>/databook.json` | ranked-kpi の値+全国順位+全国平均+年次、農業 top10。exporter が R2 values.json から生成 |
| 特産品イラスト | R2 `app/areas/<code>/specialty/<slug>.webp` | **Codex セッション (OpenAI 画像) で生成** (2026-07-18 に Gemini から変更・§5)。欠損時はイニシャル代替タイルに degrade |

```
AREA_DATABOOK_TEMPLATE (SSOT, git TS)
  │  npm run generate:area-databook --workspace=@stats47/data-configs
  └─▶ apps/web/scripts/data/page-components/area/<code>.json  (chart ブロックのみ)
        │  export-page-components-snapshot.ts (無変更)
        └─▶ R2 app/page-components/area/<code>.json → AreaDatabookSection が読む

AREA_EDITORIALS (SSOT, git TS) ──直 import──▶ SpecialtyList / PrefSymbolCard
area-databook-snapshot.ts ── R2 values.json (rank 済) ──▶ R2 app/areas/<code>/databook.json ──▶ RankedKpiGrid
```

---

## 2. データ経路 (2 系統・使い分け)

| 系統 | 対象ブロック | 経路 |
|---|---|---|
| **A. 焼き込み** | `ranked-kpi-grid` / `gender-paired-kpi` / `agri-top10` | exporter が R2 values.json (rank 実装済) から派生 → R2 `databook.json`。**ページは 1 read**。home-featured / area-profile と同一 |
| **B. estatParams ライブ** | `chart` (推移・構成・レーダー) | 既存 page-components 経路 (`DashboardComponentRenderer` → `fetchEstatData` → e-Stat + R2 キャッシュ、47 県共有) |

- ライブチャートは **≤ 12 目安** (初回 ISR 遅延を避ける)。順位不要な時系列・構成のみ B に置く。
- `capitalCityValue: true` の指標 (家計調査系) は UI が「※県庁所在市の値」注記を自動付与する。

---

## 3. ブロック文法 (何をどのブロックで見せるか)

| 見せたいこと | blockType | 描画 |
|---|---|---|
| 値 + 全国順位の KPI 群 | `ranked-kpi-grid` | `RankedKpiGrid` (databook.json 読み) |
| 男女の対比 (初婚年齢・寿命・給与・身長・体重) | `gender-paired-kpi` | `GenderPairedKpiGrid` |
| 農業産出額 上位品目 | `agri-top10` | databook.json の agriTop10 |
| 特産品 | `specialty-list` | `SpecialtyList` (editorial 直 import + R2 イラスト) |
| 県シンボル (木/花/鳥) | `symbol-card` | `PrefSymbolCard` (editorial) |
| 時系列推移 | `chart` (`line-chart`/`mixed-chart`/`stacked-area`) | estatParams |
| 構成比 (産出額内訳・世帯構成・穀類/肉類) | `chart` (`composition-chart`/`sunburst`) | estatParams |
| 費目バランス | `chart` (`radar-chart`) | estatParams |
| 品目別支出表・農業 top10 詳細 | `chart` (`stats-table`) | — |

- chart の `componentType` は **`AREA_DATABOOK_CHART_TYPES` の 8 種のみ** (validator error)。
  新しいチャート表現が要るときは `chart-component-builder` に依頼し `chart-component-standards.md` §2 の
  カタログ更新とセットで `AREA_DATABOOK_CHART_TYPES` に追加する。
- **新設した非チャート UI** (`ranked-kpi-grid` / `gender-paired-kpi`) は `RankedKpiGrid` /
  `GenderPairedKpiGrid` が正典。KPI カードは databook.json 経路専用で、既存 `kpi-card` (estatParams 経路) は
  拡張しない (経路が別物なので混ぜない)。

---

## 4. セクション構成 (書籍の章立てに対応)

`DatabookSectionKind` (15 種): `symbols` / `specialties` / `agriculture` / `food` / `civic-population` /
`civic-living` / `civic-economy` / `civic-industry` / `household` / `climate` / `gender` / `land-price` /
`tourism` / `education-facility` / `consumption`。

- ページは **1 ページ長尺 + ページ内目次** (`DatabookToc` が sectionKey をアンカーに)。
- `sortOrder` でセクション順・chart 順を決める (テンプレ内一意)。

---

## 5. editorial 品質規約 (特産品・県シンボル)

**書籍の文言・図案・写真は複製しない。** 品名・産地は事実として抽出してよいが、解説は出典に基づき独自に書く。

| フィールド | 規約 (validator error) |
|---|---|
| `specialties` 件数 | 5〜9 件 |
| `description` | 60〜160 字の独自書き起こし。書籍文言のコピー禁止 |
| `sourceUrl` | http(s)。県公式 / 市町村 / JA 等の一次情報 (`evidence-based-judgment.md`) |
| `accessedAt` | ISO date (YYYY-MM-DD) |
| `slug` | kebab-case・県内一意 (R2 イラスト asset キー) |
| `symbols.sourceUrl` / `accessedAt` | 県公式ページで裏取り・出典必須 |

**特産品イラスト**は品目 slug 確定後に **Codex セッション (OpenAI 画像 API)** で生成する
(2026-07-18 に Gemini から変更)。★これはオーナーが Codex 側で画像を作る手作業で、
Claude Code の codex MCP (`.claude/rules/codex-mcp.md`) とは別経路。文字なし・イラスト調・共通スタイルで R2
`app/areas/<code>/specialty/<slug>.webp` に配置。未生成の間は SpecialtyList がイニシャル代替タイルに degrade する。

農業 top10 は editorial ではなく **e-Stat 生産農業所得統計から exporter で機械取得** (PDF は照合用のみ)。

---

## 6. 編集フロー

```
1. packages/data-configs/src/area-databook/template.ts を編集 (セクション・ブロック・指標追加)
   または editorial/<code>.ts を追加 (特産品・シンボル)
2. npm run generate:area-databook --workspace=@stats47/data-configs   # page-components 再生成
3. npm run validate:area-databook --workspace=@stats47/data-configs   # 整合チェック
4. npx tsc --noEmit -p packages/data-configs/tsconfig.json            # 型
5. commit (SSOT + 生成物を同時に)。生成物 (area/*.json) を手編集しない
```

- exporter (databook.json) の再生成は `area-databook-snapshot.ts` (area-profile-snapshot と同一 run)。
- R2 反映は既存フロー (`export-page-components-snapshot.ts` + snapshot 系)。

---

## 7. validator (`npm run validate:area-databook`)

決定的 lint `packages/data-configs/scripts/validate-area-databook.ts`。pre-commit + CI (Area Databook Gate) に配線済。

| レベル | 検査 |
|---|---|
| **error** | rankingKey (ranked-kpi / gender-paired / relatedRankingKeys) が METRICS_REGISTRY に不在 / componentType union 外 / sectionKey・componentKey・blockKey・sortOrder 重複 / sectionKey 非 kebab |
| **error (editorial)** | areaCode 不正 / specialties 5〜9 件逸脱 / description 60〜160 字逸脱 / sourceUrl 非 http(s) / accessedAt 非 ISO / slug 非 kebab・重複 / municipality 空 |
| **error (鮮度)** | `generate:area-databook --check` — 生成物と SSOT の diff (手編集・生成忘れ両方向) |
| **warn** (`--strict` で error) | ranked-kpi 指標の selection 未記入 / editorial 未登録県 (47 未満の残数) |

---

## 8. 禁止事項

| NG | OK |
|---|---|
| `page-components/area/<code>.json` を手編集 | template.ts を編集 → `generate:area-databook` |
| R2 `databook.json` を手編集 | exporter で再生成 |
| 47 県横並び可視化を area に置く | theme へ。area は自県値+順位+回遊リンク |
| 書籍の解説文・図案・写真を複製 | 品名・産地は事実抽出、解説は独自文+出典 |
| `isActive:false` の rankingKey を参照する | 実在 (METRICS_REGISTRY) だけでなく **isActive:true** を満たすキーだけ。47 県共通テンプレなので 1 件の見落としが全 47 ページのリンク切れになる (validator `[metric-inactive]` が error) |
| 未検証の statsDataId で metric 投入 | estat-researcher の実在検証を経て data-ingester |
| 民間データ (JPX/TSR/TDB) の集計値を転載 | e-Stat 経済センサス等の公的統計で代替 |
| `AREA_DATABOOK_CHART_TYPES` 外の componentType | 8 種から選ぶ / chart-component-builder で追加 |

---

## 9. 役割分担

| 工程 | 担当 |
|---|---|
| テンプレ設計 (セクション・ブロック・指標採否・rejectedCandidates) | `area-databook-designer` (template.ts) |
| 編集コンテンツ (特産品・シンボル) + イラスト依頼 | `area-curator` (editorial・単一オーナー) |
| ギャップ指標の statsDataId 実在検証 | `estat-researcher` (未検証 ID 投入禁止) |
| metric 投入 (validate:years/config) | `data-ingester` |
| 新チャート 2 種 + カタログ更新 | `chart-component-builder` |
| databook.json exporter | `snapshot-exporter` |
| R2 push / 公開 | `r2-publisher` / CI |
| 特産品イラスト生成 | **Codex セッション (OpenAI 画像)** — `area-curator` が slug 確定後に依頼 (codex MCP とは別経路・§5) |

---

## 関連

- 型・SSOT: `packages/data-configs/src/area-databook/`
- generator: `packages/data-configs/scripts/generate-area-databook.ts`
- validator: `packages/data-configs/scripts/validate-area-databook.ts`
- exporter: `packages/area-profile/src/exporters/area-databook-snapshot.ts`
- UI: `apps/web/src/features/area-databook/`
- 情報設計 (area の責務): `docs/01_技術設計/03_情報設計.md`
- チャートカタログ: `.claude/rules/chart-component-standards.md`
- SSG 保全 (areas は ƒ): `.claude/rules/nextjs-ssg-preservation.md`
- 指標構造: `.claude/rules/metric-config-standards.md` / e-Stat: `.claude/rules/estat-api.md`
- skill: `.claude/skills/area/databook-editorial/SKILL.md`
- agent: `.claude/agents/area-databook-designer.md` / `.claude/agents/area-curator.md`

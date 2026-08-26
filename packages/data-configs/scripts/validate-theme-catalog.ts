/**
 * validate-theme-catalog — ThemeCatalog の内整合を検証する lint。
 *
 * 規約の正典: `.claude/rules/theme-catalog-standards.md`
 *
 * error (exit 1 / CI・pre-commit をブロック):
 *   - metrics.rankingKey / relatedRankingKeys が METRICS_REGISTRY / metrics に不在
 *   - metrics.rankingKey が isActive:false (/ranking/<key> が 410 か空ページになる)
 *   - componentType が union 外 (TS でもブロックされるが runtime backstop)
 *   - componentKey 重複 (テーマ内)
 *   - rankingLink の参照先が不在 or isActive:false
 *   - page-components の estatParams 構造 (statsDataId 桁 / 系列数とラベル数)
 *   - chart の旧自動生成・汎用 description と空 annotation
 *   - metricGroups: key/title 重複・rankingKeys ⊄ metrics・defaultCheckedKeys 不整合・単位 3 種以上
 * warn (exit 0 / 表示のみ, --strict で error):
 *   - primary/secondary の selection 未記入 / componentKey の横断共有 / sortOrder 重複
 *   - primary 指標がチャート未使用 / metricGroups の未所属・過大
 *
 * ★旧 panelTabs (廃止済み概念) の検査は存在しない。指標カードの編成は metricGroups が担う。
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-theme-catalog.ts
 *   npx tsx packages/data-configs/scripts/validate-theme-catalog.ts --strict
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { THEME_INDICATOR_SETS } from '@stats47/types';

import { METRICS_REGISTRY } from '../src/registry';
import { normalizeUnitForAxis } from '../src/theme-catalog/types';
import {
  listThemeCatalogs,
  CATALOG_COMPONENT_TYPES,
  collectThemeMetricContentCoverage,
  validateThemeMetricContentCoverage,
  THEME_METRIC_DESCRIPTION_MISSING_BASELINE,
  type ThemeCatalog,
} from '../src/theme-catalog';
import {
  EVIDENCE_LENS_CATALOG,
  EVIDENCE_SOURCE_CATALOG,
} from '../src/theme-catalog/evidence-lenses';
import {
  validateChartProps,
  validateMigratedSeriesRefContract,
  validateStatSeriesRefAlignment,
} from '../src/theme-catalog/stat-series-ref';
import { collectColorFieldViolations } from '../src/theme-catalog/chart-color-role';
import { isGenericChartDescription } from '../src/theme-catalog/transform';

const STRICT = process.argv.includes('--strict');
const VALID_TYPES = new Set<string>(CATALOG_COMPONENT_TYPES);

function metricExists(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(METRICS_REGISTRY, key);
}

function tally(list: string[]): string {
  const counts = list.reduce<Record<string, number>>((acc, m) => {
    const tag = m.match(/^\[([a-z-]+)\]/)?.[1] ?? 'other';
    acc[tag] = (acc[tag] ?? 0) + 1;
    return acc;
  }, {});
  return Object.entries(counts)
    .map(([k, v]) => `${k}=${v}`)
    .join(' ');
}

/**
 * チャート近接テキストの責務を検査する。
 *
 * description は廃止済み。型を迂回した残存も拒否する。
 * annotation は可視化固有の注意に限定する入口なので、指定時は空文字を許さない。
 */
export function validateChartContentContract(
  chart: ThemeCatalog['charts'][number],
  where: string,
  errors: string[]
): void {
  const rawChart = chart as unknown as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(rawChart, 'description')) {
    const description = rawChart.description;
    const tag =
      typeof description === 'string' && isGenericChartDescription(description)
        ? 'chart-description-boilerplate'
        : 'chart-description-legacy';
    errors.push(
      `[${tag}] ${where}: CatalogChart.description は廃止済み。誤読防止注釈だけを annotation に置く`
    );
  }

  const annotation = chart.annotation?.trim();
  if (chart.annotation !== undefined && !annotation) {
    errors.push(
      `[chart-annotation] ${where}: annotation は空でない文字列にする`
    );
  }
  if (
    annotation &&
    Object.prototype.hasOwnProperty.call(chart.componentProps, 'annotation')
  ) {
    errors.push(
      `[chart-annotation] ${where}: annotation は CatalogChart.annotation に一元化し、componentProps と二重定義しない`
    );
  }
}

/**
 * チャートから既存の指標ハブへ到達できるかを検査する。
 *
 * 自由記述 URL は許さず、relatedRankingKeys だけを導線の SSOT とする。
 * markdown-section 以外は 1 件以上を必須化し、実在性・有効性・重複を error で止める。
 */
export function validateChartIndicatorHubContract(
  chart: ThemeCatalog['charts'][number],
  where: string,
  errors: string[],
  _warns: string[]
): void {
  const rawChart = chart as unknown as Record<string, unknown>;
  if (Object.prototype.hasOwnProperty.call(rawChart, 'rankingLink')) {
    errors.push(
      `[ranking-link-legacy] ${where}: rankingLink は廃止済み。relatedRankingKeys[0] から生成する`
    );
  }

  const rawLinks = chart.componentProps.rankingLinks;
  if (rawLinks !== undefined) {
    errors.push(
      `[ranking-links-legacy] ${where}: componentProps.rankingLinks は廃止済み。relatedRankingKeys[1..] から生成する`
    );
  }

  const relatedKeys = chart.relatedRankingKeys ?? [];
  if (chart.componentType !== 'markdown-section' && relatedKeys.length === 0) {
    errors.push(
      `[indicator-hub-missing] ${where}: markdown-section 以外は relatedRankingKeys を1件以上指定する`
    );
  }
  const seen = new Set<string>();
  for (const key of relatedKeys) {
    if (!key.trim()) {
      errors.push(
        `[related-key] ${where}: relatedRankingKeys に空文字を置かない`
      );
      continue;
    }
    if (seen.has(key)) {
      errors.push(
        `[related-key-duplicate] ${where}: relatedRankingKey "${key}" が重複`
      );
    }
    seen.add(key);
    if (!metricExists(key)) {
      errors.push(
        `[related-key] ${where}: relatedRankingKey "${key}" が METRICS_REGISTRY に不在`
      );
    } else if (METRICS_REGISTRY[key]?.isActive !== true) {
      errors.push(
        `[related-key] ${where}: relatedRankingKey "${key}" は isActive:false — 指標ハブへ到達できない`
      );
    }
  }
}

export interface IndicatorHubContentCoverage {
  totalKeys: number;
  missingDescriptionKeys: string[];
  authoredNoteKeys: string[];
}

/**
 * チャートから到達する指標ハブに、読者向け定義文があるかを監査する。
 *
 * 導線の正しさと本文の充実度は別契約にする。現欠落は公開阻害せず明示 warn、
 * 欠落数の増加だけを error にして、段階的な著者追記を妨げない。
 */
export function validateIndicatorHubContentCompleteness(
  catalogs: ThemeCatalog[],
  errors: string[],
  warns: string[]
): IndicatorHubContentCoverage {
  const coverage = collectThemeMetricContentCoverage(
    catalogs,
    METRICS_REGISTRY
  );
  validateThemeMetricContentCoverage(coverage, {
    maxMissingDescriptions: THEME_METRIC_DESCRIPTION_MISSING_BASELINE,
    errors,
    warns,
  });

  return {
    totalKeys: coverage.themeReferencedKeys.length,
    missingDescriptionKeys: coverage.missingDescriptionKeys,
    authoredNoteKeys: coverage.populatedNoteKeys,
  };
}

/**
 * page-components (theme) の estatParams 構造を検査する。
 *
 * ★カタログの内整合 (rankingKey の実在等) だけでは、実際にチャートが叩く
 *   e-Stat リクエストの壊れ方を捕まえられない。statsDataId の桁違いや
 *   系列数とラベル数の不一致は「チャートが空になる / 系列が無名になる」形で
 *   本番に出るので、ビルド前に決定的に弾く。
 */
function validatePageComponentEstatParams(errors: string[]): number {
  const dir = path.resolve(
    __dirname,
    '../../../apps/web/scripts/data/page-components/theme'
  );
  let checked = 0;
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith('.json'));
  } catch {
    return 0; // 生成物が無い環境ではスキップ (カタログ検証自体は続行)
  }

  const isStatsDataId = (v: unknown) =>
    typeof v === 'string' && /^\d{10}$/.test(v);

  for (const file of files) {
    const theme = file.replace(/\.json$/, '');
    const components = JSON.parse(
      readFileSync(path.join(dir, file), 'utf8')
    ) as Array<Record<string, unknown>>;

    for (const comp of components) {
      const key = String(comp.componentKey ?? comp.component_key ?? '(no-key)');
      const type = String(comp.componentType ?? comp.component_type ?? '');
      const description = comp.description;
      const props = (comp.componentProps ??
        comp.component_props ??
        {}) as Record<string, unknown>;
      const where = `${theme}/${key}`;

      if (description !== null) {
        if (
          typeof description === 'string' &&
          isGenericChartDescription(description)
        ) {
          errors.push(
            `[chart-description-boilerplate] ${where}: componentType 由来の定型説明を表示しない`
          );
        } else {
          errors.push(
            `[chart-description] ${where}: 生成物 description は互換用 null に固定する`
          );
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(props, 'annotation') &&
        (typeof props.annotation !== 'string' ||
          props.annotation.trim().length === 0)
      ) {
        errors.push(
          `[chart-annotation] ${where}: annotation は空でない文字列にする`
        );
      }

      const paramGroups: Array<{ label: string; params: unknown }> = [
        { label: 'estatParams', params: props.estatParams },
        { label: 'columnParams', params: props.columnParams },
        { label: 'lineParams', params: props.lineParams },
      ];

      for (const { label, params } of paramGroups) {
        if (params == null) continue;
        const list = Array.isArray(params) ? params : [params];
        for (const p of list) {
          checked++;
          const id = (p as Record<string, unknown>)?.statsDataId;
          if (!isStatsDataId(id)) {
            errors.push(
              `[estat-params] ${where}: ${label} の statsDataId "${String(id)}" が 10 桁の数字でない`
            );
          }
        }
      }

      // statsDataId をトップレベルに持つ型 (composition / donut / cpi 等)
      if (props.statsDataId != null && !isStatsDataId(props.statsDataId)) {
        checked++;
        errors.push(
          `[estat-params] ${where}: statsDataId "${String(props.statsDataId)}" が 10 桁の数字でない`
        );
      }

      // 系列数とラベル数・色数の一致 (ずれると凡例が無名・色が既定へ落ちる)
      const lengthPairs: Array<[string, unknown, string, unknown]> =
        type === 'mixed-chart'
          ? [
              [
                'columnParams',
                props.columnParams,
                'columnLabels',
                props.columnLabels,
              ],
              ['lineParams', props.lineParams, 'lineLabels', props.lineLabels],
            ]
          : [['estatParams', props.estatParams, 'labels', props.labels]];

      for (const [paramsName, params, labelsName, labels] of lengthPairs) {
        if (!Array.isArray(params) || !Array.isArray(labels)) continue;
        if (params.length !== labels.length) {
          errors.push(
            `[estat-params] ${where}: ${paramsName} (${params.length}) と ${labelsName} (${labels.length}) の要素数が不一致`
          );
        }
      }
    }
  }

  return checked;
}

/**
 * metricGroups (指標カードの編成) の整合を検査する。
 *
 * ★単位 2 種までを error にする理由: カードのチャートは Y 軸が左右 2 本しかない
 *   (LineChart の yAxis: "left" | "right")。3 種目の単位が来ると軸が足りず、
 *   どれかの系列が桁違いのスケールに潰れる。単位文字列の正規化 (「円」と「千円」を
 *   同一視する等) は**しない** — 誤って結合する方が、定義時に弾かれるより危険。
 */
export function validateMetricGroups(
  c: ThemeCatalog,
  metricKeys: Set<string>,
  errors: string[],
  warns: string[]
): void {
  const groups = c.metricGroups;
  if (!groups || groups.length === 0) return;

  const seenGroupKeys = new Set<string>();
  const seenTitles = new Set<string>();
  const assigned = new Set<string>();

  for (const g of groups) {
    if (seenGroupKeys.has(g.key)) {
      errors.push(
        `[group-dup-key] ${c.key}: metricGroup key "${g.key}" がテーマ内で重複`
      );
    }
    seenGroupKeys.add(g.key);
    if (seenTitles.has(g.title)) {
      errors.push(
        `[group-dup-title] ${c.key}: metricGroup title "${g.title}" がテーマ内で重複`
      );
    }
    seenTitles.add(g.title);

    if (g.rankingKeys.length === 0) {
      errors.push(`[group-empty] ${c.key}/${g.key}: rankingKeys が空`);
    }

    // rankingKeys ⊆ metrics
    for (const k of g.rankingKeys) {
      if (!metricKeys.has(k)) {
        errors.push(
          `[group-key] ${c.key}/${g.key}: rankingKey "${k}" が metrics に不在`
        );
      }
      assigned.add(k);
    }

    // defaultCheckedKeys ⊆ rankingKeys かつ 1 件以上 (空だとカードが系列ゼロで開く)
    if (g.defaultCheckedKeys.length === 0) {
      errors.push(
        `[group-default] ${c.key}/${g.key}: defaultCheckedKeys が空 (初期表示する系列が無い)`
      );
    }
    const inGroup = new Set(g.rankingKeys);
    for (const k of g.defaultCheckedKeys) {
      if (!inGroup.has(k)) {
        errors.push(
          `[group-default] ${c.key}/${g.key}: defaultCheckedKeys "${k}" が rankingKeys に不在`
        );
      }
    }

    // 単位は 2 種まで (Y 軸が左右 2 本)。
    // 判定は UI の軸割当と同じ normalizeUnitForAxis を通す (% と ％ を別物にしない)
    const units = new Set(
      g.rankingKeys
        .map((k) => METRICS_REGISTRY[k]?.unit)
        .filter((u): u is string => typeof u === 'string' && u.length > 0)
        .map(normalizeUnitForAxis)
    );
    if (units.size > 2) {
      errors.push(
        `[group-units] ${c.key}/${g.key}: 単位が ${units.size} 種 (${[...units].join(' / ')}) — ` +
          `Y 軸は左右 2 本までなので 2 種以内に分割する`
      );
    }

    if (g.defaultCheckedKeys.length > 3) {
      warns.push(
        `[group-default-many] ${c.key}/${g.key}: defaultCheckedKeys が ${g.defaultCheckedKeys.length} 件 — ` +
          `初期表示で同数の時系列取得が走る (3 件以内が目安)`
      );
    }
    if (g.rankingKeys.length > 8) {
      warns.push(
        `[group-large] ${c.key}/${g.key}: 系列候補が ${g.rankingKeys.length} 件 — カードの分割を検討`
      );
    }
  }

  // 非 context 指標の未所属 (グループを定義したなら主要指標は必ずどれかのカードに出す)
  for (const m of c.metrics) {
    if (m.role === 'context') continue;
    if (!assigned.has(m.rankingKey)) {
      warns.push(
        `[group-orphan] ${c.key}: ${m.role} 指標 "${m.rankingKey}" がどの metricGroup にも未所属`
      );
    }
  }
}

export function validateEvidenceSources(errors: string[]): void {
  for (const [key, source] of Object.entries(EVIDENCE_SOURCE_CATALOG)) {
    if (!/^https:\/\//.test(source.sourceUrl)) {
      errors.push(
        `[evidence-source-url] ${key}: sourceUrl は https の公式 URL を指定する`
      );
    }
    const notebookId = 'notebookId' in source ? source.notebookId : undefined;
    if (
      typeof notebookId === 'string' &&
      !/^[0-9a-f-]{36}$/i.test(notebookId)
    ) {
      errors.push(
        `[evidence-notebook-id] ${key}: notebookId が UUID 形式でない`
      );
    }
  }
}

/**
 * Theme に採択した論点レンズと、その周遊先の実在を検査する。
 * 候補調査は skill reference / session で扱い、ここへ入った時点で公開可能でなければならない。
 */
export function validateEvidenceTopics(
  c: ThemeCatalog,
  themeKeys: Set<string>,
  errors: string[],
  warns: string[]
): void {
  const topics = c.evidenceTopics;
  if (!topics || topics.length === 0) return;

  const seen = new Set<string>();
  const chartKeys = new Set(c.charts.map((chart) => chart.componentKey));

  for (const topic of topics) {
    const where = `${c.key}/${topic.key}`;
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(topic.key)) {
      errors.push(`[evidence-key] ${where}: key は kebab-case にする`);
    }
    if (seen.has(topic.key)) {
      errors.push(
        `[evidence-dup-key] ${c.key}: evidenceTopic key "${topic.key}" が重複`
      );
    }
    seen.add(topic.key);

    if (
      !Object.prototype.hasOwnProperty.call(
        EVIDENCE_LENS_CATALOG,
        topic.lensKey
      )
    ) {
      errors.push(
        `[evidence-lens] ${where}: lensKey "${topic.lensKey}" が台帳に不在`
      );
    }
    if (
      !topic.title.trim() ||
      !topic.question.trim() ||
      !topic.summary.trim()
    ) {
      errors.push(
        `[evidence-copy] ${where}: title / question / summary は空にできない`
      );
    }
    if (topic.sourceKeys.length === 0) {
      errors.push(`[evidence-source] ${where}: sourceKeys が空`);
    }
    for (const sourceKey of new Set(topic.sourceKeys)) {
      if (
        !Object.prototype.hasOwnProperty.call(
          EVIDENCE_SOURCE_CATALOG,
          sourceKey
        )
      ) {
        errors.push(
          `[evidence-source] ${where}: sourceKey "${sourceKey}" が台帳に不在`
        );
      }
    }

    for (const rankingKey of new Set(topic.relatedRankingKeys ?? [])) {
      if (!metricExists(rankingKey)) {
        errors.push(
          `[evidence-ranking] ${where}: rankingKey "${rankingKey}" が METRICS_REGISTRY に不在`
        );
      } else if (METRICS_REGISTRY[rankingKey]?.isActive !== true) {
        errors.push(
          `[evidence-ranking] ${where}: rankingKey "${rankingKey}" は isActive:false`
        );
      }
    }
    for (const chartKey of new Set(topic.relatedChartKeys ?? [])) {
      if (!chartKeys.has(chartKey)) {
        errors.push(
          `[evidence-chart] ${where}: chartKey "${chartKey}" が同テーマの charts に不在`
        );
      }
    }
    for (const themeKey of new Set(topic.relatedThemeKeys ?? [])) {
      if (!themeKeys.has(themeKey)) {
        errors.push(
          `[evidence-theme] ${where}: themeKey "${themeKey}" がテーマ登録簿に不在`
        );
      } else if (themeKey === c.key) {
        errors.push(
          `[evidence-theme] ${where}: 自分自身へのテーマリンクは置かない`
        );
      }
    }
    for (const tagKey of new Set(topic.relatedArticleTagKeys ?? [])) {
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(tagKey)) {
        errors.push(
          `[evidence-tag] ${where}: tagKey "${tagKey}" は kebab-case にする`
        );
      }
    }

    const internalLinks =
      (topic.relatedRankingKeys?.length ?? 0) +
      (topic.relatedThemeKeys?.length ?? 0) +
      (topic.relatedArticleTagKeys?.length ?? 0);
    if (internalLinks === 0) {
      warns.push(`[evidence-no-route] ${where}: 内部の関連導線が無い`);
    }
  }
}

function main() {
  const catalogs = listThemeCatalogs();
  const errors: string[] = [];
  const warns: string[] = [];

  validateEvidenceSources(errors);
  const themeKeys = new Set(THEME_INDICATOR_SETS.map((set) => set.key));

  const globalComponentKeys = new Map<string, string>(); // componentKey → theme

  for (const c of catalogs) {
    const metricKeys = new Set(c.metrics.map((m) => m.rankingKey));
    const metricLabels = new Map(
      c.metrics.map((m) => [m.rankingKey, m.shortLabel] as const)
    );

    // metrics.rankingKey 実在 + 到達可能 (isActive)
    for (const m of c.metrics) {
      if (!metricExists(m.rankingKey)) {
        errors.push(
          `[metric-missing] ${c.key}: rankingKey "${m.rankingKey}" が METRICS_REGISTRY に不在`
        );
      } else if (METRICS_REGISTRY[m.rankingKey]?.isActive !== true) {
        errors.push(
          `[metric-inactive] ${c.key}: rankingKey "${m.rankingKey}" は isActive:false — ` +
            `/ranking/${m.rankingKey} は 410 か空ページになる`
        );
      }
      if ((m.role === 'primary' || m.role === 'secondary') && !m.selection) {
        warns.push(
          `[no-selection] ${c.key}: ${m.role} 指標 "${m.rankingKey}" に selection (選定根拠) 未記入`
        );
      }
    }

    // charts
    const seenComponentKeys = new Set<string>();
    const seenSortOrders = new Set<number>();
    const keysInCharts = new Set<string>();
    for (const ch of c.charts) {
      if (!VALID_TYPES.has(ch.componentType)) {
        errors.push(
          `[component-type] ${c.key}/${ch.componentKey}: 無効な componentType "${ch.componentType}"`
        );
      }
      validateChartContentContract(ch, `${c.key}/${ch.componentKey}`, errors);
      validateChartIndicatorHubContract(
        ch,
        `${c.key}/${ch.componentKey}`,
        errors,
        warns
      );
      // componentProps の形を chart 種別ごとに検証 (WP1)。従来は union membership しか
      // 見ておらず、必須フィールド欠落の壊れた chart を素通りさせていた。
      for (const msg of validateChartProps(
        ch.componentType,
        (ch.componentProps ?? {}) as Record<string, unknown>
      )) {
        errors.push(`[chart-props] ${c.key}/${ch.componentKey}: ${msg}`);
      }
      for (const msg of validateMigratedSeriesRefContract(
        ch.componentKey,
        (ch.componentProps ?? {}) as Record<string, unknown>
      )) {
        errors.push(`[series-ref-migration] ${c.key}/${ch.componentKey}: ${msg}`);
      }
      for (const msg of validateStatSeriesRefAlignment(
        (ch.componentProps ?? {}) as Record<string, unknown>,
        ch.relatedRankingKeys ?? [],
        metricLabels
      )) {
        errors.push(`[series-ref-alignment] ${c.key}/${ch.componentKey}: ${msg}`);
      }
      // 色は role で持ち生成器が hex へ解決する (WP5)。色キー文脈に role でない値
      // (生 hex/hsl/rgb = raw-color / typo 等の未知 role = unknown-role) が残っていたら error。
      // ★resolveComponentPropsColors は未知値を素通しするため、ここで弾かないと壊れた色文字列が
      //   生成物に焼き込まれる (2026-08-13 concurrent review 指摘)。
      const colorViolations = collectColorFieldViolations(ch.componentProps);
      const rawHex = [
        ...new Set(
          colorViolations
            .filter((v) => v.kind === 'raw-color')
            .map((v) => v.value)
        ),
      ];
      const unknownRoles = [
        ...new Set(
          colorViolations
            .filter((v) => v.kind === 'unknown-role')
            .map((v) => v.value)
        ),
      ];
      if (rawHex.length > 0) {
        errors.push(
          `[raw-color] ${c.key}/${ch.componentKey}: 色キーに生色 ${rawHex.join(', ')} — color role に置換する (chart-color-role.ts)`
        );
      }
      if (unknownRoles.length > 0) {
        errors.push(
          `[color-role] ${c.key}/${ch.componentKey}: 色キーに未知の role ${unknownRoles.join(', ')} — CHART_COLOR_ROLES から選ぶ`
        );
      }
      // componentKey 重複 (テーマ内)
      if (seenComponentKeys.has(ch.componentKey)) {
        errors.push(
          `[dup-key-theme] ${c.key}: componentKey "${ch.componentKey}" がテーマ内で重複`
        );
      }
      seenComponentKeys.add(ch.componentKey);
      // componentKey 横断重複 (warn: 複数ページでの componentKey 再利用は設計上許容
      //   = load-page-components.ts「componentKey は複数ページで再利用可能」。認知目的で warn)
      const owner = globalComponentKeys.get(ch.componentKey);
      if (owner && owner !== c.key) {
        warns.push(
          `[dup-key-global] ${c.key}: componentKey "${ch.componentKey}" が ${owner} と共有`
        );
      }
      globalComponentKeys.set(ch.componentKey, c.key);
      // sortOrder 重複 (warn: 既存データに正当な重複あり=local-economy。描画は配列順で安定)
      if (seenSortOrders.has(ch.sortOrder)) {
        warns.push(
          `[dup-sortorder] ${c.key}/${ch.componentKey}: sortOrder ${ch.sortOrder} が重複`
        );
      }
      seenSortOrders.add(ch.sortOrder);
      // (section はテーマ renderer 未使用 = free-form のため検査しない。area は AreaChartSection で使用)
      // relatedRankingKeys ⊂ metrics
      for (const k of ch.relatedRankingKeys ?? []) {
        if (!metricKeys.has(k)) {
          errors.push(
            `[related-key] ${c.key}/${ch.componentKey}: relatedRankingKey "${k}" が metrics に不在`
          );
        }
        keysInCharts.add(k);
      }
    }

    // primary 指標のカバレッジ (warn: primary は metrics[] 由来の stat-card として
    //   チャートと独立に描画されるため、チャート未使用でも正常。設計確認用に warn)
    for (const m of c.metrics) {
      if (m.role !== 'primary') continue;
      if (!keysInCharts.has(m.rankingKey)) {
        warns.push(
          `[primary-orphan] ${c.key}: primary 指標 "${m.rankingKey}" がチャート未使用 (card 描画)`
        );
      }
    }

    // metricGroups (指標カードの編成)。省略時は UI が「非 context を 1 グループ」に倒すので検査不要。
    validateMetricGroups(c, metricKeys, errors, warns);
    validateEvidenceTopics(c, themeKeys, errors, warns);
  }

  validateIndicatorHubContentCompleteness(catalogs, errors, warns);

  const estatParamsChecked = validatePageComponentEstatParams(errors);

  console.log(
    `theme-catalog 検証: ${catalogs.length} themes / estatParams ${estatParamsChecked} 件 / ` +
      `error ${errors.length} / warn ${warns.length}`
  );
  if (warns.length > 0) {
    console.log('⚠️  warn 内訳:', tally(warns));
    for (const w of warns.slice(0, 30)) console.log('   ' + w);
    if (warns.length > 30) console.log(`   … 他 ${warns.length - 30} 件`);
  }
  if (errors.length > 0) {
    console.error(`\n❌ theme-catalog 検証: ${errors.length} 件の error`);
    console.error('   内訳:', tally(errors));
    for (const e of errors.slice(0, 50)) console.error('   ' + e);
    if (errors.length > 50) console.error(`   … 他 ${errors.length - 50} 件`);
    console.error('   規約: .claude/rules/theme-catalog-standards.md');
    process.exit(1);
  }
  if (STRICT && warns.length > 0) {
    console.error(`\n❌ --strict: warn ${warns.length} 件を error 扱い`);
    process.exit(1);
  }
  console.log('✅ theme-catalog 検証: error なし');
  process.exit(0);
}

// CLI として起動されたときだけ実行する。
// test から validateMetricGroups を import しただけで main() が走ると
// process.exit(0) でテストランナーごと落ちる (2026-08-06 に踏んだ)。
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main();
}

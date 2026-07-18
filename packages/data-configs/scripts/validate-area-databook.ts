/**
 * validate-area-databook — AreaDatabookTemplate + AREA_EDITORIALS の内整合を検証する lint。
 *
 * 規約の正典: `.claude/rules/area-databook-standards.md`
 *
 * error (exit 1 / CI・pre-commit をブロック):
 *   - ranked-kpi-grid / gender-paired-kpi / relatedRankingKeys の rankingKey が METRICS_REGISTRY に不在
 *   - chart.componentType が union 外 (runtime backstop)
 *   - componentKey / blockKey / sectionKey の重複、sectionKey が kebab-case でない
 *   - chart.sortOrder 重複
 *   - editorial: areaCode 不正 / specialties 件数 5〜9 逸脱 / description 60〜160 字逸脱 /
 *     sourceUrl が http(s) でない / accessedAt が ISO date でない / slug 重複・非 kebab
 * warn (exit 0 / 表示のみ, --strict で error):
 *   - ranked-kpi-grid 指標の selection 未記入
 *   - editorial 未登録県 (47 県に満たない間は残数を表示)
 *
 * 使い方:
 *   npx tsx packages/data-configs/scripts/validate-area-databook.ts [--strict]
 */
import { METRICS_REGISTRY } from "../src/registry";
import {
  AREA_DATABOOK_CHART_TYPES,
  AREA_DATABOOK_TEMPLATE,
  AREA_EDITORIALS,
} from "../src/area-databook";

const STRICT = process.argv.includes("--strict");
const VALID_CHART_TYPES = new Set<string>(AREA_DATABOOK_CHART_TYPES);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const AREA_CODE = /^(0[1-9]|[1-3][0-9]|4[0-7])000$/;

function metricExists(key: string): boolean {
  return Object.prototype.hasOwnProperty.call(METRICS_REGISTRY, key);
}

function main() {
  const errors: string[] = [];
  const warns: string[] = [];

  // ---- template ----
  const seenSectionKeys = new Set<string>();
  const seenBlockKeys = new Set<string>();
  const seenComponentKeys = new Set<string>();
  const seenSortOrders = new Set<number>();

  for (const section of AREA_DATABOOK_TEMPLATE.sections) {
    if (!KEBAB.test(section.sectionKey)) {
      errors.push(`[section-key] "${section.sectionKey}" が kebab-case でない`);
    }
    if (seenSectionKeys.has(section.sectionKey)) {
      errors.push(`[dup-section] sectionKey "${section.sectionKey}" が重複`);
    }
    seenSectionKeys.add(section.sectionKey);

    for (const block of section.blocks) {
      if (block.blockType === "chart") {
        const ch = block.chart;
        if (!VALID_CHART_TYPES.has(ch.componentType)) {
          errors.push(
            `[component-type] ${ch.componentKey}: 無効な componentType "${ch.componentType}"`,
          );
        }
        if (seenComponentKeys.has(ch.componentKey)) {
          errors.push(`[dup-key] componentKey "${ch.componentKey}" が重複`);
        }
        seenComponentKeys.add(ch.componentKey);
        if (seenSortOrders.has(ch.sortOrder)) {
          errors.push(
            `[dup-sortorder] ${ch.componentKey}: sortOrder ${ch.sortOrder} が重複`,
          );
        }
        seenSortOrders.add(ch.sortOrder);
        for (const k of ch.relatedRankingKeys ?? []) {
          if (!metricExists(k)) {
            errors.push(
              `[metric-missing] chart ${ch.componentKey}: relatedRankingKey "${k}" が METRICS_REGISTRY に不在`,
            );
          }
        }
        continue;
      }

      // 非 chart ブロックは blockKey 一意
      if (seenBlockKeys.has(block.blockKey)) {
        errors.push(`[dup-block] blockKey "${block.blockKey}" が重複`);
      }
      seenBlockKeys.add(block.blockKey);

      if (block.blockType === "ranked-kpi-grid") {
        for (const m of block.metrics) {
          if (!metricExists(m.rankingKey)) {
            errors.push(
              `[metric-missing] ${section.sectionKey}/${block.blockKey}: rankingKey "${m.rankingKey}" が METRICS_REGISTRY に不在`,
            );
          }
          if (!m.selection) {
            warns.push(
              `[no-selection] ${section.sectionKey}/${block.blockKey}: "${m.rankingKey}" に selection 未記入`,
            );
          }
        }
      }
      if (block.blockType === "gender-paired-kpi") {
        for (const p of block.pairs) {
          for (const k of [p.maleKey, p.femaleKey]) {
            if (!metricExists(k)) {
              errors.push(
                `[metric-missing] ${section.sectionKey}/${block.blockKey}: "${p.label}" の rankingKey "${k}" が METRICS_REGISTRY に不在`,
              );
            }
          }
        }
      }
    }
  }

  // ---- editorial ----
  const editorials = Object.entries(AREA_EDITORIALS);
  for (const [code, ed] of editorials) {
    const tag = `editorial ${code}`;
    if (code !== ed.areaCode || !AREA_CODE.test(code)) {
      errors.push(`[editorial-code] ${tag}: areaCode 不正 ("${ed.areaCode}")`);
    }
    if (ed.specialties.length < 5 || ed.specialties.length > 9) {
      errors.push(
        `[editorial-count] ${tag}: specialties ${ed.specialties.length} 件 (5〜9 件が必須)`,
      );
    }
    const seenSlugs = new Set<string>();
    for (const sp of ed.specialties) {
      const stag = `${tag}/${sp.slug}`;
      if (!KEBAB.test(sp.slug)) errors.push(`[editorial-slug] ${stag}: slug が kebab-case でない`);
      if (seenSlugs.has(sp.slug)) errors.push(`[editorial-slug] ${stag}: slug 重複`);
      seenSlugs.add(sp.slug);
      const len = [...sp.description].length;
      if (len < 60 || len > 160) {
        errors.push(`[editorial-desc] ${stag}: description ${len} 字 (60〜160 字が必須)`);
      }
      if (!/^https?:\/\//.test(sp.sourceUrl)) {
        errors.push(`[editorial-source] ${stag}: sourceUrl が http(s) でない`);
      }
      if (!ISO_DATE.test(sp.accessedAt)) {
        errors.push(`[editorial-date] ${stag}: accessedAt が ISO date でない ("${sp.accessedAt}")`);
      }
      if (!sp.municipality) errors.push(`[editorial-muni] ${stag}: municipality が空`);
    }
    if (!/^https?:\/\//.test(ed.symbols.sourceUrl)) {
      errors.push(`[editorial-source] ${tag}: symbols.sourceUrl が http(s) でない`);
    }
    if (!ISO_DATE.test(ed.symbols.accessedAt)) {
      errors.push(`[editorial-date] ${tag}: symbols.accessedAt が ISO date でない`);
    }
  }
  if (editorials.length < 47) {
    warns.push(`[editorial-coverage] editorial 登録 ${editorials.length}/47 県 (残 ${47 - editorials.length})`);
  }

  console.log(
    `area-databook 検証: sections ${AREA_DATABOOK_TEMPLATE.sections.length} / editorial ${editorials.length} 県 / error ${errors.length} / warn ${warns.length}`,
  );
  if (warns.length > 0) {
    for (const w of warns.slice(0, 20)) console.log("   ⚠️ " + w);
    if (warns.length > 20) console.log(`   … 他 ${warns.length - 20} 件`);
  }
  if (errors.length > 0) {
    console.error(`\n❌ area-databook 検証: ${errors.length} 件の error`);
    for (const e of errors.slice(0, 50)) console.error("   " + e);
    if (errors.length > 50) console.error(`   … 他 ${errors.length - 50} 件`);
    console.error("   規約: .claude/rules/area-databook-standards.md");
    process.exit(1);
  }
  if (STRICT && warns.length > 0) {
    console.error(`\n❌ --strict: warn ${warns.length} 件を error 扱い`);
    process.exit(1);
  }
  console.log("✅ area-databook 検証: error なし");
  process.exit(0);
}

main();

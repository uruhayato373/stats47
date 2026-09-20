#!/usr/bin/env node
/**
 * もしものstats47サイト別・プロモーション別成果をread-onlyで取得する。
 * `.claude/state/metrics/affiliate/moshimo-results.json` は生成物で、手編集しない。
 *
 * usage:
 *   node .claude/scripts/ads/moshimo-report.mjs
 *   node .claude/scripts/ads/moshimo-report.mjs --from 2026-08-17 --to 2026-09-20
 *   node .claude/scripts/ads/moshimo-report.mjs --check
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

import {
  ensureTargetSite,
  getAsp,
  loadAspConfig,
  openAsp,
  repoRoot,
  SiteAttributionError,
} from './lib/asp-browser.mjs';
import {
  completeMoshimoRecords,
  evaluateMoshimoOutcomeGate,
  MOSHIMO_RESULTS_SCHEMA_VERSION,
  parseMoshimoPromotionRows,
} from './lib/moshimo-report-core.mjs';

const OUTPUT_PATH = join(
  repoRoot(),
  '.claude/state/metrics/affiliate/moshimo-results.json'
);
const CATALOG_PATH = join(
  repoRoot(),
  '.claude/state/ads/affiliate-catalog.json'
);

function isoDate(value) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value ?? '') ||
    Number.isNaN(Date.parse(`${value}T00:00:00Z`))
  ) {
    throw new Error(
      `日付はYYYY-MM-DDで指定してください: ${value ?? 'missing'}`
    );
  }
  return value;
}

function jstDate(offsetDays = 0) {
  const now = new Date(Date.now() + 9 * 3600000 + offsetDays * 86400000);
  return now.toISOString().slice(0, 10);
}

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { from: jstDate(-34), to: jstDate(0), check: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--from') out.from = isoDate(argv[++i]);
    else if (argv[i] === '--to') out.to = isoDate(argv[++i]);
    else if (argv[i] === '--check') out.check = true;
    else throw new Error(`未知の引数: ${argv[i]}`);
  }
  if (out.from > out.to)
    throw new Error(`期間が逆転しています: ${out.from} > ${out.to}`);
  const days =
    Math.floor(
      (Date.parse(`${out.to}T00:00:00Z`) -
        Date.parse(`${out.from}T00:00:00Z`)) /
        86400000
    ) + 1;
  if (days > 93) throw new Error(`1 runは最大93日です: ${days}日`);
  return out;
}

function reportPath(from, to) {
  const params = new URLSearchParams({
    from_date: from.replaceAll('-', '/'),
    to_date: to.replaceAll('-', '/'),
    terminal_type: '0',
    order: 'result_price_d',
  });
  return `/af/shop/report/kpi/promotion?${params}`;
}

async function scrapeRows(page, expectedSiteId) {
  return page.locator('table tbody tr').evaluateAll(
    (trs, siteId) =>
      trs.flatMap((tr) => {
        const link = [...tr.querySelectorAll("a[href*='promotion_id=']")].find(
          (candidate) => {
            try {
              const url = new URL(candidate.href, location.href);
              return (
                url.searchParams.get('shop_site_id') === siteId &&
                /^\d+$/.test(url.searchParams.get('promotion_id') ?? '')
              );
            } catch {
              return false;
            }
          }
        );
        if (!link) return [];
        const url = new URL(link.href, location.href);
        return [
          {
            programId: url.searchParams.get('promotion_id'),
            programName: (link.textContent ?? '').replace(/\s+/g, ' ').trim(),
            cells: [...tr.querySelectorAll('th,td')].map((cell) =>
              (cell.textContent ?? '').replace(/\s+/g, ' ').trim()
            ),
          },
        ];
      }),
    String(expectedSiteId)
  );
}

function approvedPrograms() {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  return Object.values(catalog.programs ?? {}).flatMap((program) => {
    const entry = program?.asps?.moshimo;
    return entry?.status === 'approved'
      ? [
          {
            programId: String(entry.promotionId),
            programName: String(program.name ?? ''),
          },
        ]
      : [];
  });
}

async function collect(opts) {
  const root = loadAspConfig();
  const asp = getAsp(root, 'moshimo');
  const expectedSiteId = asp.sites?.[root.targetSiteName];
  if (!expectedSiteId) throw new Error('moshimo stats47 site IDがありません');
  console.log(
    `もしも成果取得 ${opts.from}..${opts.to} / 対象サイト=${root.targetSiteName}`
  );
  const { ctx, page } = await openAsp(asp, {
    isReady: async (candidate) =>
      !new RegExp(asp.reAuthPattern, 'i').test(candidate.url()),
    label: 'moshimo-report',
  });
  try {
    const site = await ensureTargetSite(page, asp, root, {
      navigateTo: reportPath(opts.from, opts.to),
    });
    const url = new URL(page.url());
    if (url.pathname !== '/af/shop/report/kpi/promotion')
      throw new Error(`想定外のレポートURL: ${url.pathname}`);
    if (url.searchParams.get(asp.siteParam) !== String(expectedSiteId)) {
      throw new SiteAttributionError(
        `もしも成果レポートのsite ID不一致: ${url.searchParams.get(asp.siteParam) ?? 'missing'}`
      );
    }
    const inputDates = await page
      .locator('input[name="from_date"],input[name="to_date"]')
      .evaluateAll((els) =>
        Object.fromEntries(els.map((el) => [el.name, el.value]))
      );
    if (
      inputDates.from_date !== opts.from.replaceAll('-', '/') ||
      inputDates.to_date !== opts.to.replaceAll('-', '/')
    ) {
      throw new Error(`期間read-back不一致: ${JSON.stringify(inputDates)}`);
    }
    const nextPageControls = await page.locator('a').evaluateAll(
      (links) =>
        links.filter((link) => {
          const text = (link.textContent ?? '').replace(/\s+/g, '').trim();
          const rect = link.getBoundingClientRect();
          return (
            rect.width > 0 && rect.height > 0 && /^(次へ|次|›|>)$/.test(text)
          );
        }).length
    );
    if (nextPageControls > 0)
      throw new Error(
        'もしも成果レポートが複数ページです。全件取得未実装のためzero補完せず停止します'
      );
    const rows = await scrapeRows(page, expectedSiteId);
    const observedRecords = parseMoshimoPromotionRows(rows);
    const approved = approvedPrograms();
    const records = completeMoshimoRecords(observedRecords, approved);
    const state = {
      schemaVersion: MOSHIMO_RESULTS_SCHEMA_VERSION,
      updatedAt: new Date().toISOString(),
      source: {
        asp: 'moshimo',
        site: root.targetSiteName,
        siteId: String(site.actualSiteId),
        url: page.url(),
      },
      period: {
        from: opts.from,
        to: opts.to,
        days:
          Math.floor(
            (Date.parse(`${opts.to}T00:00:00Z`) -
              Date.parse(`${opts.from}T00:00:00Z`)) /
              86400000
          ) + 1,
      },
      coverage: {
        complete: true,
        approvedPrograms: approved.length,
        observedPrograms: observedRecords.length,
        zeroFilledPrograms: records.length - observedRecords.length,
      },
      records,
    };
    mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
    writeFileSync(OUTPUT_PATH, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
    console.log(`取得完了 ${records.length} programs → ${OUTPUT_PATH}`);
    return state;
  } finally {
    await ctx.close().catch(() => {});
  }
}

async function main() {
  const opts = parseArgs();
  if (opts.check) {
    const state = existsSync(OUTPUT_PATH)
      ? JSON.parse(readFileSync(OUTPUT_PATH, 'utf8'))
      : null;
    const gate = evaluateMoshimoOutcomeGate(state, new Date().toISOString());
    if (gate.status !== 'ready') throw new Error(gate.reasons.join(','));
    console.log(
      `✅ moshimo-results validate OK (${state.records.length} programs, age=${gate.ageDays}d)`
    );
    return;
  }
  await collect(opts);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main().catch((error) => {
    console.error(`Fatal: ${error?.message ?? error}`);
    process.exit(error instanceof SiteAttributionError ? 5 : 1);
  });
}

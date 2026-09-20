#!/usr/bin/env node
/**
 * 承認済みのもしも案件からcanonicalな広告原稿を取得し、ローカルartifactへ保存する。
 * 外部状態・配信SSOTは変更しない。ログインは openAsp の人間操作だけを使う。
 *
 * usage: node .claude/scripts/ads/moshimo-harvest.mjs --id 1863,55
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

import {
  aspBrowserCfg,
  dumpFailure,
  ensureTargetSite,
  getAsp,
  loadAspConfig,
  makeRunId,
  openAsp,
  repoRoot,
  SiteAttributionError,
  visibleText,
} from './lib/asp-browser.mjs';
import { parseMoshimoCode } from './lib/moshimo-code-core.mjs';

const CATALOG_PATH = join(
  repoRoot(),
  '.claude/state/ads/affiliate-catalog.json'
);
const OUTPUT_DIR = join(repoRoot(), '.local/affiliate-harvest/moshimo');

export function parseArgs(argv = process.argv.slice(2)) {
  const out = { ids: [] };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--id') out.ids.push(...String(argv[++i] ?? '').split(','));
    else throw new Error(`未知の引数: ${argv[i]}`);
  }
  out.ids = [...new Set(out.ids.map((value) => value.trim()).filter(Boolean))];
  if (out.ids.length === 0)
    throw new Error('--id <promotion_id[,promotion_id]> は必須です');
  if (out.ids.some((value) => !/^\d+$/.test(value)))
    throw new Error('promotion_id は数字だけを指定してください');
  if (out.ids.length > 12)
    throw new Error('1 run は最大12件です（無差別取得を防ぐ上限）');
  return out;
}

function loadTargets(ids) {
  if (!existsSync(CATALOG_PATH))
    throw new Error(`カタログがありません: ${CATALOG_PATH}`);
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  return ids.map((id) => {
    const key = `moshimo-${id}`;
    const program = catalog.programs?.[key];
    const entry = program?.asps?.moshimo;
    if (!program || !entry) throw new Error(`${key}: カタログにありません`);
    if (entry.status !== 'approved')
      throw new Error(
        `${key}: approved ではありません (status=${entry.status})`
      );
    if (program.eligibility?.status !== 'approved') {
      throw new Error(
        `${key}: eligibility approved ではありません (status=${program.eligibility?.status ?? 'missing'})`
      );
    }
    return { id, key, name: program.name, vertical: program.vertical ?? null };
  });
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\s【】「」『』（）()・｜|ー～~!！?？、。,:：]/g, '')
    .toLowerCase();
}

function pageMatchesTarget(text, target) {
  const haystack = normalize(text);
  const needle = normalize(target.name);
  return (
    needle.length >= 12 &&
    [needle.slice(0, 24), needle.slice(-24)].some((part) =>
      haystack.includes(part)
    )
  );
}

function rank(parsed) {
  if (parsed.fields.width === 300 && parsed.fields.height === 250) return 0;
  if (parsed.fields.width === 250 && parsed.fields.height === 250) return 1;
  if (parsed.fields.width === 320 && parsed.fields.height === 100) return 2;
  return 9;
}

function saveArtifact({ root, site, target, sourceUrl, rawCode, parsed }) {
  mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o700 });
  const fingerprint = createHash('sha256').update(rawCode).digest('hex');
  const artifact = {
    schemaVersion: 1,
    asp: 'moshimo',
    site: root.targetSiteName,
    siteId: site.actualSiteId,
    programId: target.id,
    programKey: target.key,
    programName: target.name,
    vertical: target.vertical,
    collectedAt: new Date().toISOString(),
    sourceUrl,
    selection: `canonical-${parsed.fields.width}x${parsed.fields.height}`,
    fingerprint,
    creativeId: parsed.creativeId,
    linkAttributes: parsed.linkAttributes,
    fields: parsed.fields,
    rawCode,
  };
  const path = join(OUTPUT_DIR, `${target.id}.json`);
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return {
    path,
    fingerprint,
    fields: parsed.fields,
    creativeId: parsed.creativeId,
  };
}

async function harvestOne(page, asp, root, target, runId) {
  const sourcePath = `${asp.sourcePathPrefix ?? '/af/shop/promotion/source?promotion_id='}${target.id}`;
  const site = await ensureTargetSite(page, asp, root, {
    navigateTo: sourcePath,
  });
  const url = new URL(page.url());
  if (url.searchParams.get('promotion_id') !== target.id) {
    throw new Error(`${target.key}: 原稿ページのpromotion_id不一致`);
  }
  if (url.searchParams.get(asp.siteParam) !== String(site.actualSiteId)) {
    throw new SiteAttributionError(
      `もしも原稿ページのsite ID不一致: 期待 ${site.actualSiteId}`
    );
  }
  const text = await visibleText(page, 240000);
  if (!pageMatchesTarget(text, target)) {
    await dumpFailure(page, aspBrowserCfg(asp), runId, {
      step: `harvest-program-bind-${target.id}`,
      message: '原稿ページとカタログ案件名を結べない',
    });
    throw new Error(`${target.key}: 原稿ページが対象案件名と一致しません`);
  }

  const codes = await page
    .locator('textarea')
    .evaluateAll((els) =>
      els
        .map((el) => String(el.value || el.textContent || '').trim())
        .filter(Boolean)
    );
  const parsed = codes
    .map((rawCode) => ({
      rawCode,
      parsed: parseMoshimoCode(rawCode, { expectedProgramId: target.id }),
    }))
    .filter((item) => item.parsed.ok)
    .sort((left, right) => rank(left.parsed) - rank(right.parsed));
  if (parsed.length === 0 || rank(parsed[0].parsed) >= 9) {
    const errors = [
      ...new Set(
        codes.map(
          (rawCode) =>
            parseMoshimoCode(rawCode, { expectedProgramId: target.id }).error
        )
      ),
    ];
    await dumpFailure(page, aspBrowserCfg(asp), runId, {
      step: `harvest-no-canonical-code-${target.id}`,
      message: `textarea=${codes.length} errors=${errors.join(',')}`,
    });
    throw new Error(
      `${target.key}: canonicalな完全コードを取得できません (${errors.join(', ')})`
    );
  }
  return saveArtifact({
    root,
    site,
    target,
    sourceUrl: page.url(),
    ...parsed[0],
  });
}

async function main() {
  const opts = parseArgs();
  const targets = loadTargets(opts.ids);
  const root = loadAspConfig();
  const asp = getAsp(root, 'moshimo');
  const runId = makeRunId();
  console.log(
    `もしも広告原稿取得: ${targets.map((target) => target.key).join(', ')} / 対象サイト=${root.targetSiteName}`
  );
  const { ctx, page } = await openAsp(asp, {
    isReady: async (candidate) =>
      !new RegExp(asp.reAuthPattern, 'i').test(candidate.url()),
    label: 'moshimo-harvest',
  });
  const completed = [];
  try {
    for (const target of targets) {
      const result = await harvestOne(page, asp, root, target, runId);
      completed.push({ target, ...result });
      console.log(
        `  ✓ ${target.key}: ${result.fields.width}x${result.fields.height} creative=${result.creativeId} fingerprint=${result.fingerprint.slice(0, 12)}`
      );
    }
  } finally {
    await ctx.close().catch(() => {});
  }
  console.log(
    `取得完了 ${completed.length} 件（ローカル保存のみ・SSOT未登録・未公開）`
  );
  for (const item of completed)
    console.log(`  - ${item.target.key}: ${item.path}`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === resolve(process.argv[1])
) {
  main().catch((error) => {
    if (error instanceof SiteAttributionError) {
      console.error(`サイト帰属を確定できないため中止: ${error.message}`);
      process.exit(5);
    }
    console.error(`Fatal: ${error?.message ?? error}`);
    process.exit(1);
  });
}

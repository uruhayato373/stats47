#!/usr/bin/env node
/**
 * 承認済みのもしも案件について、成果条件と掲載条件を実機詳細ページから保全する。
 * 外部状態・配信SSOTは変更せず、結果は git 管理外の .local/ にだけ保存する。
 *
 * usage: node .claude/scripts/ads/moshimo-inspect-offer.mjs --id 5537,6722
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

const CATALOG_PATH = join(
  repoRoot(),
  '.claude/state/ads/affiliate-catalog.json'
);
const OUTPUT_DIR = join(repoRoot(), '.local/affiliate-offer-inspect/moshimo');

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

function evidenceLines(text) {
  const pattern =
    /(成果|報酬|承認|否認|対象|条件|期限|禁止|注意|本人|登録|面談|申込|申請|新規|年齢|地域)/;
  return text
    .split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter((line) => line.length > 0 && pattern.test(line))
    .slice(0, 160);
}

async function inspectOne(page, asp, root, target, runId) {
  const detailPath = `${asp.detailPathPrefix}${target.id}`;
  const site = await ensureTargetSite(page, asp, root, {
    navigateTo: detailPath,
  });
  const url = new URL(page.url());
  if (url.searchParams.get('promotion_id') !== target.id) {
    throw new Error(`${target.key}: 詳細ページのpromotion_id不一致`);
  }
  if (url.searchParams.get(asp.siteParam) !== String(site.actualSiteId)) {
    throw new SiteAttributionError(
      `もしも詳細ページのsite ID不一致: 期待 ${site.actualSiteId}`
    );
  }
  const text = await visibleText(page, 240000);
  if (!pageMatchesTarget(text, target)) {
    await dumpFailure(page, aspBrowserCfg(asp), runId, {
      step: `inspect-program-bind-${target.id}`,
      message: '詳細ページとカタログ案件名を結べない',
    });
    throw new Error(`${target.key}: 詳細ページが対象案件名と一致しません`);
  }

  mkdirSync(OUTPUT_DIR, { recursive: true, mode: 0o700 });
  const bodySha256 = createHash('sha256').update(text).digest('hex');
  const artifact = {
    schemaVersion: 1,
    asp: 'moshimo',
    site: root.targetSiteName,
    siteId: site.actualSiteId,
    programId: target.id,
    programKey: target.key,
    programName: target.name,
    vertical: target.vertical,
    observedAt: new Date().toISOString(),
    sourceUrl: page.url(),
    bodySha256,
    evidenceLines: evidenceLines(text),
    visibleText: text,
  };
  const path = join(OUTPUT_DIR, `${target.id}.json`);
  writeFileSync(path, `${JSON.stringify(artifact, null, 2)}\n`, {
    encoding: 'utf8',
    mode: 0o600,
  });
  return { path, bodySha256, evidenceCount: artifact.evidenceLines.length };
}

async function main() {
  const opts = parseArgs();
  const targets = loadTargets(opts.ids);
  const root = loadAspConfig();
  const asp = getAsp(root, 'moshimo');
  const runId = makeRunId();
  console.log(
    `もしも案件条件確認: ${targets.map((target) => target.key).join(', ')} / 対象サイト=${root.targetSiteName}`
  );
  const { ctx, page } = await openAsp(asp, {
    isReady: async (candidate) =>
      !new RegExp(asp.reAuthPattern, 'i').test(candidate.url()),
    label: 'moshimo-inspect-offer',
  });
  const completed = [];
  try {
    for (const target of targets) {
      const result = await inspectOne(page, asp, root, target, runId);
      completed.push({ target, ...result });
      console.log(
        `  ✓ ${target.key}: evidence=${result.evidenceCount} sha256=${result.bodySha256.slice(0, 12)}`
      );
    }
  } finally {
    await ctx.close().catch(() => {});
  }
  console.log(
    `確認完了 ${completed.length} 件（ローカル保存のみ・SSOT未変更・未公開）`
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

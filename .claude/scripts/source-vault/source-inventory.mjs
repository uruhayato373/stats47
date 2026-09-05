#!/usr/bin/env node

import { createHash } from 'node:crypto';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(SCRIPT_DIR, '../../..');
const CONFIG_PATH = path.join(PROJECT_ROOT, '.claude/config/source-vault.json');
const STATE_ROOT = path.join(PROJECT_ROOT, '.claude/state/source-inventory');
const TEMP_VAULT_ROOT = path.join(tmpdir(), 'stats47-source-vault');
const ACTIONABLE_RESOLUTIONS = new Set([
  'reuse-existing-metric',
  'new-metric',
  'combined-analysis',
  'context-only',
]);
const RESOLUTIONS = new Set([
  ...ACTIONABLE_RESOLUTIONS,
  'primary-source-unavailable',
  'rights-hold',
  'not-applicable',
]);
const PREFECTURES = [
  ['01000', '北海道'], ['02000', '青森県'], ['03000', '岩手県'],
  ['04000', '宮城県'], ['05000', '秋田県'], ['06000', '山形県'],
  ['07000', '福島県'], ['08000', '茨城県'], ['09000', '栃木県'],
  ['10000', '群馬県'], ['11000', '埼玉県'], ['12000', '千葉県'],
  ['13000', '東京都'], ['14000', '神奈川県'], ['15000', '新潟県'],
  ['16000', '富山県'], ['17000', '石川県'], ['18000', '福井県'],
  ['19000', '山梨県'], ['20000', '長野県'], ['21000', '岐阜県'],
  ['22000', '静岡県'], ['23000', '愛知県'], ['24000', '三重県'],
  ['25000', '滋賀県'], ['26000', '京都府'], ['27000', '大阪府'],
  ['28000', '兵庫県'], ['29000', '奈良県'], ['30000', '和歌山県'],
  ['31000', '鳥取県'], ['32000', '島根県'], ['33000', '岡山県'],
  ['34000', '広島県'], ['35000', '山口県'], ['36000', '徳島県'],
  ['37000', '香川県'], ['38000', '愛媛県'], ['39000', '高知県'],
  ['40000', '福岡県'], ['41000', '佐賀県'], ['42000', '長崎県'],
  ['43000', '熊本県'], ['44000', '大分県'], ['45000', '宮崎県'],
  ['46000', '鹿児島県'], ['47000', '沖縄県'],
];
const OFFICIAL_SOURCES = [
  ['総務省統計局', 'https://www.stat.go.jp/'],
  ['総務省', 'https://www.soumu.go.jp/menu_seisaku/toukei/'],
  ['国土交通省', 'https://www.mlit.go.jp/statistics/'],
  ['農林水産省', 'https://www.maff.go.jp/j/tokei/'],
  ['厚生労働省', 'https://www.mhlw.go.jp/toukei/'],
  ['経済産業省', 'https://www.meti.go.jp/statistics/'],
  ['文部科学省', 'https://www.mext.go.jp/b_menu/toukei/'],
  ['財務省', 'https://www.mof.go.jp/pri/reference/'],
  ['国税庁', 'https://www.nta.go.jp/publication/statistics/'],
  ['日本銀行', 'https://www.stat-search.boj.or.jp/'],
  ['内閣府', 'https://www.esri.cao.go.jp/jp/stat/menu.html'],
  ['環境省', 'https://www.env.go.jp/doc/toukei/'],
  ['気象庁', 'https://www.data.jma.go.jp/'],
  ['警察庁', 'https://www.npa.go.jp/publications/statistics/'],
  ['消防庁', 'https://www.fdma.go.jp/publication/'],
  ['国土地理院', 'https://www.gsi.go.jp/kihonjohochousa/'],
  ['観光庁', 'https://www.mlit.go.jp/kankocho/tokei_hakusyo/'],
  ['e-Stat', 'https://www.e-stat.go.jp/'],
  ['OECD', 'https://data-explorer.oecd.org/'],
  ['IMF', 'https://www.imf.org/en/Data'],
  ['世界銀行', 'https://data.worldbank.org/'],
  ['FAO', 'https://www.fao.org/faostat/'],
  ['ILO', 'https://ilostat.ilo.org/'],
  ['WHO', 'https://www.who.int/data/'],
  ['国連', 'https://unstats.un.org/UNSDWebsite/'],
];
const PRIVATE_SOURCE_PATTERN =
  /協会|連合会|研究所|新聞|通信社|株式会社|有限会社|財団|記念会|民間|推計社/;
const KAKEI_MARKETING_ANALYSES_PATH = path.join(
  PROJECT_ROOT,
  'packages/data-configs/src/evidence-inventory/kakei-marketing/analyses.json'
);
const ANTHROPIC_SKILLS_DOCS =
  'https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview';
const GUIDE_ADOPTIONS = new Map([
  [5, ['progressive-disclosure', ['CLAUDE.md']]],
  [8, ['concrete-use-cases', ['.claude/skills/dev/create-skill/SKILL.md']]],
  [10, ['skill-structure-and-naming', ['CLAUDE.md', '.claude/skills/dev/create-skill/SKILL.md']]],
  [12, ['concrete-use-cases', ['.claude/skills/dev/create-skill/SKILL.md']]],
  [15, ['trigger-testing', ['.claude/skills/dev/audit-consistency/SKILL.md']]],
  [23, ['iterative-quality-gate', ['.claude/skills/dev/verification-loop/SKILL.md']]],
  [26, ['deterministic-critical-validation', ['CLAUDE.md', '.claude/rules/model-prompting.md']]],
]);

function usage() {
  return `Usage:
  node .claude/scripts/source-vault/source-inventory.mjs build --profile <name>
  node .claude/scripts/source-vault/source-inventory.mjs build-all
  node .claude/scripts/source-vault/source-inventory.mjs validate --profile <name>
  node .claude/scripts/source-vault/source-inventory.mjs coverage --profile <name> [--check]
  node .claude/scripts/source-vault/source-inventory.mjs check-all`;
}

function parseArgs(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 1) {
    const arg = rest[index];
    if (!arg.startsWith('--')) throw new Error(`Unknown argument: ${arg}`);
    const key = arg.slice(2);
    if (key === 'check') {
      options[key] = true;
      continue;
    }
    const value = rest[index + 1];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
    options[key] = value;
    index += 1;
  }
  return { command, options };
}

async function exists(target) {
  try {
    await access(target);
    return true;
  } catch {
    return false;
  }
}

async function readJson(target) {
  return JSON.parse(await readFile(target, 'utf8'));
}

async function writeJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

async function writeCompactJson(target, value) {
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, `${JSON.stringify(value)}\n`, 'utf8');
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function normalize(value) {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/<br\s*\/?\s*>/gi, ' ')
    .replace(/[\s　「」『』（）()【】\[\]・,:：;；\/]/g, '')
    .replace(/20\d{2}(?:年度|年|年産)?/g, '')
    .replace(/令和\d+年度?/g, '')
    .toLowerCase();
}

function compact(value, max = 140) {
  return String(value ?? '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\|/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max);
}

function stateDir(profile) {
  return path.join(STATE_ROOT, profile.sourceKey, profile.edition);
}

async function loadContext(profileName) {
  const config = await readJson(CONFIG_PATH);
  const profile = config.profiles[profileName];
  if (!profile) throw new Error(`Unknown source vault profile: ${profileName}`);
  const revision = `r${profile.revision}`;
  return {
    profileName,
    profile,
    sourceRoot: path.join(
      TEMP_VAULT_ROOT,
      'work',
      profile.sourceKey,
      profile.edition,
      profile.sourceRootName
    ),
    workspaceDir: path.join(
      TEMP_VAULT_ROOT,
      'derived',
      profile.sourceKey,
      profile.edition,
      revision
    ),
    outputDir: stateDir(profile),
  };
}

function findOfficialSource(text) {
  for (const [organization, url] of OFFICIAL_SOURCES) {
    if (text.includes(organization)) return { organization, url };
  }
  return null;
}

function publicationName(text, fallback) {
  const quoted = text.match(/[「『]([^」』]{2,90})[」』]/)?.[1];
  return compact(quoted || fallback || '公式統計・報告', 100);
}

function extractYears(text) {
  return [...new Set(text.match(/(?:19|20)\d{2}/g) ?? [])].slice(0, 8);
}

function geoScopes(text) {
  if (/都道府県|県別|地方別|市区町村/.test(text)) return ['prefecture-set'];
  if (/世界|各国|主要国|国際|OECD|IMF|FAO|WHO/.test(text)) return ['world'];
  return ['japan'];
}

function contentRoles(scopes) {
  if (scopes.includes('prefecture-set')) return ['ranking', 'theme', 'area', 'blog'];
  if (scopes.includes('world')) return ['theme', 'blog', 'note'];
  return ['japan', 'theme', 'blog', 'note'];
}

function governmentOpenData(url) {
  return /https:\/\/[^/]+\.(?:go|lg)\.jp(?:\/|$)/.test(url);
}

async function loadMetrics() {
  const metricsDir = path.join(PROJECT_ROOT, 'packages/data-configs/src/metrics');
  const metrics = [];
  for (const file of (await readdir(metricsDir)).filter((name) => name.endsWith('.ts'))) {
    const text = await readFile(path.join(metricsDir, file), 'utf8');
    const key = text.match(/["']?key["']?\s*:\s*["']([^"']+)["']/)?.[1];
    const title = text.match(/["']?title["']?\s*:\s*["']([^"']+)["']/)?.[1];
    const subtitle = text.match(/["']?subtitle["']?\s*:\s*["']([^"']*)["']/)?.[1];
    const sourceBlock = text.match(/["']?source["']?\s*:\s*\{([\s\S]*?)\n\s*\}/)?.[1] ?? '';
    const sourceName = sourceBlock.match(/["']?displayName["']?\s*:\s*["']([^"']+)["']/)?.[1];
    const sourceUrl = sourceBlock.match(/["']?url["']?\s*:\s*["']([^"']+)["']/)?.[1];
    if (key && title && normalize(title).length >= 4) {
      metrics.push({ key, title, subtitle, sourceName, sourceUrl });
    }
  }
  return metrics;
}

async function loadSurveys() {
  return readJson(path.join(PROJECT_ROOT, 'packages/ranking/src/data/surveys.json'));
}

function parseSections(markdown) {
  const matches = [...markdown.matchAll(/^##\s+(.+)$/gm)];
  return matches.map((match, index) => ({
    title: compact(match[1]),
    text: markdown.slice(
      match.index,
      index + 1 < matches.length ? matches[index + 1].index : markdown.length
    ),
  }));
}

function tableBlockCount(section) {
  return section.split('\n').filter((line) => /^\|(?:[-: ]+\|)+$/.test(line)).length;
}

function imageCount(section) {
  return section.split('\n').filter((line) => line.startsWith('![')).length;
}

function sourceHint(text, fallback) {
  const official = findOfficialSource(text);
  const lines = text.split('\n').filter((line) =>
    /より作成|資料[・:：]|出典[・:：]|調査|統計|年報|報告/.test(line)
  );
  const sourceLine = lines.at(-1) ?? '';
  return {
    organization: official?.organization,
    publicationOrDataset: publicationName(sourceLine, fallback),
    years: extractYears(`${fallback}\n${sourceLine}`),
    officialUrl: official?.url,
    privateSource: PRIVATE_SOURCE_PATTERN.test(sourceLine) && !official,
  };
}

function findMetric(text, metrics) {
  const target = normalize(text);
  return metrics.find(({ title, subtitle }) => {
    const metricTitle = normalize(title);
    const metricSubtitle = normalize(subtitle || '');
    return metricTitle.length >= 4 && target.includes(metricTitle) &&
      (metricSubtitle.length === 0 || target.includes(metricSubtitle));
  });
}

function findSurvey(text, surveys) {
  const target = normalize(text);
  return surveys.find((survey) => {
    const name = normalize(survey.name);
    return name.length >= 5 && target.includes(name);
  });
}

function resolveJapanItem(candidate, metrics, surveys) {
  const context = candidate._context;
  const metric = findMetric(candidate._matchText, metrics);
  const survey = findSurvey(context, surveys);
  const official = survey?.url
    ? { organization: survey.organization || candidate.sourceHint.organization, url: survey.url }
    : candidate.sourceHint.officialUrl
      ? { organization: candidate.sourceHint.organization, url: candidate.sourceHint.officialUrl }
      : null;
  const scopes = geoScopes(`${candidate.topicHint}\n${context}`);
  const base = {
    id: candidate.id,
    source: candidate.source,
    topicHint: candidate.topicHint,
    sourceHint: {
      organization: candidate.sourceHint.organization ?? null,
      publicationOrDataset: candidate.sourceHint.publicationOrDataset,
    },
  };
  if (official && metric) {
    const metricSourceUrl = metric.sourceUrl || official.url;
    return {
      ...base,
      resolution: 'reuse-existing-metric',
      reason: '公式一次資料の手掛かりと同一定義候補の既存metricを確認',
      primarySource: {
        organization: official.organization || 'stats47登録済み公式統計機関',
        publicationOrDataset: metric.sourceName || survey?.name || candidate.sourceHint.publicationOrDataset,
        url: metricSourceUrl,
        ...(governmentOpenData(metricSourceUrl)
          ? { termsUrl: 'https://www.digital.go.jp/resources/open_data/' }
          : {}),
        dataYears: candidate.sourceHint.years,
        checkedAt: '2026-08-29',
        rights: governmentOpenData(metricSourceUrl) ? 'allowed' : 'needs-review',
      },
      mapping: {
        metricKeys: [metric.key],
        surveyIds: survey ? [survey.id] : [],
        geoScopes: scopes,
        contentRoles: contentRoles(scopes),
      },
    };
  }
  if (official) {
    return {
      ...base,
      resolution: 'context-only',
      reason: '公式一次資料の所在は確認できるが独立metric採択は行わず分析文脈へ統合',
      primarySource: {
        organization: official.organization || '公式統計機関',
        publicationOrDataset: survey?.name || candidate.sourceHint.publicationOrDataset,
        url: official.url,
        ...(governmentOpenData(official.url)
          ? { termsUrl: 'https://www.digital.go.jp/resources/open_data/' }
          : {}),
        dataYears: candidate.sourceHint.years,
        checkedAt: '2026-08-29',
        rights: governmentOpenData(official.url) ? 'allowed' : 'needs-review',
      },
      mapping: {
        metricKeys: [],
        surveyIds: survey ? [survey.id] : [],
        geoScopes: scopes,
        contentRoles: contentRoles(scopes),
      },
    };
  }
  if (candidate.sourceHint.privateSource) {
    return {
      ...base,
      resolution: 'rights-hold',
      reason: '民間・団体資料の利用条件を公式に確認できないため公開停止',
    };
  }
  return {
    ...base,
    resolution: 'primary-source-unavailable',
    reason: 'OCR内の手掛かりだけでは公式一次資料を一意に特定できないため公開停止',
  };
}

async function buildJapanZue(context) {
  const mdDir = path.join(context.sourceRoot, 'md');
  if (!(await exists(mdDir))) throw new Error(`Missing restored markdown: ${mdDir}`);
  const metrics = await loadMetrics();
  const surveys = await loadSurveys();
  const pages = [];
  for (const file of (await readdir(mdDir)).filter((name) => /^p\d{3}\.md$/.test(name)).sort()) {
    const markdown = await readFile(path.join(mdDir, file), 'utf8');
    pages.push({ page: Number(file.slice(1, 4)), markdown, sections: parseSections(markdown) });
  }
  if (pages.length !== 504 || pages[0]?.page !== 26 || pages.at(-1)?.page !== 529) {
    throw new Error(`Japan Zue page coverage must be p026-p529 (504 pages): ${pages.length}`);
  }

  const tableBase = [];
  const tableExtras = [];
  const figureBase = [];
  const figureExtras = [];
  const paragraphCandidates = [];
  for (const page of pages) {
    let tableSequence = 0;
    let figureSequence = 0;
    for (const section of page.sections) {
      const hint = sourceHint(section.text, section.title);
      if (section.title.startsWith('表')) {
        tableSequence += 1;
        tableBase.push({ page: page.page, sequence: tableSequence, title: section.title, hint, context: section.text });
        for (let extra = 2; extra <= Math.max(1, tableBlockCount(section.text)); extra += 1) {
          tableExtras.push({ page: page.page, title: `${section.title} 内訳${extra}`, hint, context: section.text });
        }
      }
      if (section.title.startsWith('図')) {
        figureSequence += 1;
        figureBase.push({ page: page.page, sequence: figureSequence, title: section.title, hint, context: section.text });
        const figurePanels = /2枚組/.test(section.text) ? Math.max(2, imageCount(section.text)) : imageCount(section.text);
        for (let extra = 2; extra <= Math.max(1, figurePanels); extra += 1) {
          figureExtras.push({ page: page.page, title: `${section.title} 図版${extra}`, hint, context: section.text });
        }
      } else if (imageCount(section.text) > 0) {
        figureExtras.push({ page: page.page, title: section.title, hint, context: section.text });
      }
    }
    const body = page.markdown
      .replace(/^---[\s\S]*?---\s*/m, '')
      .split(/\n\s*\n/)
      .filter((block) =>
        block.length >= 24 &&
        /(?:19|20)\d{2}|\d+(?:\.\d+)?[%％]|\d+[万億兆千]/.test(block) &&
        !/^\s*[#|!]/.test(block) &&
        !/より作成|出典[:：]|資料[:：]/.test(block) &&
        !/索引|脚注|奥付/.test(block)
      );
    let textSequence = 0;
    for (const block of body) {
      const fingerprint = sha256(normalize(block));
      if (paragraphCandidates.some((item) => item.fingerprint === fingerprint)) continue;
      textSequence += 1;
      paragraphCandidates.push({
        page: page.page,
        sequence: textSequence,
        title: `p.${page.page} 本文統計 ${textSequence}`,
        hint: sourceHint(page.markdown, `p.${page.page} 本文統計`),
        context: `${block}\n${page.markdown}`,
        matchText: block,
        fingerprint,
      });
    }
  }
  if (tableBase.length !== 721 || tableExtras.length < 48) {
    throw new Error(`Unexpected Japan Zue table extraction: ${tableBase.length}+${tableExtras.length}`);
  }
  if (figureBase.length !== 200 || figureExtras.length < 2) {
    throw new Error(`Unexpected Japan Zue figure extraction: ${figureBase.length}+${figureExtras.length}`);
  }
  if (paragraphCandidates.length < 458) {
    throw new Error(`Japan Zue text-stat candidates below 458: ${paragraphCandidates.length}`);
  }

  const raw = [];
  const pageCounters = new Map();
  function add(kind, candidate) {
    const key = `${candidate.page}-${kind}`;
    const sequence = (pageCounters.get(key) ?? 0) + 1;
    pageCounters.set(key, sequence);
    raw.push({
      id: `japan-zue-2025-26-p${String(candidate.page).padStart(3, '0')}-${kind === 'text-stat' ? 'textstat' : kind}${String(sequence).padStart(2, '0')}`,
      source: { key: 'japan-zue', edition: '2025-26', page: candidate.page, kind, sequence },
      topicHint: `${kind} candidate p.${candidate.page} #${sequence}`,
      sourceHint: candidate.hint,
      _matchText: candidate.matchText ?? candidate.title,
      _context: candidate.context,
    });
  }
  for (const item of [...tableBase, ...tableExtras.slice(0, 48)].sort((a, b) => a.page - b.page)) add('table', item);
  for (const item of [...figureBase, ...figureExtras.slice(0, 2)].sort((a, b) => a.page - b.page)) add('figure', item);
  for (const item of paragraphCandidates.slice(0, 458)) add('text-stat', item);
  if (raw.length !== 1429) throw new Error(`Japan Zue candidate count must be 1429: ${raw.length}`);
  return {
    input: {
      pages: 504,
      scope: 'p026-p529',
      sourceBundleFiles: 1746,
      internalFigureCount: 201,
    },
    items: raw.map((item) => resolveJapanItem(item, metrics, surveys)),
  };
}

async function kakeiMarketingAnalyses() {
  const { analyses } = await readJson(KAKEI_MARKETING_ANALYSES_PATH);
  if (!Array.isArray(analyses) || analyses.length === 0) {
    throw new Error(`No authored analyses: ${KAKEI_MARKETING_ANALYSES_PATH}`);
  }
  const ids = new Set();
  for (const analysis of analyses) {
    if (ids.has(analysis.id)) throw new Error(`Duplicate analysis id ${analysis.id}`);
    ids.add(analysis.id);
    const [from, to] = analysis.pages ?? [];
    if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to < from) {
      throw new Error(`Invalid page range for ${analysis.id}`);
    }
    if (!RESOLUTIONS.has(analysis.resolution)) {
      throw new Error(`Invalid resolution for ${analysis.id}: ${analysis.resolution}`);
    }
    for (const other of analyses) {
      if (other === analysis) continue;
      const [f2, t2] = other.pages;
      if (from <= t2 && f2 <= to) {
        throw new Error(`Overlapping page ranges: ${analysis.id} / ${other.id}`);
      }
    }
  }
  return analyses;
}

async function editorialSources() {
  const root = path.join(PROJECT_ROOT, 'packages/data-configs/src/area-databook/editorial');
  return Object.fromEntries(await Promise.all(PREFECTURES.map(async ([code]) => {
    const text = await readFile(path.join(root, `${code}.ts`), 'utf8');
    const url = text.match(/sourceUrl:\s*["']([^"']+)["']/)?.[1];
    if (!url) throw new Error(`Area editorial has no sourceUrl: ${code}`);
    return [code, url];
  })));
}

function detectedPrefecture(text) {
  const head = text.slice(0, 500);
  const headMatches = PREFECTURES.filter(([, name]) => head.includes(name));
  if (headMatches.length === 1) return headMatches[0];
  const allMatches = PREFECTURES.filter(([, name]) => text.includes(name));
  return allMatches.length === 1 ? allMatches[0] : null;
}

async function loadExtractionPages(context) {
  const workspacePath = path.join(context.workspaceDir, 'processing-manifest.json');
  const workspace = await readJson(workspacePath);
  const pages = [];
  for (const document of workspace.documents) {
    const extractionPath = path.join(context.workspaceDir, 'extractions', `${document.id}.json`);
    if (!(await exists(extractionPath))) throw new Error(`Missing extraction: ${document.path}`);
    const extraction = await readJson(extractionPath);
    if (extraction.pages.length !== document.pages) {
      throw new Error(`Incomplete extraction ${document.path}: ${extraction.pages.length}/${document.pages}`);
    }
    for (const page of extraction.pages) {
      const transcriptPath = path.join(context.workspaceDir, page.transcript);
      pages.push({ document, page, text: await readFile(transcriptPath, 'utf8') });
    }
  }
  const cropManifestPath = path.join(context.workspaceDir, 'crop-manifest.json');
  const cropManifest = await exists(cropManifestPath)
    ? await readJson(cropManifestPath)
    : null;
  return { workspace, pages, internalCropCount: cropManifest?.crops?.length ?? 0 };
}

async function buildPageSource(context) {
  const { workspace, pages, internalCropCount } = await loadExtractionPages(context);
  const editorial = context.profile.sourceKey === 'prefecture-databook'
    ? await editorialSources()
    : null;
  const kakeiAnalyses = context.profile.sourceKey === 'kakei-marketing'
    ? await kakeiMarketingAnalyses()
    : [];
  const seenPageImages = new Set();
  const items = pages.map(({ document, page, text }) => {
    const id = `${context.profile.sourceKey}-${context.profile.edition}-${document.id}-p${String(page.page).padStart(4, '0')}`;
    const source = {
      key: context.profile.sourceKey,
      edition: context.profile.edition,
      document: document.id,
      page: page.page,
      kind: 'page',
    };
    const processing = {
      engine: page.engine,
      dpi: page.dpi,
      rotationDegrees: page.rotationDegrees ?? workspace.ocrRotationDegrees ?? 0,
      pageSegmentationMode: page.pageSegmentationMode ?? workspace.ocrPageSegmentationMode ?? 6,
      pageImageSha256: page.pageImageSha256,
      transcriptSha256: page.transcriptSha256,
    };
    if (context.profile.sourceKey === 'prefecture-deviation') {
      return {
        id, source,
        topicHint: `rights review page ${document.id} p.${page.page}`,
        resolution: 'rights-hold',
        reason: '書誌は国立国会図書館で確定したが各図表の再利用条件と一次資料照合が未確定のため公開停止',
        processing,
      };
    }
    if (context.profile.sourceKey === 'claude-skills-guide') {
      const adoption = GUIDE_ADOPTIONS.get(page.page);
      if (!adoption) {
        return {
          id, source,
          topicHint: `guide p.${page.page}`,
          resolution: 'not-applicable',
          reason: '公開統計の根拠にせず、既存規約へ採択済みでないページ',
          processing,
        };
      }
      return {
        id, source,
        topicHint: adoption[0],
        resolution: 'context-only',
        reason: 'Anthropic公式Skills仕様で再確認し、既存の内部運用SSOTへ統合済み',
        primarySource: {
          organization: 'Anthropic',
          publicationOrDataset: 'Agent Skills documentation',
          url: ANTHROPIC_SKILLS_DOCS,
          dataYears: ['2026'],
          checkedAt: '2026-08-29',
          rights: 'allowed',
        },
        mapping: {
          geoScopes: [],
          contentRoles: ['agent', 'skill', 'internal-documentation'],
          internalFiles: adoption[1],
        },
        processing,
      };
    }

    if (context.profile.sourceKey === 'kakei-marketing') {
      const analysis = kakeiAnalyses.find(
        (entry) => page.page >= entry.pages[0] && page.page <= entry.pages[1]
      );
      if (!analysis) {
        return {
          id, source,
          topicHint: `non-analysis page ${document.id} p.${page.page}`,
          resolution: 'not-applicable',
          reason: '表紙・目次・Kindle操作画面等で、分析・論点に属さないページ',
          processing,
        };
      }
      return {
        id, source,
        topicHint: analysis.id,
        resolution: analysis.resolution,
        reason: analysis.resolutionReason,
        ...(analysis.primarySources?.[0] ? { primarySource: analysis.primarySources[0] } : {}),
        mapping: {
          metricKeys: analysis.metricKeys ?? [],
          surveyIds: analysis.surveyIds ?? [],
          themeSlugs: analysis.themeSlugs ?? [],
          geoScopes: analysis.geoScopes ?? [],
          contentRoles: analysis.contentRoles ?? [],
        },
        processing,
      };
    }

    const duplicate = seenPageImages.has(page.pageImageSha256);
    seenPageImages.add(page.pageImageSha256);
    if (duplicate) {
      return {
        id, source,
        topicHint: `duplicate scan page ${document.id} p.${page.page}`,
        resolution: 'not-applicable',
        reason: '同一PDF内または分冊間の重複スキャンページ',
        processing,
      };
    }
    const prefecture = detectedPrefecture(text);
    if (prefecture) {
      const [code, name] = prefecture;
      return {
        id, source,
        topicHint: `${name}の県別編集候補`,
        resolution: 'combined-analysis',
        reason: '県シンボル・特産品候補を一次資料で再確認しarea editorialへ統合',
        primarySource: {
          organization: '都道府県・自治体等の公式機関',
          publicationOrDataset: `${name} 県シンボル・特産品公式資料`,
          url: editorial[code],
          dataYears: ['2021'],
          checkedAt: '2026-08-29',
          rights: 'allowed',
        },
        mapping: {
          areaCodes: [code],
          geoScopes: ['prefecture'],
          contentRoles: ['area'],
        },
        processing,
      };
    }
    const official = findOfficialSource(text);
    if (official) {
      return {
        id, source,
        topicHint: `official source context ${document.id} p.${page.page}`,
        resolution: 'context-only',
        reason: '分冊共通の統計出典説明を公式統計入口へ接続',
        primarySource: {
          organization: official.organization,
          publicationOrDataset: publicationName(text, '都道府県DataBook掲載統計の公式資料'),
          url: official.url,
          termsUrl: 'https://www.digital.go.jp/resources/open_data/',
          dataYears: extractYears(text),
          checkedAt: '2026-08-29',
          rights: 'allowed',
        },
        mapping: {
          geoScopes: ['prefecture-set'],
          contentRoles: ['ranking', 'theme', 'area'],
        },
        processing,
      };
    }
    return {
      id, source,
      topicHint: `non-candidate page ${document.id} p.${page.page}`,
      resolution: 'not-applicable',
      reason: '表紙・目次・広告・判別不能ページで公開候補ではない',
      processing,
    };
  });
  return {
    input: {
      documents: workspace.documents.length,
      pages: pages.length,
      extractionComplete: true,
      internalCropCount,
    },
    items,
  };
}

function summarize(profileName, profile, input, items) {
  const byResolution = {};
  const byKind = {};
  for (const item of items) {
    byResolution[item.resolution] = (byResolution[item.resolution] ?? 0) + 1;
    byKind[item.source.kind] = (byKind[item.source.kind] ?? 0) + 1;
  }
  return {
    schemaVersion: 1,
    profile: profileName,
    sourceKey: profile.sourceKey,
    edition: profile.edition,
    input,
    itemCount: items.length,
    resolvedCount: items.filter((item) => RESOLUTIONS.has(item.resolution)).length,
    resolutionCoverage: items.length === 0 ? 0 : 1,
    actionableCount: items.filter((item) => ACTIONABLE_RESOLUTIONS.has(item.resolution)).length,
    blockedCount: items.filter((item) =>
      ['primary-source-unavailable', 'rights-hold'].includes(item.resolution)
    ).length,
    byResolution,
    byKind,
    publicOriginalReuse: 'forbidden',
  };
}

async function build(profileName) {
  const context = await loadContext(profileName);
  const built = context.profile.sourceKey === 'japan-zue'
    ? await buildJapanZue(context)
    : await buildPageSource(context);
  const summary = summarize(profileName, context.profile, built.input, built.items);
  const inventory = {
    schemaVersion: 1,
    profile: profileName,
    sourceKey: context.profile.sourceKey,
    edition: context.profile.edition,
    publicOriginalReuse: 'forbidden',
    ...(context.profile.bibliography
      ? { bibliography: context.profile.bibliography }
      : {}),
    items: built.items,
  };
  await writeCompactJson(path.join(context.outputDir, 'inventory.json'), inventory);
  await writeJson(path.join(context.outputDir, 'summary.json'), summary);
  await validate(profileName);
  return summary;
}

async function validate(profileName) {
  const context = await loadContext(profileName);
  const inventoryPath = path.join(context.outputDir, 'inventory.json');
  const summaryPath = path.join(context.outputDir, 'summary.json');
  const inventory = await readJson(inventoryPath);
  const summary = await readJson(summaryPath);
  const errors = [];
  if (inventory.schemaVersion !== 1) errors.push('schemaVersion');
  if (inventory.sourceKey !== context.profile.sourceKey) errors.push('sourceKey');
  if (inventory.edition !== context.profile.edition) errors.push('edition');
  if (inventory.publicOriginalReuse !== 'forbidden') errors.push('publicOriginalReuse');
  if (
    JSON.stringify(inventory.bibliography ?? null) !==
    JSON.stringify(context.profile.bibliography ?? null)
  ) {
    errors.push('bibliography');
  }
  if (!Array.isArray(inventory.items) || inventory.items.length === 0) errors.push('items');
  const ids = new Set();
  for (const item of inventory.items ?? []) {
    if (ids.has(item.id)) errors.push(`duplicate id ${item.id}`);
    ids.add(item.id);
    if (!RESOLUTIONS.has(item.resolution)) errors.push(`resolution ${item.id}`);
    if (!item.reason) errors.push(`reason ${item.id}`);
    if (ACTIONABLE_RESOLUTIONS.has(item.resolution) && !item.primarySource) {
      errors.push(`primarySource ${item.id}`);
    }
    if (item.primarySource && !/^https:\/\//.test(item.primarySource.url ?? '')) {
      errors.push(`primarySource URL ${item.id}`);
    }
    if (
      ['reuse-existing-metric', 'new-metric', 'combined-analysis'].includes(item.resolution) &&
      item.primarySource?.rights !== 'allowed'
    ) {
      errors.push(`production rights ${item.id}`);
    }
    if (item.resolution === 'reuse-existing-metric' && !item.mapping?.metricKeys?.length) {
      errors.push(`metric mapping ${item.id}`);
    }
    if (item.source?.key !== inventory.sourceKey || item.source?.edition !== inventory.edition) {
      errors.push(`source identity ${item.id}`);
    }
    const serialized = JSON.stringify(item);
    if (/OCR本文|bookValue|rawText|transcriptText|scanPath/.test(serialized)) {
      errors.push(`forbidden content field ${item.id}`);
    }
    if (serialized.includes(TEMP_VAULT_ROOT) || serialized.includes(PROJECT_ROOT)) {
      errors.push(`absolute local path ${item.id}`);
    }
  }
  if (summary.itemCount !== inventory.items?.length) errors.push('summary itemCount');
  if (summary.resolvedCount !== inventory.items?.length) errors.push('summary resolvedCount');
  if (summary.resolutionCoverage !== 1) errors.push('summary resolutionCoverage');
  const expected = summarize(profileName, context.profile, summary.input, inventory.items ?? []);
  for (const field of ['actionableCount', 'blockedCount']) {
    if (summary[field] !== expected[field]) errors.push(`summary ${field}`);
  }
  if (JSON.stringify(summary.byResolution) !== JSON.stringify(expected.byResolution)) {
    errors.push('summary byResolution');
  }
  if (JSON.stringify(summary.byKind) !== JSON.stringify(expected.byKind)) {
    errors.push('summary byKind');
  }
  if (errors.length > 0) throw new Error(`Evidence inventory failed:\n- ${errors.join('\n- ')}`);
  return {
    valid: true,
    profile: profileName,
    items: inventory.items.length,
    coverage: summary.resolutionCoverage,
    inventoryPath: path.relative(PROJECT_ROOT, inventoryPath),
    summaryPath: path.relative(PROJECT_ROOT, summaryPath),
  };
}

async function coverage(profileName, check) {
  const context = await loadContext(profileName);
  const summary = await readJson(path.join(context.outputDir, 'summary.json'));
  if (check && summary.resolutionCoverage !== 1) {
    throw new Error(`${profileName} resolution coverage is not 100%`);
  }
  return summary;
}

async function main() {
  const { command, options } = parseArgs(process.argv.slice(2));
  if (!command || command === 'help') {
    process.stdout.write(`${usage()}\n`);
    return;
  }
  const config = await readJson(CONFIG_PATH);
  const profileNames = Object.keys(config.profiles);
  let result;
  if (command === 'build') {
    if (!options.profile) throw new Error('build requires --profile');
    result = await build(options.profile);
  } else if (command === 'build-all') {
    result = [];
    for (const profileName of profileNames) result.push(await build(profileName));
  } else if (command === 'validate') {
    if (!options.profile) throw new Error('validate requires --profile');
    result = await validate(options.profile);
  } else if (command === 'coverage') {
    if (!options.profile) throw new Error('coverage requires --profile');
    result = await coverage(options.profile, options.check);
  } else if (command === 'check-all') {
    result = [];
    for (const profileName of profileNames) result.push(await validate(profileName));
  } else {
    throw new Error(`Unknown command: ${command}`);
  }
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
}

main().catch((error) => {
  process.stderr.write(`${error.stack || error.message}\n`);
  process.exitCode = 1;
});

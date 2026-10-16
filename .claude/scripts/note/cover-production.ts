/** Category policy / production queue. Remote image registration stays in note:assets. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import sharp from 'sharp';
import { NOTE_ARTICLES } from './catalog';
import { NOTE_COVER_CATEGORIES, noteCoverCategory } from './catalog/cover-categories';
import { COVER_ROOT, coverSha, readCoverLedger, updateCoverLedger, validateCoverLedger } from './lib/cover-assets.mjs';
import { assertCoverPlan, buildCoverPlan, coverProductionView, readCoverPolicies, seedCoverProduction, validateCoverPolicies } from './lib/cover-production.mjs';
import { renderPopCover } from './lib/pop-cover-render';
import { prepareGeneratedCover } from './lib/generated-cover.mjs';
import { renderCoverReference } from './lib/cover-geography.mjs';

async function main() {
const args = process.argv.slice(2);
const command = args.shift();
const option = (name: string) => { const i = args.indexOf(name); return i < 0 ? undefined : args[i + 1]; };
for (let i = 0; i < args.length; i += 2) if (!['--id', '--ids', '--output', '--request', '--background', '--image', '--review', '--reference'].includes(args[i]) || !args[i + 1]) throw Error('invalid argument');
const policies = validateCoverPolicies(readCoverPolicies(), NOTE_COVER_CATEGORIES);
const articles = NOTE_ARTICLES.map(article => ({ ...article, category: noteCoverCategory(article) }));
if (command === 'seed') {
  await updateCoverLedger(ledger => seedCoverProduction(ledger, articles, policies));
}
const ledger = validateCoverLedger(readCoverLedger(), NOTE_ARTICLES);
if (command === 'seed' || command === 'validate' || command === 'list') {
  const rows = articles.map(article => {
    const row = ledger.articles.find(r => r.articleKey === article.key)!;
    const view = coverProductionView(row, article, policies);
    if (!view.id) throw Error(`production ID missing: ${article.key}; run seed`);
    if (row.production?.policyId !== view.policy.id) throw Error(`production category mismatch: ${article.key}`);
    return { id: view.id, articleKey: article.key, category: article.category, policy: `${view.policy.id}@${view.policy.version}`, stage: view.stage, candidateMatches: view.candidateMatches, blockers: view.blockers };
  });
  console.log(JSON.stringify(command === 'list' ? rows : { status: 'pass', articles: rows.length, generation: 'Codex imagegen (文字込み)', currentCandidates: rows.filter(r => r.candidateMatches).length, categories: NOTE_COVER_CATEGORIES.map(c => ({ ...c, count: rows.filter(r => r.category === c.key).length })) }, null, 2));
} else if (command === 'export' || command === 'export-batch') {
  const writeRequest = async (plan: NonNullable<ReturnType<typeof buildCoverPlan>>, output: string, resume: boolean) => {
    const reference = await renderCoverReference(plan);
    const referenceFile = path.join(path.dirname(output), `${plan.productionId}-map-reference.png`);
    if (reference) {
      if (fs.existsSync(referenceFile) && !fs.readFileSync(referenceFile).equals(reference)) throw Error('reference input changed; use a new batch directory');
      if (!fs.existsSync(referenceFile)) fs.writeFileSync(referenceFile, reference, { flag: 'wx' });
    }
    if (resume && fs.existsSync(output)) {
      if (JSON.stringify(JSON.parse(fs.readFileSync(output, 'utf8'))) !== JSON.stringify(plan)) throw Error('batch request changed; use a new batch directory');
    } else fs.writeFileSync(output, JSON.stringify(plan, null, 2) + '\n', { flag: 'wx' });
    return reference ? [referenceFile] : [];
  };
  if (command === 'export-batch') {
    const ids = option('--ids')?.split(','), destination = option('--output');
    if (!ids?.length || ids.length > 10 || new Set(ids).size !== ids.length || !destination) throw Error('export-batch requires 1–10 unique --ids and a temporary --output directory');
    const output = path.resolve(destination);
    if (![os.tmpdir(), '/tmp', 'C:/tmp'].some(root => { const rel = path.relative(path.resolve(root), output); return rel && !rel.startsWith('..') && !path.isAbsolute(rel); })) throw Error('batch output must be a temporary subdirectory');
    const selected = ids.map(id => {
      const row = ledger.articles.find(r => r.production?.id === id), article = articles.find(a => a.key === row?.articleKey);
      if (!row || !article) throw Error(`unknown production ID: ${id}`);
      const view = coverProductionView(row, article, policies);
      if (!view.plan || view.plan.policyVersion !== view.policy.version || view.blockers.length) throw Error(`generation blocked ${id}: ${view.blockers.join(' ') || 'save current category policy first'}`);
      assertCoverPlan(row, article, policies, view.plan);
      return { row, view };
    });
    const marker = path.join(output, '.note-cover-batch');
    if (fs.existsSync(output)) {
      if (!fs.existsSync(marker) || fs.readFileSync(marker, 'utf8') !== ids.join(',')) throw Error('batch directory ownership or selection mismatch');
    } else { fs.mkdirSync(output, { recursive: false }); fs.writeFileSync(marker, ids.join(','), { flag: 'wx' }); }
    const jobs: { id: string | null; articleKey: string; planSha256: string; status: 'candidate-registered' | 'generation-pending'; revisionRequest?: string | null; request: string; referencedImagePaths: string[]; imagePrompt?: string }[] = [];
    for (const { view } of selected) {
      const plan = view.plan!, file = path.join(output, `${view.id}-request.json`);
      const referencedImagePaths = await writeRequest(plan, file, true);
      jobs.push({ id: view.id, articleKey: plan.articleKey, planSha256: plan.planSha256, status: view.candidateMatches && view.stage !== 'changes' ? 'candidate-registered' : 'generation-pending',
        revisionRequest: view.stage === 'changes' ? ledger.articles.find(r => r.production?.id === view.id)?.revisions.find(r => r.id === view.candidateRevisionId)?.review.reason : undefined,
        request: file, referencedImagePaths, imagePrompt: plan.imagePrompt });
    }
    fs.writeFileSync(path.join(output, 'batch.json'), JSON.stringify({ account: 'stats47', ids, tool: 'Codex built-in imagegen', jobs }, null, 2) + '\n');
    console.log(JSON.stringify({ selected: jobs.length, generationPending: jobs.filter(j => j.status === 'generation-pending').length, batch: path.join(output, 'batch.json') }));
    return;
  }
  const id = option('--id'); const output = option('--output');
  if (!id || !output) throw Error('export requires --id NCI-00001 --output /tmp/request.json');
  const row = ledger.articles.find(r => r.production?.id === id);
  const article = articles.find(a => a.key === row?.articleKey);
  if (!row || !article) throw Error('unknown production ID');
  const view = coverProductionView(row, article, policies);
  const plan = buildCoverPlan(row, article, policies);
  if (!plan || view.stage === 'stale' && row.production?.policyVersion !== view.policy.version) throw Error(`save a brief with the current policy first: ${view.blockers.join(' ')}`);
  fs.mkdirSync(path.dirname(path.resolve(output)), { recursive: true });
  await writeRequest(plan, output, false);
  console.log(`Saved ${id}: ${output}`);
} else if (command === 'render' || command === 'prepare-image') {
  const complete = command === 'prepare-image';
  const request = option('--request'), background = option(complete ? '--image' : '--background'), output = option('--output');
  if (!request || !background || !output) throw Error('render requires --request request.json --background background.png --output /tmp/new-directory');
  const destination = path.resolve(output);
  const inside = (root: string) => { const relative = path.relative(path.resolve(root), destination); return !!relative && !relative.startsWith('..') && !path.isAbsolute(relative); };
  if (inside(COVER_ROOT) || ![os.tmpdir(), '/tmp', 'C:/tmp'].some(inside)) throw Error('output must be a temporary directory outside the repository');
  const supplied = JSON.parse(fs.readFileSync(request, 'utf8'));
  const row = ledger.articles.find(r => r.production?.id === supplied.productionId);
  const article = articles.find(a => a.key === row?.articleKey);
  if (!row || !article) throw Error('unknown production ID');
  assertCoverPlan(row, article, policies, supplied);
  const plan = buildCoverPlan(row, article, policies)!;
  const backgroundBytes = fs.readFileSync(background);
  if (complete !== (plan.renderer === 'note-imagegen-cover-v1')) throw Error('generation method does not match saved policy');
  const reviewFile = option('--review');
  if (complete && !reviewFile) throw Error('prepare-image requires --review JSON with original and 320px visual checks');
  const referenceFile = option('--reference'), referenceBytes = referenceFile ? fs.readFileSync(referenceFile) : undefined;
  const result = complete ? await prepareGeneratedCover(plan, backgroundBytes, JSON.parse(fs.readFileSync(reviewFile!, 'utf8')), referenceBytes) : await renderPopCover(plan, backgroundBytes);
  fs.mkdirSync(destination, { recursive: false });
  const backgroundFile = path.join(destination, complete ? 'original.png' : 'background.png');
  fs.writeFileSync(backgroundFile, backgroundBytes);
  const referenceOutput = referenceBytes ? path.join(destination, 'map-reference.png') : undefined;
  if (referenceOutput && referenceBytes) fs.writeFileSync(referenceOutput, referenceBytes);
  const file = path.join(destination, `${plan.productionId}.png`);
  fs.writeFileSync(file, result.png);
  if ('svg' in result) fs.writeFileSync(path.join(destination, `${plan.productionId}.svg`), result.svg);
  await sharp(result.png).resize(320).png().toFile(path.join(destination, `${plan.productionId}-320.png`));
  const manifest = { account: 'stats47', version: `pop-${plan.policyId}-v${plan.policyVersion}-${plan.planSha256.slice(0, 12)}`,
    articles: [{ key: article.key, noteUrl: article.noteUrl ?? null, action: 'improve', file, ...(complete ? { originalFile: backgroundFile } : { backgroundFile }), ...(referenceOutput ? { referenceFile: referenceOutput } : {}), sha256: coverSha(result.png),
      quality: { textBounds: 'pass', textOverlap: 'pass' }, evidence: result.evidence }] };
  fs.writeFileSync(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log(JSON.stringify({ image: file, manifest: path.join(destination, 'manifest.json'), status: 'local-preview; import via note:assets to register a candidate' }));
} else {
  throw Error('Usage: cover-production.ts seed|validate|list|export|export-batch|render|prepare-image [--id ID --output PATH] [--ids ID1,ID2 --output TEMP_DIR] [--request JSON --image PNG --review JSON --reference PNG --output TEMP_DIR]');
}
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

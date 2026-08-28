#!/usr/bin/env tsx
/**
 * prepare-buzz-map-batch.ts — buzz-map 集客ゲート Phase 4: eligible 候補を batch で
 * spec → render → R2 → caption → landing contract → posts.json draft まで進める CLI。
 *
 * 正典: .claude/rules/buzz-map-standards.md §5（生成・R2・draft）/
 *       .claude/rules/sns-content-standards.md §2（UTM・投稿ガード）。
 *
 * ★安全既定: dry-run。--apply が無ければ render / R2 push / posts insert を一切実行しない
 *   (選定と実行予定ステップだけ表示)。--apply は段階フラグ (--to r2 / --to draft) で分離可。
 *
 * 選定: buzz-map-catalog.json の curated entry を selectBatch (score 降順 × isEligibleForBatch)。
 * idempotent: R2 既存素材 (HEAD 200) + posts.json 既 draft は skip。動画は 1 batch 最大 3。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/prepare-buzz-map-batch.ts                 # dry-run・top12 のプラン表示
 *   npx tsx .claude/scripts/sns/prepare-buzz-map-batch.ts --limit 6
 *   npx tsx .claude/scripts/sns/prepare-buzz-map-batch.ts --json          # プランを JSON で
 *   npx tsx .claude/scripts/sns/prepare-buzz-map-batch.ts --apply --to r2 # (実装のみ・実行は Phase 3 完了後)
 */

import { spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { createRequire } from 'node:module';

import { selectBatch, isPostable } from './lib/buzz-map-router-core.mjs';
import { verifyLandingContract } from './lib/buzz-map-contract-core.mjs';
import { buildUtmUrl, utmCampaignFor } from './lib/buzz-map-utm-core.mjs';
import {
  assetPlanForType,
  compositionsForType,
  capVideos,
  r2KeysFor,
  expectedContentType,
  idempotencyDecision,
  captionComplete,
  buildCandidatePlan,
} from './lib/buzz-map-batch-core.mjs';

const require = createRequire(import.meta.url);
// posts.json は read-only 参照 (dedup)。書込は insert のみ・--apply --to draft でだけ呼ぶ。
const snsPostsStore = require('../lib/sns-posts-store.cjs') as {
  query: (
    p: (r: Record<string, unknown>) => boolean
  ) => Array<Record<string, unknown>>;
  insert: (record: Record<string, unknown>) => Record<string, unknown>;
};

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, '../../..');
const STATE_PATH = join(
  PROJECT_ROOT,
  '.claude/state/sns/buzz-map-catalog.json'
);
const SPEC_DIR = join(
  PROJECT_ROOT,
  'apps/remotion/src/features/buzz-map/specs'
);
const REMOTION_DIR = join(PROJECT_ROOT, 'apps/remotion');
const LOCAL_R2 = join(PROJECT_ROOT, '.local/r2');
const R2_PUBLIC =
  process.env.R2_PUBLIC_FETCH_URL ?? 'https://storage.stats47.jp';
const CHROME =
  process.env.CHROME ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEFAULT_LIMIT = 12;
const MAX_VIDEOS = 3;

interface CuratedEntry {
  metricKey: string;
  ideaId?: string;
  lane: string;
  title: string;
  score: number;
  status: string;
  recommendedType?: string;
  commercialUse?: string;
  sensitivity?: string;
  eligible?: boolean;
  landingStrategy?: string;
  primaryUrl?: string | null;
  metricKeys?: string[];
  aliasesOf?: string[];
}

interface CatalogFile {
  entries: CuratedEntry[];
}

function parseArgs() {
  const a = process.argv.slice(2);
  const has = (f: string) => a.includes(f);
  const val = (f: string) => {
    const i = a.indexOf(f);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  return {
    limit: val('--limit') ? Number(val('--limit')) : DEFAULT_LIMIT,
    apply: has('--apply'),
    to: (val('--to') as 'r2' | 'draft' | null) ?? null,
    json: has('--json'),
    maxVideos: val('--max-videos') ? Number(val('--max-videos')) : MAX_VIDEOS,
  };
}

function loadCatalog(): CatalogFile {
  if (!existsSync(STATE_PATH)) {
    throw new Error(
      `catalog state が無い: ${STATE_PATH} (先に build-buzz-map-catalog.ts)`
    );
  }
  return JSON.parse(readFileSync(STATE_PATH, 'utf8')) as CatalogFile;
}

/** curated 候補の spec を ideaId / aliasesOf から解決 (存在するファイル名を返す)。 */
function resolveSpecId(entry: CuratedEntry): {
  specId: string | null;
  exists: boolean;
} {
  const candidates = [entry.ideaId, ...(entry.aliasesOf ?? [])].filter(
    (x): x is string => Boolean(x)
  );
  for (const id of candidates) {
    if (existsSync(join(SPEC_DIR, `${id}.json`)))
      return { specId: id, exists: true };
  }
  // 未生成: 既定の spec 名は ideaId
  return { specId: entry.ideaId ?? entry.metricKey, exists: false };
}

/** R2 に素材が既にあるか HEAD で確認 (idempotent)。credential を使わず公開 URL のみ。 */
async function headR2(
  key: string
): Promise<{ ok: boolean; status: number | null; contentType: string | null }> {
  try {
    const res = await fetch(`${R2_PUBLIC}/${key}`, { method: 'HEAD' });
    return {
      ok: res.ok,
      status: res.status,
      contentType: res.headers.get('content-type'),
    };
  } catch {
    return { ok: false, status: null, contentType: null };
  }
}

async function main() {
  const opts = parseArgs();
  const catalog = loadCatalog();

  // curated 候補のみを batch 選定 (score 降順 × isEligibleForBatch)
  const curated = catalog.entries.filter(
    (e) => e.lane === 'curated' && e.ideaId
  );
  const selected = selectBatch(curated, opts.limit) as CuratedEntry[];

  // 動画上限。asset plan を付けて capVideos に渡す
  const withPlans = selected.map((e) => ({
    entry: e,
    ideaId: e.ideaId as string,
    assetPlan: assetPlanForType(e.recommendedType ?? 'A'),
  }));
  const capped = capVideos(withPlans, opts.maxVideos) as Array<
    (typeof withPlans)[number] & { videoDeferred: boolean }
  >;

  // 既 draft (posts.json read-only)
  const existingDrafts = new Set(
    snsPostsStore
      .query((p) => p.domain === 'buzz-map' && p.status === 'draft')
      .map((p) => `instagram:${p.content_key}`)
      .concat(
        snsPostsStore
          .query((p) => p.domain === 'buzz-map' && p.status === 'draft')
          .map((p) => `x:${p.content_key}`)
      )
  );

  const report: unknown[] = [];
  let videoBudget = opts.maxVideos;

  for (let i = 0; i < capped.length; i++) {
    const { entry, ideaId, assetPlan, videoDeferred } = capped[i];
    const { specId, exists: specExists } = resolveSpecId(entry);
    const plan = buildCandidatePlan(
      { ...entry, recommendedType: entry.recommendedType ?? 'A', ideaId },
      { specExists, specId }
    );
    const r2Keys = r2KeysFor(ideaId, assetPlan);
    const requiredKeys = Object.values(r2Keys).filter(
      (value): value is string => typeof value === 'string'
    );

    // idempotency: R2 HEAD (dry-run でも読み取りは可) + posts.json 既 draft
    const existingR2 = new Set<string>();
    for (const key of requiredKeys) {
      const head = await headR2(key);
      if (head.ok) existingR2.add(key);
    }
    const alreadyDraft =
      existingDrafts.has(`instagram:${ideaId}`) ||
      existingDrafts.has(`x:${ideaId}`);
    const idem = idempotencyDecision({
      requiredKeys,
      existingR2Keys: existingR2,
      alreadyDraft,
    });

    if (assetPlan.xVideo || assetPlan.igReel)
      videoBudget = Math.max(0, videoBudget - 1);

    report.push({
      rank: i + 1,
      ideaId,
      score: entry.score,
      type: plan.type,
      status: entry.status,
      landing: entry.landingStrategy,
      primaryUrl: entry.primaryUrl ?? null,
      assets: {
        still: assetPlan.still,
        xVideo: assetPlan.xVideo,
        igReel: assetPlan.igReel,
        videoDeferred,
      },
      spec: { id: specId, exists: specExists },
      blocked: plan.blocked,
      blockReason: plan.blockReason,
      idempotentSkip: idem.skip,
      idempotentReason: idem.reason,
      r2Keys,
      steps: plan.steps,
      campaign: utmCampaignFor(ideaId),
    });
  }

  if (opts.json) {
    console.log(
      JSON.stringify(
        {
          limit: opts.limit,
          maxVideos: opts.maxVideos,
          mode: opts.apply ? 'apply' : 'dry-run',
          candidates: report,
        },
        null,
        2
      )
    );
  } else {
    printReport(report as ReportRow[], opts);
  }

  if (!opts.apply) {
    // --json のときは stdout を JSON 専有にするため notice は stderr へ
    const notice = `[dry-run] 実行はしていません。render / R2 push / draft insert は --apply で実行されます。`;
    if (opts.json) console.error(notice);
    else console.log(`\n${notice}`);
    return;
  }

  // ── --apply: render → R2 push (sns/buzz-map) → HEAD 検証 → contract → isPostable → draft ──
  console.log(`\n─── APPLY 実行 (--to ${opts.to ?? 'draft'}) ───`);
  await applyBatch(report as ReportRow[], opts);
}

interface ReportRow {
  rank: number;
  ideaId: string;
  score: number;
  type: string;
  blocked: boolean;
  blockReason: string | null;
  idempotentSkip: boolean;
  idempotentReason: string | null;
  spec: { id: string | null; exists: boolean };
  assets: {
    still: boolean;
    xVideo: boolean;
    igReel: boolean;
    videoDeferred: boolean;
  };
  r2Keys: Record<string, string>;
  steps: string[];
  primaryUrl: string | null;
  landing?: string;
}

function printReport(rows: ReportRow[], opts: ReturnType<typeof parseArgs>) {
  console.log(
    `\n=== prepare-buzz-map-batch (${opts.apply ? 'APPLY' : 'dry-run'}) === limit=${opts.limit} maxVideos=${opts.maxVideos}`
  );
  console.log(
    `選定 ${rows.length} 件 (curated・score 降順 × isEligibleForBatch)\n`
  );
  for (const r of rows) {
    const flags = [
      r.blocked ? `BLOCKED(${r.blockReason})` : null,
      r.idempotentSkip ? 'SKIP(idempotent)' : null,
      r.assets.videoDeferred ? 'video-deferred(cap)' : null,
      !r.spec.exists ? 'spec-missing' : null,
    ]
      .filter(Boolean)
      .join(' ');
    console.log(
      `#${String(r.rank).padStart(2)} [${r.type}] score ${String(r.score).padStart(3)}  ${r.ideaId}  ${flags}`
    );
    const assetList =
      [
        r.assets.still ? 'still' : null,
        r.assets.xVideo ? 'x-video' : null,
        r.assets.igReel ? 'ig-reel' : null,
      ]
        .filter(Boolean)
        .join('+') || '(none)';
    console.log(
      `     assets: ${assetList} / landing: ${r.landing} ${r.primaryUrl ?? ''}`
    );
    if (!r.blocked && !r.idempotentSkip) {
      for (const s of r.steps) console.log(`       - ${s}`);
    }
  }
}

/** remotion still を .local/r2 の指定 key へ描画。成功可否を返す。 */
function renderStill(
  compositionId: string,
  specPath: string,
  r2Key: string
): boolean {
  const outPath = join(LOCAL_R2, r2Key);
  mkdirSync(dirname(outPath), { recursive: true });
  const res = spawnSync(
    'npx',
    [
      'remotion',
      'still',
      'src/index.ts',
      compositionId,
      outPath,
      `--props=${specPath}`,
      `--browser-executable=${CHROME}`,
    ],
    { cwd: REMOTION_DIR, stdio: 'pipe', encoding: 'utf8' }
  );
  const ok = res.status === 0 && existsSync(outPath);
  if (!ok)
    console.error(
      `   render 失敗 (${compositionId} → ${r2Key}): ${(res.stderr ?? '').slice(-200)}`
    );
  return ok;
}

/** この実行で生成した明示keyだけをbytes比較でexact publishする。 */
function pushR2(keys: readonly string[]): boolean {
  if (keys.length === 0) {
    console.error('   R2 push 失敗: この実行で生成したassetが0件です');
    return false;
  }
  const res = spawnSync(
    'npx',
    [
      'tsx',
      'packages/r2-storage/src/scripts/push-exact-r2-assets.ts',
      ...keys.flatMap((key) => ['--key', key]),
    ],
    {
      cwd: PROJECT_ROOT,
      stdio: 'pipe',
      encoding: 'utf8',
      env: { ...process.env, ALLOW_LOCAL_R2_WRITE: '1' },
    }
  );
  if (res.status !== 0)
    console.error(
      `   R2 push 失敗: ${(res.stderr ?? res.stdout ?? '').slice(-300)}`
    );
  return res.status === 0;
}

/** R2 の key を HEAD で検証 (200 + Content-Type 一致)。 */
async function verifyR2Key(
  key: string
): Promise<{ ok: boolean; status: number | null; ctOk: boolean }> {
  const head = await headR2(key);
  const expected = expectedContentType(key);
  const ctOk =
    head.contentType != null &&
    expected != null &&
    head.contentType.startsWith(expected);
  return { ok: head.ok && ctOk, status: head.status, ctOk };
}

/**
 * --apply の実行本体 (段階フラグ --to で分離)。
 * spec 確認/生成 → render (compositionsForType) → 決定的レンダ検査 → idea単位exact publish
 * → HEAD 200 + Content-Type 検証 → caption（共通UTM）→ landing contract → isPostable 全条件 PASS
 * のみ posts.json draft insert。posts.json は insert 経由のみ・予約なし・実投稿しない。
 */
async function applyBatch(
  rows: ReportRow[],
  opts: ReturnType<typeof parseArgs>
) {
  const stopAfter = opts.to; // "r2" で R2 push まで / "draft" で draft まで / null=全段
  // 既 draft を platform 単位で dedup (X 側の新規は可・IG 701-704 と重複しない)
  const draftKey = (platform: string, key: string) => `${platform}:${key}`;
  const existingDrafts = new Set(
    snsPostsStore
      .query(
        (p) =>
          p.domain === 'buzz-map' &&
          (p.status === 'draft' ||
            p.status === 'scheduled' ||
            p.status === 'posted')
      )
      .map((p) => draftKey(String(p.platform), String(p.content_key)))
  );
  const inserted: Array<Record<string, unknown>> = [];

  for (const r of rows) {
    if (r.blocked) {
      console.log(`[apply] ${r.ideaId}: skip (BLOCKED: ${r.blockReason})`);
      continue;
    }
    if (r.idempotentSkip) {
      console.log(`[apply] ${r.ideaId}: skip (${r.idempotentReason})`);
      continue;
    }
    if (!r.spec.exists) {
      // spec 未生成は今回対象外（spec 生成は別工程）。draft せず記録
      console.log(
        `[apply] ${r.ideaId}: skip (spec 未生成 — 先に build-buzz-map-spec が必要)`
      );
      continue;
    }
    const specPath = join(SPEC_DIR, `${r.spec.id}.json`);
    const comps = compositionsForType(r.type) as { still?: string };
    const generatedKeys: string[] = [];

    // 2-3. render (still を X/IG 両パスへ) + 決定的レンダ検査 (renderStill が存在確認)
    let renderOk = true;
    if (r.assets.still && comps.still) {
      renderOk =
        renderStill(comps.still, specPath, r.r2Keys.xStill) &&
        renderStill(comps.still, specPath, r.r2Keys.igStill);
      if (renderOk) {
        generatedKeys.push(r.r2Keys.xStill, r.r2Keys.igStill);
      }
    }
    if (!renderOk) {
      console.log(`[apply] ${r.ideaId}: skip (render 失敗)`);
      continue;
    }

    // 4. R2 push (この実行で生成した明示keyだけをexact publish)
    const pushed = pushR2(generatedKeys);
    if (!pushed) {
      console.log(`[apply] ${r.ideaId}: skip (R2 push 失敗)`);
      continue;
    }
    if (stopAfter === 'r2') {
      console.log(`[apply --to r2] ${r.ideaId}: R2 push 完了`);
      continue;
    }

    // 5. HEAD 200 + Content-Type 検証 (still キーのみ・caption はまだ push しない)
    const stillKeys = [r.r2Keys.xStill, r.r2Keys.igStill].filter(
      Boolean
    ) as string[];
    let r2Ok = true;
    for (const key of stillKeys) {
      const v = await verifyR2Key(key);
      if (!v.ok) {
        r2Ok = false;
        console.error(
          `   HEAD 検証 失敗 ${key}: status=${v.status} ctOk=${v.ctOk}`
        );
      }
    }

    // 6. caption（共通UTM）。X 用 canonical に UTM。出典/年度/対象単位を含める
    const variant = 'question-a';
    const utm = r.primaryUrl
      ? buildUtmUrl({
          canonicalUrl: r.primaryUrl,
          platform: 'x',
          ideaId: r.ideaId,
          variant,
        })
      : null;
    const caption =
      `${r.ideaId}（出典: e-Stat / 総務省統計）\n${utm ?? ''}`.trim();
    const capCheck = captionComplete(caption, { sourceRequired: true });

    // 7. landing contract (verifyLandingContract → pass && live 200)。
    //    primaryUrl は catalog では相対 (/blog/...) なので絶対化してから渡す (fetch が相対を解釈できない)。
    const absLanding = r.primaryUrl
      ? r.primaryUrl.startsWith('http')
        ? r.primaryUrl
        : `https://stats47.jp${r.primaryUrl}`
      : null;
    const contract = await verifyLandingContract({
      ideaId: r.ideaId,
      canonicalUrl: absLanding,
      promise: '',
      requiredMetricKeys: [],
      requiredTerms: [],
    });

    // 8. isPostable — 全条件 PASS のみ draft (X 側で登録。IG は既存 701-704 と衝突回避)
    const platform = 'x';
    const noDuplicate = !existingDrafts.has(draftKey(platform, r.ideaId));
    const facts = {
      commercialUse: r.landing === 'blocked' ? 'blocked' : 'allowed',
      sensitivity: 'low',
      specGenerated: r.spec.exists,
      renderChecked: renderOk,
      r2Ok,
      landingContractPass: contract.result === 'pass',
      landingLive: contract.liveStatus === 200,
      captionComplete: capCheck.complete,
      noDuplicate,
    };
    const postable = isPostable(facts);
    if (!postable.postable) {
      console.log(
        `[apply] ${r.ideaId}: draft 見送り (${postable.reasons.join(', ')})`
      );
      continue;
    }
    if (stopAfter === 'draft' || stopAfter === null) {
      const row = snsPostsStore.insert({
        platform,
        post_type: 'single',
        domain: 'buzz-map',
        content_key: r.ideaId,
        caption,
        media_path: r.r2Keys.xStill ?? null,
        status: 'draft',
        template: `buzzmap-${r.type}`,
        utm_url: utm,
        // X は本文リンクで直接遷移 = direct (SNS CTR の分母に使える)
        attribution: 'direct',
      });
      inserted.push(row);
      existingDrafts.add(draftKey(platform, r.ideaId));
      console.log(
        `[apply] ${r.ideaId}: draft 登録 id=${row.id} (campaign=${utmCampaignFor(r.ideaId)})`
      );
    }
  }
  console.log(`\n[apply] draft 登録 ${inserted.length} 件`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

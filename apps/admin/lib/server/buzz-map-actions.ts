import 'server-only';

import path from 'node:path';

import { isPostable } from '../../../../.claude/scripts/sns/lib/buzz-map-router-core.mjs';
// UTM は正典 sns-utm.cjs に一本化 (CP5)。gallery からも同じ util で組む。
import snsUtm from '../../../../.claude/scripts/lib/sns-utm.cjs';

import { projectRoot, R2_BASE } from './project-root';

const typedSnsUtm = snsUtm as unknown as {
  buildUtmForDomain: (p: {
    domain: string;
    domainParams: Record<string, string>;
    canonicalUrl: string;
    platform: string;
    variant: string;
  }) => string;
};
import { startJob } from './jobs';
import {
  findBuzzMapIdea,
  listCuratedIdeaIds,
  readBuzzMapCatalog,
} from './buzz-map';
import { query as queryPosts, insert as insertPost } from './posts-store';

/**
 * buzz-map gallery アクション（操作と安全ガード）。
 *
 * 各操作は分離した job として起動 (同時実行 1 件ガードは jobs.ts が既に持つ)。
 * ideaId は必ず catalog 実在 (curated レーン) の allowlist で検証し、
 * 任意文字列を CLI に渡さない。R2 push / draft 登録は追加の確認が要る。
 */
export type ActionResult<T = unknown> = { status: number; body: T };

const IDEA_ID_RE = /^[a-z0-9-]+$/;

function assertIdeaId(
  ideaId: unknown
): { ok: true; id: string } | { ok: false; error: string } {
  if (typeof ideaId !== 'string' || !IDEA_ID_RE.test(ideaId)) {
    return { ok: false, error: 'ideaId は英数字とハイフンのみ' };
  }
  if (!listCuratedIdeaIds().has(ideaId)) {
    return {
      ok: false,
      error: `ideaId が catalog (curated レーン) に存在しません: ${ideaId}`,
    };
  }
  return { ok: true, id: ideaId };
}

// ─── landing 再判定 (catalog 全体を rebuild) ─────────────
export function routeLanding(): ActionResult {
  const script = path.join(
    projectRoot(),
    '.claude/scripts/sns/build-buzz-map-catalog.ts'
  );
  const r = startJob('buzz-map:route-landing', 'npx', ['tsx', script]);
  return 'error' in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── spec 生成 (ideaId の sourceKind に応じて呼び先ヘルパーが違うため、
//     コマンド全文をユーザーが確認・編集できるようプレビューだけ返す。
//     実行は generic な "custom-spec" job としてサーバ側で組み立てた args を渡す) ─────
export interface GenerateSpecInput {
  ideaId?: string;
  /** build-buzz-map-spec 系のうちどれを使うか (sourceKind に対応)。 */
  helper?: 'estat' | 'ksj' | 'gsi' | 'merge';
  /** helper へ渡す追加 CLI 引数 (allowlist 済みの --flag value 配列。shell 文字列は受け取らない)。 */
  extraArgs?: string[];
}

const SPEC_HELPER_SCRIPT: Record<
  NonNullable<GenerateSpecInput['helper']>,
  string
> = {
  estat: '.claude/scripts/sns/build-buzz-map-spec.ts',
  ksj: '.claude/scripts/sns/build-buzz-map-spec-ksj.ts',
  gsi: '.claude/scripts/sns/build-buzz-map-spec-gsi.ts',
  merge: '.claude/scripts/sns/merge-buzz-map-specs.ts',
};

/** extraArgs は "--flag" / 値 のみを許可 (shell メタ文字・任意コマンド注入を防ぐ)。 */
function isSafeArgToken(token: string): boolean {
  return /^[A-Za-z0-9._\-/:%|]+$/.test(token) && token.length < 512;
}

export function generateSpec(body: GenerateSpecInput): ActionResult {
  const idea = assertIdeaId(body.ideaId);
  if (!idea.ok) return { status: 400, body: { error: idea.error } };
  const helper = body.helper;
  if (!helper || !(helper in SPEC_HELPER_SCRIPT)) {
    return {
      status: 400,
      body: {
        error: `helper は ${Object.keys(SPEC_HELPER_SCRIPT).join(' | ')} のいずれか`,
      },
    };
  }
  const extraArgs = Array.isArray(body.extraArgs) ? body.extraArgs : [];
  if (!extraArgs.every(isSafeArgToken)) {
    return {
      status: 400,
      body: { error: 'extraArgs に許可されない文字が含まれています' },
    };
  }
  if (!extraArgs.includes('--id')) extraArgs.push('--id', idea.id);
  const script = path.join(projectRoot(), SPEC_HELPER_SCRIPT[helper]);
  const r = startJob(`buzz-map:generate-spec:${idea.id}`, 'npx', [
    'tsx',
    script,
    ...extraArgs,
  ]);
  return 'error' in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── レンダ (still / preview / full) ─────────────────────
type RenderKind = 'still' | 'preview' | 'full';

function remotionArgs(
  ideaId: string,
  kind: RenderKind,
  outAbs: string
): string[] {
  const specRel = `apps/remotion/src/features/buzz-map/specs/${ideaId}.json`;
  const args = [
    'remotion',
    'still',
    'src/index.ts',
    'BuzzMap-Still-45',
    outAbs,
    `--props=${specRel}`,
  ];
  if (kind === 'preview') args.push('--frames=0-89', '--scale=0.5');
  return args;
}

export function renderBuzzMap(body: {
  ideaId?: string;
  kind?: RenderKind;
}): ActionResult {
  const idea = assertIdeaId(body.ideaId);
  if (!idea.ok) return { status: 400, body: { error: idea.error } };
  const kind = body.kind;
  if (kind !== 'still' && kind !== 'preview' && kind !== 'full') {
    return {
      status: 400,
      body: { error: 'kind は still | preview | full のいずれか' },
    };
  }
  const remotionRoot = path.join(projectRoot(), 'apps/remotion');
  const outRel =
    kind === 'still'
      ? `public/buzz-map/renders/${idea.id}-45.png`
      : `public/buzz-map/renders/${idea.id}-${kind}.mp4`;
  const outAbs = path.join(remotionRoot, outRel);
  const args = remotionArgs(idea.id, kind, outAbs);
  const r = startJob(`buzz-map:render-${kind}:${idea.id}`, 'npx', args);
  return 'error' in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── R2 push (確認ダイアログは呼び元 UI が出す。ここでは実行のみ) ─────
export function pushBuzzMapR2(body: { ideaId?: string }): ActionResult {
  const idea = assertIdeaId(body.ideaId);
  if (!idea.ok) return { status: 400, body: { error: idea.error } };
  const script = path.join(
    projectRoot(),
    'packages/r2-storage/src/scripts/push-exact-r2-assets.ts'
  );
  const args = [
    'tsx',
    script,
    '--prefix',
    `sns/buzz-map/${idea.id}`,
    '--extension',
    'png,webp,jpg,jpeg,svg,mp4,txt,json',
  ];
  const r = startJob(`buzz-map:push-r2:${idea.id}`, 'npx', args);
  return 'error' in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── draft 登録 (draft gate を通ったときのみ posts.json へ insert) ─────
export interface RegisterDraftInput {
  ideaId?: string;
  channel?: 'x' | 'instagram';
}

async function headOk(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export async function registerBuzzMapDraft(
  body: RegisterDraftInput
): Promise<ActionResult> {
  const idea = assertIdeaId(body.ideaId);
  if (!idea.ok) return { status: 400, body: { error: idea.error } };
  const channel = body.channel;
  if (channel !== 'x' && channel !== 'instagram') {
    return {
      status: 400,
      body: { error: 'channel は x | instagram のいずれか' },
    };
  }

  const entry = findBuzzMapIdea(idea.id);
  if (!entry)
    return { status: 400, body: { error: 'catalog entry が見つかりません' } };

  const { entries } = readBuzzMapCatalog({ lane: 'curated' });
  const decorated = entries.find((e) => e.ideaId === idea.id);

  const captionUrl = `${R2_BASE}/sns/buzz-map/${idea.id}/${channel}/caption.txt`;
  const stillsUrl =
    channel === 'x'
      ? `${R2_BASE}/sns/buzz-map/${idea.id}/x/stills/${idea.id}-45.png`
      : `${R2_BASE}/sns/buzz-map/${idea.id}/instagram/stills/slide-1-cover-1080x1350.png`;

  const [captionOk, stillOk] = await Promise.all([
    headOk(captionUrl),
    headOk(stillsUrl),
  ]);

  const landingUrl = entry.primaryUrl
    ? entry.primaryUrl.startsWith('http')
      ? entry.primaryUrl
      : `https://stats47.jp${entry.primaryUrl}`
    : null;
  const landingLive = landingUrl ? await headOk(landingUrl) : false;

  const noDuplicate =
    queryPosts(
      (p) =>
        p.platform === channel &&
        p.domain === 'buzz-map' &&
        p.content_key === idea.id &&
        !p.deleted_at
    ).length === 0;

  const facts = {
    commercialUse: entry.commercialUse ?? '',
    sensitivity: entry.sensitivity ?? '',
    specGenerated: Boolean(decorated?.assets?.hasSpec),
    renderChecked: Boolean(decorated?.assets?.hasLocalAssets),
    r2Ok: captionOk && stillOk,
    landingContractPass:
      entry.landingReadiness === 'live' || entry.landingReadiness === 'ready',
    landingLive,
    captionComplete: captionOk,
    noDuplicate,
  };

  const gate = isPostable(facts);
  if (!gate.postable) {
    return {
      status: 422,
      body: {
        error: `draft gate 未通過: ${gate.reasons.join(' / ')}`,
        reasons: gate.reasons,
      },
    };
  }

  // UTM + attribution（x=direct 本文リンク / instagram=profile 間接導線）。
  // primaryUrl が無い候補は UTM を付けない (canonical 不明)。
  const utmUrl = entry.primaryUrl
    ? typedSnsUtm.buildUtmForDomain({
        domain: 'buzz-map',
        domainParams: { ideaId: idea.id },
        canonicalUrl: entry.primaryUrl,
        platform: channel,
        variant: 'question-a',
      })
    : null;
  const attribution = channel === 'x' ? 'direct' : 'profile';

  const post = insertPost({
    platform: channel,
    domain: 'buzz-map',
    content_key: idea.id,
    post_type: entry.recommendedType ?? null,
    status: 'draft',
    media_path: null,
    utm_url: utmUrl,
    attribution,
  });

  return { status: 201, body: post };
}

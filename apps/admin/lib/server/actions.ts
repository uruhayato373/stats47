import 'server-only';

import path from 'node:path';

import { projectRoot, R2_BASE } from './project-root';
import { startJob, startJobSteps, type JobStep } from './jobs';
import { loadGalleryState } from './gallery-state';

/**
 * spawn を伴うアクション (publish-x / regenerate) と R2 探索。
 * 旧 server.mjs の該当ハンドラを忠実移植 (引数構成・ガード・ホワイトリストを変えない)。
 * 各関数は { status, body } を返し、route が HTTP に写す。
 */
export type ActionResult<T = unknown> = { status: number; body: T };

function publishXScript(): string {
  return path.join(projectRoot(), '.claude/skills/sns/publish-x/publish-x.ts');
}

// ─── publish-x ─────────────────────────────────────
export interface PublishXInput {
  content_key?: string;
  datetime?: string;
  domain?: string;
  dry_run?: boolean;
  immediate?: boolean;
  force?: boolean;
}

export function publishX(body: PublishXInput): ActionResult {
  const {
    content_key,
    datetime,
    domain = 'ranking',
    dry_run = false,
    immediate = false,
  } = body;
  if (!content_key)
    return { status: 400, body: { error: 'content_key は必須' } };
  if (!dry_run && !immediate && !datetime) {
    return {
      status: 400,
      body: { error: '予約には datetime (YYYY-MM-DDTHH:MM) が必要' },
    };
  }
  // 誤即時投稿ガード: 最終成功から 7 日超なら dry-run を先に強制
  const st = loadGalleryState();
  const last = st.lastPublishXSuccess
    ? Date.now() - Date.parse(st.lastPublishXSuccess)
    : Infinity;
  if (!dry_run && last > 7 * 24 * 3600 * 1000 && !body.force) {
    return {
      status: 428,
      body: {
        error:
          'publish-x の成功実績が 7 日以上ない。まず dry-run で UI 変化を確認してください (force:true で強行可)',
      },
    };
  }
  const args = ['tsx', publishXScript(), content_key];
  if (datetime && !immediate) args.push(datetime);
  args.push('--domain', domain);
  if (immediate) args.push('--immediate');
  if (dry_run) args.push('--dry-run');
  const r = startJob('publish-x', 'npx', args);
  return 'error' in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── regenerate (kind ホワイトリストのみ・任意コマンド実行を防ぐ) ─────
function ogpRegen(
  type: string,
  keys: string | null
): JobStep[] {
  const plan = `.local/image-generation-publish-plan-${type}.json`;
  return [
    {
      cmd: 'npx',
      args: [
        'tsx',
        '--tsconfig',
        'apps/web/scripts/tsconfig.ogp.json',
        'apps/web/scripts/generate-ogp-images.ts',
        '--type',
        type,
        '--max-generate',
        '500',
        ...(keys ? ['--key', keys] : []),
      ],
    },
    {
      cmd: 'npx',
      args: ['tsx', 'packages/r2-storage/src/scripts/push-generated-image-set.ts', '--plan', plan],
      requiredFile: plan,
    },
  ];
}

const REGEN: Record<
  string,
  (keys: string | null) => JobStep[]
> = {
  'blog-thumbnails': (keys) => {
    const plan = '.local/image-generation-publish-plan-blog.json';
    return [
      {
        cmd: 'npx',
        args: [
          'tsx',
          'apps/web/scripts/generate-blog-thumbnails-cloud.ts',
          '--max-generate',
          '500',
          ...(keys ? ['--slug', keys] : []),
        ],
      },
      {
        cmd: 'npx',
        args: ['tsx', 'packages/r2-storage/src/scripts/push-generated-image-set.ts', '--plan', plan],
        requiredFile: plan,
      },
    ];
  },
  'ogp-ranking': (keys) => ogpRegen('ranking', keys),
  'ogp-ranking-cards': (keys) => ogpRegen('ranking-cards', keys),
  'ogp-areas': (keys) => ogpRegen('areas', keys),
  'ogp-note-covers': (keys) => ogpRegen('note-covers', keys),
};

export interface RegenerateInput {
  kind?: string;
  keys?: string;
}

export function regenerate(body: RegenerateInput): ActionResult {
  const kind = body.kind;
  const keys = body.keys ? String(body.keys).trim() : null;
  if (!kind || !REGEN[kind]) {
    return {
      status: 400,
      body: { error: `kind は ${Object.keys(REGEN).join(' | ')} のいずれか` },
    };
  }
  if (keys && !/^[a-z0-9,_-]+$/.test(keys)) {
    return {
      status: 400,
      body: { error: 'keys は英数字・カンマ・ハイフンのみ (安全のため)' },
    };
  }
  const r = startJobSteps(`regenerate:${kind}`, REGEN[kind](keys));
  return 'error' in r ? { status: 409, body: r } : { status: 202, body: r };
}

// ─── R2 探索 (HEAD probe — list 不可の代替) ─────────────
export async function probeR2(
  domain: string,
  contentKey: string
): Promise<Array<{ rel: string; size: number }>> {
  const rels = [
    `instagram/caption.txt`,
    `instagram/reel.mp4`,
    `instagram/stills/slide-1-cover-1080x1350.png`,
    `x/caption.txt`,
    `x/stills/chart-x-1200x630.png`,
  ];
  const found: Array<{ rel: string; size: number }> = [];
  await Promise.all(
    rels.map(async (rel) => {
      try {
        const r = await fetch(`${R2_BASE}/sns/${domain}/${contentKey}/${rel}`, {
          method: 'HEAD',
        });
        if (r.ok)
          found.push({
            rel,
            size: Number(r.headers.get('content-length') || 0),
          });
      } catch {
        // 探索なので失敗は無視
      }
    })
  );
  return found;
}

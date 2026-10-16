import { z } from 'zod';
import { qualityOverview } from '@/lib/server/content-quality';
import { projectRoot } from '@/lib/server/project-root';
import { jsonResponse } from '@/lib/server/http';
import { workspaceJson, workspaceError } from '@/lib/server/workspace-request';
import { saveReview } from '../../../../../.claude/scripts/media/lib/workspace.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const check = z.enum(['unchecked', 'pass', 'issue', 'na']);
const schema = z
  .object({
    id: z
      .string()
      .regex(
        /^(note\/[A-Za-z0-9_-]+|sns\/[0-9]+|web\/[a-z-]+\/[A-Za-z0-9_-]+)$/
      ),
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    review: z
      .object({
        priority: z.enum(['high', 'normal', 'low']),
        policy: z.string().max(10000),
        checks: z
          .object({
            data: check,
            images: check,
            placement: check,
            intro: check,
            sources: check,
            links: check,
          })
          .strict(),
      })
      .strict(),
  })
  .strict();
export async function GET() {
  try {
    return jsonResponse(qualityOverview());
  } catch (e) {
    return workspaceError(e);
  }
}
export async function PATCH(req: Request) {
  try {
    const body = schema.parse(await workspaceJson(req));
    saveReview(projectRoot(), body.id, body.revision, body.review);
    return jsonResponse(qualityOverview());
  } catch (e) {
    return workspaceError(e);
  }
}

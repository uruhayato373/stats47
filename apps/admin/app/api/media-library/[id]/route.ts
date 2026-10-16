import { z } from 'zod';
import { projectRoot } from '@/lib/server/project-root';
import { jsonResponse } from '@/lib/server/http';
import { workspaceJson, workspaceError } from '@/lib/server/workspace-request';
import { saveVisualReview } from '@/lib/server/content-quality';
import {
  imageById,
  saveImagePlan,
} from '../../../../../../.claude/scripts/media/lib/workspace.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const revision = z.string().regex(/^[a-f0-9]{64}$/);
const schema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('plan'),
      revision,
      templateId: z.string().max(60),
      policy: z.string().max(10000),
    })
    .strict(),
  z
    .object({
      action: z.literal('review'),
      revision,
      candidateId: revision,
      review: z
        .object({
          status: z.enum(['pass', 'needs-revision']),
          reason: z.string().trim().min(1).max(5000),
          original: z.boolean(),
          mobile: z.boolean(),
          data: z.boolean(),
        })
        .strict(),
    })
    .strict(),
]);
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params,
      body = schema.parse(await workspaceJson(req));
    if (body.action === 'plan')
      saveImagePlan(projectRoot(), id, body.revision, {
        templateId: body.templateId,
        policy: body.policy,
      });
    else
      await saveVisualReview(id, body.revision, body.candidateId, body.review);
    return jsonResponse(imageById(projectRoot(), id));
  } catch (e) {
    return workspaceError(e);
  }
}

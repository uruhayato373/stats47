import { z } from 'zod';
import { projectRoot } from '@/lib/server/project-root';
import { jsonResponse } from '@/lib/server/http';
import { workspaceJson, workspaceError } from '@/lib/server/workspace-request';
import {
  saveVisualReview,
  saveOriginalReview,
} from '@/lib/server/content-quality';
import {
  imageById,
  saveImagePlan,
  saveImagePolicy,
  saveImageComparison,
} from '../../../../../../.claude/scripts/media/lib/workspace.mjs';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    return jsonResponse(imageById(projectRoot(), (await params).id));
  } catch (e) {
    return workspaceError(e);
  }
}
const revision = z.string().regex(/^[a-f0-9]{64}$/);
const schema = z.discriminatedUnion('action', [
  z
    .object({
      action: z.literal('comparison'),
      revision,
      comparison: z
        .object({
          key: z.string().regex(/^[A-Za-z0-9][A-Za-z0-9_-]{0,159}$/),
          title: z.string().trim().min(1).max(300),
          reason: z.string().trim().min(1).max(5000),
          sharedChannels: z.array(z.enum(['note', 'web', 'x', 'instagram'])),
        })
        .strict()
        .nullable(),
    })
    .strict(),
  z
    .object({
      action: z.literal('assess'),
      revision,
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
  z
    .object({
      action: z.literal('policy'),
      revision,
      policy: z.string().max(10000),
    })
    .strict(),
  z
    .object({
      action: z.literal('plan'),
      revision,
      templateId: z.string().max(60),
      policy: z.string().max(10000),
      role: z.string().min(1).max(40),
      reason: z.string().trim().min(1).max(5000),
      purpose: z.string().min(1).max(40),
      selection: z.string().min(1).max(40),
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
        role: body.role as import('../../../../../../.claude/scripts/media/lib/classification.mjs').ImageRole,
        reason: body.reason,
        purpose: body.purpose,
        selection: body.selection,
      });
    else if (body.action === 'policy')
      saveImagePolicy(projectRoot(), id, body.revision, body.policy);
    else if (body.action === 'comparison')
      saveImageComparison(projectRoot(), id, body.revision, body.comparison);
    else if (body.action === 'assess')
      await saveOriginalReview(id, body.revision, body.review);
    else
      await saveVisualReview(id, body.revision, body.candidateId, body.review);
    return jsonResponse(imageById(projectRoot(), id));
  } catch (e) {
    return workspaceError(e);
  }
}

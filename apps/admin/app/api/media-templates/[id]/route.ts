import { z } from 'zod';
import {
  saveTemplate,
  readTemplates,
  sha,
} from '../../../../../../.claude/scripts/media/lib/workspace.mjs';
import { workspaceJson, workspaceError } from '@/lib/server/workspace-request';
import { projectRoot } from '@/lib/server/project-root';
import { jsonResponse } from '@/lib/server/http';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
const schema = z
  .object({
    revision: z.string().regex(/^[a-f0-9]{64}$/),
    policy: z.string().trim().min(1).max(5000),
    profiles: z
      .object({
        note: z.string().max(2000),
        x: z.string().max(2000),
        instagram: z.string().max(2000),
        web: z.string().min(1).max(2000).optional(),
      })
      .strict(),
  })
  .strict();
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params,
      body = schema.parse(await workspaceJson(req));
    saveTemplate(projectRoot(), id, body.revision, body);
    const result = readTemplates(projectRoot());
    return jsonResponse({
      ...result,
      templates: result.templates.map((template) => ({
        ...template,
        revision: sha(template),
      })),
    });
  } catch (e) {
    return workspaceError(e);
  }
}

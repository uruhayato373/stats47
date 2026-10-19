import { ImageTemplateWorkspace } from '@/components/content/image-template-workspace';
import {
  readTemplates,
  sha,
} from '../../../../../.claude/scripts/media/lib/workspace.mjs';
import { projectRoot } from '@/lib/server/project-root';
import {
  basicTemplateBranches,
  basicTemplateQuery,
} from '@/lib/image-template-basics';
import { redirect } from 'next/navigation';
import { taxonomyQuery } from '../../../../../.claude/scripts/media/lib/taxonomy.mjs';
import { loadStatisticalSamples } from '@/lib/server/template-statistical-samples';

export const dynamic = 'force-dynamic';
export const metadata = { title: '型の基本形 — stats47 admin' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const legacy = taxonomyQuery(raw);
  if (
    legacy.template === 'unclassified' ||
    legacy.queue === 'classification' ||
    legacy.purpose === 'undecided'
  )
    redirect('/ops/image-library?queue=classification');
  const query = basicTemplateQuery(raw);
  if (JSON.stringify(raw) !== JSON.stringify(query))
    redirect(
      '/ops/image-templates?' +
        new URLSearchParams(
          Object.entries(query).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        )
    );
  const templates = readTemplates(projectRoot()).templates.map((template) => ({
    ...template,
    revision: sha(template),
  }));
  if (
    query.template &&
    !basicTemplateBranches(templates).some(
      (branch) =>
        branch.templateId === query.template &&
        (!query.purpose || branch.purpose === query.purpose)
    )
  )
    redirect(
      '/ops/image-library?' +
        new URLSearchParams(
          Object.entries({
            template: query.template,
            purpose: query.purpose,
          }).filter((entry): entry is [string, string] => !!entry[1])
        )
    );
  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[520px] flex-col gap-3 md:h-[calc(100dvh-4rem)]">
      <header>
        <h1 className="text-2xl font-bold">型の基本形</h1>
      </header>
      <ImageTemplateWorkspace
        initial={{ templates, samples: loadStatisticalSamples(projectRoot()) }}
      />
    </div>
  );
}

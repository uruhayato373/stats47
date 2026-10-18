import { ImageTemplateWorkspace } from '@/components/content/image-template-workspace';
import { qualityOverview } from '@/lib/server/content-quality';
import { templateSamplePool } from '@/lib/media-template-examples';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { taxonomyQuery } from '../../../../../.claude/scripts/media/lib/taxonomy.mjs';

export const dynamic = 'force-dynamic';
export const metadata = { title: '型の見本 — stats47 admin' };

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const raw = await searchParams;
  const query = taxonomyQuery(raw);
  if (query.template === 'unclassified' || query.queue === 'classification')
    redirect('/ops/image-library?queue=classification');
  if (JSON.stringify(raw) !== JSON.stringify(query))
    redirect(
      '/ops/image-templates?' +
        new URLSearchParams(
          Object.entries(query).filter(
            (entry): entry is [string, string] => typeof entry[1] === 'string'
          )
        )
    );
  const { images, templates, classificationSummary } = qualityOverview();
  return (
    <div className="flex h-[calc(100dvh-6rem)] min-h-[520px] flex-col gap-3 md:h-[calc(100dvh-4rem)]">
      <header>
        <h1 className="text-2xl font-bold">型の見本</h1>
        <p className="text-sm text-console-muted">
          型と媒体を選び、実画像を確認して制作方針を整えます。{' '}
          <Link
            className="text-console-accent underline"
            href="/ops/image-library?queue=classification"
          >
            用途・型の確認待ち {classificationSummary.tasks.classification}件
          </Link>
        </p>
      </header>
      <ImageTemplateWorkspace
        initial={{ ...templateSamplePool(images), templates }}
      />
    </div>
  );
}

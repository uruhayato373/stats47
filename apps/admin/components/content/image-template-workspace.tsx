'use client';
import { useState } from 'react';
import type { WorkspaceData } from './media-workspace';
import { TemplateGallery } from './image-template-gallery';
import { templateSamplePool } from '@/lib/media-template-examples';

export function ImageTemplateWorkspace({
  initial,
}: {
  initial: Pick<WorkspaceData, 'images' | 'templates'> & {
    counts: Record<string, number>;
  };
}) {
  const [data, setData] = useState(initial);
  return (
    <TemplateGallery
      templates={data.templates}
      images={data.images}
      counts={data.counts}
      onSave={async (template, policy, profiles) => {
        const response = await fetch('/api/media-templates/' + template.id, {
          method: 'PATCH',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            revision: template.revision,
            policy,
            profiles,
          }),
        });
        const result = await response.json();
        if (!response.ok)
          throw Error(result.error ?? '方針を保存できませんでした。');
        const overview = await fetch('/api/content-quality');
        if (!overview.ok)
          throw Error(
            '方針は保存されましたが、再読込に失敗しました。ページを再読込してください。'
          );
        const next: WorkspaceData = await overview.json();
        setData({
          templates: next.templates,
          ...templateSamplePool(next.images),
        });
      }}
    />
  );
}

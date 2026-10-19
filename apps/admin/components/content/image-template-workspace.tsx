'use client';
import { useState } from 'react';
import type { Template } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { TemplateGallery } from './image-template-gallery';
import type { StatisticalSampleView } from '@/lib/image-template-basics';

export function ImageTemplateWorkspace({
  initial,
}: {
  initial: {
    templates: (Template & { revision: string })[];
    samples: StatisticalSampleView[];
  };
}) {
  const [data, setData] = useState(initial);
  return (
    <TemplateGallery
      templates={data.templates}
      samples={data.samples}
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
        setData((current) => ({ ...current, templates: result.templates }));
      }}
    />
  );
}

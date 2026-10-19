import 'server-only';
import fs from 'node:fs';
import path from 'node:path';
import { datasetDir } from '../../../../config/datasets.mjs';
import {
  imageLibrary,
  FILES,
  type ImageView,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import {
  STATISTICAL_SAMPLES,
  type StatisticalSampleView,
  type SampleImage,
} from '@/lib/image-template-basics';
import {
  comparisonExamples,
  originalUrl,
  exampleDimensions,
  TEMPLATE_CHANNELS,
} from '@/lib/media-template-examples';
import { RANKING_BAR_FRAME } from '@/lib/template-ranking-bars';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_SOURCE } from '@/lib/template-ranking-data';

export function resolveStatisticalSamples(
  images: ImageView[]
): StatisticalSampleView[] {
  return STATISTICAL_SAMPLES.map((sample) => {
    const media: StatisticalSampleView['media'] = {};
    if (sample.renderer) {
      const trial: SampleImage = {
        src: '/api/template-samples/' + sample.id,
        imageId: sample.imageId ?? sample.id,
        ...RANKING_BAR_FRAME,
        kind: 'trial',
      };
      for (const channel of TEMPLATE_CHANNELS) media[channel] = trial;
    } else if (sample.topic) {
      const group = images.filter(
        (i) =>
          i.templateId === sample.templateId &&
          i.classification.purpose === sample.purpose
      );
      for (const channel of TEMPLATE_CHANNELS) {
        const example = comparisonExamples(group, channel, sample.topic)[0];
        if (!example) continue;
        const dimensions = exampleDimensions(
          example.image,
          example.state !== 'existing'
        );
        media[channel] = {
          src: example.src,
          imageId: example.image.id,
          width: dimensions?.width,
          height: dimensions?.height,
          kind: example.state === 'existing' ? 'reference' : 'trial',
        };
      }
    } else if (sample.imageId) {
      const image = images.find(
        (i) =>
          i.id === sample.imageId &&
          i.templateId === sample.templateId &&
          !i.previewOnly
      );
      const src = image && originalUrl(image);
      if (image && src) {
        const dimensions = exampleDimensions(image, false);
        const reference: SampleImage = {
          src,
          imageId: image.id,
          width: dimensions?.width,
          height: dimensions?.height,
          kind: 'reference',
        };
        for (const channel of TEMPLATE_CHANNELS) media[channel] = reference;
      }
    }
    const basisImages = (sample.referenceImages ?? []).flatMap((reference) => {
      const image = images.find((i) => i.id === reference.imageId && !i.previewOnly);
      const src = image && originalUrl(image);
      return image && src ? [{ src, label: reference.label, pageUrl: image.pageUrl }] : [];
    });
    const binding = sample.renderer ? {
      metricKey: RANKING_SAMPLE_METRIC.key,
      definitionPath: `${datasetDir('metrics.definitions')}/${RANKING_SAMPLE_METRIC.key}.ts`,
      dataKey: RANKING_SAMPLE_SOURCE.key,
      dataSha256: RANKING_SAMPLE_SOURCE.sha256,
      visualization: RANKING_SAMPLE_METRIC.visualization,
    } : undefined;
    return { ...sample, media, basisImages, binding };
  });
}
export function loadStatisticalSamples(root: string) {
  // A newly initialized checkout can still show sample definitions before its asset inventory arrives.
  if (!fs.existsSync(path.join(root, FILES.inventory)))
    return resolveStatisticalSamples([]);
  return resolveStatisticalSamples(imageLibrary(root).images);
}

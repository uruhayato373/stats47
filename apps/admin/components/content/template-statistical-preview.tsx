'use client';
import { useState } from 'react';
import type {
  SampleImage,
  StatisticalSampleView,
} from '@/lib/image-template-basics';
import { TEMPLATE_CHANNELS } from '@/lib/media-template-examples';
import { ActualImage } from './media-image';
import { StatusBadge } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const labels = { note: 'note', web: 'サイト', x: 'X', instagram: 'Instagram' };
function SamplePreview({
  image,
  label,
}: {
  image: SampleImage;
  label: string;
}) {
  const [size, setSize] = useState<{ width: number; height: number } | null>(
    null
  );
  const width = size?.width ?? image.width,
    height = size?.height ?? image.height;
  const ratio =
    width && height
      ? Math.abs(width / height - 0.8) < 0.002
        ? '4:5'
        : (width / height).toFixed(2) + ':1'
      : null;
  return (
    <figure className="space-y-2">
      <a
        href={image.src}
        target="_blank"
        rel="noreferrer"
        aria-label={label + 'のサンプル画像を原寸で開く'}
        className="mx-auto block w-full max-w-[320px] rounded-md border border-console-border bg-white"
      >
        <ActualImage
          src={image.src}
          alt={label + 'の実統計サンプル'}
          dimensions={width && height ? { width, height } : null}
          onDimensions={setSize}
        />
      </a>
      <figcaption className="space-y-1 text-sm text-console-muted">
        <p>
          {ratio
            ? ratio + ' · ' + width + ' × ' + height + 'px'
            : '寸法を確認中'}
        </p>
        {image.kind === 'reference' && <p>参考図・形式調整前</p>}
      </figcaption>
    </figure>
  );
}
function SampleRow({ sample }: { sample: StatisticalSampleView }) {
  return (
    <section
      className="space-y-3"
      aria-label={sample.statistic + (sample.label ? '・' + sample.label : '')}
    >
      <h3 className="font-medium">
        {sample.statistic}
        {sample.label ? ' · ' + sample.label : ''}
      </h3>
      <div className="grid items-start gap-6 @min-[600px]:grid-cols-2 @min-[900px]:grid-cols-4">
        {TEMPLATE_CHANNELS.map((channel) => (
          <section
            key={channel}
            aria-label={sample.id + '・' + labels[channel]}
            className="min-w-0 space-y-3"
          >
            <h4 className="font-semibold">{labels[channel]}</h4>
            {sample.media[channel] ? (
              <SamplePreview
                key={sample.media[channel].src}
                image={sample.media[channel]}
                label={labels[channel] + '・' + sample.statistic}
              />
            ) : (
              <div className="rounded-md border border-dashed border-console-border p-6 text-sm text-console-muted">
                サンプル画像を準備中
              </div>
            )}
          </section>
        ))}
      </div>
      {sample.binding && (
        <div aria-label="データと表示設定" className="space-y-1 border-t border-console-border pt-3 text-sm text-console-muted">
          {sample.templateId === 'tile-map' && <p>
            配色：{sample.binding.visualization.colorScheme.replace(/^interpolate/, '')}
            {' · '}{sample.binding.visualization.colorSchemeType === 'diverging' ? '発散色' : '単方向'}
            {' · '}{sample.binding.visualization.classification.method === 'equal-interval' ? '等間隔' : sample.binding.visualization.classification.method === 'quantile' ? '分位' : sample.binding.visualization.classification.method === 'threshold' ? '指定した境界値' : '連続階調'}
            {'classes' in sample.binding.visualization.classification && sample.binding.visualization.classification.classes + '区分'}
            {' · '}{sample.binding.visualization.domain.mode === 'extent' ? '全47県の実測範囲' : sample.binding.visualization.domain.mode === 'zero' ? '0を含む範囲' : '固定範囲'}
          </p>}
          {sample.templateId === 'bar' && <p>
            表示範囲：{sample.binding.visualization.barDomain?.mode === 'fixed'
              ? `${sample.binding.visualization.barDomain.min} ～ ${sample.binding.visualization.barDomain.max}（固定）`
              : sample.binding.visualization.barDomain?.mode === 'zero'
                ? '最小0・上限は全47県から算出'
                : '全47県の実測最小値 ～ 最大値'}
            {' · 指標台帳の棒グラフ設定'}
          </p>}
          {sample.templateId === 'line' && <p>
            表示範囲：{sample.binding.visualization.trendDomain.mode === 'fixed'
              ? `${sample.binding.visualization.trendDomain.min} ～ ${sample.binding.visualization.trendDomain.max}（固定）`
              : sample.binding.visualization.trendDomain.mode === 'zero' ? '0を含む範囲' : '掲載期間の実測範囲'}
            {' · 指標台帳の推移設定'}
          </p>}
          <p>指標定義・単位・出典はサイトと共通。{sample.purpose === 'ranking' && '同じ値は同順位。'}</p>
        </div>
      )}
    </section>
  );
}
export function TemplateStatisticalPreview({
  samples,
}: {
  samples: StatisticalSampleView[];
}) {
  const [open, setOpen] = useState(false);
  if (!samples.length)
    return (
      <div className="space-y-3">
        <StatusBadge tone="neutral">代表統計を選定中</StatusBadge>
        <div className="grid gap-6 @min-[600px]:grid-cols-2 @min-[900px]:grid-cols-4">
          {TEMPLATE_CHANNELS.map((channel) => (
            <section key={channel} className="space-y-3">
              <h3 className="font-semibold">{labels[channel]}</h3>
              <p className="text-sm text-console-muted">サンプル画像を準備中</p>
            </section>
          ))}
        </div>
      </div>
    );
  return (
    <div className="space-y-5">
      <SampleRow sample={samples[0]} />
      {!!samples[0].basisImages?.length && (
        <section aria-label="公開済みの基準画像" className="space-y-3 border-t border-console-border pt-4">
          <h3 className="font-medium">公開済みの基準画像</h3>
          <div className="grid items-start gap-6 @min-[600px]:grid-cols-2">
            {samples[0].basisImages.map((reference) => (
              <figure key={reference.src} className="min-w-0 space-y-2">
                <figcaption className="text-sm">{reference.label}</figcaption>
                <a href={reference.src} target="_blank" rel="noreferrer" aria-label={reference.label + 'の原寸を開く'} className="block w-full max-w-[320px] rounded-md border border-console-border bg-white">
                  <ActualImage src={reference.src} alt={reference.label} eager />
                </a>
                {reference.pageUrl && <a href={reference.pageUrl} target="_blank" rel="noreferrer" className="text-sm text-console-accent underline">公開先</a>}
              </figure>
            ))}
          </div>
        </section>
      )}
      {samples.length > 1 && (
        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm">
              {open ? 'ほかの検討見本を閉じる' : 'ほかの検討見本を見る'}（
              {samples.length - 1}件）
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-6 pt-4">
            {open &&
              samples
                .slice(1)
                .map((sample) => <SampleRow key={sample.id} sample={sample} />)}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

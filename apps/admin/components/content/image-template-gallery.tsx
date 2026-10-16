'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  ImageView,
  Template,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import {
  channelExamples,
  channelRatios,
  exampleDimensions,
  MEDIA_CHANNELS,
  type TemplateExample,
} from '@/lib/media-template-examples';
import { PanelCard, StatusBadge } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import { CANVAS } from '../../../remotion/src/shared/themes/brand';
import { ActualImage } from './media-image';

type EditableTemplate = Template & { revision: string };
type Save = (
  template: EditableTemplate,
  policy: string,
  profiles: Template['profiles']
) => Promise<void>;
const labels = {
  approved: '採用済み画像',
  candidate: '試作候補',
  stale: '試作候補・再確認が必要',
  existing: '既存画像の参考例',
};
const channels = {
  note: 'note',
  x: 'X',
  instagram: 'Instagram',
  web: 'Web・ブログ',
};

const usages: Record<string, string> = {
  body: '本文図版',
  social: '投稿画像',
  ogp: 'OGP',
  card: 'リンクカード',
  background: '背景',
  material: '素材',
};
const sizeText = (size: { width: number; height: number }) =>
  `${size.width} × ${size.height}px`;

function ExamplePreview({
  example,
  label,
}: {
  example: TemplateExample;
  label: string;
}) {
  const [loadedSize, setLoadedSize] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const size =
    loadedSize ??
    exampleDimensions(example.image, example.state !== 'existing');
  const dimensions = size
    ? exampleDimensions(
        { ...example.image, width: size.width, height: size.height },
        false
      )
    : null;
  return (
    <div className="space-y-3">
      <StatusBadge
        tone={
          example.state === 'stale'
            ? 'warn'
            : example.state === 'approved'
              ? 'good'
              : example.state === 'candidate'
                ? 'info'
                : 'neutral'
        }
      >
        {labels[example.state]}
      </StatusBadge>
      <figure className="space-y-2">
        <div className="mx-auto w-full max-w-[320px] rounded-md border border-console-border bg-white">
          <ActualImage
            src={example.src}
            alt={label + 'の基本形の見本'}
            onDimensions={setLoadedSize}
            dimensions={dimensions}
          />
        </div>
        <figcaption className="space-y-1 text-sm">
          <p className="font-medium">
            {dimensions
              ? `${dimensions.ratio} · ${sizeText(dimensions)}`
              : '寸法未記録（読込後に表示）'}
          </p>
          <p className="text-console-muted">
            {usages[example.image.usage] ?? example.image.usage} ·{' '}
            {example.state === 'existing'
              ? example.image.format?.toUpperCase()
              : '候補画像'}
          </p>
          <p className="line-clamp-2" title={example.image.title}>
            {example.image.title || example.image.owner}
          </p>
        </figcaption>
      </figure>
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <a href={example.src} target="_blank" rel="noreferrer">
            原寸
          </a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href={'/ops/image-library?image=' + example.image.id}>
            比較・元データ・改善
          </Link>
        </Button>
      </div>
      {example.state === 'stale' && (
        <p className="text-sm text-console-muted">
          方針または入力の更新前の候補です。再確認が必要です。
        </p>
      )}
    </div>
  );
}

function MediumExamples({
  template,
  images,
  channel,
}: {
  template: EditableTemplate;
  images: ImageView[];
  channel: keyof typeof channels;
}) {
  const [ratio, setRatio] = useState('');
  const [selected, setSelected] = useState(0);
  const examples = channelExamples(images, channel, ratio);
  const ratios = channelRatios(images, channel);
  const index = Math.min(selected, Math.max(0, examples.length - 1));
  const example = examples[index];
  const label = `${template.label}・${channels[channel]}`;
  return (
    <section aria-label={label} className="min-w-0 space-y-3">
      <h3 className="font-semibold">{channels[channel]}</h3>
      <NativeSelect
        aria-label={label + 'の比率'}
        value={ratio}
        onChange={(e) => {
          setRatio(e.target.value);
          setSelected(0);
        }}
      >
        <option value="">すべての比率</option>
        {ratios.map((value) => (
          <option key={value} value={value}>
            {value}
          </option>
        ))}
      </NativeSelect>
      {example ? (
        <>
          <ExamplePreview key={example.src} example={example} label={label} />
          {examples.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                aria-label={label + 'の前の見本'}
                onClick={() => setSelected(index - 1)}
              >
                前
              </Button>
              <span className="text-sm">
                {index + 1} / {examples.length}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={index >= examples.length - 1}
                aria-label={label + 'の次の見本'}
                onClick={() => setSelected(index + 1)}
              >
                次
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="space-y-2 rounded-md border border-dashed border-console-border p-6 text-sm text-console-muted">
          <p className="font-medium">
            {ratio ? 'この比率の見本は未登録' : '媒体別の見本は未登録'}
          </p>
          <p>
            {template.id === 'unclassified'
              ? '用途と内容を確認して型を割り当てます。'
              : 'この媒体に合わせた候補を登録して比較します。'}
          </p>
        </div>
      )}
      <p className="text-sm text-console-muted">
        {template.profiles[channel] ?? '使用先で可読性を確認する。'}
      </p>
    </section>
  );
}

function MediaSizes() {
  return (
    <details className="space-y-3 text-sm">
      <summary className="cursor-pointer font-medium">
        用途と制作サイズの目安
      </summary>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <p className="font-semibold">note</p>
          <p>
            本文：元の比率を保持。今回の縦長試作は2:3（640 × 960、出力は2倍）。
          </p>
          <p>正方形：{sizeText(CANVAS.square)}</p>
          <p>カバー：{sizeText(CANVAS.noteCover)}</p>
        </div>
        <div>
          <p className="font-semibold">X</p>
          <p>縦長：4:5 · {sizeText(CANVAS.carousel)}</p>
          <p>正方形：1:1 · {sizeText(CANVAS.square)}</p>
          <p>横長：16:9 · {sizeText(CANVAS.xPost)}</p>
          <p>散布図・比較の既存出力：{sizeText(CANVAS.ogp)}</p>
        </div>
        <div>
          <p className="font-semibold">Instagram</p>
          <p>フィード：4:5 · {sizeText(CANVAS.carousel)}</p>
          <p>正方形：1:1 · {sizeText(CANVAS.square)}</p>
          <p>リール：9:16 · {sizeText(CANVAS.portrait)}</p>
        </div>
      </div>
      <p className="text-console-muted">
        プロジェクトの制作プリセットです。各画像には実寸を表示し、選択した比率で絞り込みます。寸法未記録の画像は「すべての比率」で表示します。画像の引き伸ばしやトリミングは行いません。カバーは専用の制作画面で確認します。
      </p>
    </details>
  );
}

function TemplateCard({
  template,
  images,
  count,
  onSave,
}: {
  template: EditableTemplate;
  images: ImageView[];
  count: number;
  onSave: Save;
}) {
  const [policy, setPolicy] = useState(template.policy);
  const [profiles, setProfiles] = useState(template.profiles);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const changed =
    policy !== template.policy ||
    JSON.stringify(profiles) !== JSON.stringify(template.profiles);
  return (
    <PanelCard
      title={template.label}
      description={'方針 v' + template.version + ' · 使用箇所 ' + count + '件'}
    >
      <div className="space-y-4">
        <div className="grid items-start gap-6 md:grid-cols-3">
          {MEDIA_CHANNELS.map((channel) => (
            <MediumExamples
              key={channel}
              template={template}
              images={images}
              channel={channel}
            />
          ))}
        </div>
        {channelExamples(images, 'web').length > 0 && (
          <details
            className="space-y-3 border-t border-console-border pt-4"
            open={
              !MEDIA_CHANNELS.some(
                (channel) => channelExamples(images, channel).length
              )
            }
          >
            <summary className="cursor-pointer text-sm font-medium">
              Web・ブログの参考見本（媒体別の完成形とは別）
            </summary>
            <div className="max-w-sm">
              <MediumExamples
                template={template}
                images={images}
                channel="web"
              />
            </div>
          </details>
        )}
        <Button asChild variant="outline" size="sm">
          <Link href={'/ops/image-library?template=' + template.id}>
            この型の全画像 · {count}件
          </Link>
        </Button>
        <p className="text-sm">{template.policy}</p>
        <details className="space-y-3">
          <summary className="cursor-pointer text-sm font-medium">
            共通方針・媒体別の調整を編集
          </summary>
          <Textarea
            aria-label={template.label + 'の共通方針'}
            rows={4}
            value={policy}
            onChange={(e) => setPolicy(e.target.value)}
          />
          {(['note', 'x', 'instagram', 'web'] as const).map((channel) => (
            <label key={channel} className="block space-y-1 text-sm">
              <span>{channels[channel]}</span>
              <Textarea
                rows={2}
                value={
                  profiles[channel] ?? '使用ページの幅と表示テーマで確認する。'
                }
                onChange={(e) =>
                  setProfiles({ ...profiles, [channel]: e.target.value })
                }
              />
            </label>
          ))}
          <p className="text-sm text-console-muted">
            保存すると版が上がり、この型の候補は再確認が必要になります。
          </p>
          <Button
            disabled={busy || !changed}
            onClick={async () => {
              setBusy(true);
              try {
                await onSave(template, policy, profiles);
                setMessage('方針を更新しました。');
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
              }
            }}
          >
            新しい版として保存
          </Button>
          <p role="status" className="text-sm">
            {message}
          </p>
        </details>
      </div>
    </PanelCard>
  );
}

export function TemplateGallery({
  templates,
  images,
  onSave,
}: {
  templates: EditableTemplate[];
  images: ImageView[];
  onSave: Save;
}) {
  const [query, setQuery] = useState('');
  const [onlyCandidates, setOnlyCandidates] = useState(false);
  const [coverage, setCoverage] = useState('all');
  const groups = useMemo(() => {
    const byType = new Map<string, ImageView[]>();
    for (const image of images) {
      const group = byType.get(image.templateId) ?? [];
      group.push(image);
      byType.set(image.templateId, group);
    }
    return templates
      .map((template) => {
        const group = byType.get(template.id) ?? [];
        const examples = [...MEDIA_CHANNELS, 'web'].flatMap((channel) =>
          channelExamples(group, channel)
        );
        return {
          template,
          examples,
          images: group,
          count: group.length,
          mediaCount: MEDIA_CHANNELS.filter(
            (channel) => channelExamples(group, channel).length > 0
          ).length,
          hasCandidate: examples.some((e) => e.state !== 'existing'),
        };
      })
      .sort((a, b) => Number(b.hasCandidate) - Number(a.hasCandidate));
  }, [templates, images]);
  const shown = groups.filter(
    (g) =>
      (!onlyCandidates || g.hasCandidate) &&
      (coverage === 'all' ||
        (coverage === 'complete'
          ? g.mediaCount === MEDIA_CHANNELS.length
          : g.mediaCount < MEDIA_CHANNELS.length)) &&
      (g.template.label + ' ' + g.template.id)
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  return (
    <section className="space-y-4" aria-label="型の基本形を確認">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          note・X・Instagramの基本形を見比べる
        </h2>
        <p className="text-sm text-console-muted">
          各型を媒体別に並べ、各欄に実画像を最大3枚表示します。試作候補を優先し、既存画像を参考として比較できます。題材は画像ごとに異なります。見本の表示は採用や公開を意味しません。
        </p>
        <p className="text-sm">
          {templates.length}型 · 見本あり{' '}
          {groups.filter((g) => g.examples.length).length}型 ·
          3媒体の見本登録あり{' '}
          {groups.filter((g) => g.mediaCount === MEDIA_CHANNELS.length).length}
          型 · 試作・採用候補あり {groups.filter((g) => g.hasCandidate).length}
          型
        </p>
      </div>
      <MediaSizes />
      <div className="flex flex-wrap items-center gap-3">
        <NativeSelect
          aria-label="媒体別見本の充足状況"
          value={coverage}
          onChange={(e) => setCoverage(e.target.value)}
        >
          <option value="all">すべての型</option>
          <option value="complete">3媒体の見本登録あり</option>
          <option value="missing">媒体別見本が不足</option>
        </NativeSelect>
        <Input
          className="max-w-sm"
          aria-label="型を検索"
          placeholder="型名で検索（地図・散布図・OGPなど）"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={onlyCandidates}
            onChange={(e) => setOnlyCandidates(e.target.checked)}
          />
          試作・採用候補のある型だけ
        </label>
      </div>
      <div className="space-y-6">
        {shown.map((g) => (
          <TemplateCard
            key={g.template.id + ':' + g.template.version}
            {...g}
            onSave={onSave}
          />
        ))}
      </div>
      {!shown.length && (
        <p className="text-sm text-console-muted">該当する型はありません。</p>
      )}
    </section>
  );
}

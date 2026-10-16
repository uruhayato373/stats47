'use client';
import {
  IMAGE_PURPOSES,
  IMAGE_SELECTIONS,
} from '../../../../.claude/scripts/media/lib/taxonomy.mjs';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  mediaUrl,
  templateMedium,
  type TemplateMedium,
} from '@/lib/media-workspace-navigation';
import { MediaWorkspaceNav } from './media-workspace-nav';
import Link from 'next/link';
import type {
  ImageView,
  Template,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import {
  channelExamples,
  channelRatios,
  sampleCountKey,
  exampleDimensions,
  MEDIA_CHANNELS,
  type TemplateExample,
} from '@/lib/media-template-examples';
import { StatusBadge } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { CANVAS } from '../../../remotion/src/shared/themes/brand';
import { ActualImage } from './media-image';

type EditableTemplate = Template & { revision: string };
type TemplateListEntry = {
  template: EditableTemplate;
  available: (keyof typeof channels)[];
};

function TemplateList({
  entries,
  selected,
  drafts,
  onSelect,
}: {
  entries: TemplateListEntry[];
  selected?: string;
  drafts: Record<string, PolicyDraft>;
  onSelect: (id: string) => void;
}) {
  return (
    <nav aria-label="型の一覧">
      <ul className="space-y-2">
        {entries.map(({ template, available }) => (
          <li key={template.id}>
            <Button
              className="w-full justify-start"
              variant={template.id === selected ? 'default' : 'ghost'}
              size="sm"
              aria-pressed={template.id === selected}
              title={template.label}
              onClick={() => onSelect(template.id)}
            >
              <span className="truncate">{template.label}</span>
              {drafts[template.id] && <span aria-label="未保存">＊</span>}
            </Button>
            <p className="px-3 text-xs text-console-muted">
              {available.length
                ? available.map((channel) => channels[channel]).join(' / ')
                : '見本未登録'}
            </p>
          </li>
        ))}
      </ul>
      {!entries.length && (
        <p className="text-sm text-console-muted">該当する型はありません。</p>
      )}
    </nav>
  );
}
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
  cover: 'noteカバー',
  body: '本文図版',
  social: '投稿画像',
  ogp: 'OGP',
  card: 'リンクカード',
  background: '背景',
  material: '素材',
};
const sizeText = (size: { width: number; height: number }) =>
  `${size.width} × ${size.height}px`;

function updateView(patch: Record<string, string>) {
  const url = new URL(window.location.href);
  for (const [key, value] of Object.entries(patch)) {
    if (value) url.searchParams.set(key, value);
    else url.searchParams.delete(key);
  }
  window.history.replaceState(null, '', url);
}

type PolicyDraft = Pick<EditableTemplate, 'policy' | 'profiles' | 'revision'>;

function ExamplePreview({
  example,
  label,
  returnTo,
}: {
  returnTo: string;
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
      {example.image.classification?.status === 'suggested' && (
        <StatusBadge tone="warn">分類案・実画像で確認</StatusBadge>
      )}
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
          <p className="text-console-muted">
            {IMAGE_PURPOSES[example.image.classification.purpose]} ·{' '}
            {IMAGE_SELECTIONS[example.image.classification.selection]}
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
          <Link
            href={mediaUrl('images', {
              image: example.image.id,
              template: example.image.templateId,
              returnTo,
            })}
          >
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
  const params = useSearchParams();
  const ratios = channelRatios(images, channel);
  const requestedRatio = params.get('ratio-' + channel) ?? '';
  const ratio = ratios.includes(requestedRatio) ? requestedRatio : '';
  const examples = channelExamples(images, channel, ratio);
  const index = Math.max(
    0,
    examples.findIndex((e) => e.image.id === params.get('sample-' + channel))
  );
  const returnTo = mediaUrl('templates', Object.fromEntries(params));
  const example = examples[index];
  const label = `${template.label}・${channels[channel]}`;
  return (
    <section aria-label={label} className="min-w-0 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{channels[channel]}</h3>
        <NativeSelect
          aria-label={label + 'の比率'}
          value={ratio}
          onChange={(e) => {
            updateView({
              ['ratio-' + channel]: e.target.value,
              ['sample-' + channel]: '',
            });
          }}
        >
          <option value="">すべての比率</option>
          {ratios.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </NativeSelect>
      </div>
      {example ? (
        <>
          <ExamplePreview
            key={example.src}
            example={example}
            label={label}
            returnTo={returnTo}
          />
          {examples.length > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={index === 0}
                aria-label={label + 'の前の見本'}
                onClick={() =>
                  updateView({
                    ['sample-' + channel]: examples[index - 1].image.id,
                  })
                }
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
                onClick={() =>
                  updateView({
                    ['sample-' + channel]: examples[index + 1].image.id,
                  })
                }
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
  medium,
  draft,
  onDraft,
}: {
  template: EditableTemplate;
  images: ImageView[];
  count: number;
  onSave: Save;
  medium: TemplateMedium;
  draft?: PolicyDraft;
  onDraft: (draft: PolicyDraft | null) => void;
}) {
  const params = useSearchParams();
  const returnTo = mediaUrl('templates', Object.fromEntries(params));
  const { policy, profiles, revision } = draft ?? template;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const changed =
    policy !== template.policy ||
    JSON.stringify(profiles) !== JSON.stringify(template.profiles);
  function edit(patch: Partial<PolicyDraft>) {
    onDraft({ policy, profiles, revision, ...patch });
  }
  return (
    <section aria-label={template.label + 'の見本と方針'} className="space-y-4">
      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <h2 className="font-semibold">{template.label}</h2>
        <p className="text-sm text-console-muted">
          方針 v{template.version} · 使用箇所 {count}件
        </p>
      </div>
      <div className="space-y-4">
        <div
          className={
            medium === 'compare'
              ? 'grid items-start gap-6 @min-[600px]:grid-cols-3'
              : 'mx-auto w-full max-w-xl'
          }
        >
          {(medium === 'compare' ? MEDIA_CHANNELS : [medium]).map((channel) => (
            <MediumExamples
              key={channel}
              template={template}
              images={images}
              channel={channel}
            />
          ))}
        </div>
        <Button asChild variant="outline" size="sm">
          <Link
            href={mediaUrl('images', {
              template: template.id,
              purpose: params.get('purpose') ?? '',
              selection: params.get('selection') ?? '',
              returnTo,
            })}
          >
            この型の全画像 · {count}件
          </Link>
        </Button>
        <details className="space-y-2 text-sm">
          <summary className="cursor-pointer font-medium">
            この型の共通方針
          </summary>
          <p>{template.policy}</p>
        </details>
        {template.id === 'note-cover' ? (
          <Button asChild variant="outline">
            <Link href="/content/note/covers">
              カテゴリ別のカバー方針・制作台帳を開く
            </Link>
          </Button>
        ) : (
          <details className="space-y-3">
            <summary className="cursor-pointer text-sm font-medium">
              共通方針・媒体別の調整を編集{changed ? '（未保存）' : ''}
            </summary>
            <Textarea
              aria-label={template.label + 'の共通方針'}
              rows={4}
              value={policy}
              disabled={busy}
              onChange={(e) => edit({ policy: e.target.value })}
            />
            {(['note', 'x', 'instagram', 'web'] as const).map((channel) => (
              <label key={channel} className="block space-y-1 text-sm">
                <span>{channels[channel]}</span>
                <Textarea
                  disabled={busy}
                  rows={2}
                  value={
                    profiles[channel] ??
                    '使用ページの幅と表示テーマで確認する。'
                  }
                  onChange={(e) =>
                    edit({
                      profiles: { ...profiles, [channel]: e.target.value },
                    })
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
                  await onSave({ ...template, revision }, policy, profiles);
                  onDraft(null);
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
        )}
      </div>
    </section>
  );
}

export function TemplateGallery({
  templates,
  images,
  counts,
  onSave,
}: {
  templates: EditableTemplate[];
  images: ImageView[];
  counts: Record<string, number>;
  onSave: Save;
}) {
  const params = useSearchParams();
  const root = useRef<HTMLElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<string, PolicyDraft>>({});
  const [listOpen, setListOpen] = useState(false);
  const query = params.get('q') ?? '';
  const purpose = params.get('purpose') ?? '';
  const selection = params.get('selection') ?? '';
  const coverage = params.get('coverage') ?? 'all';
  const onlyCandidates = params.get('candidates') === '1';
  const dirtyCount = templates.filter((t) => {
    const draft = drafts[t.id];
    return (
      draft &&
      (draft.policy !== t.policy ||
        JSON.stringify(draft.profiles) !== JSON.stringify(t.profiles))
    );
  }).length;
  useEffect(() => {
    if (!root.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setWidth(entry.contentRect.width)
    );
    observer.observe(root.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!dirtyCount) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const warnNavigation = (event: MouseEvent) => {
      const link = (event.target as Element).closest('a');
      if (
        !link ||
        link.target === '_blank' ||
        link.getAttribute('aria-current') ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      if (
        !window.confirm(
          '未保存の方針があります。ページを移動すると変更が失われます。移動しますか？'
        )
      ) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    window.addEventListener('beforeunload', warn);
    document.addEventListener('click', warnNavigation, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', warnNavigation, true);
    };
  }, [dirtyCount]);
  const groups = useMemo(() => {
    const byType = new Map<string, ImageView[]>();
    for (const image of images) {
      if (
        (purpose && image.classification.purpose !== purpose) ||
        (selection && image.classification.selection !== selection)
      )
        continue;
      const group = byType.get(image.templateId) ?? [];
      group.push(image);
      byType.set(image.templateId, group);
    }
    return templates
      .filter((template) => template.id !== 'unclassified')
      .map((template) => {
        const group = byType.get(template.id) ?? [];
        const available = [...MEDIA_CHANNELS, 'web' as const].filter(
          (channel) => channelExamples(group, channel).length > 0
        );
        return {
          template,
          images: group,
          count: counts[sampleCountKey(template.id, purpose, selection)] ?? 0,
          available,
          mediaCount: available.filter((channel) => channel !== 'web').length,
          hasCandidate: available.some((channel) =>
            channelExamples(group, channel).some((e) => e.state !== 'existing')
          ),
        };
      })
      .sort((a, b) => Number(b.hasCandidate) - Number(a.hasCandidate));
  }, [templates, images, counts, purpose, selection]);
  const shown = groups.filter(
    (g) =>
      (!(purpose || selection) || g.count > 0) &&
      (!onlyCandidates || g.hasCandidate) &&
      (coverage === 'all' ||
        (coverage === 'complete'
          ? g.mediaCount === MEDIA_CHANNELS.length
          : g.mediaCount < MEDIA_CHANNELS.length)) &&
      (g.template.label + ' ' + g.template.id)
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  const index = Math.max(
    0,
    shown.findIndex((g) => g.template.id === params.get('template'))
  );
  const selected = shown[index];
  const medium =
    templateMedium(params.get('medium')) ??
    (width !== null && width >= 850 && selected?.mediaCount
      ? 'compare'
      : (selected?.available[0] ?? 'note'));
  useEffect(() => {
    if (!selected || width === null) return;
    if (
      params.get('template') !== selected.template.id ||
      !templateMedium(params.get('medium'))
    ) {
      updateView({ template: selected.template.id, medium });
    }
  }, [selected, medium, params, width]);
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0;
  }, [selected?.template.id, medium]);
  function choose(id: string) {
    updateView({
      template: id,
      'ratio-note': '',
      'ratio-x': '',
      'ratio-instagram': '',
      'ratio-web': '',
      'sample-note': '',
      'sample-x': '',
      'sample-instagram': '',
      'sample-web': '',
    });
  }
  return (
    <section
      ref={root}
      className="@container flex min-h-0 flex-1 flex-col gap-3"
      aria-label="型の基本形を確認"
    >
      <MediaWorkspaceNav active="templates" template={selected?.template.id} />
      <p className="shrink-0 text-sm text-console-muted">
        型は見た目、目的は伝える内容です。同じ型をnote・X・Instagramの比率で見比べます。
      </p>
      <div
        className="shrink-0 space-y-2 border-b border-console-border pb-3"
        aria-label="見本の切り替え"
      >
        <div className="flex items-end gap-2">
          <div className="@min-[760px]:hidden">
            <Sheet open={listOpen} onOpenChange={setListOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  型の一覧 ({shown.length})
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>型の一覧 ({shown.length})</SheetTitle>
                  <SheetDescription>
                    型を選ぶと、選択中の媒体で見本を表示します。
                  </SheetDescription>
                </SheetHeader>
                <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                  <TemplateList
                    entries={shown}
                    selected={selected?.template.id}
                    drafts={drafts}
                    onSelect={(id) => {
                      choose(id);
                      setListOpen(false);
                    }}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <label className="min-w-0 max-w-xl flex-1 space-y-1 text-sm [&>[data-slot=native-select-wrapper]]:w-full">
            <span className="font-medium">型を選択</span>
            <NativeSelect
              aria-label="型を選択"
              value={selected?.template.id ?? ''}
              onChange={(e) => choose(e.target.value)}
              disabled={!shown.length}
            >
              {!shown.length && (
                <option value="">該当する型はありません</option>
              )}
              {shown.map((g) => (
                <option key={g.template.id} value={g.template.id}>
                  {g.template.label}
                  {drafts[g.template.id] ? ' · 編集中' : ''}
                </option>
              ))}
            </NativeSelect>
          </label>
          <Button
            variant="outline"
            size="sm"
            aria-label="前の型"
            disabled={!selected || index === 0}
            onClick={() => choose(shown[index - 1].template.id)}
          >
            前
          </Button>
          <Button
            variant="outline"
            size="sm"
            aria-label="次の型"
            disabled={!selected || index >= shown.length - 1}
            onClick={() => choose(shown[index + 1].template.id)}
          >
            次
          </Button>
        </div>
        <div
          role="group"
          aria-label="見本の媒体"
          className="flex flex-wrap gap-2"
        >
          {([...MEDIA_CHANNELS, 'web', 'compare'] as const).map((channel) => (
            <Button
              key={channel}
              size="sm"
              variant={medium === channel ? 'default' : 'outline'}
              aria-pressed={medium === channel}
              onClick={() => updateView({ medium: channel })}
            >
              {channel === 'compare' ? '3媒体を比較' : channels[channel]}
            </Button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <NativeSelect
            aria-label="見本の目的"
            value={purpose}
            onChange={(e) => updateView({ purpose: e.target.value })}
          >
            <option value="">すべての目的</option>
            {Object.entries(IMAGE_PURPOSES).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </NativeSelect>
          <NativeSelect
            aria-label="見本の構成"
            value={selection}
            onChange={(e) => updateView({ selection: e.target.value })}
          >
            <option value="">すべての構成</option>
            {Object.entries(IMAGE_SELECTIONS).map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </NativeSelect>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-console-muted">
          <span>
            {shown.length ? index + 1 : 0} / {shown.length}型 · 見本のある媒体{' '}
            {selected?.available.length ?? 0}/4
          </span>
          {dirtyCount > 0 && (
            <StatusBadge tone="warn">未保存の方針 {dirtyCount}件</StatusBadge>
          )}
          <details>
            <summary className="cursor-pointer">型を絞り込む</summary>
            <div className="flex flex-wrap items-center gap-2 py-2">
              <Input
                className="max-w-xs"
                aria-label="型を検索"
                placeholder="地図・散布図・OGPなど"
                value={query}
                onChange={(e) => updateView({ q: e.target.value })}
              />
              <NativeSelect
                aria-label="媒体別見本の充足状況"
                value={coverage}
                onChange={(e) => updateView({ coverage: e.target.value })}
              >
                <option value="all">すべての型</option>
                <option value="complete">3媒体の見本登録あり</option>
                <option value="missing">媒体別見本が不足</option>
              </NativeSelect>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={onlyCandidates}
                  onChange={(e) =>
                    updateView({ candidates: e.target.checked ? '1' : '' })
                  }
                />
                試作・採用候補あり
              </label>
            </div>
          </details>
        </div>
      </div>
      <div className="grid min-h-0 flex-1 gap-4 @min-[760px]:grid-cols-[216px_minmax(0,1fr)]">
        <aside
          className="hidden min-h-0 flex-col gap-3 border-r border-console-border pr-3 @min-[760px]:flex"
          aria-label="型を一覧から選ぶ"
        >
          <h2 className="shrink-0 font-semibold">型の一覧 ({shown.length})</h2>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            <TemplateList
              entries={shown}
              selected={selected?.template.id}
              drafts={drafts}
              onSelect={choose}
            />
          </div>
        </aside>
        <div
          ref={content}
          className="@container min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-1 pb-4"
          role="region"
          aria-label="選択した型の見本"
          tabIndex={0}
        >
          {selected ? (
            <TemplateCard
              key={selected.template.id}
              {...selected}
              medium={medium}
              onSave={onSave}
              draft={drafts[selected.template.id]}
              onDraft={(draft) =>
                setDrafts((current) => {
                  const next = { ...current };
                  if (
                    draft &&
                    (draft.policy !== selected.template.policy ||
                      JSON.stringify(draft.profiles) !==
                        JSON.stringify(selected.template.profiles))
                  ) {
                    next[selected.template.id] = draft;
                  } else delete next[selected.template.id];
                  return next;
                })
              }
            />
          ) : (
            <p className="text-sm text-console-muted">
              該当する型はありません。絞り込み条件を変更してください。
            </p>
          )}
          <MediaSizes />
          <p className="text-sm text-console-muted">
            実画像を各媒体・比率で最大3枚表示します。題材は画像ごとに異なり、見本の表示は採用・公開を意味しません。未登録の媒体はそのまま表示します。
          </p>
        </div>
      </div>
    </section>
  );
}

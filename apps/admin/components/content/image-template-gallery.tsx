'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Template } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { IMAGE_PURPOSES } from '../../../../.claude/scripts/media/lib/taxonomy.mjs';
import { CHART_IMAGE_COPY_POLICY } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import {
  basicTemplateQuery,
  templateCatalog,
  templateGroup,
  TEMPLATE_GROUPS,
  type StatisticalSampleView,
} from '@/lib/image-template-basics';
import { mediaUrl } from '@/lib/media-workspace-navigation';
import { TEMPLATE_CHANNELS } from '@/lib/media-template-examples';
import { MediaWorkspaceNav } from './media-workspace-nav';
import { ImageTemplateTree } from './image-template-tree';
import { TemplateStatisticalPreview } from './template-statistical-preview';
import { PanelCard, StatusBadge } from '@/components/admin-ui';
import { Button, buttonVariants, Input, Textarea, Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@stats47/components';

type EditableTemplate = Template & { revision: string };
type PolicyDraft = Pick<EditableTemplate, 'policy' | 'profiles' | 'revision'>;
type Save = (
  template: EditableTemplate,
  policy: string,
  profiles: Template['profiles']
) => Promise<void>;
const channels = {
  note: 'note',
  web: 'サイト',
  x: 'X',
  instagram: 'Instagram',
};
function updateView(values: Record<string, string>) {
  const url = new URL(window.location.href);
  url.search = new URLSearchParams(values).toString();
  window.history.replaceState(null, '', url);
}
/** Purposes offered as filters: only those some statistical form declares. */
const FILTER_PURPOSES = ['ranking', 'comparison', 'trend', 'composition', 'relationship', 'distribution'] as const;
function MapVariants({ template }: { template: EditableTemplate }) {
  if (!template.variants?.length) return null;
  return (
    <PanelCard title="描き分け" description="同じ型の中の重ね方・出し方。バズ地図の型はこの描き分けに当たる。">
      <ul className="divide-y divide-border text-sm">
        {template.variants.map((variant) => (
          <li key={variant.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2">
            <span className="min-w-40 font-medium">{variant.label}</span>
            <StatusBadge tone={variant.status === 'ready' ? 'good' : 'neutral'}>{variant.status === 'ready' ? '描画あり' : '未実装'}</StatusBadge>
            {!!variant.buzzMapTypes?.length && (
              <span className="text-muted-foreground">バズ地図 {variant.buzzMapTypes.map((type) => (type === 'flow' ? 'flow' : '型' + type)).join('・')}</span>
            )}
          </li>
        ))}
      </ul>
      <Link href="/buzz-map" className={buttonVariants({ variant: 'ghost', size: 'sm' })}>バズ地図の候補を見る</Link>
    </PanelCard>
  );
}
function TemplateCard({
  template,
  purpose,
  draft,
  onDraft,
  onSave,
  samples,
}: {
  template: EditableTemplate;
  purpose?: string;
  draft?: PolicyDraft;
  onDraft: (draft: PolicyDraft | null) => void;
  onSave: Save;
  samples: StatisticalSampleView[];
}) {
  const { policy, profiles, revision } = draft ?? template;
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const changed =
    policy !== template.policy ||
    JSON.stringify(profiles) !== JSON.stringify(template.profiles);
  const edit = (patch: Partial<PolicyDraft>) =>
    onDraft({ policy, profiles, revision, ...patch });
  const returnTo = mediaUrl('templates', { template: template.id, ...(purpose ? { purpose } : {}) });
  const group = templateGroup(template);
  const isChart = group !== 'asset';
  return (
    <section aria-label="共通の基本形" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">{template.label}</h2>
          <p className="text-sm text-muted-foreground">
            {TEMPLATE_GROUPS.find((g) => g.id === group)?.label}
            {template.purposes?.length ? ' · 用途：' + template.purposes.map((p) => IMAGE_PURPOSES[p as keyof typeof IMAGE_PURPOSES]).join('・') : ''}
          </p>
        </div>
        {isChart && <StatusBadge tone="neutral">基本形を検討中</StatusBadge>}
      </div>
      {isChart ? (
        <TemplateStatisticalPreview samples={samples} />
      ) : (
        <p className="text-sm text-muted-foreground">統計図ではないため、型の見本はありません。実物は「この型の使用先」で確認します。</p>
      )}
      <MapVariants template={template} />
      <PanelCard title="共通ルール">
        <p className="text-sm">{policy}</p>
        {isChart && <p className="text-sm">{CHART_IMAGE_COPY_POLICY}</p>}
      </PanelCard>
      <div className="flex flex-wrap gap-2">
        <Sheet>
          <SheetTrigger render={<Button variant="outline" size="sm" />}>
              型の方針を編集{changed ? '（未保存）' : ''}
            </SheetTrigger>
          <SheetContent className="overflow-y-auto sm:max-w-xl">
            <SheetHeader>
              <SheetTitle>{template.label}の方針を編集</SheetTitle>
              <SheetDescription>
                共通ルールと、必要な媒体別の調整を記録します。
              </SheetDescription>
            </SheetHeader>
            <div className="space-y-3 px-4 pb-4">
              <label className="block space-y-1 text-sm">
                <span>共通方針</span>
                <Textarea
                  aria-label={template.label + 'の共通方針'}
                  rows={4}
                  value={policy}
                  disabled={busy}
                  onChange={(e) => edit({ policy: e.target.value })}
                />
              </label>
              {TEMPLATE_CHANNELS.map((channel) => (
                <label key={channel} className="block space-y-1 text-sm">
                  <span>{channels[channel]}の調整・試作メモ</span>
                  <Textarea
                    disabled={busy}
                    rows={2}
                    value={profiles[channel] ?? ''}
                    onChange={(e) =>
                      edit({
                        profiles: { ...profiles, [channel]: e.target.value },
                      })
                    }
                  />
                </label>
              ))}
              <p className="text-sm text-muted-foreground">
                保存すると版が上がり、この型の候補は再確認が必要になります。
              </p>
              <Button
                disabled={busy || !changed}
                onClick={async () => {
                  setBusy(true);
                  setMessage('');
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
            </div>
          </SheetContent>
        </Sheet>
        <Link href={mediaUrl('images', {
              template: template.id,
              ...(purpose ? { purpose } : {}),
              returnTo,
            })} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            この型の使用先
          </Link>
      </div>
    </section>
  );
}
export function TemplateGallery({
  templates,
  onSave,
  samples,
}: {
  templates: EditableTemplate[];
  onSave: Save;
  samples: StatisticalSampleView[];
}) {
  const params = useSearchParams();
  const content = useRef<HTMLDivElement>(null);
  const [drafts, setDrafts] = useState<Record<string, PolicyDraft>>({});
  const [listOpen, setListOpen] = useState(false);
  const query = params.get('q') ?? '';
  const purpose = params.get('purpose') ?? '';
  const dirty = new Set(Object.keys(drafts));
  const shown = useMemo(
    () => templateCatalog(templates, purpose || undefined).filter((template) => template.label.includes(query)),
    [templates, purpose, query]
  );
  const selected = shown.find((template) => template.id === params.get('template')) ?? shown[0];
  useEffect(() => {
    if (!selected) return;
    const values = basicTemplateQuery(Object.fromEntries(params));
    values.template = selected.id;
    if (new URLSearchParams(values).toString() !== params.toString())
      updateView(values);
  }, [params, selected]);
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0;
  }, [selected?.id]);
  useEffect(() => {
    if (!dirty.size) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    const navigate = (event: MouseEvent) => {
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
    document.addEventListener('click', navigate, true);
    return () => {
      window.removeEventListener('beforeunload', warn);
      document.removeEventListener('click', navigate, true);
    };
  }, [dirty.size]);
  const view = (patch: Record<string, string>) => {
    const values = { ...basicTemplateQuery(Object.fromEntries(params)), ...patch };
    updateView(Object.fromEntries(Object.entries(values).filter(([, v]) => v)));
  };
  const tree = (
    <ImageTemplateTree
      templates={shown}
      selected={selected?.id}
      dirty={dirty}
      onSelect={(template) => {
        view({ template: template.id });
        setListOpen(false);
      }}
    />
  );
  return (
    <section
      aria-label="型の基本形を確認"
      className="@container flex min-h-0 flex-1 flex-col gap-3"
    >
      <MediaWorkspaceNav active="templates" template={selected?.id} />
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border pb-3">
        <div className="@min-[760px]:hidden">
          <Sheet open={listOpen} onOpenChange={setListOpen}>
            <SheetTrigger render={<Button variant="outline" size="sm" />}>
                図の型を選ぶ
              </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>図の型</SheetTitle>
                <SheetDescription>図の形を選びます。用途は上の絞り込みで選びます。</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                {tree}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <Input
          aria-label="図の型を検索"
          placeholder="図の型を検索"
          className="max-w-48"
          value={query}
          onChange={(e) => view({ q: e.target.value })}
        />
        <div role="group" aria-label="用途で絞る" className="flex flex-wrap gap-1">
          {['', ...FILTER_PURPOSES].map((id) => (
            <Button
              key={id || 'all'}
              size="sm"
              variant={purpose === id ? 'secondary' : 'ghost'}
              aria-pressed={purpose === id}
              onClick={() => view({ purpose: id })}
            >
              {id ? IMAGE_PURPOSES[id as keyof typeof IMAGE_PURPOSES] : 'すべての用途'}
            </Button>
          ))}
        </div>
        {dirty.size > 0 && (
          <StatusBadge tone="warn">未保存の方針 {dirty.size}件</StatusBadge>
        )}
      </div>
      <div className="grid min-h-0 flex-1 gap-4 @min-[760px]:grid-cols-[216px_minmax(0,1fr)]">
        <aside
          className="hidden min-h-0 flex-col gap-3 border-r border-border pr-3 @min-[760px]:flex"
          aria-label="図の型を一覧から選ぶ"
        >
          <h2 className="shrink-0 font-semibold">図の型</h2>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {tree}
          </div>
        </aside>
        <div
          ref={content}
          className="min-h-0 space-y-4 overflow-y-auto overscroll-contain pr-1 pb-4"
          role="region"
          aria-label="選択した型の基本形"
          tabIndex={0}
        >
          {selected ? (
            <TemplateCard
              key={selected.id}
              template={selected}
              purpose={purpose || undefined}
              samples={samples.filter(
                (sample) =>
                  sample.templateId === selected.id &&
                  (!purpose || sample.purpose === purpose)
              )}
              draft={drafts[selected.id]}
              onSave={onSave}
              onDraft={(draft) =>
                setDrafts((current) => {
                  const next = { ...current };
                  if (
                    draft &&
                    (draft.policy !== selected.policy ||
                      JSON.stringify(draft.profiles) !==
                        JSON.stringify(selected.profiles))
                  )
                    next[selected.id] = draft;
                  else delete next[selected.id];
                  return next;
                })
              }
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              該当する型はありません。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

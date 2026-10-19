'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import type { Template } from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { IMAGE_PURPOSES } from '../../../../.claude/scripts/media/lib/taxonomy.mjs';
import { CHART_IMAGE_COPY_POLICY } from '../../../../.claude/scripts/media/lib/image-copy.mjs';
import {
  basicTemplateBranches,
  basicTemplateQuery,
  type StatisticalSampleView,
} from '@/lib/image-template-basics';
import { mediaUrl } from '@/lib/media-workspace-navigation';
import { TEMPLATE_CHANNELS } from '@/lib/media-template-examples';
import { MediaWorkspaceNav } from './media-workspace-nav';
import { ImageTemplateTree, type GalleryBranch } from './image-template-tree';
import { TemplateStatisticalPreview } from './template-statistical-preview';
import { PanelCard, StatusBadge } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

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
function TemplateCard({
  template,
  purpose,
  draft,
  onDraft,
  onSave,
  samples,
}: {
  template: EditableTemplate;
  purpose: string;
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
  const returnTo = mediaUrl('templates', { template: template.id, purpose });
  return (
    <section aria-label="共通の基本形" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          {IMAGE_PURPOSES[purpose]} / {template.label}
        </h2>
        <StatusBadge tone="neutral">基本形を検討中</StatusBadge>
      </div>
      <TemplateStatisticalPreview samples={samples} />
      <PanelCard title="共通ルール">
        <p className="text-sm">{policy}</p>
        <p className="text-sm">{CHART_IMAGE_COPY_POLICY}</p>
      </PanelCard>
      <div className="flex flex-wrap gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="sm">
              型の方針を編集{changed ? '（未保存）' : ''}
            </Button>
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
              <p className="text-sm text-console-muted">
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
        <Button asChild variant="ghost" size="sm">
          <Link
            href={mediaUrl('images', {
              template: template.id,
              purpose,
              returnTo,
            })}
          >
            この型の使用先
          </Link>
        </Button>
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
  const dirty = new Set(Object.keys(drafts));
  const branches = useMemo(() => basicTemplateBranches(templates), [templates]);
  const shown = branches.filter((branch) =>
    [IMAGE_PURPOSES[branch.purpose], branch.template.label]
      .join(' ')
      .includes(query)
  );
  const selected =
    shown.find(
      (branch) =>
        branch.templateId === params.get('template') &&
        (!params.get('purpose') || branch.purpose === params.get('purpose'))
    ) ??
    shown.find((branch) => branch.purpose === params.get('purpose')) ??
    shown[0];
  useEffect(() => {
    if (!selected) return;
    const values = basicTemplateQuery(Object.fromEntries(params));
    values.template = selected.templateId;
    values.purpose = selected.purpose;
    if (new URLSearchParams(values).toString() !== params.toString())
      updateView(values);
  }, [params, selected]);
  useEffect(() => {
    if (content.current) content.current.scrollTop = 0;
  }, [selected?.key]);
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
  const choose = (branch: GalleryBranch) => {
    updateView({
      template: branch.templateId,
      purpose: branch.purpose,
      ...(query ? { q: query } : {}),
    });
    setListOpen(false);
  };
  const tree = (
    <ImageTemplateTree
      branches={shown}
      selected={selected?.key}
      dirty={dirty}
      onSelect={choose}
    />
  );
  return (
    <section
      aria-label="型の基本形を確認"
      className="@container flex min-h-0 flex-1 flex-col gap-3"
    >
      <MediaWorkspaceNav active="templates" template={selected?.templateId} />
      <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-console-border pb-3">
        <div className="@min-[760px]:hidden">
          <Sheet open={listOpen} onOpenChange={setListOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                型分類を選ぶ
              </Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>型分類</SheetTitle>
                <SheetDescription>目的と図の形を選びます。</SheetDescription>
              </SheetHeader>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
                {tree}
              </div>
            </SheetContent>
          </Sheet>
        </div>
        <Input
          aria-label="型分類を検索"
          placeholder="型分類を検索"
          className="max-w-xs"
          value={query}
          onChange={(e) =>
            updateView({
              ...basicTemplateQuery(Object.fromEntries(params)),
              q: e.target.value,
            })
          }
        />
        {dirty.size > 0 && (
          <StatusBadge tone="warn">未保存の方針 {dirty.size}件</StatusBadge>
        )}
      </div>
      <div className="grid min-h-0 flex-1 gap-4 @min-[760px]:grid-cols-[216px_minmax(0,1fr)]">
        <aside
          className="hidden min-h-0 flex-col gap-3 border-r border-console-border pr-3 @min-[760px]:flex"
          aria-label="型分類を一覧から選ぶ"
        >
          <h2 className="shrink-0 font-semibold">型分類</h2>
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
              key={selected.templateId}
              template={selected.template}
              purpose={selected.purpose}
              samples={samples.filter(
                (sample) =>
                  sample.templateId === selected.templateId &&
                  sample.purpose === selected.purpose
              )}
              draft={drafts[selected.templateId]}
              onSave={onSave}
              onDraft={(draft) =>
                setDrafts((current) => {
                  const next = { ...current };
                  if (
                    draft &&
                    (draft.policy !== selected.template.policy ||
                      JSON.stringify(draft.profiles) !==
                        JSON.stringify(selected.template.profiles))
                  )
                    next[selected.templateId] = draft;
                  else delete next[selected.templateId];
                  return next;
                })
              }
            />
          ) : (
            <p className="text-sm text-console-muted">
              該当する分類はありません。
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

'use client';
import { useMemo, useState } from 'react';
import Link from 'next/link';
import type {
  ImageView,
  Template,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import {
  templateExamples,
  type TemplateExample,
} from '@/lib/media-template-examples';
import { PanelCard, StatusBadge } from '@/components/admin-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

function TemplateCard({
  template,
  examples,
  count,
  onSave,
}: {
  template: EditableTemplate;
  examples: TemplateExample[];
  count: number;
  onSave: Save;
}) {
  const [selected, setSelected] = useState(0);
  const [policy, setPolicy] = useState(template.policy);
  const [profiles, setProfiles] = useState(template.profiles);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const example = examples[selected] ?? examples[0];
  const changed =
    policy !== template.policy ||
    JSON.stringify(profiles) !== JSON.stringify(template.profiles);
  return (
    <PanelCard
      title={template.label}
      description={'方針 v' + template.version + ' · 使用箇所 ' + count + '件'}
    >
      <div className="space-y-4">
        {example ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
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
              {examples.length > 1 && (
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selected === 0}
                    aria-label={template.label + 'の前の見本'}
                    onClick={() => setSelected(selected - 1)}
                  >
                    前
                  </Button>
                  <span className="text-sm">
                    {selected + 1} / {examples.length}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={selected >= examples.length - 1}
                    aria-label={template.label + 'の次の見本'}
                    onClick={() => setSelected(selected + 1)}
                  >
                    次
                  </Button>
                </div>
              )}
            </div>
            <figure className="space-y-2">
              <div className="mx-auto w-full max-w-[320px] rounded-md border border-console-border bg-white">
                <ActualImage
                  key={example.src}
                  src={example.src}
                  alt={template.label + 'の基本形の見本'}
                />
              </div>
              <figcaption className="space-y-1 text-sm">
                <p className="text-console-muted">
                  表示幅は最大320px ·{' '}
                  {channels[example.image.channel as keyof typeof channels] ??
                    example.image.channel}
                </p>
                <p className="line-clamp-2">{example.image.title}</p>
              </figcaption>
            </figure>
            <div className="flex flex-wrap gap-2">
              <Button asChild variant="outline" size="sm">
                <a href={example.src} target="_blank" rel="noreferrer">
                  原寸を見る
                </a>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={'/ops/image-library?image=' + example.image.id}>
                  比較・元データ・改善
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={'/ops/image-library?template=' + template.id}>
                  この型の全画像
                </Link>
              </Button>
            </div>
            {example.state === 'stale' && (
              <p className="text-sm text-console-muted">
                方針または入力の更新前に作った候補です。比較画面で再確認してください。
              </p>
            )}
          </>
        ) : (
          <p className="py-8 text-sm text-console-muted">
            {template.id === 'unclassified'
              ? '未分類は基本形を決めず、画像の用途と内容を確認して型を割り当てます。'
              : '見本はまだありません。この型の画像を分類・登録してから確認します。'}
          </p>
        )}
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
        const examples = templateExamples(group);
        return {
          template,
          examples,
          count: group.length,
          hasCandidate: examples.some((e) => e.state !== 'existing'),
        };
      })
      .sort((a, b) => Number(b.hasCandidate) - Number(a.hasCandidate));
  }, [templates, images]);
  const shown = groups.filter(
    (g) =>
      (!onlyCandidates || g.hasCandidate) &&
      (g.template.label + ' ' + g.template.id)
        .toLowerCase()
        .includes(query.toLowerCase())
  );
  return (
    <section className="space-y-4" aria-label="型の基本形を確認">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">
          基本形の見本を見て、型の方針を決める
        </h2>
        <p className="text-sm text-console-muted">
          見本は実画像から最大3枚ずつ表示します。試作候補を優先し、次に既存画像を表示します。見本の表示だけでは型の確定や記事への反映は行いません。
        </p>
        <p className="text-sm">
          {templates.length}型 · 見本あり{' '}
          {groups.filter((g) => g.examples.length).length}型 ·
          試作・採用候補あり {groups.filter((g) => g.hasCandidate).length}型
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
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
      <div className="grid items-start gap-4 lg:grid-cols-2">
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

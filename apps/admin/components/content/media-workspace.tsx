'use client';
import {
  IMAGE_PURPOSES,
  IMAGE_SELECTIONS,
  selectionAllowed,
} from '../../../../.claude/scripts/media/lib/taxonomy.mjs';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { ActualImage } from './media-image';
import { MediaWorkspaceNav } from './media-workspace-nav';
import { ImageAssessment } from './image-assessment';
import { ImageComparison } from './image-comparison';
import { originalUrl, candidateUrl } from '@/lib/media-template-examples';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IMAGE_USES } from '../../../../.claude/scripts/media/lib/catalog.mjs';
import {
  IMAGE_ROLES,
  CLASSIFICATION_STATES,
  IMAGE_QUEUES,
  roleForTemplate,
} from '../../../../.claude/scripts/media/lib/classification.mjs';
import {
  PanelCard,
  StatusBadge,
  StatCard,
  TableFrame,
} from '@/components/admin-ui';
import { Section } from '@/components/layout-primitives';
import { Button, buttonVariants, Input, Textarea, NativeSelect, Collapsible, CollapsibleContent, CollapsibleTrigger } from '@stats47/components';
import type {
  ImageView,
  ItemView,
  Review,
  CheckName,
  CheckState,
  Template,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';

export interface WorkspaceData {
  items: ItemView[];
  images: ImageView[];
  templates: (Template & { revision: string })[];
  inventoryUpdatedAt: string | null;
  classificationSummary?: {
    version: number;
    total: number;
    states: Record<string, number>;
    tasks: Record<string, number>;
  };
  inventoryGaps?: { owner: string; reason: string }[];
  webInventoryUpdatedAt?: string | null;
  coverage?: {
    collection: string;
    images: number;
    verified: number;
    missing: number;
    unverified: number;
  }[];
  migration?: { observedAt: string; counts: Record<string, number> } | null;
}
const CHECK_LABELS: Record<CheckName, string> = {
  data: 'データ・出典の一致',
  images: '画像の読みやすさ',
  placement: '画像の配置',
  intro: '導入・読者への説明',
  sources: '出典の表示',
  links: 'リンク・関連記事・マガジン',
};
const STATE_LABELS: Record<string, string> = {
  unchecked: '未確認',
  partial: '確認途中',
  issue: '要改善',
  checked: '確認済み',
  stale: '変更あり・再確認',
};
const CHANNELS: Record<string, string> = {
  web: 'Web・ブログ',
  note: 'note',
  x: 'X',
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};
const PAGE_SIZE = 36;
async function requestJson(url: string, method: string, body: unknown) {
  const res = await fetch(url, {
    method,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const value = await res.json();
  if (!res.ok) throw new Error(value.error ?? '保存できませんでした。');
  return value;
}
function ArticleEditor({
  item,
  images,
  onSaved,
  onImage,
  onDirty,
}: {
  item: ItemView;
  images: ImageView[];
  onSaved: (data: WorkspaceData) => void;
  onImage: (id: string) => void;
  onDirty: (value: boolean) => void;
}) {
  const [review, setReview] = useState<Review>({
    priority: item.review.priority,
    policy: item.review.policy,
    checks: { ...item.review.checks },
    imageInventory: item.review.imageInventory ?? 'unverified',
    inventoryReason: item.review.inventoryReason ?? '',
  });
  const [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false),
    [body, setBody] = useState<{
      body: string;
      verified: boolean;
      reason?: string;
      error?: string;
    } | null>(null),
    [showBody, setShowBody] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/content-quality/body?owner=' + encodeURIComponent(item.id), {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then(setBody)
      .catch((e) => {
        if (e.name !== 'AbortError')
          setBody({
            body: '',
            verified: false,
            error: '本文を取得できません。',
          });
      });
    return () => controller.abort();
  }, [item.id, item.basis]);
  const change = (next: Review) => {
    setReview(next);
    onDirty(true);
  };
  async function save() {
    setBusy(true);
    setMessage('');
    try {
      const data = await requestJson('/api/content-quality', 'PATCH', {
        id: item.id,
        revision: item.revision,
        review,
      });
      onDirty(false);
      onSaved(data);
      setMessage('改善方針と確認結果を保存しました。');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">{item.title}</h2>
        <p className="break-all text-xs text-muted-foreground">{item.id}</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge tone={item.reviewState === 'checked' ? 'good' : 'warn'}>
            {STATE_LABELS[item.reviewState]}
          </StatusBadge>
          <StatusBadge tone={item.bodySaved ? 'neutral' : 'warn'}>
            {item.bodySaved ? '本文保存記録あり' : '本文未回収'}
          </StatusBadge>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
            >
              公開ページ
            </a>
          )}
        </div>
      </div>
      {item.stale && (
        <p role="status" className="text-sm text-muted-foreground">
          前回確認後に本文・画像などが変わっています。各項目を確認し直して保存してください。
        </p>
      )}
      <label className="block space-y-2">
        <span className="text-sm font-medium">優先度</span>
        <NativeSelect
          value={review.priority}
          onChange={(e) =>
            change({
              ...review,
              priority: e.target.value as Review['priority'],
            })
          }
        >
          <option value="high">高</option>
          <option value="normal">通常</option>
          <option value="low">低</option>
        </NativeSelect>
      </label>
      <label className="block space-y-2">
        <span className="text-sm font-medium">改善方針・具体的な修正内容</span>
        <Textarea
          rows={6}
          value={review.policy}
          placeholder="どの図を、どのように変えるか。配置・導入・出典・導線の修正も記録できます。"
          onChange={(e) => change({ ...review, policy: e.target.value })}
        />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        {(Object.keys(CHECK_LABELS) as CheckName[]).map((check) => (
          <label key={check} className="space-y-1 text-sm">
            <span>{CHECK_LABELS[check]}</span>
            <NativeSelect
              aria-label={CHECK_LABELS[check]}
              value={review.checks[check]}
              onChange={(e) =>
                change({
                  ...review,
                  checks: {
                    ...review.checks,
                    [check]: e.target.value as CheckState,
                  },
                })
              }
            >
              <option value="unchecked">未確認</option>
              <option value="issue">要改善</option>
              <option value="pass">確認済み</option>
              <option value="na">対象外</option>
            </NativeSelect>
          </label>
        ))}
      </div>
      {item.id.startsWith('sns/') && item.assetCount === 0 && (
        <div className="space-y-2 text-sm">
          <label>
            素材一覧の確認
            <NativeSelect
              value={review.imageInventory}
              onChange={(e) =>
                change({
                  ...review,
                  imageInventory: e.target.value as Review['imageInventory'],
                })
              }
            >
              <option value="unverified">未確認・回収待ち</option>
              <option value="no-assets">画像・動画なしの投稿と確認</option>
            </NativeSelect>
          </label>
          <Textarea
            aria-label="素材なしと判断した根拠"
            value={review.inventoryReason}
            onChange={(e) =>
              change({ ...review, inventoryReason: e.target.value })
            }
            placeholder="公開投稿などで確認した根拠"
          />
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={save} disabled={busy}>
          {busy ? '保存中…' : '改善方針・確認結果を保存'}
        </Button>
        <p role="status" className="text-sm">
          {message}
        </p>
      </div>
      <Section title="使用画像" count={images.length}>
        <div className="grid gap-4 sm:grid-cols-2">
          {images.map((image) => (
            <button
              type="button"
              key={image.id}
              className="space-y-2 rounded-md border border-border p-3 text-left hover:border-primary"
              onClick={() => onImage(image.id)}
            >
              <ActualImage
                key={originalUrl(image)}
                src={originalUrl(image)}
                alt={image.file}
                small
              />
              <div className="break-all text-sm">
                {image.kind === 'cover' ? 'カバー' : image.file}
              </div>
              <StatusBadge tone={image.original?.key ? 'good' : 'warn'}>
                {image.original?.key ? 'R2保存' : '未移行・未保全'}
              </StatusBadge>
            </button>
          ))}
        </div>
        {!images.some((i) => i.kind !== 'cover') && (
          <p className="mt-2 text-sm text-muted-foreground">
            本文画像の一覧が未取得、または本文に画像がありません。未取得を「画像なし」と判定しません。
          </p>
        )}
      </Section>
      <Section title="本文・配置を確認する">
        <Button variant="outline" onClick={() => setShowBody(!showBody)}>
          {showBody ? '本文を閉じる' : '本文を表示'}
        </Button>
        {showBody && (
          <div className="mt-4 space-y-4">
            {!body && <p>本文を取得しています…</p>}
            {(body?.error || body?.reason) && (
              <p className="text-sm text-muted-foreground">
                {body.error ?? body.reason}
              </p>
            )}
            {body?.body && (
              <div className="mx-auto max-w-[390px] space-y-4 break-words text-sm leading-7">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  skipHtml
                  components={{
                    img: ({ src, alt }) => {
                      const clean = String(src ?? '').replace(/^\.\//, '');
                      const im = images.find((i) => i.file === clean);
                      return (
                        <ActualImage
                          src={im ? originalUrl(im) : null}
                          alt={alt ?? clean}
                        />
                      );
                    },
                    a: ({ href, children }) => (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline"
                      >
                        {children}
                      </a>
                    ),
                    h2: ({ children }) => (
                      <h2 className="mt-6 text-lg font-semibold">{children}</h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="mt-4 font-semibold">{children}</h3>
                    ),
                    table: ({ children }) => (
                      <TableFrame>{children}</TableFrame>
                    ),
                  }}
                >
                  {body.body}
                </ReactMarkdown>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              保存原稿のプレビューです。公開後のnoteカード表示・配置は公開ページでも確認します。
            </p>
          </div>
        )}
      </Section>
    </div>
  );
}
function ImageEditor({
  image,
  comparisonImages,
  related,
  onSelect,
  templates,
  onSaved,
  onDirty,
}: {
  image: ImageView;
  comparisonImages: ImageView[];
  related: ImageView[];
  onSelect: (image: ImageView) => void;
  templates: Template[];
  onSaved: () => Promise<void>;
  onDirty: (value: boolean) => void;
}) {
  const [policy, setPolicy] = useState(image.policy),
    [templateId, setTemplateId] = useState(image.templateId),
    [purpose, setPurpose] = useState(image.classification.purpose),
    [selection, setSelection] = useState(image.classification.selection),
    [classificationReason, setClassificationReason] = useState(
      image.record?.classification?.reason ?? ''
    ),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  const [reason, setReason] = useState(''),
    [original, setOriginal] = useState(false),
    [mobile, setMobile] = useState(false),
    [data, setData] = useState(false);
  const [file, setFile] = useState<File | null>(null),
    [evidence, setEvidence] = useState(
      '{"renderer":"","sourceData":"","changes":""}'
    );
  async function perform(fn: () => Promise<unknown>) {
    setBusy(true);
    setMessage('');
    try {
      await fn();
      onDirty(false);
      await onSaved();
      setMessage('保存しました。公開画像は採用だけでは変わりません。');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const old = originalUrl(image),
    candidate = candidateUrl(image);
  const template = templates.find((t) => t.id === templateId);
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-base font-semibold">{image.title}</h2>
        <p className="break-all text-sm text-muted-foreground">
          {image.id} · {image.file}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge tone={image.original?.key ? 'good' : 'warn'}>
            {image.original?.key
              ? 'R2参照'
              : image.original?.provider === 'git'
                ? 'Git素材'
                : image.original?.provider === 'site'
                  ? 'サイト配信'
                  : 'R2移行・回収待ち'}
          </StatusBadge>
          <StatusBadge tone="neutral">
            {IMAGE_USES[image.usage] ?? image.usage} ·{' '}
            {image.format || '形式未照合'}
          </StatusBadge>
          <StatusBadge tone={image.original?.sha256 ? 'info' : 'warn'}>
            {image.inventoryStatus === 'verified'
              ? '取得・SHA記録済み'
              : image.original?.sha256
                ? '保存記録あり'
                : '実体未照合'}
          </StatusBadge>
          <StatusBadge tone={image.approved ? 'good' : 'neutral'}>
            {image.approved
              ? '候補を採用済み'
              : image.candidate
                ? '候補あり'
                : '候補未登録'}
          </StatusBadge>
        </div>
      </div>
      <Section title="分類と次の作業">
        <div className="flex flex-wrap gap-2">
          <StatusBadge
            tone={
              ['confirmed', 'recorded'].includes(image.classification.status)
                ? 'info'
                : 'warn'
            }
          >
            {CLASSIFICATION_STATES[image.classification.status]}
          </StatusBadge>
          <StatusBadge tone="neutral">
            役割: {IMAGE_ROLES[image.classification.role]}
          </StatusBadge>
          <StatusBadge tone="neutral">
            型: {templates.find((t) => t.id === image.templateId)?.label}
          </StatusBadge>
          <StatusBadge tone="neutral">
            目的: {IMAGE_PURPOSES[image.classification.purpose]}
          </StatusBadge>
          <StatusBadge tone="neutral">
            構成: {IMAGE_SELECTIONS[image.classification.selection]}
          </StatusBadge>
          {image.tasks.map((task) => (
            <StatusBadge key={task} tone="neutral">
              {IMAGE_QUEUES[task]}
            </StatusBadge>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          {image.classification.reason}
        </p>
        {image.classification.updatedAt && (
          <p className="text-xs text-muted-foreground">
            分類の確認日: {image.classification.updatedAt}
          </p>
        )}
        {!!image.record?.classificationHistory?.length && (
          <Collapsible className="text-sm">
            <CollapsibleTrigger className="cursor-pointer text-left">
              過去の分類 {image.record.classificationHistory.length}件
            </CollapsibleTrigger>
<CollapsibleContent>
            {image.record.classificationHistory.map((entry, index) => (
              <p key={index}>
                {entry.updatedAt} · {entry.templateId} · {entry.reason}
              </p>
            ))}
          </CollapsibleContent>
</Collapsible>
        )}
        {image.coverWorkflow && (
          <p className="mt-2 text-sm">
            制作ID: {image.coverWorkflow.id} · 方針:{' '}
            {image.coverWorkflow.policyId ?? '要確認'}
            。候補・採用・公開状態はカバー制作台帳で確認できます。
          </p>
        )}
      </Section>
      <Section title="使用先・元データ・生成元">
        <div className="space-y-3 text-sm">
          {image.pageUrl && (
            <a
              className="text-primary underline"
              href={image.pageUrl}
              target="_blank"
              rel="noreferrer"
            >
              使用ページ・投稿を開く
            </a>
          )}
          <p className="break-all text-xs text-muted-foreground">
            原本:{' '}
            {image.original?.key ??
              image.original?.path ??
              image.original?.url ??
              '所在未確認'}
          </p>
          {image.missingReason && (
            <p className="text-muted-foreground">{image.missingReason}</p>
          )}
          {image.occurrences?.map((use, index) => (
            <p key={index}>
              本文 {use.line}行目 · {use.heading || '導入'} ·{' '}
              {use.alt || '説明なし'}
            </p>
          ))}
          {!!related.length && (
            <div>
              <p>同じ原本の使用先（{related.length}件）</p>
              <ul className="space-y-1">
                {related.map((row) => (
                  <li key={row.id}>
                    <button
                      className="text-left text-primary underline"
                      onClick={() => onSelect(row)}
                    >
                      {row.title} · {IMAGE_USES[row.usage] ?? row.usage}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {image.generation && (
            <div className="break-all text-xs text-muted-foreground">
              <p>生成方式: {image.generation.generator}</p>
              <p>生成コード: {image.generation.renderer ?? '未記録'}</p>
              {image.generation.rendererHash && (
                <p>コードの記録SHA: {image.generation.rendererHash}</p>
              )}
              {image.generation.inputHash && (
                <p>入力の記録SHA: {image.generation.inputHash}</p>
              )}
            </div>
          )}
          {image.sourceLinks?.map((source, index) => (
            <div key={index}>
              <p>{source.relationship}</p>
              {source.url ? (
                <a
                  className="break-all text-primary underline"
                  href={source.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  {source.label}
                </a>
              ) : (
                <p className="break-all">{source.label}</p>
              )}
            </div>
          ))}
          {!!image.missingInputs?.length && (
            <p className="break-all text-muted-foreground">
              未取得の入力: {image.missingInputs.join('、')}
            </p>
          )}
        </div>
      </Section>
      <div className="grid gap-4 sm:grid-cols-2">
        <Section title="現在の画像">
          <ActualImage key={old} src={old} alt="現在の画像" />
          {old && (
            <div className="flex flex-wrap gap-3">
              <a
                href={old}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary underline"
              >
                原寸を開く
              </a>
              {image.kind !== 'cover' &&
                image.original?.provider !== 'external' && (
                  <a
                    className="text-xs text-primary underline"
                    href={'/api/media-library/' + image.id + '/file?download=1'}
                  >
                    原本ファイルを保存
                  </a>
                )}
            </div>
          )}
        </Section>
        <Section title="改善候補">
          <ActualImage key={candidate} src={candidate} alt="改善候補" />
          {candidate && (
            <a
              href={candidate}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-primary underline"
            >
              原寸を開く
            </a>
          )}
        </Section>
      </div>
      <Section title="スマホ幅320pxで比較">
        <div className="flex flex-wrap gap-4">
          <div className="w-[320px] max-w-full shrink-0">
            <ActualImage key={old} src={old} alt="現在の画像・320px" />
          </div>
          <div className="w-[320px] max-w-full shrink-0">
            <ActualImage
              key={candidate}
              src={candidate}
              alt="候補画像・320px"
            />
          </div>
        </div>
      </Section>
      {image.kind === 'cover' ? (
        <Link href={image.coverManagement ?? '/content/note/covers'} className={buttonVariants()}>
            カバーの制作・採用画面を開く
          </Link>
      ) : (
        <>
          <label className="block space-y-2 text-sm">
            <span>図・画像の型（確認して割り当てる）</span>
            <NativeSelect
              value={templateId}
              aria-label="図・画像の型（確認して割り当てる）"
              onChange={(e) => {
                setTemplateId(e.target.value);
                onDirty(true);
              }}
            >
              <option value="unclassified" disabled>
                型を選択してください
              </option>
              {templates
                .filter((t) => !['unclassified', 'note-cover'].includes(t.id))
                .map((t) => (
                  <option value={t.id} key={t.id}>
                    {t.label} · v{t.version}
                  </option>
                ))}
            </NativeSelect>
          </label>
          <p className="text-sm">
            選択した型の役割: {IMAGE_ROLES[roleForTemplate(templateId)]}
          </p>
          <p className="text-sm text-muted-foreground">
            棒の長さで比較する画像は棒グラフ、行と列で数値を読む画像はテーブルです。ランキングは目的として記録します。
          </p>
          <label className="block space-y-2 text-sm">
            <span>伝える目的</span>
            <NativeSelect
              aria-label="伝える目的"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (!selectionAllowed(e.target.value, selection))
                  setSelection('undecided');
                onDirty(true);
              }}
            >
              {Object.entries(IMAGE_PURPOSES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </NativeSelect>
          </label>
          <label className="block space-y-2 text-sm">
            <span>掲載範囲・構成</span>
            <NativeSelect
              aria-label="掲載範囲・構成"
              value={selection}
              onChange={(e) => {
                setSelection(e.target.value);
                onDirty(true);
              }}
            >
              {Object.entries(IMAGE_SELECTIONS)
                .filter(([id]) => selectionAllowed(purpose, id))
                .map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </NativeSelect>
          </label>
          <label className="block space-y-2 text-sm">
            <span>分類を確認した根拠</span>
            <Textarea
              rows={2}
              value={classificationReason}
              placeholder="実画像で確認した内容、または一致を確認した生成記録を記入"
              onChange={(e) => {
                setClassificationReason(e.target.value);
                onDirty(true);
              }}
            />
          </label>
          <p className="text-sm text-muted-foreground">{template?.policy}</p>
          <label className="block space-y-2 text-sm">
            <span>この画像の改善方針</span>
            <Textarea
              rows={4}
              value={policy}
              onChange={(e) => {
                setPolicy(e.target.value);
                onDirty(true);
              }}
            />
          </label>
          <Button
            disabled={busy}
            onClick={() =>
              perform(() =>
                requestJson('/api/media-library/' + image.id, 'PATCH', {
                  action: 'plan',
                  revision: image.revision,
                  templateId,
                  policy,
                  role: roleForTemplate(templateId),
                  reason: classificationReason,
                  purpose,
                  selection,
                })
              )
            }
          >
            分類と改善方針を確認して保存
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() =>
              perform(() =>
                requestJson('/api/media-library/' + image.id, 'PATCH', {
                  action: 'policy',
                  revision: image.revision,
                  policy,
                })
              )
            }
          >
            改善方針だけ保存（分類は変更しない）
          </Button>
          {!image.previewOnly && (
            <ImageComparison
              image={image}
              images={comparisonImages}
              busy={busy}
              onDirty={() => onDirty(true)}
              onSave={(comparison) =>
                perform(() =>
                  requestJson('/api/media-library/' + image.id, 'PATCH', {
                    action: 'comparison',
                    revision: image.revision,
                    comparison,
                  })
                )
              }
            />
          )}
          <ImageAssessment
            image={image}
            busy={busy}
            onDirty={() => onDirty(true)}
            onSave={(review) =>
              perform(() =>
                requestJson('/api/media-library/' + image.id, 'PATCH', {
                  action: 'assess',
                  revision: image.revision,
                  review,
                })
              )
            }
          />
          <Section title="元データ・生成条件">
            <p className="text-sm">
              {image.inputFiles.length
                ? '保存一覧に入力候補があります。値・単位の妥当性と再生成の成功は別途確認します。'
                : '固定入力の保全は未確認です。完成画像だけでは再生成を保証できません。'}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {image.inputFiles.map((f) => (
                <li key={f.name} className="break-all">
                  <a
                    className="text-primary underline"
                    href={
                      '/api/media-library/' +
                      image.id +
                      '/inputs?name=' +
                      encodeURIComponent(f.name)
                    }
                  >
                    {f.name}
                  </a>{' '}
                  · {f.sha256.slice(0, 12)}
                  {' · '}
                  {f.role ?? '入力候補'}
                  {f.state === 'observed-current'
                    ? '（今回取得。生成当時との一致は未照合）'
                    : ''}
                </li>
              ))}
            </ul>
            <a href={'/api/media-library/' + image.id + '/request'} className={buttonVariants({ variant: "outline" })}>
                制作仕様をダウンロード
              </a>
          </Section>
          <Section title="改善候補をR2へ保存">
            <p className="text-sm text-muted-foreground">
              PNG・JPEG・WebP・SVGと、使用したrenderer・元データ・変更点を登録します。SVGは安全なプレビューへ変換して表示します。
            </p>
            <Input
              aria-label="改善候補の画像"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <Textarea
              aria-label="生成根拠JSON"
              rows={4}
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
            />
            <Button
              disabled={busy || !file}
              onClick={() =>
                perform(async () => {
                  const form = new FormData();
                  form.set('file', file!);
                  form.set('revision', image.revision);
                  form.set('evidence', evidence);
                  const res = await fetch(
                    '/api/media-library/' + image.id + '/candidate',
                    { method: 'POST', body: form }
                  );
                  const result = await res.json();
                  if (!res.ok) throw new Error(result.error);
                })
              }
            >
              候補画像を保存
            </Button>
          </Section>
          {image.candidate && (
            <Section title="候補の確認・採用">
              {!image.candidateMatches && (
                <p className="text-sm text-muted-foreground">
                  入力・方針が変更されたため、この候補は採用できません。現在の制作仕様で新しい候補を登録してください。
                </p>
              )}
              <div className="flex flex-wrap gap-4 text-sm">
                <label>
                  <input
                    type="checkbox"
                    checked={original}
                    onChange={(e) => setOriginal(e.target.checked)}
                  />{' '}
                  原寸を確認
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={mobile}
                    onChange={(e) => setMobile(e.target.checked)}
                  />{' '}
                  320pxで読める
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={data}
                    onChange={(e) => setData(e.target.checked)}
                  />{' '}
                  数値・年・単位を照合
                </label>
              </div>
              <Textarea
                aria-label="画像の確認理由"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="確認した点・修正が必要な点"
              />
              <div className="flex flex-wrap gap-2">
                {(['pass', 'needs-revision'] as const).map((status) => (
                  <Button
                    key={status}
                    variant={status === 'pass' ? 'default' : 'outline'}
                    disabled={
                      busy ||
                      !reason.trim() ||
                      !image.candidateMatches ||
                      (status === 'pass' && !(original && mobile && data))
                    }
                    onClick={() =>
                      perform(() =>
                        requestJson('/api/media-library/' + image.id, 'PATCH', {
                          action: 'review',
                          revision: image.revision,
                          candidateId: image.candidate!.id,
                          review: { status, reason, original, mobile, data },
                        })
                      )
                    }
                  >
                    {status === 'pass' ? 'この候補を採用' : '修正を依頼'}
                  </Button>
                ))}
                <a href={
                      '/api/media-library/' +
                      image.id +
                      '/file?revision=' +
                      image.candidate.id +
                      '&input=1'
                    } className={buttonVariants({ variant: "outline" })}>
                    保存した生成根拠
                  </a>
              </div>
            </Section>
          )}
          {!!image.record?.revisions.length && (
            <Collapsible>
              <CollapsibleTrigger className="cursor-pointer text-sm text-left">
                候補の履歴（{image.record.revisions.length}版）
              </CollapsibleTrigger>
<CollapsibleContent>
              <ul className="space-y-2 py-3 text-sm">
                {image.record.revisions.map((r) => (
                  <li key={r.id}>
                    <a
                      className="text-primary underline"
                      target="_blank"
                      rel="noreferrer"
                      href={
                        '/api/media-library/' +
                        image.id +
                        '/file?revision=' +
                        r.id
                      }
                    >
                      {r.createdAt} · {r.width}×{r.height}
                    </a>{' '}
                    · {r.review?.reason ?? '未確認'}
                  </li>
                ))}
              </ul>
            </CollapsibleContent>
</Collapsible>
          )}
        </>
      )}
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
export function MediaWorkspace({
  initial,
  mode,
  initialOwner = '',
  initialImage = '',
  initialChannel = '',
  initialUsage = '',
  initialFormat = '',
  initialCollection = '',
  initialQuery = '',
  initialTemplate = '',
  initialQueue = '',
  initialRole = '',
  initialPurpose = '',
  initialSelection = '',
}: {
  initial: WorkspaceData;
  mode: 'articles' | 'images';
  initialOwner?: string;
  initialImage?: string;
  initialChannel?: string;
  initialUsage?: string;
  initialFormat?: string;
  initialCollection?: string;
  initialQuery?: string;
  initialTemplate?: string;
  initialQueue?: string;
  initialRole?: string;
  initialPurpose?: string;
  initialSelection?: string;
}) {
  const [data, setData] = useState(initial),
    [q, setQ] = useState(initialQuery),
    [channel, setChannel] = useState(initialChannel),
    [storage, setStorage] = useState(''),
    [state, setState] = useState(''),
    [template, setTemplate] = useState(
      initialTemplate === 'unclassified' ? '' : initialTemplate
    ),
    [queue, setQueue] = useState(
      initialTemplate === 'unclassified' ? 'classification' : initialQueue
    ),
    [role, setRole] = useState(initialRole),
    [purpose, setPurpose] = useState(initialPurpose),
    [selection, setSelection] = useState(initialSelection),
    [usage, setUsage] = useState(initialUsage),
    [format, setFormat] = useState(initialFormat),
    [collection, setCollection] = useState(initialCollection),
    [ownerFilter, setOwnerFilter] = useState(initialOwner),
    [page, setPage] = useState(0);
  const [owner, setOwner] = useState(
      initialOwner ||
        initial.images.find((i) => i.id === initialImage)?.owner ||
        ''
    ),
    [imageId, setImageId] = useState(initialImage),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState('');
  const [detail, setDetail] = useState<ImageView | null>(null);
  useEffect(() => {
    const url = new URL(window.location.href);
    for (const [key, value] of Object.entries({
      channel,
      usage,
      format,
      collection,
      owner: ownerFilter,
      template,
      queue,
      role,
      purpose,
      selection,
      q,
    })) {
      if (value) url.searchParams.set(key, value);
      else url.searchParams.delete(key);
    }
    window.history.replaceState(null, '', url);
  }, [
    channel,
    usage,
    format,
    collection,
    ownerFilter,
    template,
    queue,
    role,
    purpose,
    selection,
    q,
  ]);
  useEffect(() => {
    const controller = new AbortController();
    setDetail(null);
    if (imageId)
      fetch('/api/media-library/' + encodeURIComponent(imageId), {
        signal: controller.signal,
      })
        .then(async (res) => {
          const value = await res.json();
          if (!res.ok) throw Error(value.error);
          return value;
        })
        .then(setDetail)
        .catch((e) => {
          if (e.name !== 'AbortError') setError(e.message);
        });
    return () => controller.abort();
  }, [imageId, data]);
  useEffect(() => {
    const listener = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', listener);
    return () => window.removeEventListener('beforeunload', listener);
  }, [dirty]);
  const reload = async () => {
    const res = await fetch('/api/content-quality');
    const value = await res.json();
    if (!res.ok) throw new Error(value.error);
    setData(value);
  };
  const choose = (nextOwner: string, nextImage = '') => {
    if (dirty && !window.confirm('未保存の変更を破棄して移動しますか？'))
      return;
    setDirty(false);
    setOwner(nextOwner);
    setImageId(nextImage);
    const url = new URL(window.location.href);
    if (nextImage) url.searchParams.set('image', nextImage);
    else url.searchParams.delete('image');
    window.history.replaceState(null, '', url);
  };
  const filtered = useMemo(
    () =>
      data.items.filter(
        (i) =>
          (!channel || i.channel === channel) &&
          (!state || i.reviewState === state) &&
          (mode === 'images' ||
            !q ||
            (i.title + ' ' + i.id + ' ' + i.category + ' ' + i.review.policy)
              .toLowerCase()
              .includes(q.toLowerCase()))
      ),
    [data.items, channel, state, q, mode]
  );
  const filteredIds = new Set(filtered.map((i) => i.id));
  const images = data.images.filter(
    (i) =>
      filteredIds.has(i.owner) &&
      (!q ||
        [i.id, i.file, i.title, i.owner, i.category, i.policy]
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!template || i.templateId === template) &&
      (!queue || i.tasks.includes(queue)) &&
      (!role || i.classification.role === role) &&
      (!purpose || i.classification.purpose === purpose) &&
      (!selection || i.classification.selection === selection) &&
      (!usage || i.usage === usage) &&
      (!format || i.format === format) &&
      (!collection || i.collection === collection) &&
      (!storage ||
        (storage === 'r2'
          ? !!i.original?.key
          : storage === 'candidate'
            ? !!i.candidate
            : !i.original?.key)) &&
      (!ownerFilter || mode !== 'images' || i.owner === ownerFilter)
  );
  const selected = data.items.find((i) => i.id === owner),
    image = detail?.id === imageId ? detail : undefined;
  const rows = mode === 'images' ? images : filtered,
    pages = Math.ceil(rows.length / PAGE_SIZE),
    slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="space-y-6">
      <MediaWorkspaceNav
        active={mode}
        template={template || image?.templateId}
        owner={owner}
        dirty={dirty}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="記事・投稿・使用先" value={data.items.length} />
        <StatCard label="画像の使用箇所" value={data.images.length} />
        <StatCard
          label="要改善・再確認"
          value={
            data.items.filter((i) => ['issue', 'stale'].includes(i.reviewState))
              .length
          }
        />
      </div>
      <Collapsible className="text-sm text-muted-foreground">
        <CollapsibleTrigger className="cursor-pointer text-left">
          棚卸し範囲・不足を確認する（Web索引:{' '}
          {data.webInventoryUpdatedAt ?? '未取得'}）
        </CollapsibleTrigger>
<CollapsibleContent>
        <p>
          画像の使用箇所を一覧化しています。生成記録の存在は再生成成功を意味しません。未取得・外部参照・素材登録だけの画像も区別して残します。
        </p>
        <ul className="mt-2 space-y-1">
          {data.coverage?.map((row) => (
            <li key={row.collection}>
              {row.collection}: {row.images}件 / SHA記録あり {row.verified}件 /
              未照合 {row.unverified}件 / 取得不可 {row.missing}件
            </li>
          ))}
        </ul>
      </CollapsibleContent>
</Collapsible>
      {mode === 'images' && (
        <Section title="画像の改善キュー">
          <p className="mb-2 text-sm text-muted-foreground">
            全使用箇所から自動集計します。複数の作業がある画像は各キューに含まれます。分類済みは品質確認済みを意味しません。
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={queue ? 'outline' : 'default'}
              onClick={() => {
                setQueue('');
                setPage(0);
              }}
            >
              全画像
            </Button>
            {Object.entries(IMAGE_QUEUES).map(([key, label]) => (
              <Button
                key={key}
                size="sm"
                variant={queue === key ? 'default' : 'outline'}
                onClick={() => {
                  setQueue(key);
                  setPage(0);
                }}
              >
                {label} · {data.classificationSummary?.tasks[key] ?? 0}
              </Button>
            ))}
          </div>
        </Section>
      )}
      {!!data.inventoryGaps?.length && (
        <Collapsible className="text-sm">
          <CollapsibleTrigger className="cursor-pointer font-medium text-left">
            棚卸し待ちの使用先 ·{' '}
            {new Set(data.inventoryGaps.map((g) => g.owner)).size}件
          </CollapsibleTrigger>
<CollapsibleContent className="flex flex-col gap-2">
          <p>
            一覧未取得を「画像なし」と判定しません。本文・素材台帳を回収して索引を更新すると、同じ画像IDの改善キューへ入ります。
          </p>
          <ul className="max-h-64 space-y-2 overflow-y-auto">
            {data.inventoryGaps.map((gap, index) => (
              <li key={gap.owner + index}>
                <Link
                  className="text-primary underline"
                  href={
                    '/product/content-quality?owner=' +
                    encodeURIComponent(gap.owner)
                  }
                >
                  {data.items.find((i) => i.id === gap.owner)?.title ??
                    gap.owner}
                </Link>{' '}
                · {gap.reason}
              </li>
            ))}
          </ul>
        </CollapsibleContent>
</Collapsible>
      )}
      {data.migration && (
        <p className="text-sm text-muted-foreground">
          旧SNS画像の移行確認: {data.migration.observedAt} · R2照合済み{' '}
          {data.migration.counts.migrated ?? 0}件 · 元画像未取得{' '}
          {data.migration.counts['source-unavailable'] ?? 0}件 · 内容不一致{' '}
          {data.migration.counts['source-mismatch'] ?? 0}件 · 照合未完了{' '}
          {data.migration.counts.unverified ?? 0}件
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {ownerFilter && (
          <Button
            variant="outline"
            onClick={() => {
              setOwnerFilter('');
              setPage(0);
              const url = new URL(window.location.href);
              url.searchParams.delete('owner');
              window.history.replaceState(null, '', url);
            }}
          >
            この記事への絞り込みを解除
          </Button>
        )}
        <Input
          className="max-w-md"
          aria-label="記事・画像を検索"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(0);
          }}
          placeholder="タイトル・ID・分類・改善方針で検索"
        />
        <NativeSelect
          aria-label="媒体"
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value);
            setPage(0);
          }}
        >
          <option value="">全媒体</option>
          {Object.entries(CHANNELS).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          aria-label="確認状況"
          value={state}
          onChange={(e) => {
            setState(e.target.value);
            setPage(0);
          }}
        >
          <option value="">全確認状況</option>
          {Object.entries(STATE_LABELS).map(([key, label]) => (
            <option value={key} key={key}>
              {label}
            </option>
          ))}
        </NativeSelect>
        {mode === 'images' && (
          <>
            <NativeSelect
              aria-label="画像の目的"
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (
                  e.target.value &&
                  !selectionAllowed(e.target.value, selection)
                )
                  setSelection('');
                setPage(0);
              }}
            >
              <option value="">すべての目的</option>
              {Object.entries(IMAGE_PURPOSES).map(([id, label]) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="画像の構成"
              value={selection}
              onChange={(e) => {
                setSelection(e.target.value);
                if (e.target.value === 'top-bottom') setPurpose('ranking');
                setPage(0);
              }}
            >
              <option value="">すべての構成</option>
              {Object.entries(IMAGE_SELECTIONS)
                .filter(([id]) => !purpose || selectionAllowed(purpose, id))
                .map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </NativeSelect>
            <NativeSelect
              aria-label="画像の役割"
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                setPage(0);
              }}
            >
              <option value="">すべての役割</option>
              {Object.entries(IMAGE_ROLES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="画像の用途"
              value={usage}
              onChange={(e) => {
                setUsage(e.target.value);
                setPage(0);
              }}
            >
              <option value="">すべての用途</option>
              {Object.entries(IMAGE_USES).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </NativeSelect>
            <NativeSelect
              aria-label="画像形式"
              value={format}
              onChange={(e) => {
                setFormat(e.target.value);
                setPage(0);
              }}
            >
              <option value="">すべての形式</option>
              {/* URL で指定した形式は、該当画像が 0 件 (在庫索引の未取得など) でも選択肢に残して条件を保つ */}
              {[...new Set([...data.images.map((i) => i.format), format].filter(Boolean))]
                .sort()
                .map((f) => (
                  <option key={f} value={f}>
                    {f.toUpperCase()}
                  </option>
                ))}
            </NativeSelect>
            <NativeSelect
              aria-label="既存カタログ"
              value={collection}
              onChange={(e) => {
                setCollection(e.target.value);
                setPage(0);
              }}
            >
              <option value="">すべてのカタログ</option>
              {[
                ...new Set(
                  data.images
                    .map((i) => i.collection)
                    .filter((v): v is string => !!v)
                ),
              ]
                .sort()
                .map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
            </NativeSelect>
          </>
        )}
        {mode === 'images' && (
          <NativeSelect
            aria-label="図の型"
            value={template}
            onChange={(e) => {
              setTemplate(e.target.value);
              setPage(0);
            }}
          >
            <option value="">すべての型</option>
            {data.templates
              .filter((t) => t.id !== 'unclassified')
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
          </NativeSelect>
        )}
        {mode === 'images' && (
          <NativeSelect
            aria-label="画像の保存状況"
            value={storage}
            onChange={(e) => {
              setStorage(e.target.value);
              setPage(0);
            }}
          >
            <option value="">全保存状況</option>
            <option value="r2">R2保存</option>
            <option value="pending">移行・回収待ち</option>
            <option value="candidate">改善候補あり</option>
          </NativeSelect>
        )}
        <Button
          variant="outline"
          onClick={() => reload().catch((e) => setError(e.message))}
        >
          再読込
        </Button>
      </div>
      {error && <p role="alert">{error}</p>}
      <p className="text-xs text-muted-foreground">
        画像一覧の取得: {data.inventoryUpdatedAt ?? '未実施'} ·
        R2保存の記録と再生成の成功は別々に確認します。
      </p>
      <div className="grid min-w-0 grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(260px,2fr)_minmax(340px,3fr)]">
        <Section
          className="lg:max-h-[75vh] lg:overflow-y-auto"
          title={mode === 'images' ? '画像' : '記事・投稿'}
          count={rows.length}
        >
          <div
            className={
              mode === 'images' ? 'grid gap-3 sm:grid-cols-2' : 'space-y-2'
            }
          >
            {slice.map((row) =>
              mode === 'images' ? (
                <button
                  key={row.id}
                  className="space-y-2 rounded-md border border-border p-3 text-left hover:border-primary"
                  onClick={() => choose((row as ImageView).owner, row.id)}
                >
                  <ActualImage
                    key={originalUrl(row as ImageView)}
                    src={originalUrl(row as ImageView)}
                    alt={(row as ImageView).file}
                    small
                  />
                  <p className="line-clamp-2 text-sm">
                    {(row as ImageView).title}
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {(row as ImageView).file}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {IMAGE_USES[(row as ImageView).usage]} ·{' '}
                    {IMAGE_ROLES[(row as ImageView).classification.role]}
                  </p>
                  <StatusBadge
                    tone={
                      ['recorded', 'confirmed'].includes(
                        (row as ImageView).classification.status
                      )
                        ? 'info'
                        : 'warn'
                    }
                  >
                    {
                      CLASSIFICATION_STATES[
                        (row as ImageView).classification.status
                      ]
                    }
                  </StatusBadge>
                  <StatusBadge
                    tone={(row as ImageView).original?.key ? 'good' : 'warn'}
                  >
                    {(row as ImageView).original?.key
                      ? 'R2参照'
                      : (row as ImageView).original?.provider === 'git'
                        ? 'Git素材'
                        : (row as ImageView).original?.provider === 'inline-svg'
                          ? '本文埋込'
                          : (row as ImageView).original?.url
                            ? 'URL参照'
                            : '未移行・未保全'}
                  </StatusBadge>
                </button>
              ) : (
                <button
                  key={row.id}
                  className="block w-full space-y-2 rounded-md border border-border p-3 text-left hover:border-primary"
                  onClick={() => choose(row.id)}
                >
                  <p className="text-sm font-medium">{row.title}</p>
                  <div className="flex flex-wrap gap-2">
                    <StatusBadge tone="neutral">
                      {CHANNELS[row.channel] ?? row.channel}
                    </StatusBadge>
                    <StatusBadge
                      tone={
                        (row as ItemView).reviewState === 'checked'
                          ? 'good'
                          : 'warn'
                      }
                    >
                      {STATE_LABELS[(row as ItemView).reviewState]}
                    </StatusBadge>
                  </div>
                  <p className="break-all text-xs text-muted-foreground">
                    {row.id}
                  </p>
                </button>
              )
            )}
          </div>
          <div className="mt-4 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={!page}
              onClick={() => setPage(page - 1)}
            >
              前
            </Button>
            <span className="text-sm">
              {pages ? page + 1 : 0} / {pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= pages}
              onClick={() => setPage(page + 1)}
            >
              次
            </Button>
          </div>
        </Section>
        <PanelCard
          key={imageId || owner}
          title={image ? '画像の確認・改善' : '記事の確認・改善'}
          className="order-first min-w-0 lg:order-none lg:max-h-[75vh] lg:overflow-y-auto"
        >
          {image ? (
            <div className="space-y-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => choose(image.owner)}
              >
                記事・投稿の方針へ戻る
              </Button>
              <ImageEditor
                key={image.id + ':' + image.revision}
                image={image}
                comparisonImages={data.images}
                related={data.images.filter(
                  (row) =>
                    image.relatedImageIds.includes(row.id) &&
                    row.id !== image.id
                )}
                onSelect={(row) => choose(row.owner, row.id)}
                templates={data.templates}
                onSaved={reload}
                onDirty={setDirty}
              />
            </div>
          ) : imageId ? (
            <p role="status">画像の詳細を読み込んでいます。</p>
          ) : selected ? (
            <ArticleEditor
              key={selected.id + ':' + selected.revision}
              item={selected}
              images={data.images.filter((i) => i.owner === selected.id)}
              onSaved={setData}
              onImage={(id) => choose(selected.id, id)}
              onDirty={setDirty}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              左の項目を選ぶと、実際の画像と改善方針をここで確認・編集できます。
            </p>
          )}
        </PanelCard>
      </div>
    </div>
  );
}

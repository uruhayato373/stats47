'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  PanelCard,
  StatusBadge,
  StatCard,
  TableFrame,
} from '@/components/admin-ui';
import { Section } from '@/components/layout-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';
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
  note: 'note',
  x: 'X',
  instagram: 'Instagram',
  threads: 'Threads',
  youtube: 'YouTube',
  tiktok: 'TikTok',
};
const PAGE_SIZE = 36;
function originalUrl(image: ImageView) {
  if (image.kind === 'cover') return image.coverUrl ?? null;
  if (image.original?.key) return '/api/media-library/' + image.id + '/file';
  return image.legacyUrl ?? null;
}
function candidateUrl(image: ImageView) {
  return image.kind === 'cover'
    ? (image.coverCandidateUrl ?? null)
    : image.candidate
      ? '/api/media-library/' +
        image.id +
        '/file?revision=' +
        image.candidate.id
      : null;
}
function ActualImage({
  src,
  alt,
  small = false,
}: {
  src: string | null;
  alt: string;
  small?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  if (!src)
    return (
      <p className="p-6 text-sm text-console-muted">
        画像の保存記録がありません
      </p>
    );
  if (failed)
    return (
      <div className="space-y-2 p-4 text-sm text-console-muted">
        <p>
          画像を取得できません。保存先への接続・移行状況を確認してください。
        </p>
        <Button variant="outline" size="sm" onClick={() => setFailed(false)}>
          再取得
        </Button>
      </div>
    );
  // Exact ledger-owned proxy or a previously recorded public image URL.
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={
        small
          ? 'mx-auto h-36 w-full object-contain'
          : 'mx-auto h-auto max-h-[600px] w-full object-contain'
      }
      onError={() => setFailed(true)}
    />
  );
}
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
        <h2 className="text-lg font-semibold">{item.title}</h2>
        <p className="break-all text-xs text-console-muted">{item.id}</p>
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
              className="text-sm text-console-accent underline"
            >
              公開ページ
            </a>
          )}
        </div>
      </div>
      {item.stale && (
        <p role="status" className="text-sm text-console-muted">
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
              className="space-y-2 rounded-md border border-console-border p-3 text-left hover:border-console-accent"
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
          <p className="mt-2 text-sm text-console-muted">
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
              <p className="text-sm text-console-muted">
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
                        className="text-console-accent underline"
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
            <p className="text-xs text-console-muted">
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
  templates,
  onSaved,
  onDirty,
}: {
  image: ImageView;
  templates: Template[];
  onSaved: () => Promise<void>;
  onDirty: (value: boolean) => void;
}) {
  const [policy, setPolicy] = useState(image.policy),
    [templateId, setTemplateId] = useState(image.templateId),
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
        <h2 className="text-lg font-semibold">{image.title}</h2>
        <p className="break-all text-sm text-console-muted">
          {image.id} · {image.file}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          <StatusBadge tone={image.original?.key ? 'good' : 'warn'}>
            {image.original?.key ? 'R2保存' : 'R2移行・回収待ち'}
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
      <div className="grid gap-4 xl:grid-cols-2">
        <Section title="現在の画像">
          <ActualImage key={old} src={old} alt="現在の画像" />
          {old && (
            <a
              href={old}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-console-accent underline"
            >
              原寸を開く
            </a>
          )}
        </Section>
        <Section title="改善候補">
          <ActualImage key={candidate} src={candidate} alt="改善候補" />
          {candidate && (
            <a
              href={candidate}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-console-accent underline"
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
        <Button asChild>
          <Link href={image.coverManagement ?? '/content/note/covers'}>
            カバーの制作・採用画面を開く
          </Link>
        </Button>
      ) : (
        <>
          <label className="block space-y-2 text-sm">
            <span>図の型</span>
            <NativeSelect
              value={templateId}
              onChange={(e) => {
                setTemplateId(e.target.value);
                onDirty(true);
              }}
            >
              {templates.map((t) => (
                <option value={t.id} key={t.id}>
                  {t.label} · v{t.version}
                </option>
              ))}
            </NativeSelect>
          </label>
          <p className="text-sm text-console-muted">{template?.policy}</p>
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
                })
              )
            }
          >
            画像の改善方針を保存
          </Button>
          <Section title="元データ・生成条件">
            <p className="text-sm">
              {image.inputFiles.length
                ? '保存一覧に入力候補があります。値・単位の妥当性と再生成の成功は別途確認します。'
                : '固定入力の保全は未確認です。完成画像だけでは再生成を保証できません。'}
            </p>
            <ul className="mt-2 space-y-1 text-xs text-console-muted">
              {image.inputFiles.map((f) => (
                <li key={f.name} className="break-all">
                  <a
                    className="text-console-accent underline"
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
                </li>
              ))}
            </ul>
            <Button asChild variant="outline">
              <a href={'/api/media-library/' + image.id + '/request'}>
                制作仕様をダウンロード
              </a>
            </Button>
          </Section>
          <Section title="改善候補をR2へ保存">
            <p className="text-sm text-console-muted">
              PNG・JPEG・WebPと、使用したrenderer・元データ・変更点を登録します。統計図は元データに基づいて生成してください。
            </p>
            <Input
              aria-label="改善候補の画像"
              type="file"
              accept="image/png,image/jpeg,image/webp"
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
                <p className="text-sm text-console-muted">
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
                <Button asChild variant="outline">
                  <a
                    href={
                      '/api/media-library/' +
                      image.id +
                      '/file?revision=' +
                      image.candidate.id +
                      '&input=1'
                    }
                  >
                    保存した生成根拠
                  </a>
                </Button>
              </div>
            </Section>
          )}
          {!!image.record?.revisions.length && (
            <details>
              <summary className="cursor-pointer text-sm">
                候補の履歴（{image.record.revisions.length}版）
              </summary>
              <ul className="space-y-2 py-3 text-sm">
                {image.record.revisions.map((r) => (
                  <li key={r.id}>
                    <a
                      className="text-console-accent underline"
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
            </details>
          )}
        </>
      )}
      <p role="status" className="text-sm">
        {message}
      </p>
    </div>
  );
}
function TemplateEditor({
  template,
  onSaved,
}: {
  template: Template & { revision: string };
  onSaved: () => Promise<void>;
}) {
  const [policy, setPolicy] = useState(template.policy),
    [profiles, setProfiles] = useState(template.profiles),
    [message, setMessage] = useState(''),
    [busy, setBusy] = useState(false);
  return (
    <PanelCard title={template.label} description={'方針 v' + template.version}>
      <div className="space-y-3">
        <Textarea
          aria-label={template.label + 'の共通方針'}
          value={policy}
          onChange={(e) => setPolicy(e.target.value)}
        />
        {(['note', 'x', 'instagram'] as const).map((p) => (
          <label key={p} className="block space-y-1 text-sm">
            <span>{CHANNELS[p]}</span>
            <Textarea
              rows={2}
              value={profiles[p]}
              onChange={(e) =>
                setProfiles({ ...profiles, [p]: e.target.value })
              }
            />
          </label>
        ))}
        <p className="text-xs text-console-muted">
          方針を更新すると、この型を使った候補は再確認が必要になります。
        </p>
        <Button
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await requestJson(
                '/api/media-templates/' + template.id,
                'PATCH',
                { revision: template.revision, policy, profiles }
              );
              await onSaved();
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
    </PanelCard>
  );
}
export function MediaWorkspace({
  initial,
  mode,
  initialOwner = '',
  initialImage = '',
  initialChannel = '',
}: {
  initial: WorkspaceData;
  mode: 'articles' | 'images' | 'templates';
  initialOwner?: string;
  initialImage?: string;
  initialChannel?: string;
}) {
  const [data, setData] = useState(initial),
    [q, setQ] = useState(''),
    [channel, setChannel] = useState(initialChannel),
    [storage, setStorage] = useState(''),
    [state, setState] = useState(''),
    [template, setTemplate] = useState(''),
    [page, setPage] = useState(0);
  const [owner, setOwner] = useState(initialOwner),
    [imageId, setImageId] = useState(initialImage),
    [dirty, setDirty] = useState(false),
    [error, setError] = useState('');
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
  };
  const filtered = useMemo(
    () =>
      data.items.filter(
        (i) =>
          (!channel || i.channel === channel) &&
          (!state || i.reviewState === state) &&
          (mode === 'images' ||
            !q ||
            (i.title + ' ' + i.id + ' ' + i.category)
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
        [i.id, i.file, i.title, i.owner, i.category]
          .join(' ')
          .toLowerCase()
          .includes(q.toLowerCase())) &&
      (!template || i.templateId === template) &&
      (!storage ||
        (storage === 'r2'
          ? !!i.original?.key
          : storage === 'candidate'
            ? !!i.candidate
            : !i.original?.key)) &&
      (!initialOwner || mode !== 'images' || i.owner === initialOwner)
  );
  const selected = data.items.find((i) => i.id === owner),
    image = data.images.find((i) => i.id === imageId);
  const rows = mode === 'images' ? images : filtered,
    pages = Math.ceil(rows.length / PAGE_SIZE),
    slice = rows.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  return (
    <div className="space-y-6">
      <nav className="flex flex-wrap gap-2">
        <Button asChild variant={mode === 'articles' ? 'default' : 'outline'}>
          <Link href="/product/content-quality">記事・投稿の改善</Link>
        </Button>
        <Button asChild variant={mode === 'images' ? 'default' : 'outline'}>
          <Link href="/ops/image-library">画像ライブラリ</Link>
        </Button>
        <Button asChild variant={mode === 'templates' ? 'default' : 'outline'}>
          <Link href="/ops/image-templates">図の型・媒体別方針</Link>
        </Button>
      </nav>
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="記事・投稿" value={data.items.length} />
        <StatCard label="画像の使用箇所" value={data.images.length} />
        <StatCard
          label="要改善・再確認"
          value={
            data.items.filter((i) => ['issue', 'stale'].includes(i.reviewState))
              .length
          }
        />
      </div>
      {data.migration && (
        <p className="text-sm text-console-muted">
          旧SNS画像の移行確認: {data.migration.observedAt} · R2照合済み{' '}
          {data.migration.counts.migrated ?? 0}件 · 元画像未取得{' '}
          {data.migration.counts['source-unavailable'] ?? 0}件 · 内容不一致{' '}
          {data.migration.counts['source-mismatch'] ?? 0}件 · 照合未完了{' '}
          {data.migration.counts.unverified ?? 0}件
        </p>
      )}
      {mode === 'templates' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {data.templates.map((t) => (
            <TemplateEditor
              key={t.id + ':' + t.version}
              template={t}
              onSaved={reload}
            />
          ))}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            <Input
              className="max-w-md"
              aria-label="記事・画像を検索"
              value={q}
              onChange={(e) => {
                setQ(e.target.value);
                setPage(0);
              }}
              placeholder="タイトル・記事ID・分類で検索"
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
              <NativeSelect
                aria-label="図の型"
                value={template}
                onChange={(e) => {
                  setTemplate(e.target.value);
                  setPage(0);
                }}
              >
                <option value="">すべての型</option>
                {data.templates.map((t) => (
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
          <p className="text-xs text-console-muted">
            画像一覧の取得: {data.inventoryUpdatedAt ?? '未実施'} ·
            R2保存の記録と再生成の成功は別々に確認します。
          </p>
          <div className="grid min-w-0 grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(320px,2fr)_minmax(420px,3fr)]">
            <Section
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
                      className="space-y-2 rounded-md border border-console-border p-3 text-left hover:border-console-accent"
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
                      <p className="break-all text-xs text-console-muted">
                        {(row as ImageView).file}
                      </p>
                      <StatusBadge
                        tone={
                          (row as ImageView).original?.key ? 'good' : 'warn'
                        }
                      >
                        {(row as ImageView).original?.key
                          ? 'R2'
                          : '未移行・未保全'}
                      </StatusBadge>
                    </button>
                  ) : (
                    <button
                      key={row.id}
                      className="block w-full space-y-2 rounded-md border border-console-border p-3 text-left hover:border-console-accent"
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
                      <p className="break-all text-xs text-console-muted">
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
              className="order-first min-w-0 xl:order-none xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto"
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
                    templates={data.templates}
                    onSaved={reload}
                    onDirty={setDirty}
                  />
                </div>
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
                <p className="text-sm text-console-muted">
                  左の項目を選ぶと、実際の画像と改善方針をここで確認・編集できます。
                </p>
              )}
            </PanelCard>
          </div>
        </>
      )}
    </div>
  );
}

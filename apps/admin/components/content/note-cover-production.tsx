'use client';
import { useState } from 'react';
import { StatusBadge } from '@/components/admin-ui';
import { Section, Stack } from '@/components/layout-primitives';
import { Button, buttonVariants } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { COVER_PRODUCTION_STAGES } from '@/lib/note-cover-view';
import { NoteCoverImage } from './note-cover-image';
import type { NoteCoverRow } from '@/lib/server/note-covers';
import type { CoverBrief } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import type { CoverPolicy } from '../../../../.claude/scripts/note/lib/cover-production.mjs';

export function CoverPolicyDetails({ policy }: { policy: CoverPolicy }) {
  return <Stack gap="sm">
    <p className="font-medium">{policy.id} · v{policy.version} · {policy.label}</p>
    <p className="text-sm">{policy.direction}</p>
    {policy.visualRules && <p className="text-sm">{policy.visualRules.layout === 'prefecture-map' ? '県の主域輪郭＋対象都市' : '記事の題材を主役にする構図'} · 人物・キャラクターなし · 補足も幅320pxで確認</p>}
    <details className="text-sm"><summary className="cursor-pointer">方針・コピー・確認項目</summary>
      <Stack className="pt-3"><p>{policy.readerValue}</p><p>{policy.prompt}</p>
        <ul className="list-disc pl-5">{policy.copyRules.map(rule => <li key={rule}>{rule}</li>)}</ul>
        <ul className="list-disc pl-5">{policy.reviewChecklist.map(rule => <li key={rule}>{rule}</li>)}</ul>
      </Stack>
    </details>
  </Stack>;
}

export function CoverProductionBadge({ row }: { row: NoteCoverRow }) {
  const stage = row.production.stage;
  return <StatusBadge tone={stage === 'published' || stage === 'approved' ? 'good' : stage === 'changes' || stage === 'stale' ? 'warn' : 'neutral'}>
    {COVER_PRODUCTION_STAGES.find(s => s.key === stage)?.label}
  </StatusBadge>;
}

export function NoteCoverProduction({ row, onSaved, onDirty }: { row: NoteCoverRow; onSaved: (row: NoteCoverRow) => void; onDirty: (dirty: boolean) => void }) {
  const work = row.production;
  const complete = work.policy.generation === 'imagegen-complete';
  const needsMap = work.policy.visualRules?.layout === 'prefecture-map';
  const prompt = work.plan?.imagePrompt ?? work.plan?.backgroundPrompt ?? '';
  const outdatedPolicy = !!work.plan && (work.plan.policyId !== work.policy.id || work.plan.policyVersion !== work.policy.version);
  const [brief, setBrief] = useState<CoverBrief>(work.brief ?? { headline: '', subline: '', subject: '', evidence: '' });
  const [reason, setReason] = useState('');
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const edit = (key: 'headline' | 'subline' | 'subject' | 'evidence', value: string) => { setBrief(b => ({ ...b, [key]: value })); setDirty(true); onDirty(true); };
  const editScope = (key: 'place' | 'year', value: string) => {
    setBrief(b => ({ ...b, dataScope: { place: '', year: '', ...b.dataScope, households: '二人以上の世帯', [key]: value } }));
    setDirty(true); onDirty(true);
  };
  const scopeReady = !needsMap || !!brief.dataScope?.place.trim() && /^[12][0-9]{3}$/.test(brief.dataScope?.year ?? '');
  const save = async (change: object) => {
    setBusy(true); setMessage('');
    try {
      const response = await fetch(`/api/note-covers/${encodeURIComponent(row.key)}/production`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...change, revision: work.revision }),
      });
      const data = await response.json();
      if (!response.ok || !data.row) throw Error(data.error ?? '保存できませんでした。');
      setDirty(false); onDirty(false); onSaved(data.row);
    } catch (error) { setMessage(error instanceof Error ? error.message : '保存できませんでした。'); }
    finally { setBusy(false); }
  };
  const download = () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(work.plan, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a'); a.href = url; a.download = `${work.id}-request.json`; a.click(); URL.revokeObjectURL(url);
  };
  return <Section title="カバーの制作">
    <Stack>
      <div className="flex flex-wrap items-center gap-2"><span className="font-mono">{work.id ?? '制作ID未登録'}</span><CoverProductionBadge row={row} /></div>
      <CoverPolicyDetails policy={work.policy} />
      <p className="text-sm text-console-muted">コピーと題材・根拠を保存し、{complete ? '文字と絵を一枚の画像として制作します' : 'プロンプトで背景を制作します'}。候補画像を登録すると、この画面で確認・採用できます。</p>
      <Stack gap="sm"><Label htmlFor="cover-headline">大きく見せるコピー</Label><Textarea id="cover-headline" value={brief.headline} maxLength={64} onChange={e => edit('headline', e.target.value)} placeholder={'ゴルフは愛知\n釣りは広島'} /></Stack>
      <Stack gap="sm"><Label htmlFor="cover-subline">補足・対象年・比較条件</Label><Textarea id="cover-subline" value={brief.subline} maxLength={100} onChange={e => edit('subline', e.target.value)} /></Stack>
      {needsMap && <Stack gap="sm">
        <Label htmlFor="cover-scope-place">家計データの対象都市</Label><Input id="cover-scope-place" value={brief.dataScope?.place ?? ''} maxLength={30} onChange={e => editScope('place', e.target.value)} placeholder="例：甲府市、東京都区部" />
        <Label htmlFor="cover-scope-year">対象年</Label><Input id="cover-scope-year" value={brief.dataScope?.year ?? ''} inputMode="numeric" maxLength={4} onChange={e => editScope('year', e.target.value)} placeholder="2024" />
        <p className="text-sm text-console-muted">二人以上の世帯。県の輪郭は地域を示す記号で、データの集計範囲は対象都市です。県名・都市・年・世帯区分を掲載文言にも入れてください。</p>
      </Stack>}
      <Stack gap="sm"><Label htmlFor="cover-subject">描く題材・構図</Label><Textarea id="cover-subject" value={brief.subject} maxLength={1000} onChange={e => edit('subject', e.target.value)} placeholder="例：ゴルフクラブと釣り竿を対にして、右側に大きく描く" /></Stack>
      <Stack gap="sm"><Label htmlFor="cover-evidence">コピーの根拠・本文の該当箇所</Label><Textarea id="cover-evidence" value={brief.evidence} maxLength={2000} onChange={e => edit('evidence', e.target.value)} placeholder="原稿・データの出典、対象年や条件など。本文にない数値は追加しない。" /></Stack>
      <Button disabled={busy || !work.id || !brief.headline.trim() || !brief.subject.trim() || !brief.evidence.trim() || !scopeReady} onClick={() => save({ action: 'brief', brief })}>制作内容を保存</Button>
      {!!work.blockers?.length && <ul className="list-disc pl-5 text-sm">{work.blockers.map(issue => <li key={issue}>{issue}</li>)}</ul>}
      {dirty && <p className="text-sm text-console-muted">未保存の入力があります。</p>}
      {work.plan && <Stack gap="sm">
        {outdatedPolicy && <p className="text-sm">方針が更新されました。制作内容を確認して保存し直してください。</p>}
        <Label htmlFor="cover-prompt">{work.plan.imagePrompt ? '生成プロンプト（文字込み）' : '生成プロンプト（背景用）'}</Label><Textarea id="cover-prompt" readOnly value={prompt} />
        <div className="flex flex-wrap gap-2"><Button variant="outline" disabled={dirty || outdatedPolicy} onClick={async () => { try { await navigator.clipboard.writeText(prompt); setMessage('プロンプトをコピーしました。'); } catch { setMessage('コピーできませんでした。プロンプト欄から選択してください。'); } }}>プロンプトをコピー</Button><Button variant="outline" disabled={dirty || outdatedPolicy} onClick={download}>制作仕様をダウンロード</Button></div>
        <p className="text-xs text-console-muted">{complete ? '掲載文言を含めて生成し、原寸と縮小表示で誤字・文字切れを確認します。' : '文字は保存したコピーを後から組版します。'}画像生成・登録は制作担当へこの仕様を渡してください。</p>
      </Stack>}
      {work.candidateRevisionId && !work.candidateMatches && <p className="text-sm text-console-muted">表示中の候補は、この制作内容で作った画像として登録されていません。新しい候補を制作・登録してください。</p>}
      {work.candidateMatches && <Stack>
        {row.candidateImageUrl && <><div className="w-full max-w-80"><NoteCoverImage src={row.candidateImageUrl} alt="候補の縮小表示（幅320px）" /></div><a href={row.candidateImageUrl} target="_blank" rel="noreferrer" data-slot="button" className={buttonVariants({ variant: "outline" })}>候補を原寸で開く</a></>}
        <p className="text-sm">原寸と幅320pxで文字・絵・根拠との一致を確認し、上の確認項目に沿って判定してください。</p>
        <Label htmlFor="cover-review-reason">確認結果・修正指示</Label><Textarea id="cover-review-reason" value={reason} maxLength={2000} onChange={e => { setReason(e.target.value); onDirty(dirty || !!e.target.value); }} />
        <div className="flex flex-wrap gap-2"><Button disabled={busy || dirty || !reason.trim()} onClick={() => save({ action: 'review', status: 'pass', candidateRevisionId: work.candidateRevisionId, reason })}>この画像を採用</Button><Button variant="outline" disabled={busy || dirty || !reason.trim()} onClick={() => save({ action: 'review', status: 'needs-revision', candidateRevisionId: work.candidateRevisionId, reason })}>修正を依頼</Button></div>
        <p className="text-xs text-console-muted">採用すると台帳に記録されます。noteへの反映は公開工程で行います。</p>
      </Stack>}
      {message && <p role="alert" className="text-sm">{message}</p>}
    </Stack>
  </Section>;
}

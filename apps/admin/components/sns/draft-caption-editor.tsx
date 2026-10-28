'use client';

import { useEffect, useState } from 'react';
import { Button, Label, Textarea } from '@stats47/components';
import type { PostDTO } from '@/lib/contracts/types';

export function DraftCaptionEditor({
  post,
  onSaved,
  onDirtyChange,
}: {
  post: PostDTO;
  onSaved: (post: PostDTO) => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [caption, setCaption] = useState(post.caption ?? '');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const dirty = caption !== (post.caption ?? '');
  useEffect(() => {
    onDirtyChange(dirty || saving);
  }, [dirty, saving, onDirtyChange]);
  useEffect(() => {
    if (!dirty && !saving) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, saving]);
  async function save() {
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch(`/api/posts/${post.id}/caption`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption, revision: post.revision }),
      });
      const data = (await response.json()) as {
        post?: PostDTO;
        error?: string;
      };
      if (!response.ok || !data.post)
        throw new Error(data.error ?? '保存できませんでした。');
      onSaved(data.post);
      setMessage('下書きを保存しました。本文変更後は承認待ちになります。');
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : '保存できませんでした。再読込して確認してください。'
      );
    } finally {
      setSaving(false);
    }
  }
  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor={`caption-${post.id}`}>下書き本文</Label>
      <Textarea
        id={`caption-${post.id}`}
        value={caption}
        onChange={(e) => {
          setCaption(e.target.value);
          setMessage('');
        }}
        rows={12}
        maxLength={10000}
        disabled={saving}
      />
      <p className="text-xs text-muted-foreground">
        {caption.length.toLocaleString()}文字 · 保存先は投稿 #{post.id}{' '}
        の下書きです。公開前に再承認します。
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          onClick={save}
          disabled={!dirty || saving || !caption.trim() || !post.revision}
        >
          {saving ? '保存中…' : '下書きを保存'}
        </Button>
        <Button
          variant="outline"
          disabled={!dirty || saving}
          onClick={() => {
            setCaption(post.caption ?? '');
            setError('');
            setMessage('');
          }}
        >
          変更を戻す
        </Button>
      </div>
      {message && (
        <p role="status" className="text-sm text-positive">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-negative">
          {error}
        </p>
      )}
    </div>
  );
}

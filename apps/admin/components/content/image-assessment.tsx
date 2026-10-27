'use client';
import { useState } from 'react';
import type {
  ImageView,
  VisualReview,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import { Section } from '@/components/layout-primitives';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

export function ImageAssessment({
  image,
  busy,
  onDirty,
  onSave,
}: {
  image: ImageView;
  busy: boolean;
  onDirty: () => void;
  onSave: (review: VisualReview) => void;
}) {
  const [review, setReview] = useState<VisualReview>({
    status: 'needs-revision',
    reason: '',
    original: false,
    mobile: false,
    data: false,
  });
  const edit = (patch: Partial<VisualReview>) => {
    setReview({ ...review, ...patch });
    onDirty();
  };
  return (
    <Section title="現在の画像を確認する">
      <p className="text-sm text-muted-foreground">
        現画像を維持する判断も記録できます。原本・分類・制作方針が変わると再確認になります。
      </p>
      {image.assessment && (
        <p className="text-sm">
          {image.assessmentMatches
            ? image.assessment.status === 'pass'
              ? '維持を確認済み'
              : '改善が必要'
            : '前回確認後に変更あり'}{' '}
          · {image.assessment.reason}
        </p>
      )}
      <div className="my-3 flex flex-wrap gap-4 text-sm">
        {(
          [
            ['original', '原寸を確認'],
            ['mobile', '320pxで読める'],
            ['data', '内容・数値・出典を照合'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={review[key]}
              onChange={(e) => edit({ [key]: e.target.checked })}
            />{' '}
            {label}
          </label>
        ))}
      </div>
      <Textarea
        aria-label="現画像の確認理由"
        value={review.reason}
        onChange={(e) => edit({ reason: e.target.value })}
        placeholder="維持できる理由、または修正が必要な点"
      />
      <div className="mt-2 flex flex-wrap gap-2">
        <Button
          disabled={
            busy ||
            !review.reason.trim() ||
            !review.original ||
            !review.mobile ||
            !review.data
          }
          onClick={() => onSave({ ...review, status: 'pass' })}
        >
          現画像を維持する
        </Button>
        <Button
          variant="outline"
          disabled={busy || !review.reason.trim()}
          onClick={() => onSave({ ...review, status: 'needs-revision' })}
        >
          改善が必要と記録
        </Button>
      </div>
    </Section>
  );
}

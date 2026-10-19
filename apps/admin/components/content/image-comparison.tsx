'use client';
import { useState } from 'react';
import type {
  ImageView,
  ComparisonPlan,
} from '../../../../.claude/scripts/media/lib/workspace.mjs';
import {
  comparisonGroups,
  comparisonTopic,
  TEMPLATE_CHANNELS,
} from '@/lib/media-template-examples';
import { Section } from '@/components/layout-primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { NativeSelect } from '@/components/ui/native-select';

const labels = { note: 'note', web: 'サイト', x: 'X', instagram: 'Instagram' };
export function ImageComparison({
  image,
  images,
  busy,
  onDirty,
  onSave,
}: {
  image: ImageView;
  images: ImageView[];
  busy: boolean;
  onDirty: () => void;
  onSave: (plan: ComparisonPlan | null) => void;
}) {
  const initial = comparisonTopic(image);
  const [key, setKey] = useState(initial.key);
  const [title, setTitle] = useState(initial.title);
  const [reason, setReason] = useState(image.record?.comparison?.reason ?? '');
  const [sharedChannels, setSharedChannels] = useState(
    initial.sharedChannels ?? []
  );
  const groups = comparisonGroups(
    images.filter(
      (i) =>
        i.templateId === image.templateId &&
        i.classification.purpose === image.classification.purpose &&
        i.classification.selection === image.classification.selection
    )
  );
  if (!groups.some((g) => g.key === initial.key))
    groups.unshift({ key: initial.key, title: initial.title });
  return (
    <Section title="同じ図の使用先">
      <div className="space-y-3 text-sm">
        <label className="block space-y-1">
          <span>関連付ける図</span>
          <NativeSelect
            aria-label="同じ図の使用先を関連付ける"
            value={key}
            disabled={busy}
            onChange={(event) => {
              const selected = groups.find((g) => g.key === event.target.value);
              setKey(selected?.key ?? image.id);
              setTitle(selected?.title ?? image.title);
              setSharedChannels([]);
              onDirty();
            }}
          >
            {groups.map((group) => (
              <option key={group.key} value={group.key}>
                {group.title}
              </option>
            ))}
            {!groups.some((group) => group.key === image.id) && (
              <option value={image.id}>別の図として管理する</option>
            )}
          </NativeSelect>
        </label>
        <label className="block space-y-1">
          <span>図の管理名</span>
          <Input
            value={title}
            disabled={busy}
            onChange={(e) => {
              setTitle(e.target.value);
              onDirty();
            }}
          />
        </label>
        <fieldset disabled={busy} className="space-y-2">
          <legend>同じ画像を共通見本として使う媒体</legend>
          <div className="flex flex-wrap gap-3">
            {TEMPLATE_CHANNELS.filter(
              (channel) => channel !== image.channel
            ).map((channel) => (
              <label key={channel} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={sharedChannels.includes(channel)}
                  onChange={(e) => {
                    setSharedChannels(
                      e.target.checked
                        ? [...sharedChannels, channel]
                        : sharedChannels.filter((c) => c !== channel)
                    );
                    onDirty();
                  }}
                />
                {labels[channel]}
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block space-y-1">
          <span>同じ元データ・項目・年・単位である根拠</span>
          <Textarea
            value={reason}
            disabled={busy}
            rows={2}
            onChange={(e) => {
              setReason(e.target.value);
              onDirty();
            }}
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={busy || !title.trim() || !reason.trim()}
            onClick={() =>
              onSave({
                key,
                title: title.trim(),
                reason: reason.trim(),
                sharedChannels,
              })
            }
          >
            使用先の関連付けを保存
          </Button>
          {image.record?.comparison && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => onSave(null)}
            >
              個別の紐付けを解除
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}

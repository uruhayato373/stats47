'use client';
import { useId, useState } from 'react';

import { Input } from '@stats47/components/atoms/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@stats47/components/atoms/ui/select';

import { GeoSourceLinkCard } from './GeoSourceLinkCard';
type Entry = {
  dataId: string;
  name: string;
  category: string;
  geometryType: string;
  latestVersion?: string;
  sourcePageUrl?: string;
  href?: string;
  assetCount?: number;
  thumbnailLabel?: string;
};
const categories: Record<string, string> = {
  land: '土地・自然',
  policy: '区域・防災',
  facility: '施設',
  transport: '交通',
  statistics: '統計',
};
const geometry: Record<string, string> = {
  point: '地点',
  line: '線',
  polygon: '区域',
  mesh: 'メッシュ',
  mixed: '複合',
};
export function GeoSourceDirectory({ entries }: { entries: Entry[] }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const filtered = entries.filter(
    (d) =>
      (category === 'all' || d.category === category) &&
      `${d.name} ${d.dataId}`
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase())
  );
  return (
    <>
      <div className="mb-4 flex flex-wrap gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={`${id}-query`} className="mb-1 block text-sm">
            データ名で検索
          </label>
          <Input
            id={`${id}-query`}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="例：河川、学校"
            className="min-h-11"
          />
        </div>
        <div>
          <label htmlFor={`${id}-category`} className="mb-1 block text-sm">
            分野
          </label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger
              id={`${id}-category`}
              className="min-h-11 w-28 sm:w-40"
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              {Object.entries(categories).map(([id, label]) => (
                <SelectItem key={id} value={id}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <p role="status" className="mb-3 text-sm">
        {filtered.length}件
      </p>
      <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {filtered.map((d) =>
          d.href ? (
            <li key={d.dataId} className="min-w-0">
              <GeoSourceLinkCard
                dataId={d.dataId}
                name={d.name}
                version={d.latestVersion ?? ''}
                label={d.thumbnailLabel}
                description={`${geometry[d.geometryType]} · ${d.dataId} · 登録版 ${d.latestVersion}`}
              />
            </li>
          ) : (
            <li key={d.dataId} className="border-b pb-3 text-sm">
              <span className="font-semibold">{d.name}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {categories[d.category]}・{geometry[d.geometryType]}／{d.dataId}
                ・登録版 {d.latestVersion ?? '未記録'}
              </span>
              {d.sourcePageUrl && (
                <a
                  href={d.sourcePageUrl}
                  className="inline-flex min-h-11 items-center text-primary underline"
                >
                  原典・利用条件
                </a>
              )}
            </li>
          )
        )}
      </ul>
      {filtered.length === 0 && (
        <p className="text-sm">
          一致するデータがありません。検索語や分野を変えてください。
        </p>
      )}
    </>
  );
}

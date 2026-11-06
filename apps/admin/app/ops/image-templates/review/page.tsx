import fs from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';
import { Cell, DataTable, PanelCard, Row, StatusBadge, type Tone } from '@/components/admin-ui';
import { Grid, Stack } from '@/components/layout-primitives';
import { PageHeading } from '@/components/ops/primitives';
import { mapRows, videoRows, type MapRow, type VideoRow } from '@/lib/server/media-unification';
import { projectRoot } from '@/lib/server/project-root';
import type { ReviewRow, ReviewStatus } from '@/lib/template-review-rows';

export const dynamic = 'force-dynamic';
export const metadata = { title: '型の最終確認 — stats47 admin' };

const STATUS: Record<ReviewStatus, { label: string; tone: Tone }> = {
  review: { label: '確認待ち', tone: 'warn' },
  done: { label: '決定済み', tone: 'good' },
  unused: { label: '未使用', tone: 'neutral' },
  undecided: { label: '方針未定', tone: 'neutral' },
};
const SOURCE = 'apps/admin/scripts/build-template-review.ts';

function readManifest() {
  const file = path.join(projectRoot(), '.local/template-review/manifest.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8')) as { generatedAt: string; rows: ReviewRow[] };
}

function SampleImage({ name, label }: { name?: string; label: string }) {
  if (!name) return <p className="text-sm text-muted-foreground">{label}版なし</p>;
  // Local review images served by the API route; next/image would only re-encode them.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={`/api/template-review/${name}`} alt={label} loading="lazy" className="w-full rounded-md border" />;
}

function TemplateRow({ row }: { row: ReviewRow }) {
  const status = STATUS[row.status];
  return (
    <PanelCard id={row.id} title={row.title} description={row.summary} action={<StatusBadge tone={status.tone}>{status.label}</StatusBadge>}>
      <Stack>
        {row.fit && (
          <Stack gap="sm">
            <p className="text-sm">答える問い: {row.fit.answers}</p>
            <p className="text-sm">必要なデータ: {row.fit.needs}</p>
          </Stack>
        )}
        {row.samples.length === 0 && <p className="text-sm text-muted-foreground">見本なし</p>}
        {row.samples.map((sample) => (
          <Stack key={sample.label} gap="sm">
            <p className="text-sm font-medium">{sample.label}</p>
            <Grid min="lg" lines={false} className="max-w-3xl">
              <SampleImage name={sample.light} label="明るい" />
              <SampleImage name={sample.dark} label="暗い" />
            </Grid>
          </Stack>
        ))}
      </Stack>
    </PanelCard>
  );
}

const Mark = ({ on, label = '使う', off = 'まだ' }: { on: boolean; label?: string; off?: string }) => <StatusBadge tone={on ? 'good' : 'warn'}>{on ? label : off}</StatusBadge>;

function MapStatus({ rows }: { rows: MapRow[] }) {
  const ledger = rows.filter((row) => row.ledgerColor).length;
  return (
    <PanelCard id="unification-map" title="地図の共通化" description={`形と投影は ${rows.filter((row) => row.geometry).length} / ${rows.length} 件が土台を使う。色は ${ledger} 件が指標の配色を読み、残りは処理ごとの配色。`}>
      <DataTable columns={['処理', '形と投影', '指標の配色']}>
        {rows.map((row) => (
          <Row key={row.file}>
            <Cell>{row.file}</Cell>
            <Cell><Mark on={row.geometry} /></Cell>
            <Cell><Mark on={row.ledgerColor} /></Cell>
          </Row>
        ))}
      </DataTable>
    </PanelCard>
  );
}

const MAP_LABEL: Record<VideoRow['map'], ReactNode> = {
  base: <StatusBadge tone="good">土台</StatusBadge>, tile: <StatusBadge tone="good">タイル</StatusBadge>, own: <StatusBadge tone="warn">別の処理</StatusBadge>, none: '描かない',
};

function VideoStatus({ rows }: { rows: VideoRow[] }) {
  const maps = rows.filter((row) => row.map === 'base' || row.map === 'own');
  return (
    <PanelCard id="unification-video" title="動画の共通化" description={`動画の構成 ${rows.length} 件。形の地図を描く ${maps.length} 件のうち土台を使うのは ${maps.filter((row) => row.map === 'base').length} 件、タイルは ${rows.filter((row) => row.map === 'tile').length} 件。指標の配色は ${rows.filter((row) => row.ledgerColor).length} 件、静止画と同じ紙と文字の色は ${rows.filter((row) => row.theme).length} 件。`}>
      <DataTable columns={['構成', '置き場', '描画の手順', '地図', '指標の配色', '紙と文字の色']}>
        {rows.map((row) => (
          <Row key={row.id}>
            <Cell>{row.id}</Cell>
            <Cell>{row.feature}</Cell>
            <Cell><Mark on={row.rendered} label="あり" off="なし" /></Cell>
            <Cell>{MAP_LABEL[row.map]}</Cell>
            <Cell><Mark on={row.ledgerColor} /></Cell>
            <Cell><Mark on={row.theme} /></Cell>
          </Row>
        ))}
      </DataTable>
    </PanelCard>
  );
}

export default function Page() {
  const manifest = readManifest();
  return (
    <Stack gap="lg">
      <PageHeading title="型の最終確認" source={SOURCE} />
      <MapStatus rows={mapRows()} />
      <VideoStatus rows={videoRows()} />
      {!manifest && <p>見本がまだありません。npx tsx {SOURCE} で作ります。</p>}
      {manifest?.rows.map((row) => <TemplateRow key={row.id} row={row} />)}
    </Stack>
  );
}

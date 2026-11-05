import fs from 'node:fs';
import path from 'node:path';
import { Cell, DataTable, Row, StatCard, StatusBadge } from '@/components/admin-ui';
import { Grid, Stack } from '@/components/layout-primitives';
import { PageHeading } from '@/components/ops/primitives';
import { projectRoot } from '@/lib/server/project-root';
import { datasetPath } from '../../../../../config/datasets.mjs';

export const dynamic = 'force-dynamic';
export const metadata = { title: '内訳の台帳 — stats47 admin' };

type CompositionSet = { id: string; theme: string; title: string; parts: { metricKey: string; label: string; unit: string | null }[]; issues: string[] };
type Ledger = { summary: { sets: number; parts: number; withIssues: number }; sets: CompositionSet[] };

const ISSUE_LABEL: Record<string, string> = { 'unknown-metric': '指標が無い', 'mixed-units': '単位が混在', 'too-many-parts': '区分が多い' };

export default function Page() {
  const ledger = JSON.parse(fs.readFileSync(path.join(projectRoot(), datasetPath('themes.composition-sets')), 'utf8')) as Ledger;
  return (
    <Stack gap="lg">
      <PageHeading title="内訳の台帳" source={datasetPath('themes.composition-sets')} />
      <Grid min="sm">
        <StatCard label="内訳の組" value={ledger.summary.sets} />
        <StatCard label="区分の合計" value={ledger.summary.parts} />
        <StatCard label="確かめる組" value={ledger.summary.withIssues} />
      </Grid>
      <DataTable columns={['テーマ', '内訳', '区分', '単位', '確かめること']}>
        {ledger.sets.map((set) => (
          <Row key={set.id}>
            <Cell>{set.theme}</Cell>
            <Cell>{set.title}</Cell>
            <Cell>{set.parts.length}</Cell>
            <Cell>{[...new Set(set.parts.map((part) => part.unit ?? '不明'))].join('・')}</Cell>
            <Cell>{set.issues.map((issue) => <StatusBadge key={issue} tone="warn">{ISSUE_LABEL[issue]}</StatusBadge>)}</Cell>
          </Row>
        ))}
      </DataTable>
    </Stack>
  );
}

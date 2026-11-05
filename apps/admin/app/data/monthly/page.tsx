import fs from 'node:fs';
import path from 'node:path';
import { Cell, DataTable, Row, StatCard, StatusBadge, type Tone } from '@/components/admin-ui';
import { Grid, Section, Stack } from '@/components/layout-primitives';
import { PageHeading } from '@/components/ops/primitives';
import { projectRoot } from '@/lib/server/project-root';
import { datasetPath } from '../../../../../config/datasets.mjs';

export const dynamic = 'force-dynamic';
export const metadata = { title: '月次データの台帳 — stats47 admin' };

type Survey = { statCode: string; statName: string; govOrg: string; tables: number; prefectureTables: number; latestUpdate: string };
type Decision = { statCode: string; decision: Status; reason: string; areaGrain?: string; siteUse?: string[]; issues?: string[] };
type Status = 'use' | 'hold' | 'exclude';

const STATUS: Record<Status, { label: string; tone: Tone }> = {
  use: { label: '使う', tone: 'good' },
  hold: { label: '保留', tone: 'warn' },
  exclude: { label: '使わない', tone: 'neutral' },
};
const USE_LABEL: Record<string, string> = { article: '記事', sns: 'SNS', theme: 'テーマ' };
const GRAIN_LABEL: Record<string, string> = { nation: '全国', 'nation-and-cities': '全国と市', prefecture: '都道府県', port: '港' };
const readJson = <T,>(id: string) => JSON.parse(fs.readFileSync(path.join(projectRoot(), datasetPath(id)), 'utf8')) as T;

export default function Page() {
  const ledger = readJson<{ summary: { catalogTables: number; monthlyTables: number; surveys: number }; surveys: Survey[] }>('estat.monthly-ledger');
  const { decisions } = readJson<{ decisions: Decision[] }>('estat.monthly-decisions');
  const byCode = new Map(ledger.surveys.map((survey) => [survey.statCode, survey]));
  return (
    <Stack gap="lg">
      <PageHeading title="月次データの台帳" source={datasetPath('estat.monthly-decisions')} />
      <Grid min="sm">
        <StatCard label="月次の表" value={ledger.summary.monthlyTables.toLocaleString('en-US')} />
        <StatCard label="調査" value={ledger.summary.surveys} />
        <StatCard label="使う調査" value={decisions.filter((d) => d.decision === 'use').length} />
      </Grid>
      {(Object.keys(STATUS) as Status[]).map((status) => {
        const rows = decisions.filter((d) => d.decision === status);
        return rows.length > 0 && (
          <Section key={status} id={status} title={STATUS[status].label} count={rows.length}>
            <DataTable columns={['調査', '月次の表', '地域', '使い道', '問い', '理由']}>
              {rows.map((d) => {
                const survey = byCode.get(d.statCode);
                return (
                  <Row key={d.statCode}>
                    <Cell>{survey?.statName ?? d.statCode}</Cell>
                    <Cell>{survey?.tables ?? 0}</Cell>
                    <Cell>{d.areaGrain ? GRAIN_LABEL[d.areaGrain] : ''}</Cell>
                    <Cell>{(d.siteUse ?? []).map((use) => USE_LABEL[use]).join('・')}</Cell>
                    <Cell>{(d.issues ?? []).map((issue) => issue.replace('issue:', '')).join(' ')}</Cell>
                    <Cell>{d.reason}</Cell>
                  </Row>
                );
              })}
            </DataTable>
          </Section>
        );
      })}
    </Stack>
  );
}

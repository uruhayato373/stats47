import { OPEN_DATA_SOURCES, OPEN_DATASETS } from '@stats47/data-configs';

import { DataGrid, StatCard, StatusBadge, type GridRow } from '@/components/admin-ui';
import { Grid, Section, Stack } from '@/components/layout-primitives';
import { PageHeading } from '@/components/ops/primitives';
import {
  deriveReflection,
  loadReflectionLookup,
  REFLECTION_STATUS,
  type ReflectionStatus,
} from '@/lib/server/open-data-status';
import { datasetPath } from '../../../../../config/datasets.mjs';

export const dynamic = 'force-dynamic';
export const metadata = { title: '外部データの台帳 — stats47 admin' };

const ACCESS_LABEL: Record<string, string> = {
  api: 'API',
  'bulk-download': '一括DL',
  'file-download': 'ファイルDL',
  'tile-service': 'タイル',
  'web-only': '画面のみ',
};
const LEVEL_LABEL: Record<string, string> = {
  national: '全国',
  prefecture: '都道府県',
  municipality: '市区町村',
  district: '小地域',
  mesh: 'メッシュ',
  point: '地点',
  line: '線',
  polygon: '面',
};
const USE_LABEL: Record<string, string> = {
  ranking: 'ランキング',
  theme: 'テーマ',
  map: '地図',
  area: '県ページ',
  'research-only': '調査',
  'not-suitable': '対象外',
};
const COMMERCIAL_LABEL: Record<string, { label: string; tone: 'good' | 'warn' | 'neutral' }> = {
  allowed: { label: '商用可', tone: 'good' },
  restricted: { label: '条件付き', tone: 'warn' },
  unknown: { label: '不明', tone: 'neutral' },
};
const VERIFICATION_LABEL: Record<string, { label: string; tone: 'good' | 'warn' | 'bad' | 'neutral' }> = {
  verified: { label: '確認済み', tone: 'good' },
  'partially-verified': { label: '一部確認', tone: 'warn' },
  unverified: { label: '未確認', tone: 'neutral' },
  unavailable: { label: '到達不可', tone: 'bad' },
  deprecated: { label: '廃止', tone: 'bad' },
};
const SOURCE_KIND_LABEL: Record<string, string> = {
  'government-portal': '政府ポータル',
  'government-api': '政府API',
  'municipal-portal': '自治体ポータル',
  'gis-portal': 'GISポータル',
  dashboard: 'ダッシュボード',
};

const STATUS_ORDER: ReflectionStatus[] = ['published', 'ingested', 'todo', 'research', 'excluded'];

export default function Page() {
  const lookup = loadReflectionLookup();
  const sourceById = new Map(OPEN_DATA_SOURCES.map((source) => [source.id, source]));

  const rows = OPEN_DATASETS.map((dataset) => {
    const source = sourceById.get(dataset.sourceId);
    const reflection = deriveReflection(dataset, lookup);
    const status = REFLECTION_STATUS[reflection.status];
    const license = COMMERCIAL_LABEL[dataset.license.commercialUse];
    const verification = VERIFICATION_LABEL[dataset.verification.status];
    const targets = [
      ...reflection.publishedMetricKeys.map((key) => `${key} (公開)`),
      ...reflection.pendingMetricKeys,
      ...reflection.publishedGisIds.map((id) => `${id} (公開)`),
      ...reflection.pendingGisIds,
    ];

    return {
      id: dataset.id,
      cells: [
        <div key="name">
          <a
            className="font-medium underline-offset-2 hover:underline"
            href={dataset.landingPageUrl}
            rel="noreferrer"
            target="_blank"
          >
            {dataset.name}
          </a>
          <div className="mt-1 max-w-xl text-xs text-muted-foreground">{dataset.description}</div>
        </div>,
        source?.name ?? dataset.sourceId,
        dataset.accessMethods.map((method) => ACCESS_LABEL[method] ?? method).join('・'),
        dataset.geographicLevels.map((level) => LEVEL_LABEL[level] ?? level).join('・'),
        <StatusBadge key="license" tone={license.tone} title={dataset.license.name}>
          {license.label}
        </StatusBadge>,
        dataset.stats47Uses.map((use) => USE_LABEL[use] ?? use).join('・'),
        <StatusBadge key="status" tone={status.tone} title={status.description}>
          {status.label}
        </StatusBadge>,
        targets.length > 0 ? (
          <div key="targets" className="max-w-56 text-xs">
            {targets.join('、')}
          </div>
        ) : (
          <span key="targets" className="text-muted-foreground">
            —
          </span>
        ),
        <div key="verification">
          <StatusBadge tone={verification.tone} title={dataset.verification.notes}>
            {verification.label}
          </StatusBadge>
          <div className="mt-1 text-xs text-muted-foreground">{dataset.verification.verifiedAt}</div>
        </div>,
      ],
      sort: [
        dataset.name,
        source?.name ?? dataset.sourceId,
        null,
        null,
        dataset.license.commercialUse,
        dataset.stats47Uses.join(','),
        STATUS_ORDER.indexOf(reflection.status),
        targets.length,
        dataset.verification.verifiedAt,
      ],
      search: `${dataset.id} ${dataset.name} ${source?.name ?? ''} ${dataset.sourceId} ${targets.join(' ')}`,
      facet: reflection.status,
      tone: dataset.verification.status === 'unavailable' ? ('bad' as const) : undefined,
    } satisfies GridRow;
  });

  const countOf = (status: ReflectionStatus) => rows.filter((row) => row.facet === status).length;
  const unverified = OPEN_DATASETS.filter(
    (dataset) => dataset.verification.status === 'unverified' || dataset.verification.status === 'unavailable',
  ).length;

  const sourceRows = OPEN_DATA_SOURCES.map((source) => {
    const verification = VERIFICATION_LABEL[source.status];
    return {
      id: source.id,
      cells: [
        <a
          key="name"
          className="font-medium underline-offset-2 hover:underline"
          href={source.homepageUrl}
          rel="noreferrer"
          target="_blank"
        >
          {source.name}
        </a>,
        source.publisher,
        SOURCE_KIND_LABEL[source.kind] ?? source.kind,
        source.datasetIds.length,
        <StatusBadge key="status" tone={verification.tone} title={source.notes}>
          {verification.label}
        </StatusBadge>,
        source.lastVerifiedAt,
      ],
      sort: [source.name, source.publisher, source.kind, source.datasetIds.length, source.status, source.lastVerifiedAt],
      search: `${source.id} ${source.name} ${source.publisher}`,
      facet: source.kind,
      tone: source.datasetIds.length === 0 ? ('warn' as const) : undefined,
    } satisfies GridRow;
  });

  return (
    <Stack gap="lg">
      <PageHeading title="外部データの台帳" source={datasetPath('open-data.datasets')} />
      <p className="text-sm text-muted-foreground">
        e-Stat 以外の政府・自治体オープンデータの台帳です。反映状況は台帳に書かず、
        台帳の参照先を指標の正本 (isActive) と GIS の台帳 (ランキング対象) に
        突き合わせて表示のたびに導いています。e-Stat の統計は月次データの台帳、
        国土数値情報は GIS の台帳が正本なので、ここには入っていません。
      </p>
      <Grid min="sm">
        <StatCard label="データセット" value={OPEN_DATASETS.length} />
        <StatCard label="公開中" value={countOf('published')} tone="good" />
        <StatCard label="未着手 (採用候補)" value={countOf('todo')} tone="warn" />
        <StatCard label="検証未了" value={unverified} tone={unverified > 0 ? 'warn' : undefined} />
      </Grid>

      <Section id="datasets" title="データセット" count={OPEN_DATASETS.length}>
        <DataGrid
          columns={[
            { id: 'name', header: '名称' },
            { id: 'source', header: '提供元', sortable: true },
            { id: 'access', header: '取得方式', nowrap: true },
            { id: 'level', header: '粒度' },
            { id: 'license', header: 'ライセンス', sortable: true, nowrap: true },
            { id: 'uses', header: '使い道', sortable: true },
            { id: 'status', header: '反映状況', sortable: true, nowrap: true },
            { id: 'targets', header: '反映先', sortable: true },
            { id: 'verification', header: '検証', sortable: true, nowrap: true },
          ]}
          rows={rows}
          facets={STATUS_ORDER.map((status) => ({
            value: status,
            label: REFLECTION_STATUS[status].label,
          }))}
          searchPlaceholder="名称・提供元・指標キーで絞り込み"
        />
      </Section>

      <Section
        id="sources"
        title="提供元"
        count={OPEN_DATA_SOURCES.length}
        note="データセットが 0 件の提供元は、まだ中身を登録していない (黄色の行)。"
      >
        <DataGrid
          columns={[
            { id: 'name', header: '名称', sortable: true },
            { id: 'publisher', header: '発行機関', sortable: true },
            { id: 'kind', header: '種類', sortable: true, nowrap: true },
            { id: 'count', header: 'データセット', numeric: true, sortable: true },
            { id: 'status', header: '検証', sortable: true, nowrap: true },
            { id: 'verifiedAt', header: '確認日', sortable: true, nowrap: true },
          ]}
          rows={sourceRows}
          facets={Object.entries(SOURCE_KIND_LABEL).map(([value, label]) => ({ value, label }))}
          searchPlaceholder="提供元・発行機関で絞り込み"
        />
      </Section>
    </Stack>
  );
}

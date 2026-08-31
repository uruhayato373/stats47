import Link from 'next/link';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@stats47/components/atoms/ui/table';
import { GIS_DATASETS } from '@stats47/gis/mlit-ksj';

import { Breadcrumbs, PageHeader, PageShell } from '@/components/layout';
import { SectionHeader } from '@/components/section';
import {
  getSurfaceCardClassName,
  SurfaceCard,
  SurfaceSection,
} from '@/components/surface';

import type { Metadata } from 'next';

type CatalogItem = {
  dataId: string;
  aliases: string[];
  name: string;
  geometryType: string | null;
  coverage: string | null;
  license: string | null;
  sourcePageUrl: string | null;
  registered: boolean;
  publicationPolicy: string;
  state: string;
  usedInAnalyses: string[];
  compliance: { publicMirrorPolicyMismatch: boolean };
  r2: {
    prefix: string | null;
    versions: string[];
    fileCount: number;
    completionManifestCount: number;
    expectedManifestCount: number | null;
    totalBytes: number;
    featureCount: number | null;
  };
};

type OpenDataItem = {
  id: string;
  sourceId: string;
  name: string;
  landingPageUrl: string;
  downloadUrl: string | null;
  hasGeometry: boolean;
  geometryTypes: string[];
  accessMethods: string[];
  formats: string[];
  license: { commercialUse: string };
  verification: { status: string };
  mirroredGisDataIds: string[];
  acquisitionState: string;
};

type GeoDataCatalog = {
  generatedAt: string;
  source: { inventoryMode: string };
  summary: {
    candidateCatalog: number;
    unionCatalog: number;
    registered: number;
    r2Acquired: number;
    registeredMissingR2: number;
    analysisSources: number;
    readyToAcquire: number;
    licenseReview: number;
    localOnly: number;
    sourceUrlComplete: number;
    complianceMismatches: number;
  };
  openDataCatalog: {
    sourceCount: number;
    datasetCount: number;
    geometryDatasetCount: number;
    mirroredViaKsj: number;
    adapterRequired: number;
    credentialsRequired?: number;
    actionRequired?: number;
    licenseReview: number;
    note: string;
    items: OpenDataItem[];
  };
  items: CatalogItem[];
};

const R2_BASE = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || 'https://storage.stats47.jp';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'GISデータカタログ | stats47 GeoAI',
  description:
    'stats47 GeoAIで管理する国土数値情報と政府オープンデータの取得、分析利用、公開条件を確認できます。',
  alternates: { canonical: '/geo/data-catalog' },
};

function fallbackCatalog(): GeoDataCatalog {
  const items: CatalogItem[] = GIS_DATASETS.map((item) => ({
    dataId: item.dataId,
    aliases: [...(item.candidateAliases ?? [])],
    name: item.name,
    geometryType: item.geometryType,
    coverage: item.coverage,
    license: item.license,
    sourcePageUrl: item.sourcePageUrl ?? null,
    registered: true,
    publicationPolicy:
      item.license === 'non-commercial'
        ? 'local-only'
        : item.license === 'cc-by-4.0-partial'
          ? 'review-required'
          : 'public-r2-eligible',
    state: 'catalogued',
    usedInAnalyses: [],
    compliance: { publicMirrorPolicyMismatch: false },
    r2: {
      prefix: null,
      versions: [],
      fileCount: 0,
      completionManifestCount: 0,
      expectedManifestCount: null,
      totalBytes: 0,
      featureCount: null,
    },
  }));
  return {
    generatedAt: '',
    source: { inventoryMode: 'git-fallback' },
    summary: {
      candidateCatalog: 126,
      unionCatalog: 126,
      registered: items.length,
      r2Acquired: 0,
      registeredMissingR2: items.length,
      analysisSources: 0,
      readyToAcquire: 0,
      licenseReview: items.filter((item) => item.publicationPolicy === 'review-required').length,
      localOnly: items.filter((item) => item.publicationPolicy === 'local-only').length,
      sourceUrlComplete: items.filter((item) => item.sourcePageUrl).length,
      complianceMismatches: 0,
    },
    openDataCatalog: {
      sourceCount: 0,
      datasetCount: 0,
      geometryDatasetCount: 0,
      mirroredViaKsj: 0,
      adapterRequired: 0,
      credentialsRequired: 0,
      actionRequired: 0,
      licenseReview: 0,
      note: '',
      items: [],
    },
    items,
  };
}

async function loadCatalog(): Promise<GeoDataCatalog> {
  try {
    const response = await fetch(`${R2_BASE}/app/geo/data-catalog/items.json?schema=2`, {
      next: { revalidate: 86400 },
    });
    if (!response.ok) return fallbackCatalog();
    const catalog = (await response.json()) as Partial<GeoDataCatalog>;
    return catalog.summary?.r2Acquired !== undefined ? (catalog as GeoDataCatalog) : fallbackCatalog();
  } catch {
    return fallbackCatalog();
  }
}

function bytes(value: number): string {
  if (value <= 0) return '未取得';
  if (value >= 1024 * 1024 * 1024) return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
  return `${(value / 1024 / 1024).toFixed(value >= 100 * 1024 * 1024 ? 0 : 1)} MB`;
}

const stateLabel: Record<string, string> = {
  acquired: 'R2取得済み',
  'analysis-source': '分析利用中',
  'ready-to-acquire': '取得実行可',
  'license-review': '利用条件確認',
  'local-only': '公開不可',
  'metadata-incomplete': 'メタ整備待ち',
  candidate: '候補',
  catalogued: '登録済み',
};

const openStateLabel: Record<string, string> = {
  'acquired-r2': 'R2取得済み',
  'mirrored-via-ksj': 'KSJ経由で取得済み',
  'credentials-required': 'APIキー待ち',
  'ready-to-acquire': '取得実行可',
  'adapter-required': 'API・タイル接続待ち',
  'research-reference': '調査参照用',
  'non-spatial': '非空間データ',
  'excluded-not-suitable': '対象外',
  'license-review': '利用条件確認',
  'source-resolution-required': '取得先特定待ち',
};

export default async function GeoDataCatalogPage() {
  const catalog = await loadCatalog();
  const registered = catalog.items.filter((item) => item.registered);
  const candidates = catalog.items.filter((item) => !item.registered);
  const openGeo = catalog.openDataCatalog.items.filter((item) => item.hasGeometry);

  return (
    <PageShell>
      <Breadcrumbs
        items={[
          { label: 'ホーム', href: '/' },
          { label: '地域分析', href: '/geo' },
          { label: 'GISデータカタログ' },
        ]}
      />
      <PageHeader
        eyebrow="GeoAI データ管理"
        title="GISデータカタログ"
        description="一次資料URL、配布版、R2実体、分析利用、公開条件を分けて管理します。『カタログにある』ことを『取得済み』とは扱いません。"
        stats={`KSJ登録 ${catalog.summary.registered} ・ R2取得 ${catalog.summary.r2Acquired} ・ 広域Geo候補 ${catalog.openDataCatalog.geometryDatasetCount}`}
        meta={catalog.generatedAt ? `R2実査 ${catalog.generatedAt.slice(0, 10)}` : 'git TSカタログ表示'}
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">国土数値情報候補</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{catalog.summary.candidateCatalog}</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">stats47登録</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{catalog.summary.registered}</p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">取得完了</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {catalog.summary.r2Acquired}/{catalog.summary.registered}
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs text-muted-foreground">広域Geoデータ候補</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">{catalog.openDataCatalog.geometryDatasetCount}</p>
        </SurfaceCard>
      </div>

      {catalog.summary.registeredMissingR2 > 0 ? (
        <SurfaceSection className="mb-6">
          <p className="text-sm font-semibold text-destructive">
            登録済みのうち取得完了条件を満たさないデータが {catalog.summary.registeredMissingR2} 件あります。
          </p>
        </SurfaceSection>
      ) : null}

      {catalog.summary.complianceMismatches > 0 ? (
        <SurfaceSection className="mb-6">
          <p className="text-sm font-semibold text-destructive">
            非商用データの既存公開ミラーが {catalog.summary.complianceMismatches} 件あります。公開停止または代替データへの移行が必要です。
          </p>
        </SurfaceSection>
      ) : null}

      {(catalog.openDataCatalog.actionRequired ?? 0) > 0 ? (
        <SurfaceSection className="mb-6">
          <p className="text-sm font-semibold">
            外部Geoデータの取得に追加対応が必要なものが {catalog.openDataCatalog.actionRequired} 件あります。
          </p>
        </SurfaceSection>
      ) : null}

      <SurfaceSection>
        <SectionHeader title="登録済み国土数値情報" hideRule />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          R2の実オブジェクトを毎回一覧化した結果です。取得状態と公開可否は別判定です。
          公開条件に不整合がある既存ミラーは警告し、自動削除や再公開をしません。
        </p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>データ</TableHead>
                <TableHead>形状・範囲</TableHead>
                <TableHead>公開条件</TableHead>
                <TableHead>R2実体</TableHead>
                <TableHead>GeoAI利用</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registered.map((item) => (
                <TableRow key={item.dataId}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    {item.sourcePageUrl ? (
                      <a className="text-xs text-primary underline" href={item.sourcePageUrl} target="_blank" rel="noopener noreferrer">
                        {item.dataId}・一次資料
                      </a>
                    ) : (
                      <code className="text-xs text-muted-foreground">{item.dataId}</code>
                    )}
                    {item.aliases.length > 0 ? (
                      <p className="text-xs text-muted-foreground">候補ID: {item.aliases.join(', ')}</p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.geometryType ?? '未確認'} / {item.coverage ?? '未確認'}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{item.license ?? '未確認'}</p>
                    {item.compliance.publicMirrorPolicyMismatch ? (
                      <p className="text-xs font-semibold text-destructive">既存公開ミラー要確認</p>
                    ) : null}
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium">{stateLabel[item.state] ?? item.state}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.r2.fileCount > 0
                        ? `${item.r2.fileCount} files / ${bytes(item.r2.totalBytes)} / v${item.r2.versions.join(', ')}`
                        : 'R2実体なし'}
                    </p>
                    {item.r2.expectedManifestCount !== null ? (
                      <p className="text-xs text-muted-foreground">
                        完了マニフェスト {item.r2.completionManifestCount}/{item.r2.expectedManifestCount}
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.usedInAnalyses.length > 0 ? item.usedInAnalyses.join(' / ') : '未使用'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SurfaceSection>

      <SurfaceSection className="mt-6">
        <SectionHeader title="政府オープンデータの広域Geo候補" hideRule />
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {catalog.openDataCatalog.sourceCount} 出典・{catalog.openDataCatalog.datasetCount} データセットのうち、位置情報を持つ {openGeo.length} 件です。
          API・タイルは接続アダプターが必要で、仕様書のExcelは観測値として取得済みに数えません。
        </p>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>データ</TableHead>
                <TableHead>形状・取得方法</TableHead>
                <TableHead>確認状態</TableHead>
                <TableHead>取得判定</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {openGeo.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <a className="text-xs text-primary underline" href={item.landingPageUrl} target="_blank" rel="noopener noreferrer">
                      {item.sourceId}・一次資料
                    </a>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {(item.geometryTypes.length > 0 ? item.geometryTypes : ['位置属性']).join(', ')} / {item.accessMethods.join(', ')}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {item.verification.status} / 商用 {item.license.commercialUse}
                  </TableCell>
                  <TableCell className="text-sm">
                    <p>{openStateLabel[item.acquisitionState] ?? item.acquisitionState}</p>
                    {item.mirroredGisDataIds.length > 0 ? (
                      <p className="text-xs text-muted-foreground">{item.mirroredGisDataIds.join(', ')}</p>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SurfaceSection>

      <details className={getSurfaceCardClassName({ className: 'mt-6' })}>
        <summary className="cursor-pointer font-semibold">未登録の国土数値情報候補 {candidates.length} 件</summary>
        <div className="mt-4 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>データ</TableHead>
                <TableHead>状態</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {candidates.map((item) => (
                <TableRow key={item.dataId}>
                  <TableCell>
                    {item.sourcePageUrl ? (
                      <a className="font-medium text-primary underline" href={item.sourcePageUrl} target="_blank" rel="noopener noreferrer">
                        {item.name} ({item.dataId})
                      </a>
                    ) : (
                      <span>{item.name} ({item.dataId})</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{stateLabel[item.state] ?? item.state}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </details>

      <p className="mt-6 text-sm text-muted-foreground">
        分析記事へ戻る: <Link className="font-medium text-primary underline" href="/geo">GeoAI地域分析</Link>
      </p>
    </PageShell>
  );
}

import Link from 'next/link';

import {
  geoAnalysisManifestKey,
  geoAnalysisPrefKey,
  type GeoAnalysisEvidenceManifest,
} from '@stats47/gis';

import { SectionHeader } from '@/components/section';
import { SurfaceCard, SurfaceSection } from '@/components/surface';

import { geoAnalysisPublicDataUrl } from '../lib/load-geo-analysis-evidence';

import type { GeoCrossAnalysisSlug } from '../lib/geo-cross-analysis';

interface Props {
  slug: GeoCrossAnalysisSlug;
  prefCode2: string;
  manifest: GeoAnalysisEvidenceManifest;
}

export function GeoContentPublicationSection({
  slug,
  prefCode2,
  manifest,
}: Props) {
  const aggregateKey = `app/geo/${slug}/item.json`;
  const manifestKey = geoAnalysisManifestKey(slug);
  const detailKey = geoAnalysisPrefKey(slug, prefCode2);

  return (
    <SurfaceSection id="article-data" className="mt-6 scroll-mt-24">
      <SectionHeader
        title="再現・検証データ"
        description="結論だけでなく、入力、空間処理、県別途中データ、保存則を同じ分析の証拠として公開しています。"
        hideRule
      />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SurfaceCard>
          <p className="text-xs font-medium text-muted-foreground">
            入力から結論まで
          </p>
          <p className="mt-1 text-lg font-bold">
            47県・保存則 {manifest.quality.conservationChecks}/47
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {new Set(manifest.inputs.map(input => input.layerId)).size}レイヤー・{manifest.inputs.length}入力ファイル / {manifest.stages.length}段階 / 最大
            {(manifest.quality.maxDetailBytes / 1_000_000).toFixed(2)}MB
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs font-medium text-muted-foreground">
            方法と限界
          </p>
          <Link
            className="mt-1 block font-bold text-primary underline"
            href="/geo/method"
          >
            空間処理の読み方
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            包含・距離・集計の条件を確認
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs font-medium text-muted-foreground">
            初期表示県の証拠
          </p>
          <Link
            className="mt-1 block font-bold text-primary underline"
            href={`/geo/data/${slug}/${prefCode2}`}
          >
            途中データを画面で確認
          </Link>
          <p className="mt-1 text-xs text-muted-foreground">
            入力レイヤーと判定結果を県別に確認
          </p>
        </SurfaceCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold">検証用データ</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <a
                className="font-medium text-primary underline"
                href={geoAnalysisPublicDataUrl(aggregateKey)}
              >
                47都道府県の集計JSON
              </a>
            </li>
            <li>
              <a
                className="font-medium text-primary underline"
                href={geoAnalysisPublicDataUrl(manifestKey)}
              >
                入力SHA・処理・検算manifest
              </a>
            </li>
            <li>
              <Link
                className="font-medium text-primary underline"
                href={`/geo/data/${slug}/${prefCode2}`}
              >
                初期表示県の途中データを画面で確認
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">
                JSONも取得可能
              </span>
            </li>
            <li>
              <a
                className="font-medium text-primary underline"
                href={geoAnalysisPublicDataUrl(detailKey)}
              >
                初期表示県の途中artifact JSON
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold">検証の順序</h3>
          <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>1. manifestで入力キー・版・SHA-256を確認</li>
            <li>2. 選択県の途中artifactで空間判定を確認</li>
            <li>3. 保存則と47県coverageを確認</li>
            <li>4. 最終集計JSONと画面の値を照合</li>
          </ol>
        </div>
      </div>

      <details className="mt-5 border-t pt-4">
        <summary className="cursor-pointer text-sm font-bold">
          lineageの全段階を見る
        </summary>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          {manifest.stages.map((stage, index) => (
            <li key={stage.id}>
              {index + 1}.{' '}
              <strong className="text-foreground">{stage.label}</strong> —{' '}
              {stage.operation}（{stage.outputs.length}出力）
            </li>
          ))}
        </ol>
      </details>
    </SurfaceSection>
  );
}

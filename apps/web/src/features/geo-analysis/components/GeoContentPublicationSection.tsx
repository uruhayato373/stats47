import Link from 'next/link';

import { BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE } from '@stats47/data-configs/business-plan';
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

const surfaceLabels = {
  ready: '利用可能',
  draft: '制作中',
  gated: '品質確認待ち',
} as const;

export function GeoContentPublicationSection({ slug, prefCode2, manifest }: Props) {
  const content = BUSINESS_PLAN_GEO_CONTENT_LIFECYCLE.find(
    (item) => item.analysisSlug === slug
  );
  if (!content) return null;
  const aggregateKey = `app/geo/${slug}/item.json`;
  const manifestKey = geoAnalysisManifestKey(slug);
  const detailKey = geoAnalysisPrefKey(slug, prefCode2);

  return (
    <SurfaceSection id="article-data" className="mt-6 scroll-mt-24">
      <SectionHeader
        title="記事制作データと公開経路"
        description="この分析を正典に、テーマ・県ページ・記事・SNS・有料の再利用物へ展開します。無料ページでは結論を公開し、有料物は再現手順と加工済み成果物に価値を置きます。"
        hideRule
      />

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <SurfaceCard>
          <p className="text-xs font-medium text-muted-foreground">入力から結論まで</p>
          <p className="mt-1 text-lg font-bold">
            47県・保存則 {manifest.quality.conservationChecks}/47
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {manifest.inputs.length}入力 / {manifest.stages.length}段階 / 最大
            {(manifest.quality.maxDetailBytes / 1_000_000).toFixed(2)}MB
          </p>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs font-medium text-muted-foreground">無料の公開先</p>
          <Link className="mt-1 block font-bold text-primary underline" href={content.free.canonicalPath}>
            Geo分析の正典
          </Link>
          <Link className="mt-1 block text-sm text-primary underline" href={content.free.methodPath}>
            方法・限界
          </Link>
        </SurfaceCard>
        <SurfaceCard>
          <p className="text-xs font-medium text-muted-foreground">有料の再利用物</p>
          <p className="mt-1 font-bold">{content.paid.readerOutcome}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            note ¥{content.paid.priceYen.toLocaleString('ja-JP')}・{surfaceLabels[content.paid.status]}
          </p>
        </SurfaceCard>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold">制作に使えるデータ</h3>
          <ul className="mt-2 space-y-2 text-sm">
            <li>
              <a className="font-medium text-primary underline" href={geoAnalysisPublicDataUrl(aggregateKey)}>
                47都道府県の集計JSON
              </a>
            </li>
            <li>
              <a className="font-medium text-primary underline" href={geoAnalysisPublicDataUrl(manifestKey)}>
                入力SHA・処理・検算manifest
              </a>
            </li>
            <li>
              <Link className="font-medium text-primary underline" href={`/geo/data/${slug}/${prefCode2}`}>
                選択県の途中データを画面で確認
              </Link>
              <span className="ml-2 text-xs text-muted-foreground">JSONも取得可能</span>
            </li>
            <li>
              <a className="font-medium text-primary underline" href={geoAnalysisPublicDataUrl(detailKey)}>
                選択県の途中artifact JSON
              </a>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-bold">1分析から派生する経路</h3>
          <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
            <li>1. このGeoページで問い・結論・地図・検算を公開</li>
            <li>2. {content.themeKeys.join(' / ')} のテーマと47県ページへ要約接続</li>
            <li>3. ブログ「{content.editorial.suggestedTitle}」で背景と読み方を解説</li>
            <li>4. SNSは発見1点からこの分析の該当段階へ送客</li>
            <li>5. 有料物は {content.paid.deliverables.join('・')} を提供</li>
          </ol>
        </div>
      </div>

      <details className="mt-5 border-t pt-4">
        <summary className="cursor-pointer text-sm font-bold">lineageの全段階を見る</summary>
        <ol className="mt-3 space-y-2 text-sm text-muted-foreground">
          {manifest.stages.map((stage, index) => (
            <li key={stage.id}>
              {index + 1}. <strong className="text-foreground">{stage.label}</strong> — {stage.operation}
              （{stage.outputs.length}出力）
            </li>
          ))}
        </ol>
      </details>
    </SurfaceSection>
  );
}

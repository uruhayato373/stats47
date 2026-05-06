import Link from "next/link";
import { notFound } from "next/navigation";

import { fetchFromR2AsJson } from "@stats47/r2-storage/server";

import { GisViewerClient } from "@/features/gis-catalog/components";
import { fetchGisDataset, fetchGisDatasets } from "@/features/gis-catalog/repository/gis-datasets-reader";
import type { KsjMeta } from "@/features/gis-catalog/types";

import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ dataId: string }>;
}

export const dynamicParams = true;

export async function generateStaticParams() {
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return [];
  }
  try {
    const datasets = await fetchGisDatasets();
    return datasets
      .filter((d) => d.isDownloaded && d.r2Prefix)
      .map((d) => ({ dataId: d.dataId }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { dataId } = await params;
  const dataset = await fetchGisDataset(dataId);
  if (!dataset) return { title: "GIS データ | stats47" };
  return {
    title: `${dataset.name} | GIS データカタログ | stats47`,
    robots: "noindex, follow",
  };
}

export default async function GisDatasetViewerPage({ params }: PageProps) {
  const { dataId } = await params;

  const dataset = await fetchGisDataset(dataId);
  if (!dataset || !dataset.isDownloaded || !dataset.r2Prefix) notFound();

  // _meta.json をサーバー側で取得（ファイル一覧 + サイズ情報）
  const meta = await fetchFromR2AsJson<KsjMeta>(`${dataset.r2Prefix}_meta.json`);

  const COVERAGE_LABELS: Record<string, string> = {
    national: "全国",
    prefecture: "都道府県別",
    mesh: "メッシュコード別",
    region: "地域別",
  };
  const GEOMETRY_LABELS: Record<string, string> = {
    point: "点", line: "線", polygon: "面", mesh: "メッシュ", mixed: "複合",
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      {/* ヘッダー */}
      <div className="mb-6">
        <p className="text-sm text-muted-foreground mb-1">
          <Link href="/gis" className="hover:underline">GIS データカタログ</Link>
          {" / "}
          <span>{dataset.dataId}</span>
        </p>
        <h1 className="text-2xl font-bold text-slate-900">{dataset.name}</h1>
        <p className="text-sm text-slate-500 mt-1">{dataset.nameEn}</p>
      </div>

      {/* メタ情報 */}
      <div className="flex flex-wrap gap-4 text-sm text-slate-600 mb-6 p-4 bg-slate-50 rounded-md border">
        <span><span className="text-slate-400 mr-1">ID</span>{dataset.dataId}</span>
        <span><span className="text-slate-400 mr-1">型</span>{GEOMETRY_LABELS[dataset.geometryType] ?? dataset.geometryType}</span>
        <span><span className="text-slate-400 mr-1">配布</span>{COVERAGE_LABELS[dataset.coverage] ?? dataset.coverage}</span>
        <span><span className="text-slate-400 mr-1">バージョン</span>{dataset.r2Version}</span>
        <span><span className="text-slate-400 mr-1">ライセンス</span>{dataset.license}</span>
        {meta && (
          <span>
            <span className="text-slate-400 mr-1">ファイル</span>
            {meta.files.length} 件 /{" "}
            {formatBytesStatic(meta.files.reduce((s, f) => s + f.sizeBytes, 0))} 合計
          </span>
        )}
      </div>

      {/* ビューア */}
      <GisViewerClient dataset={dataset} meta={meta} />

      {/* 帰属表示 */}
      {dataset.attribution && (
        <p className="mt-4 text-xs text-slate-400">
          出典: {dataset.attribution}
        </p>
      )}
    </main>
  );
}

function formatBytesStatic(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

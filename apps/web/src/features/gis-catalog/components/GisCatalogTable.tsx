import type { GisDatasetRow } from "../types";

const CATEGORY_LABELS: Record<string, string> = {
  land: "国土・自然",
  policy: "政策・行政区域",
  facility: "施設",
  transport: "交通",
  statistics: "統計",
};

const GEOMETRY_LABELS: Record<string, string> = {
  point: "点",
  line: "線",
  polygon: "面",
  mesh: "メッシュ",
  mixed: "複合",
};

const COVERAGE_LABELS: Record<string, string> = {
  national: "全国",
  prefecture: "都道府県別",
  mesh: "メッシュコード別",
  region: "地域別",
};

const LICENSE_LABELS: Record<string, string> = {
  "cc-by-4.0": "CC BY 4.0",
  "cc-by-4.0-partial": "CC BY 4.0（一部）",
  "commercial-ok": "商用可",
  "non-commercial": "非商用",
};

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes >= 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(0)}MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${bytes}B`;
}

interface Props {
  datasets: GisDatasetRow[];
}

export function GisCatalogTable({ datasets }: Props) {
  const categories = [...new Set(datasets.map((d) => d.category))].sort();
  const downloadedCount = datasets.filter((d) => d.isDownloaded).length;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        {datasets.length} データセット中 {downloadedCount} 件をローカルに変換済み
      </p>

      {categories.map((cat) => {
        const group = datasets.filter((d) => d.category === cat);
        return (
          <section key={cat}>
            <h2 className="text-base font-semibold text-slate-700 mb-2">
              {CATEGORY_LABELS[cat] ?? cat}
            </h2>
            <div className="border rounded-md overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium w-20">ID</th>
                    <th className="text-left px-3 py-2 font-medium">名称</th>
                    <th className="text-left px-3 py-2 font-medium w-20">型</th>
                    <th className="text-left px-3 py-2 font-medium w-28">配布</th>
                    <th className="text-left px-3 py-2 font-medium w-32">ライセンス</th>
                    <th className="text-left px-3 py-2 font-medium w-16">状態</th>
                    <th className="text-right px-3 py-2 font-medium w-16">ファイル</th>
                    <th className="text-right px-3 py-2 font-medium w-20">サイズ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.map((d) => (
                    <tr key={d.dataId} className="hover:bg-slate-50">
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {d.isDownloaded ? (
                          <a href={`/gis/${d.dataId}`} className="hover:underline text-blue-600">
                            {d.dataId}
                          </a>
                        ) : (
                          d.dataId
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-slate-900">{d.name}</span>
                        <span className="ml-2 text-xs text-muted-foreground hidden sm:inline">
                          {d.nameEn}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {GEOMETRY_LABELS[d.geometryType] ?? d.geometryType}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {COVERAGE_LABELS[d.coverage] ?? d.coverage}
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {LICENSE_LABELS[d.license] ?? d.license}
                      </td>
                      <td className="px-3 py-2">
                        {d.isDownloaded ? (
                          <span className="text-emerald-600 font-medium">✓</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {d.fileCount ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right text-slate-600">
                        {formatBytes(d.totalSizeBytes)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}
    </div>
  );
}

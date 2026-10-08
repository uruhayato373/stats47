import { LOW_ELEVATION_ATTRIBUTION, type GeoAnalysisEvidenceManifest } from '@stats47/gis';

const JST_DATE = new Intl.DateTimeFormat('ja-JP', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  timeZone: 'Asia/Tokyo',
});

/** 入力ファイルの取得日(JST)の最小〜最大。取得日時が記録されていなければnull。 */
export function lowElevationRetrievalPeriod(
  manifest: GeoAnalysisEvidenceManifest,
  layerId: string
): string | null {
  const times = manifest.inputs
    .filter((input) => input.layerId === layerId)
    .map((input) => (input.retrievedAt ? Date.parse(input.retrievedAt) : NaN));
  if (!times.length || times.some((time) => !Number.isFinite(time))) return null;
  const first = JST_DATE.format(new Date(Math.min(...times)));
  const last = JST_DATE.format(new Date(Math.max(...times)));
  return first === last ? first : `${first}〜${last}`;
}

/** 標高(G04-a)の承認番号付き原典表示と人口メッシュのCC BY 4.0表示、取得日、加工主体。 */
export function GeoLowElevationAttribution({
  manifest,
}: {
  manifest: GeoAnalysisEvidenceManifest;
}) {
  const elevation = lowElevationRetrievalPeriod(manifest, 'ksj-g04a-elevation-mesh-3rd');
  const population = lowElevationRetrievalPeriod(manifest, 'ipss-population-mesh-1km');
  return (
    <div data-testid="low-elevation-attribution">
      <h3 className="mt-5 text-sm font-bold">原典表示</h3>
      <ul className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
        <li>
          標高：国土交通省「国土数値情報 標高・傾斜度3次メッシュデータ」（2011年度版。原典は国土地理院「基盤地図情報
          数値標高モデル（10mメッシュ、250mメッシュ）」、データ基準日は2009年5月1日）。
          {LOW_ELEVATION_ATTRIBUTION['G04-a'].map((sentence) => (
            <span key={sentence} className="mt-1 block">
              「{sentence}」
            </span>
          ))}
        </li>
        <li>
          人口：{LOW_ELEVATION_ATTRIBUTION.mesh1000r6}。
        </li>
        <li>
          取得日：標高 {elevation ?? '記録なし'}、人口 {population ?? '記録なし'}
          （公式配布元から取得した日。上記の生成日とは別です）。
        </li>
        <li>
          加工：stats47が、両データの3次メッシュコードの完全一致で人口と標高を結合し、標高の区分ごとに人口を集計しました。
        </li>
      </ul>
    </div>
  );
}

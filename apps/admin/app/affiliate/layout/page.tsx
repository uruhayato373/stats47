import type { Metadata } from "next";
import Link from "next/link";

import { Cell, DataTable, PanelCard, Row, StatusBadge } from "@/components/admin-ui";
import { Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import {
  AD_LAYOUT_ROOT,
  type AdLayoutManifest,
  type AdLayoutShot,
  latestAdLayoutManifest,
  type PlacementDefinition,
  placementDefinitions,
} from "@/lib/server/ad-layout";
import { buttonVariants } from "@stats47/components";

export const metadata: Metadata = {
  title: "広告の配置 — stats47 管理コンソール",
};

export const dynamic = "force-dynamic";

/** 手置きの AdSense を出す境界 (apps/web の MANUAL_AD_DESKTOP_ONLY_CLASS = md:block と同じ 768px) */
const DESKTOP_MIN_WIDTH = 768;
/**
 * 右レールが本文の横に出る画面の幅。右レールは Shell の幅 988px 以上で出る (RAIL_AD_BESIDE_BODY_ONLY_CLASS)。
 * 撮影の幅 (390 / 768 / 1440) のうち 1440 だけがこれに当たる (サイドバー 256px を引いても 988px を超える)
 */
const RAIL_MIN_WIDTH = 1280;

const REGION_LABEL: Record<string, string> = { body: "本文", rail: "右レール" };
const DEVICE_LABEL: Record<string, string> = { desktop: "デスクトップ", mobile: "モバイル" };

function shotUrl(date: string, file: string) {
  return `/api/ad-layout/${encodeURIComponent(date)}/${encodeURIComponent(file)}`;
}

function deviceOf(width: number) {
  return width >= DESKTOP_MIN_WIDTH ? "desktop" : "mobile";
}

/**
 * 台帳と撮影の AdSense のユニットの違い (その幅で出るはずの行だけと比べる)。
 * 条件付きの行 (condition) は出ないことがあるので、写っていなくても「条件付き」として分ける。
 */
type ExpectedUnit = { unit: string | null; slot: string; slotName: string; condition: string | null };

/** その幅で出るはずの AdSense の枠。広告の段は枠ごとに分け、2 枠目以降は本文の幅で出たり出なかったりするので条件付きにする */
function expectedAdsense(shot: AdLayoutShot, defs: PlacementDefinition[]): ExpectedUnit[] {
  return defs
    .filter((d) => d.devices.includes(deviceOf(shot.width)) && (d.region !== "rail" || shot.width >= RAIL_MIN_WIDTH))
    .flatMap((d): ExpectedUnit[] => {
      if (d.provider === "adsense") return [{ unit: d.unit, slot: d.slot, slotName: d.slotName, condition: d.condition }];
      if (!d.cells) return [];
      return d.cells.flatMap((c, i) =>
        c.kind === "adsense"
          ? [{ unit: c.unit, slot: "adsense-body", slotName: d.slotName, condition: i === 0 ? d.condition : "段の 2 枠目以降 (本文の幅で出る)" }]
          : [],
      );
    });
}

function adsenseDiff(shot: AdLayoutShot, defs: PlacementDefinition[]) {
  const expected = expectedAdsense(shot, defs);
  // ユニットが分かる枠はユニットで、分からない枠 (ブログ本文など) は枠の種類で突き合わせる
  const remaining = shot.ads.filter((a) => a.kind === "adsense");
  const missing: ExpectedUnit[] = [];
  // ユニットを決めていない段の枠 (ブログの末尾など) は、名前の決まった枠を当てた後に本文の残りの AdSense を当てる
  const ordered = [...expected.filter((d) => !(d.slot === "adsense-body" && !d.unit)), ...expected.filter((d) => d.slot === "adsense-body" && !d.unit)];
  for (const d of ordered) {
    const i = remaining.findIndex((a) =>
      d.slot === "adsense-body" && !d.unit ? a.region === "body" : (a.unit ?? a.slotType) === (d.unit ?? d.slot),
    );
    if (i >= 0) remaining.splice(i, 1);
    else missing.push(d);
  }
  return { missing, extra: remaining.map((a) => a.unit ?? a.label) };
}

function filterHref(pageType?: string) {
  return `/affiliate/layout${pageType ? `?page=${encodeURIComponent(pageType)}` : ""}`;
}

function ShotSummary({ shot, defs }: { shot: AdLayoutShot; defs: PlacementDefinition[] }) {
  if (shot.error) return <StatusBadge tone="bad">撮れなかった: {shot.error}</StatusBadge>;
  const { missing, extra } = adsenseDiff(shot, defs);
  const hardMissing = missing.filter((d) => !d.condition);
  const pr = shot.ads.filter((a) => a.kind === "pr").length;
  return (
    <div className="flex flex-wrap gap-1">
      <StatusBadge tone="neutral">AdSense {shot.ads.length - pr}・PR {pr}</StatusBadge>
      {hardMissing.length > 0 ? <StatusBadge tone="warn">台帳にあり写っていない {hardMissing.map((d) => d.unit ?? d.slotName).join("・")}</StatusBadge> : null}
      {missing.length > hardMissing.length ? <StatusBadge tone="neutral">条件付きで出ていない {missing.length - hardMissing.length}</StatusBadge> : null}
      {extra.length > 0 ? <StatusBadge tone="warn">台帳に無い {extra.join("・")}</StatusBadge> : null}
      {shot.truncated ? <StatusBadge tone="neutral">上から {shot.imageHeight}px まで (全体 {shot.pageHeight}px)</StatusBadge> : null}
    </div>
  );
}

function PageTypePanel({ manifest, pageType, defs }: { manifest: AdLayoutManifest; pageType: AdLayoutManifest["pageTypes"][number]; defs: PlacementDefinition[] }) {
  const shots = manifest.widths.map((w) => manifest.shots.find((s) => s.pageType === pageType.id && s.width === w));
  return (
    <PanelCard id={pageType.id} title={`${pageType.label} (${pageType.id})`} description={pageType.url}>
      <div className="grid gap-3 lg:grid-cols-3">
        {manifest.widths.map((width, i) => {
          const shot = shots[i];
          return (
            <div key={width} className="flex min-w-0 flex-col gap-2">
              <div className="text-sm font-medium">{width}px</div>
              {shot ? <ShotSummary shot={shot} defs={defs} /> : <StatusBadge tone="neutral">未撮影</StatusBadge>}
              {shot?.image ? (
                <a href={shotUrl(manifest.date, shot.image)} target="_blank" rel="noreferrer" className="block max-h-[80vh] overflow-y-auto border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- ローカルの撮影画像をそのまま見せる */}
                  <img src={shotUrl(manifest.date, shot.image)} alt={`${pageType.label} ${width}px`} loading="lazy" className="block w-full" />
                </a>
              ) : null}
            </div>
          );
        })}
      </div>

      <DataTable columns={["幅", "種類", "ユニット・中身", "場所", "上端 y", "幅 × 高さ"]}>
        {shots.flatMap((shot) =>
          shot
            ? shot.ads.map((ad, i) => (
                <Row key={`${shot.width}-${i}`}>
                  <Cell nowrap>{shot.width}px</Cell>
                  <Cell nowrap>{ad.kind === "adsense" ? "AdSense" : "PR"}</Cell>
                  <Cell>{ad.label}</Cell>
                  <Cell nowrap muted>
                    {REGION_LABEL[ad.region] ?? ad.region}
                  </Cell>
                  <Cell nowrap muted>
                    {ad.y.toLocaleString()}px
                  </Cell>
                  <Cell nowrap muted>
                    {ad.width} × {ad.height}
                  </Cell>
                </Row>
              ))
            : [],
        )}
      </DataTable>

      <DataTable columns={["台帳の枠", "場所", "位置", "ユニット", "出す画面", "条件"]}>
        {defs.map((d, i) => (
          <Row key={`${d.slot}-${i}`}>
            <Cell nowrap>{d.slotName}</Cell>
            <Cell nowrap muted>
              {REGION_LABEL[d.region] ?? d.region}
            </Cell>
            <Cell>{d.position}</Cell>
            <Cell nowrap muted>
              {d.cells ? d.cells.map((c) => (c.kind === "adsense" ? (c.unit ?? "AdSense") : "PR")).join(" / ") : (d.unit ?? "—")}
            </Cell>
            <Cell nowrap muted>
              {d.devices.map((v) => DEVICE_LABEL[v] ?? v).join("・") || "—"}
            </Cell>
            <Cell muted>{d.condition ?? "—"}</Cell>
          </Row>
        ))}
      </DataTable>
    </PanelCard>
  );
}

/**
 * /affiliate/layout — 広告の配置をページの種類 × 画面の幅のスクショで見る。型 B (一覧): ページの種類ごとに 3 幅を横に並べ、
 * 下に撮影で見つけた枠と広告の枠の台帳 (config/ads/placements.json) の定義を並べる。読み取り専用。
 * 撮影は開発サーバーから `npx tsx .claude/scripts/ads/capture-ad-layout.ts` (.local/ad-layout/<日付>/)。
 */
export default async function AdLayoutPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const manifest = latestAdLayoutManifest();
  if (!manifest) {
    return (
      <>
        <PageHeading title="広告の配置" source={`${AD_LAYOUT_ROOT}/<日付>/manifest.json + config/ads/placements.json`} />
        <PanelCard title="まだ撮影していません">
          <p className="m-0 text-sm">
            開発サーバーを起動し (npm run dev:web)、撮影します (npx tsx .claude/scripts/ads/capture-ad-layout.ts)。
          </p>
        </PanelCard>
      </>
    );
  }

  const definitions = placementDefinitions();
  const pageFilter = manifest.pageTypes.some((p) => p.id === params.page) ? params.page : undefined;
  const pageTypes = manifest.pageTypes.filter((p) => !pageFilter || p.id === pageFilter);
  const failed = manifest.shots.filter((s) => s.error).length;

  return (
    <>
      <PageHeading title="広告の配置" source={`${AD_LAYOUT_ROOT}/${manifest.date}/manifest.json + config/ads/placements.json`} />
      <Stack>
        <p className="m-0 text-sm text-muted-foreground">
          {new Date(manifest.generatedAt).toLocaleString("ja-JP")} に {manifest.baseUrl} から撮影 ({manifest.shots.length} 枚
          {failed > 0 ? `・撮れなかった ${failed} 枚` : ""})。赤い枠は AdSense (開発中は代わりの表示)、橙の枠は PR。PR の括弧の中は出ている案件の名前。
          広告の段は本文の幅で枠の数が変わる (608px 未満 1 枠・608px 以上 2 枠・916px 以上 3 枠) ので、2 枠目以降は条件付きとして照らす。
          右レールの AdSense は本文の横に右レールが出る幅 ({RAIL_MIN_WIDTH}px 以上) だけで照らす。
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href={filterHref()} className={buttonVariants({ variant: pageFilter ? "outline" : "default", size: "sm" })}>
            全ての種類
          </Link>
          {manifest.pageTypes.map((p) => (
            <Link key={p.id} href={filterHref(p.id)} className={buttonVariants({ variant: p.id === pageFilter ? "default" : "outline", size: "sm" })}>
              {p.label}
            </Link>
          ))}
        </div>
        {pageTypes.map((p) => (
          <PageTypePanel key={p.id} manifest={manifest} pageType={p} defs={definitions[p.id] ?? []} />
        ))}
      </Stack>
    </>
  );
}

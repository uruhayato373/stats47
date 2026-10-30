import type { Metadata } from "next";
import Link from "next/link";

import { PanelCard, StatusBadge } from "@/components/admin-ui";
import { Stack } from "@/components/layout-primitives";
import { PageHeading } from "@/components/ops/primitives";
import { type LayoutScenario, layoutReviewManifest, LAYOUT_REVIEW_ROOT } from "@/lib/server/layout-review";
import { buttonVariants } from "@stats47/components";

export const metadata: Metadata = {
  title: "レイアウト確認 — stats47 管理コンソール",
};

export const dynamic = "force-dynamic";

const DEFAULT_WIDTH = 768;

const SCENARIO_LABEL: Record<LayoutScenario, string> = {
  now: "今のまま",
  hide: "案 1: 積まれた右レールの広告を出さない",
  row: "案 2: 本文のセルと同じ全幅の行にする",
};

function shotUrl(file: string) {
  return `/api/layout-review/${encodeURIComponent(file)}`;
}

function filterHref(width: number, page?: string) {
  return `/quality/layout-review?width=${width}${page ? `&page=${page}` : ""}`;
}

/**
 * 広告の配置を画面の幅ごとに目で確かめる。型 B (一覧): ページごとに、今のままと案 1・案 2 の撮影を横に並べる。
 * 撮影はローカルの開発サーバーから撮る (`npm run dev:web:ad-preview` のあと `npm run layout:review`)。
 */
export default async function LayoutReviewPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const manifest = layoutReviewManifest();
  if (!manifest) {
    return (
      <>
        <PageHeading title="レイアウト確認" source={LAYOUT_REVIEW_ROOT} />
        <PanelCard title="まだ撮影していません">
          <p className="m-0 text-sm">
            広告の在庫を代わりの広告で満たした開発サーバーを起動し (npm run dev:web:ad-preview)、撮影します (npm run layout:review)。
          </p>
        </PanelCard>
      </>
    );
  }

  const width = manifest.widths.includes(Number(params.width)) ? Number(params.width) : (manifest.widths.includes(DEFAULT_WIDTH) ? DEFAULT_WIDTH : manifest.widths[0]);
  const pageFilter = manifest.pages.some((p) => p.id === params.page) ? params.page : undefined;
  const pages = manifest.pages.filter((p) => !pageFilter || p.id === pageFilter);

  return (
    <>
      <PageHeading title="レイアウト確認" source={LAYOUT_REVIEW_ROOT} />
      <Stack>
        <p className="m-0 text-sm text-muted-foreground">
          {new Date(manifest.generatedAt).toLocaleString("ja-JP")} に {manifest.baseUrl} から撮影。赤い枠は AdSense の代わりの表示、橙の枠は PR のバナー。
          右レールが本文の下に積まれる幅だけ、案 1・案 2 を撮っています。
        </p>
        <div className="flex flex-wrap gap-2">
          {manifest.widths.map((w) => (
            <Link key={w} href={filterHref(w, pageFilter)} className={buttonVariants({ variant: w === width ? "default" : "outline", size: "sm" })}>
              {w}px
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={filterHref(width)} className={buttonVariants({ variant: pageFilter ? "outline" : "default", size: "sm" })}>
            全てのページ
          </Link>
          {manifest.pages.map((p) => (
            <Link key={p.id} href={filterHref(width, p.id)} className={buttonVariants({ variant: p.id === pageFilter ? "default" : "outline", size: "sm" })}>
              {p.label}
            </Link>
          ))}
        </div>
        {pages.map((p) => {
          const measure = manifest.measures.find((m) => m.page === p.id && m.width === width);
          const shots = manifest.shots.filter((s) => s.page === p.id && s.width === width);
          return (
            <PanelCard
              key={p.id}
              id={p.id}
              title={`${p.label} (${width}px)`}
              description={
                measure
                  ? `${p.path} · 本文の幅 ${measure.shellWidth ?? "—"}px · 本文の広告 ${measure.bodyAds} · 右レールの広告 ${measure.railAds}`
                  : p.path
              }
              action={
                measure ? (
                  <StatusBadge tone={measure.railStacked ? "warn" : "neutral"}>{measure.railStacked ? "右レールは本文の下" : "右レールは本文の横"}</StatusBadge>
                ) : null
              }
            >
              <div className="grid gap-3 lg:grid-cols-3">
                {shots.map((shot) => (
                  <div key={shot.file} className="flex min-w-0 flex-col gap-1">
                    <a href={shotUrl(shot.file)} target="_blank" rel="noreferrer" className="text-xs text-muted-foreground underline underline-offset-4">
                      {SCENARIO_LABEL[shot.scenario]}
                    </a>
                    <div className="max-h-[80vh] overflow-y-auto border">
                      {/* eslint-disable-next-line @next/next/no-img-element -- ローカルの撮影画像をそのまま見せる */}
                      <img src={shotUrl(shot.file)} alt={`${p.label} ${width}px ${SCENARIO_LABEL[shot.scenario]}`} loading="lazy" className="block w-full" />
                    </div>
                  </div>
                ))}
              </div>
            </PanelCard>
          );
        })}
      </Stack>
    </>
  );
}

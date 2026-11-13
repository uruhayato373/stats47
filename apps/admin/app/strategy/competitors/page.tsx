import Link from "next/link";
import { DatabaseIcon, EllipsisIcon, HandshakeIcon, MapIcon, StoreIcon } from "lucide-react";

import { Alert, AlertDescription, Button, NativeSelect, NativeSelectOption, buttonVariants } from "@stats47/components";

import { Cell, DataGrid, DataTable, Row, StatCard, StatusBadge, type GridColumn, type Tone } from "@/components/admin-ui";
import { Grid, Section } from "@/components/layout-primitives";
import { ErrorNote, PageHeading } from "@/components/ops/primitives";
import { COMPETITOR_CATEGORIES, categoryLabel, platformLabel, type CompetitorCategory, type CompetitorListing, type FilterOption } from "@/lib/competitor-scan";
import { COMPETITOR_SCAN_DOC, COMPETITOR_SCAN_PATH, competitorScan } from "@/lib/server/competitor-scan";
import { docHref } from "@/lib/server/domains";

export const dynamic = "force-dynamic";
export const metadata = { title: "競合の観測 — stats47 admin" };

const ROUTE = "/strategy/competitors";
const LINK = "font-medium underline-offset-4 hover:underline";

const CATEGORY_TONE: Record<CompetitorCategory, Tone> = { "stats-data": "info", map: "good", commission: "warn", other: "neutral", unclassified: "bad" };
const CATEGORY_NOTE = Object.fromEntries(COMPETITOR_CATEGORIES.map((c) => [c.id, c.description])) as Record<CompetitorCategory, string>;

const yen = (value: number | null) => (value === null ? "未確認" : `¥${value.toLocaleString("ja-JP")}`);
const signed = (value: number | null) => (value === null ? "—" : value > 0 ? `+${value.toLocaleString("ja-JP")}` : value === 0 ? "±0" : value.toLocaleString("ja-JP"));

/** 販売面の名前。共有の Cell は折り返しを ! で指定していて nowrap が効かないので、中身の側で折り返しを止める */
function PlatformName({ id }: { id: string }) {
  return <span className="whitespace-nowrap">{platformLabel(id)}</span>;
}

/** 価格の幅。取れた金額が 1 つだけなら幅にしない */
const priceRange = (min: number | null, max: number | null) => (min === max ? yen(min) : `${yen(min)}〜${yen(max)}`);

/** 出品の題名・出品者・URL。URL は CSV の値なので http(s) のときだけリンクにする */
function ListingCell({ row }: { row: CompetitorListing }) {
  return (
    <div className="flex min-w-56 flex-col gap-0.5">
      <span className="font-medium">{row.title}</span>
      {row.seller ? <span className="text-xs text-muted-foreground">出品者: {row.seller}</span> : null}
      {/^https?:\/\//.test(row.url) ? (
        <a className="break-all text-xs text-muted-foreground underline-offset-4 hover:underline" href={row.url} target="_blank" rel="noreferrer">
          {row.url.replace(/^https?:\/\//, "")}
        </a>
      ) : (
        <span className="break-all text-xs text-muted-foreground">{row.url}</span>
      )}
    </div>
  );
}

/** 関心の目安。取れなかった値は 0 と見分けられるよう「未取得」と書く */
function Interest({ row }: { row: CompetitorListing }) {
  if (row.interestValue === null) return <span className="text-muted-foreground">未取得</span>;
  return (
    <>
      {row.interestValue.toLocaleString("ja-JP")} <span className="text-xs text-muted-foreground">{row.interestMetric}</span>
    </>
  );
}

function CategoryBadge({ category }: { category: CompetitorCategory }) {
  return (
    <StatusBadge tone={CATEGORY_TONE[category]} title={CATEGORY_NOTE[category]}>
      {categoryLabel(category)}
    </StatusBadge>
  );
}

function FilterSelect({ name, label, value, options }: { name: string; label: string; value: string | null; options: FilterOption[] }) {
  return (
    <NativeSelect name={name} defaultValue={value ?? ""} aria-label={`${label}で絞り込み`} size="sm" className="max-w-full">
      <NativeSelectOption value="">{label}: すべて</NativeSelectOption>
      {options.map((option) => (
        <NativeSelectOption key={option.id} value={option.id}>
          {option.label} ({option.count})
        </NativeSelectOption>
      ))}
    </NativeSelect>
  );
}

/** 競合の観測 (型 B: 一覧)。注記 → 絞り込み → 分類ごとの件数 → 販売面ごとの件数 → 関心の目安の上位 → 全出品。読み取り専用 */
export default async function CompetitorScanPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const { view, error } = competitorScan({ platform: params.platform, query: params.query, category: params.category });
  if (!view) {
    return (
      <>
        <PageHeading title="競合の観測" source={COMPETITOR_SCAN_PATH} />
        <ErrorNote error={error ?? "unknown error"} />
      </>
    );
  }

  const filtered = Object.values(view.filter).some((value) => value !== null);
  const latest = view.observedDates.at(-1) ?? "—";
  const top = view.platforms.flatMap((platform) => platform.top);
  const columns: GridColumn[] = [
    { id: "platform", header: "販売面", nowrap: true, sortable: true },
    { id: "listing", header: "出品", sortable: true },
    { id: "category", header: "分類", nowrap: true, sortable: true },
    { id: "query", header: "検索語", sortable: true },
    { id: "price", header: "価格", numeric: true, nowrap: true, sortable: true },
    { id: "interest", header: "関心の目安", numeric: true, nowrap: true, sortable: true },
    ...(view.hasTrend ? [{ id: "delta", header: "前回からの増減", numeric: true, nowrap: true, sortable: true }] : []),
    { id: "observed", header: "観測日", nowrap: true, sortable: true },
  ];

  return (
    <>
      <PageHeading title="競合の観測" source={COMPETITOR_SCAN_PATH}>
        <p className="max-w-4xl text-sm text-muted-foreground">
          他の販売者が出している統計データ・地図・受注の出品を、販売面ごとに並べる。観測日は {view.observedDates.join("・")}、出品は {view.total} 件。再調査は同じ CSV
          に行を追記する。自分の商品は{" "}
          <Link href="/strategy/products" className={LINK}>
            商品の台帳
          </Link>
          。
        </p>
      </PageHeading>

      <Alert>
        <AlertDescription>
          <p>
            関心の目安 (BOOTH の欲しいもの・ココナラの評価数・note のスキ) は販売数ではない。販売面ごとに数え方が違うので、順位は同じ販売面の中だけで読む。
          </p>
          <p>ランサーズは検索画面が人間確認で取れず、Web 検索で見つかった出品だけを載せている。関心の目安は未取得で、金額が未確認の出品がある。</p>
          <p>
            無料の公的サービスや書籍を含めた層ごとの表と読み取りは <Link href={docHref(COMPETITOR_SCAN_DOC)}>収益化戦略 §2.2「販売されている競合」</Link> にある。
          </p>
        </AlertDescription>
      </Alert>

      <form action={ROUTE} className="flex flex-wrap items-center gap-2">
        <FilterSelect name="platform" label="販売面" value={view.filter.platform} options={view.options.platforms} />
        <FilterSelect name="category" label="分類" value={view.filter.category} options={view.options.categories} />
        <FilterSelect name="query" label="検索語" value={view.filter.query} options={view.options.queries} />
        <Button type="submit" variant="outline" size="sm">
          絞り込む
        </Button>
        {filtered ? (
          <Link href={ROUTE} className={buttonVariants({ variant: "ghost", size: "sm" })}>
            絞り込みを解除
          </Link>
        ) : null}
      </form>

      <Grid min="sm">
        <StatCard label="出品" icon={<StoreIcon />} value={view.listings.length} sub={filtered ? `全 ${view.total} 件のうち` : `最新の観測日 ${latest}`} />
        <StatCard label="統計データ" icon={<DatabaseIcon />} value={view.byCategory["stats-data"]} sub="公開データの表・データセット" />
        <StatCard label="地図" icon={<MapIcon />} value={view.byCategory.map} sub="既製の地図データ・素材・ツール" />
        <StatCard label="受注" icon={<HandshakeIcon />} value={view.byCategory.commission} sub="依頼ごとに作る作業" />
        <StatCard
          label="その他"
          icon={<EllipsisIcon />}
          value={view.byCategory.other + view.byCategory.unclassified}
          sub={view.byCategory.unclassified ? `うち未分類 ${view.byCategory.unclassified} 件` : "統計・地図・データ作業でない"}
          tone={view.byCategory.unclassified ? "warn" : "neutral"}
        />
      </Grid>

      <Section title="販売面ごとの件数" count={view.platforms.length} note="価格は観測日の表示価格。価格の幅は金額が取れた出品だけで出す。">
        <DataTable columns={["販売面", "出品", "統計データ", "地図", "受注", "その他", "価格の幅", "関心の目安の数え方"]}>
          {view.platforms.map((platform) => (
            <Row key={platform.id}>
              <Cell>
                <PlatformName id={platform.id} />
              </Cell>
              <Cell nowrap>{platform.count}</Cell>
              <Cell nowrap>{platform.byCategory["stats-data"]}</Cell>
              <Cell nowrap>{platform.byCategory.map}</Cell>
              <Cell nowrap>{platform.byCategory.commission}</Cell>
              <Cell nowrap>{platform.byCategory.other + platform.byCategory.unclassified}</Cell>
              <Cell nowrap>
                {priceRange(platform.priceMinYen, platform.priceMaxYen)}
                {platform.priced < platform.count ? <span className="ml-1 text-xs text-muted-foreground">({platform.count - platform.priced} 件は金額未確認)</span> : null}
              </Cell>
              <Cell muted>{platform.interestMetrics.join("・")}</Cell>
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section
        title="関心の目安の上位"
        count={top.length}
        note={
          view.hasTrend
            ? "販売面ごとに上位 5 件。増減は同じ URL の 1 つ前の観測との差で、どちらかが未取得のときは出さない。"
            : `販売面ごとに上位 5 件。観測日が 1 つ (${latest}) なので、前回からの増減はまだ出ない。再調査の行を追記すると、同じ URL の差を出す。`
        }
      >
        <DataTable columns={["販売面", "出品", "分類", "価格", "関心の目安", ...(view.hasTrend ? ["前回からの増減"] : [])]}>
          {top.map((row) => (
            <Row key={row.url}>
              <Cell>
                <PlatformName id={row.platform} />
              </Cell>
              <Cell>
                <ListingCell row={row} />
              </Cell>
              <Cell nowrap>
                <CategoryBadge category={row.category} />
              </Cell>
              <Cell nowrap>{yen(row.priceYen)}</Cell>
              <Cell nowrap>
                <Interest row={row} />
              </Cell>
              {view.hasTrend ? <Cell nowrap>{signed(row.interestDelta)}</Cell> : null}
            </Row>
          ))}
        </DataTable>
      </Section>

      <Section title="観測した出品" count={view.listings.length} note="見出しを押すと並べ替える。関心の目安は販売面をまたいで比べない。">
        <DataGrid
          columns={columns}
          searchPlaceholder="題名・出品者・検索語で絞り込み…"
          rows={view.listings.map((row) => ({
            id: row.url,
            search: [row.title, row.seller, row.query, platformLabel(row.platform), categoryLabel(row.category)].join(" "),
            cells: [
              <PlatformName key="platform" id={row.platform} />,
              <ListingCell key="listing" row={row} />,
              <CategoryBadge key="category" category={row.category} />,
              row.query,
              yen(row.priceYen),
              <Interest key="interest" row={row} />,
              ...(view.hasTrend ? [signed(row.interestDelta)] : []),
              row.observedAt,
            ],
            sort: [platformLabel(row.platform), row.title, categoryLabel(row.category), row.query, row.priceYen, row.interestValue, ...(view.hasTrend ? [row.interestDelta] : []), row.observedAt],
          }))}
        />
      </Section>
    </>
  );
}

'use client';

import { useMemo, useState } from 'react';

import { useRouter } from 'next/navigation';

import { REGIONS, PREFECTURE_LIST_2DIGIT, to5DigitPrefCode } from '@stats47/area';
import { buttonVariants, cn } from '@stats47/components';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@stats47/components/atoms/ui/breadcrumb';
import { Input } from '@stats47/components/atoms/ui/input';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@stats47/components/atoms/ui/sheet';
import { hrefFor } from '@stats47/data-configs/content/href';
import { ChevronDown, MapPin } from 'lucide-react';

import Link from '@/components/atoms/SiteLink';
import { RailNavRow } from '@/components/surface';

import { trackNavClick } from '@/lib/analytics/events';

import { themeHref } from '../config/theme-href';

import { useThemePrefecture } from './ThemePrefectureContext';
import { CRUMB_TRIGGER_CLASS, ThemeSwitcher, type ThemeSwitcherTheme } from './ThemeSwitcher';

const PREFECTURE_NAME = new Map(PREFECTURE_LIST_2DIGIT.map((p) => [to5DigitPrefCode(p.code), p.name]));

/** 地域の Sheet の段。どの段から開いたかで、最初に見せる段を変える */
type RegionLevel = 'national' | 'prefecture' | 'city';

interface CityOption {
  code: string;
  /** 県名を外した名前 */
  name: string;
}

interface Props {
  themeKey: string;
  themes: readonly ThemeSwitcherTheme[];
  /** 今のページが 1 つの県のページ (`/areas/県/テーマ`) のときの県 */
  areaContext?: { areaCode: string };
  /** 県ごとのページ (`/areas/県/テーマ`) を持つテーマか。持たないテーマは県を `?pref=` で選ぶ */
  hasAreaPages: boolean;
  /** 同じ主題の市区町村・全国のページ (無い主語は渡さない) */
  scopeHrefs: { municipalities?: string; japan?: string };
  /** 県内の市区町村を比べるページ (`/areas/県/テーマ/cities`) を持つテーマか */
  hasMunicipalityPages?: boolean;
  /**
   * 今のページ。prefectures = テーマ・県のページ / japan = 全国の推移 (`/japan/テーマ`) /
   * municipalities = 全国の市区町村を比べる (`/municipalities/themes/テーマ`。県を選ぶと、その県内の比較へ移る) /
   * prefecture-municipalities = 県内の市区町村を比べる (別の県を選ぶと、その県の同じ比較へ移る)
   */
  current?: 'prefectures' | 'japan' | 'municipalities' | 'prefecture-municipalities' | 'city';
  /** 今のページが 1 つの市区町村×テーマ (`/areas/県/cities/市/テーマ`) のときの市区町村 */
  city?: CityOption;
  /** 地域の Sheet に出す、今の県の市区町村 (サーバーが渡す。全国 1,913 件をブラウザに送らない) */
  prefectureCities?: readonly CityOption[];
}

/**
 * テーマページの地域・テーマの選び方 (2026-10-31 オーナー決定 IA-REGION-THEME-01)。
 *
 * パンくず「ホーム › 全国 ⌄ › 兵庫県 ⌄ › 労働・賃金 ⌄」の各段と、右端のアイコン (地域・テーマ) から Sheet を開く。
 * 旧: 地域単位のリンク・テーマのボタン・県の Select を並べた帯 (「47都道府県」が意味違いで 2 回出ていた)。
 * 地域の Sheet は 全国 (全国の推移・47 都道府県を比べる) → 都道府県 (名前で探す・地方別) → 市区町村 の段に並べ、
 * そのテーマで作れないページは選択肢に出さない。移り先 URL と計測 (nav_click の theme_region) は旧の帯と同じ。
 */
export function ThemeRegionNav({
  themeKey,
  themes,
  areaContext,
  hasAreaPages,
  hasMunicipalityPages = false,
  scopeHrefs,
  current = 'prefectures',
  city,
  prefectureCities = [],
}: Props) {
  const { selectedPrefectureCode, setSelected } = useThemePrefecture();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState<RegionLevel>('national');
  const [query, setQuery] = useState('');
  const [cityQuery, setCityQuery] = useState('');

  const prefectureCode = areaContext?.areaCode ?? selectedPrefectureCode ?? null;
  const prefectureName = prefectureCode ? PREFECTURE_NAME.get(prefectureCode) : undefined;

  const openAt = (next: RegionLevel) => {
    setLevel(next);
    setQuery('');
    setCityQuery('');
    setOpen(true);
  };

  const cityHref = (code: string) =>
    hrefFor('city-theme', { areaCode: prefectureCode ?? '', cityCode: code, themeSlug: themeKey });
  const filteredCities = prefectureCities.filter((c) => !cityQuery.trim() || c.name.includes(cityQuery.trim()));
  const citiesHref = (code: string) => hrefFor('area-theme-cities', { areaCode: code, themeSlug: themeKey });
  const prefectureHref = (code: string) =>
    (current === 'prefecture-municipalities' || current === 'municipalities') && hasMunicipalityPages
      ? citiesHref(code)
      : hasAreaPages
        ? hrefFor('area-theme', { areaCode: code, themeSlug: themeKey })
        : `${themeHref(themeKey)}?pref=${code}`;

  const choosePrefecture = (code: string | null) => {
    const href = code ? prefectureHref(code) : themeHref(themeKey);
    trackNavClick({ surface: 'theme_region', label: code ?? 'all', href });
    setOpen(false);
    // 県ごとのページを持たないテーマは同じページのまま県を切り替える (旧 PrefectureSelect と同じ)
    if (!hasAreaPages && !areaContext && current === 'prefectures') setSelected(code);
    else router.push(href);
  };

  const groups = useMemo(() => {
    const q = query.trim();
    return REGIONS.map((region) => ({
      label: region.regionName,
      prefectures: region.prefectures
        .map((code) => ({ code, name: PREFECTURE_NAME.get(code) ?? code }))
        .filter((p) => !q || p.name.includes(q)),
    })).filter((g) => g.prefectures.length > 0);
  }, [query]);

  return (
    <div className="flex items-center justify-between gap-2">
      <Breadcrumb className="min-w-0">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <button type="button" className={CRUMB_TRIGGER_CLASS} onClick={() => openAt('national')} aria-label="地域を変える (今: 全国)">
              全国
              <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
            </button>
          </BreadcrumbItem>
          {prefectureName && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <button type="button" className={CRUMB_TRIGGER_CLASS} onClick={() => openAt('prefecture')} aria-label={`都道府県を変える (今: ${prefectureName})`}>
                  {prefectureName}
                  <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
                </button>
              </BreadcrumbItem>
            </>
          )}
          {city && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <button type="button" className={CRUMB_TRIGGER_CLASS} onClick={() => openAt('city')} aria-label={`市区町村を変える (今: ${city.name})`}>
                  {city.name}
                  <ChevronDown aria-hidden className="size-3.5 text-muted-foreground" />
                </button>
              </BreadcrumbItem>
            </>
          )}
          <BreadcrumbSeparator />
          <BreadcrumbItem className="min-w-0">
            <ThemeSwitcher themes={themes} currentThemeKey={themeKey} areaContext={areaContext} trigger="crumb" />
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          aria-label="地域を変える"
          title="地域を変える"
          onClick={() => openAt(city ? 'city' : prefectureName ? 'prefecture' : 'national')}
          className={buttonVariants({ variant: 'outline', size: 'icon-sm' })}
        >
          <MapPin aria-hidden />
        </button>
        <ThemeSwitcher themes={themes} currentThemeKey={themeKey} areaContext={areaContext} trigger="icon" />
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        {/* サイトの上端のヘッダー (sticky・z-200) と Cookie 同意 (z-[1100]) より前に出す。Sheet の既定は z-50 */}
        <SheetContent side="right" className="z-[1200]! overflow-y-auto">
          <SheetHeader>
            <SheetTitle>地域を選ぶ</SheetTitle>
            <SheetDescription>選ぶと、そのページへ移ります</SheetDescription>
          </SheetHeader>
          <div className="flex flex-col gap-5 px-4 pb-6">
            {level === 'national' && (
              <nav aria-label="全国">
                <p className="mb-1 text-xs font-medium text-muted-foreground">全国</p>
                {scopeHrefs.japan && (
                  <RailNavRow href={scopeHrefs.japan} active={current === 'japan'} chevron={false} trailing="日本全体" data-nav-surface="theme_region">
                    全国の推移
                  </RailNavRow>
                )}
                <RailNavRow
                  href={themeHref(themeKey)}
                  active={current === 'prefectures' && !prefectureCode}
                  chevron={false}
                  trailing="ランキング・地図"
                  onClick={(event) => {
                    event.preventDefault();
                    choosePrefecture(null);
                  }}
                >
                  47 都道府県を比べる
                </RailNavRow>
                {scopeHrefs.municipalities && (
                  <RailNavRow
                    href={scopeHrefs.municipalities}
                    active={current === 'municipalities'}
                    chevron={false}
                    trailing="全国の市区町村"
                    data-nav-surface="theme_region"
                  >
                    市区町村を比べる
                  </RailNavRow>
                )}
              </nav>
            )}
            {prefectureCode && prefectureName && hasAreaPages && (
              <nav aria-label={prefectureName}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{prefectureName}</p>
                <RailNavRow
                  href={hrefFor('area-theme', { areaCode: prefectureCode, themeSlug: themeKey })}
                  active={current === 'prefectures'}
                  chevron={false}
                  trailing="県のページ"
                  data-nav-surface="theme_region"
                >
                  {prefectureName}の全体
                </RailNavRow>
                {hasMunicipalityPages && (
                  <RailNavRow
                    href={citiesHref(prefectureCode)}
                    active={current === 'prefecture-municipalities'}
                    chevron={false}
                    trailing="県内の比較"
                    data-nav-surface="theme_region"
                  >
                    {prefectureName}の市区町村を比べる
                  </RailNavRow>
                )}
              </nav>
            )}
            {prefectureName && hasMunicipalityPages && prefectureCities.length > 0 && (
              <section aria-label={`${prefectureName}の市区町村`}>
                <p className="mb-1 text-xs font-medium text-muted-foreground">{prefectureName}の市区町村を詳しく見る</p>
                <Input
                  type="search"
                  value={cityQuery}
                  onChange={(event) => setCityQuery(event.target.value)}
                  placeholder="市区町村名で探す (例: 西宮)"
                  aria-label="市区町村名で探す"
                  className="mb-2"
                />
                <div className="grid max-h-64 grid-cols-3 gap-1 overflow-y-auto">
                  {filteredCities.map((c) => (
                    <Link
                      key={c.code}
                      href={cityHref(c.code)}
                      aria-current={c.code === city?.code ? 'page' : undefined}
                      data-nav-surface="theme_region"
                      className={cn(
                        buttonVariants({ variant: c.code === city?.code ? 'default' : 'outline', size: 'sm' }),
                        'px-1 text-xs'
                      )}
                    >
                      {c.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
            <section aria-label="都道府県">
              <p className="mb-1 text-xs font-medium text-muted-foreground">1 つの県を詳しく見る</p>
              <Input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="県名で探す (例: 兵庫)"
                aria-label="県名で探す"
                className="mb-3"
              />
              <div className="flex flex-col gap-3">
                {groups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-1 text-xs text-muted-foreground">{group.label}</p>
                    <div className="grid grid-cols-4 gap-1">
                      {group.prefectures.map((p) => (
                        <Link
                          key={p.code}
                          href={prefectureHref(p.code)}
                          aria-current={p.code === prefectureCode ? 'page' : undefined}
                          onClick={(event) => {
                            event.preventDefault();
                            choosePrefecture(p.code);
                          }}
                          className={cn(
                            buttonVariants({ variant: p.code === prefectureCode ? 'default' : 'outline', size: 'sm' }),
                            'px-1 text-xs'
                          )}
                        >
                          {p.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
                {groups.length === 0 && <p className="text-sm text-muted-foreground">「{query}」に当たる県がありません</p>}
              </div>
            </section>
            {level !== 'national' && (
              <nav aria-label="全国">
                <p className="mb-1 text-xs font-medium text-muted-foreground">全国</p>
                <RailNavRow
                  href={themeHref(themeKey)}
                  chevron={false}
                  trailing="ランキング・地図"
                  onClick={(event) => {
                    event.preventDefault();
                    choosePrefecture(null);
                  }}
                >
                  47 都道府県を比べる
                </RailNavRow>
                {scopeHrefs.japan && (
                  <RailNavRow href={scopeHrefs.japan} chevron={false} trailing="日本全体" data-nav-surface="theme_region">
                    全国の推移
                  </RailNavRow>
                )}
              </nav>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

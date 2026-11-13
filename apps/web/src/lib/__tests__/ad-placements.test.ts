// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import placements from '../../../../../data/ads/placements.json';
import { AFFILIATE_ADS } from '../../../scripts/affiliate-ads-data';
import { adSlotType } from '../ad-placements';

/**
 * 広告の枠の台帳 (data/ads/placements.json) とコードの照合 (2026-10-29 新設。同日ランキングを載せて一般化)。
 *
 * 台帳は「どの枠を、どのページの、どこに置くか」の正本。コードと別々に直すとずれるので、次をここで止める:
 *  (a) 置き方の目印 (marker) が、そのファイル (source) に台帳と同じ順である
 *  (b) 台帳の枠の部品をファイルに直に置くなら、台帳に載っている (載っていない枠を足さない)
 *  (c) 同じファイルで続く枠の間には内容がある。隣り合わせは knownAdjacentReason の例外だけで、直ったら例外も消す
 *  (d) 本文の AdSense は上限まで / 登録の大きさは台帳の語彙にある / 箱は本番の実測のまま
 */

const ROOT = path.resolve(__dirname, '../../../../..');
const read = (rel: string) => readFileSync(path.join(ROOT, rel), 'utf8');

type Placement = (typeof placements.pages)[keyof typeof placements.pages][number] & {
  knownAdjacentReason?: string;
  adsenseSlot?: string;
  scopes?: string[];
  cells?: { kind: string; adsenseSlot?: string }[];
};
const PAGES = placements.pages as Record<string, Placement[]>;
/**
 * 1 つの実際のページとして見る単位。地域の単位 (scopes) を持つページの種類 (テーマ: 全国・県別・日本・市区町村。2026-11-12 オーナー決定で
 * 1 つの種類にまとめた) は、単位ごとに別のページなので「種類@単位」に分ける。その単位で出る枠 (scopes が無いか、単位を含む) だけを入れる
 */
const SCOPED_PAGES: Record<string, Placement[]> = Object.fromEntries(
  Object.entries(PAGES).flatMap(([page, entries]) => {
    const scopes = [...new Set(entries.flatMap((e) => e.scopes ?? []))];
    if (scopes.length === 0) return [[page, entries]];
    return scopes.map((scope) => [`${page}@${scope}`, entries.filter((e) => !e.scopes || e.scopes.includes(scope))]);
  }),
);
const SLOT_COMPONENTS = new Set(placements.slotTypes.map((slot) => slot.component));
/** 広告を描く部品 (隣り合わせの判定で「内容」に数えない) */
const AD_COMPONENTS = new Set([
  ...SLOT_COMPONENTS,
  'AdSenseAd', 'BannerAd', 'AffiliateAdSlot', 'SidebarPromoBanner',
  // 本文の広告のセル (広告を包むだけで、内容には数えない)
  'AdCell',
]);

/**
 * 特定の指標でしか描かれないカード。隣り合わせの判定で内容に数えない (ほとんどのページで何も描かないため)。
 * 港湾の地図は港湾の指標だけ。2026-10-29 に、これを区切りに数えて PR と右レールの最後の AdSense の隣り合わせを見落とした
 */
const RARELY_RENDERED = new Set(['PortStatisticsMapCard']);

/** 置き方ごとに、ファイルの中の目印の位置を引く */
function locate(list: Placement[]) {
  return list.map((placement) => {
    const source = read(placement.source);
    return { placement, source, index: source.indexOf(placement.marker) };
  });
}

describe('広告の枠の台帳 (data/ads/placements.json)', () => {
  it('ページの置き方が指す枠の種類は台帳にある', () => {
    for (const [page, list] of Object.entries(PAGES)) {
      for (const placement of list) expect(() => adSlotType(placement.slot), `${page}: ${placement.slot}`).not.toThrow();
    }
  });

  it.each(Object.keys(PAGES))('%s: 目印がファイルにあり、同じファイルの中で台帳と同じ順に並ぶ', (page) => {
    const located = locate(PAGES[page]);
    for (const { placement, index } of located) {
      expect(index, `${placement.source} に ${placement.marker} が無い`).toBeGreaterThanOrEqual(0);
    }
    for (let i = 1; i < located.length; i++) {
      if (located[i].placement.source !== located[i - 1].placement.source) continue;
      expect(located[i].index, `${located[i].placement.marker} が前の枠より前にある`).toBeGreaterThan(located[i - 1].index);
    }
  });

  it.each(Object.keys(PAGES))('%s: ファイルに直に置いた台帳の枠の部品は、どれも台帳に載っている', (page) => {
    const sources = [...new Set(PAGES[page].map((p) => p.source))];
    for (const rel of sources) {
      const source = read(rel);
      const markers = PAGES[page].filter((p) => p.source === rel).map((p) => source.indexOf(p.marker));
      for (const match of source.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)) {
        if (!SLOT_COMPONENTS.has(match[1])) continue;
        const at = match.index ?? 0;
        // 目印は部品のタグか、その直後の属性 (slotId・position) にある
        expect(markers.some((m) => m >= at && m <= at + 400), `${rel} の <${match[1]}> が台帳に無い`).toBe(true);
      }
    }
  });

  it.each(Object.keys(SCOPED_PAGES))('%s: 続く枠の間に内容がある (隣り合わせは理由付きの例外だけ)', (page) => {
    const located = locate(SCOPED_PAGES[page]);
    for (let i = 1; i < located.length; i++) {
      const prev = located[i - 1];
      const cur = located[i];
      if (cur.placement.region !== prev.placement.region) continue;
      // 同じファイルなら 2 つの目印の間。別のファイル (右レールの最後に別のファイルが枠を足す) なら、前のファイルの目印より後ろ全部
      const between =
        cur.placement.source === prev.placement.source
          ? cur.source.slice(prev.index + prev.placement.marker.length, cur.index)
          : prev.source.slice(prev.index + prev.placement.marker.length);
      // 内容 = 広告ではない部品のタグか、広告ではない節の差し込み ({sections.relatedRankings} など。名前に affiliate を含む節は広告)
      // 描画関数の呼び出し (renderChapter など) も内容に数える (テーマの章の間に広告の段を入れる。2026-11-03)
      const content = [
        ...[...between.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].filter((m) => !AD_COMPONENTS.has(m[1]) && !RARELY_RENDERED.has(m[1])),
        ...between.matchAll(/\brender[A-Z][A-Za-z0-9]*\(/g),
        ...[...between.matchAll(/\{sections\.([A-Za-z0-9]+)\}/g)].filter((m) => !/affiliate|adRow/i.test(m[1])),
      ];
      const adjacent = content.length === 0;
      const label = `${page}: ${prev.placement.marker} → ${cur.placement.marker}`;
      if (adjacent) expect(cur.placement.knownAdjacentReason, `${label} が隣り合わせ`).toBeTruthy();
      // 直ったのに例外が残っていたら、例外を消す (例外を増やさない・残さない)
      else expect(cur.placement.knownAdjacentReason, `${label} は隣り合わせではない。knownAdjacentReason を消す`).toBeUndefined();
    }
  });

  // 本文の AdSense の数の上限 (1 ページ 4 枠) は 2026-11-12 オーナー決定で撤廃した。手置きの数だけでは自動広告を含めた
  // 実際の広告の量を表さないため。量はスマホの広告密度 (本文の高さに対する広告の高さ・自動広告込み。Better Ads Standards の
  // 30%) を本番で測って判断する (backlog ADSENSE-FORMAT-EXPERIMENT-01)

  it('登録されている広告の大きさは、すべて台帳の大きさの語彙に載っている', () => {
    const vocabulary = new Map(placements.sizes.map((s) => [s.size, s]));
    for (const ad of AFFILIATE_ADS.filter((a) => a.isActive !== false)) {
      const size = ad.adType === 'banner' ? `${ad.width}x${ad.height}` : 'text';
      const entry = vocabulary.get(size);
      expect(entry, `${ad.id} の大きさ ${size} が台帳に無い`).toBeDefined();
      // 判断待ち・退役の大きさは、対象の登録を台帳に名指しする (知らないうちに増えない)
      if (entry && entry.status !== 'standard') expect(entry.adIds, `${ad.id} (${size})`).toContain(ad.id);
    }
  });

  // 2026-10-30: 台帳がテーマとランキングしか持たず、ブログ・ハブの枠が台帳の箱を使わず小さく確保されていた。
  // 台帳の枠の部品を置いたファイルは、枠の部品そのもの (features/ads・AdSense の部品) を除いてすべて台帳の source に載せる
  it('台帳の枠の部品を置いたファイルは、どれも台帳のページの置き方に載っている', () => {
    const sources = new Set(Object.values(PAGES).flat().map((p) => p.source));
    const componentFiles = /^apps\/web\/src\/(features\/ads\/components\/|lib\/google-adsense\/)/;
    // 節を組み立てるだけのファイル。置き場所は台帳の {sections.adRowMid} / {sections.adRowFooter} / {sections.adRowEnd} (RankingPageContentSections)
    const sectionBuilders = new Set([
      'apps/web/src/features/ranking/components/RankingKeyPage/RankingPageClientShell.tsx',
    ]);
    const unlisted: string[] = [];
    const walk = (dir: string) => {
      for (const entry of readdirSync(path.join(ROOT, dir), { withFileTypes: true })) {
        const rel = `${dir}/${entry.name}`;
        if (entry.isDirectory()) {
          if (entry.name !== '__tests__') walk(rel);
          continue;
        }
        if (!rel.endsWith('.tsx') || componentFiles.test(rel) || sectionBuilders.has(rel) || sources.has(rel)) continue;
        const source = read(rel);
        if ([...source.matchAll(/<([A-Z][A-Za-z0-9]*)\b/g)].some((m) => SLOT_COMPONENTS.has(m[1]))) unlisted.push(rel);
      }
    };
    walk('apps/web/src');
    expect(unlisted, '台帳の data/ads/placements.json の pages に載せる').toEqual([]);
  });

  // 2026-10-31 オーナー決定: AdSense は全て 300×250 の固定の大きさ。幅に合わせて伸びる広告は、同日の本番の実測で
  // 最大 1200×600・積まれた右レールで 928×280・モバイルの関連コンテンツ型で 308×1503 まで広がっていた。
  // 2026-11-12 オーナー決定の例外: ランキングの解説の後の 1 枠だけ幅いっぱい。広がりすぎないよう幅の上限を必ず持つ
  const RESPONSIVE_ADSENSE_SLOT_IDS = new Set(['adsense-body-responsive']);
  // 2026-11-12 オーナー決定の例外: 右レールの最後の追従する縦長。Google の追従広告の条件 (幅 300px 以下・PC だけ) に収める
  const STICKY_RAIL_ADSENSE_SLOT_IDS = new Set(['adsense-rail-sticky']);
  it('AdSense の枠は、例外の幅いっぱいの枠と追従する縦長を除いて 300×250 の固定の大きさ', () => {
    const adsense = placements.slotTypes.filter((slot) => slot.provider === 'adsense');
    expect(adsense.length).toBeGreaterThan(0);
    for (const slot of adsense) {
      const box = adSlotType(slot.id).box;
      if (RESPONSIVE_ADSENSE_SLOT_IDS.has(slot.id)) {
        expect(box.width, slot.id).toBe('full');
        expect(box.maxWidth, `${slot.id} は幅の上限を持つ`).toBeGreaterThan(0);
        continue;
      }
      // 2026-11-12 オーナー決定の例外: 記事の一覧の中のインフィード広告。一覧の行の幅いっぱいで、大きさは AdSense が行に合わせて決める
      if (slot.id === 'adsense-infeed') {
        expect(box.width, slot.id).toBe('full');
        expect(slot.accepts, slot.id).toEqual(['adsense:infeed']);
        continue;
      }
      if (STICKY_RAIL_ADSENSE_SLOT_IDS.has(slot.id)) {
        expect(box, slot.id).toEqual({ width: 300, height: 600 });
        expect(adSlotType(slot.id).devices, `${slot.id} は PC だけ`).toEqual(['desktop']);
        continue;
      }
      expect(box, slot.id).toEqual({ width: 300, height: 250 });
    }
  });

  // 2026-11-13: 追従する広告は親の高さの中でしか動けない。PageShell の右レールに置く RailStack は、レールの列 (本文と同じ高さ) まで
  // 伸ばさないと追従しない (分野のページで実測。ArticleShell は右レール自身が flex の列なので対象外)
  it('PageShell の右レールで追従する広告を置くページは、RailStack を rail:h-full で伸ばす', () => {
    const sources = [...new Set(Object.values(PAGES).flat().filter((p) => p.slot === 'adsense-rail-sticky').map((p) => p.source))];
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      const code = read(source);
      if (!/<PageShell[^>]*rightRail=/.test(code)) continue;
      expect(code, source).toMatch(/<RailStack className="[^"]*rail:h-full/);
    }
  });

  // 2026-11-03 オーナー決定: 全ページのモバイルの本文に AdSense を 1 枠以上出す (自動広告なしで再開したので、手置きが無いと 0 枠になる)。
  // 広告の段はモバイルで先頭の 1 枠だけが出るので、先頭が AdSense の段か、モバイルにも出す AdSense の枠を数える
  it.each(Object.keys(SCOPED_PAGES))('%s: モバイルの本文に AdSense が 1 枠以上出る', (page) => {
    const mobileAdsense = SCOPED_PAGES[page].filter((p) => {
      if (p.region !== 'body') return false;
      const type = adSlotType(p.slot);
      const devices = (p as { devices?: readonly string[] }).devices ?? type.devices;
      if (!devices.includes('mobile')) return false;
      return p.slot === 'ad-row' ? p.cells?.[0]?.kind === 'adsense' : type.provider === 'adsense';
    });
    expect(mobileAdsense.length, `${page} はモバイルの本文に AdSense が無い (段の先頭を AdSense にする)`).toBeGreaterThan(0);
  });

  // 2026-11-03 オーナー決定: 右レールの AdSense は右レールが本文の横にあるときだけ出す。本文の下に回るとページの最後に積まれて見られず、
  // 本文の最後の広告とも隣り合う (トップで実際に起きた)。右レールの AdSense を描く 2 つの部品が同じクラスで隠すことを固定する
  it('右レールの AdSense は本文の横にあるときだけ出す', () => {
    expect(adSlotType('adsense-rail-rect')).toMatchObject({ devices: ['desktop'] });
    for (const rel of ['apps/web/src/features/ads/components/slots/RailAdSlot.tsx', 'apps/web/src/features/ads/components/AffiliateAdSlot.tsx']) {
      expect(read(rel), rel).toContain('RAIL_AD_BESIDE_BODY_ONLY_CLASS');
    }
    expect(read('apps/web/src/features/ads/constants/manual-ad-policy.ts')).toContain(
      'export const RAIL_AD_BESIDE_BODY_ONLY_CLASS = "hidden rail:block"',
    );
  });

  // 2026-11-03: 広告の段は枠ごとに別の AdSense ユニットを使う (同じユニットを 1 ページで重ねない。ADSENSE-SLOT-DEDUPE-01)
  it.each(Object.keys(SCOPED_PAGES))('%s: 同じ AdSense のユニットを 1 ページで重ねない', (page) => {
    const units = SCOPED_PAGES[page].flatMap((p) => [p.adsenseSlot, ...(p.cells ?? []).map((cell) => cell.adsenseSlot)]).filter(Boolean);
    expect(new Set(units).size, units.join(', ')).toBe(units.length);
  });
});

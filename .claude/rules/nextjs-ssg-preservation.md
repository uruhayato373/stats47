# Next.js App Router SSG 保全ルール

`apps/web` の Next.js App Router で **Server Components から `cookies()` / `headers()` / `draftMode()` を呼ぶ位置を誤ると、SSG が崩れて Cloudflare Workers 上で 500 を返す**。本ルールはその防止策。

## 大原則

**`layout.tsx` または `layout.tsx` から render される Server Component で `cookies()` / `headers()` / `draftMode()` を呼んではならない**。これらの dynamic 関数を呼ぶと、Next.js は対象 route segment 以下を **force-dynamic 化** し、SSG 対象だったページ（`generateStaticParams` 持ち）も実行時 SSR に切り替わる。Cloudflare Workers では一部 SSG 前提の最適化が崩れて 500 になる事例あり（2026-05-10 EXP-004 revert: commit `ebad87c2`）。

## 失敗事例（再発させてはならない）

### EXP-004 (2026-05-10) — async layout + cookies() で全 ranking 詳細が 500

```typescript
// ❌ 失敗パターン: layout.tsx
import { cookies } from "next/headers";
export default async function RootLayout({ children }) {
  const cookieStore = await cookies();
  const consent = cookieStore.get("stats47_consent")?.value;
  return <html>...<CookieConsentBanner serverConsent={consent} />...</html>;
}
```

結果: `apps/web/src/app/ranking/[rankingKey]/page.tsx` の SSG が崩れ全 ranking 詳細ページが 500。commit `ebad87c2` で revert。

### EXP-005 (2026-05-16 未然防止) — async Server Component を layout から render

```typescript
// ❌ 失敗パターン: CookieConsentBanner.tsx (layout から render される)
import { cookies } from "next/headers";
export async function CookieConsentBanner() {
  const cookieStore = await cookies();
  const consent = cookieStore.get("stats47_consent")?.value;
  if (consent) return null;
  return <CookieConsentBannerClient />;
}

// layout.tsx (sync) — 一見セーフに見えるが、async child が cookies() を呼んだ時点で
// 全 route segment が dynamic 化されて SSG が崩れる
export default function RootLayout({ children }) {
  return <html>...<CookieConsentBanner />...</html>;
}
```

`layout.tsx` が sync でも、layout 配下の Server Component が `cookies()` を呼べば dynamic-ness は親に伝播し、結果は EXP-004 と同じ。**「layout に置かれた dynamic 関数」と等価**と考える。

## 正しいパターン

### パターン A: SSR で常に同じ HTML を返し、Client で表示判定する

```typescript
// CookieConsentBanner.tsx (sync Server Component)
export function CookieConsentBanner() {
  return <CookieConsentBannerClient />;
}

// CookieConsentBannerClient.tsx ("use client")
export function CookieConsentBannerClient() {
  const [mounted, setMounted] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  useEffect(() => {
    const consent = document.cookie.match(/stats47_consent=([^;]+)/)?.[1];
    if (consent === "granted" || consent === "denied") {
      setDismissed(true);
      return;
    }
    setMounted(true);
  }, []);
  if (dismissed) return null;
  return <div style={{ visibility: mounted ? "visible" : "hidden" }}>...</div>;
}
```

- SSR HTML は常に同じ（visibility:hidden の div）→ SSG 維持
- Lighthouse LCP candidate scoring から visibility:hidden 要素は除外される → A1 効果は得られる
- 同意済みユーザーには hydration 後すぐに `dismissed=true` で null 返却

### パターン B: middleware で header に乗せる（必要なら）

サーバー側で本当に banner HTML を抑制したい場合は `middleware.ts` で `stats47_consent` を読み、`x-banner-suppressed` header を inject。Server Component 側で `headers()` を呼ぶことになるが、これも layout で使えば SSG が崩れる点は同じ。**page.tsx の動的 route 配下に限定し、SSG ページには波及させない**こと。

### パターン C: layout を分割して dynamic を局所化

dynamic な部分を別の child layout に切り出し、影響範囲を route segment レベルに閉じ込める。例: `app/(dynamic)/dashboard/layout.tsx` で `cookies()` を使い、`app/(static)/ranking/[rankingKey]/page.tsx` には影響させない。

## チェックリスト（Server Component を新規追加・修正する前に）

- [ ] このコンポーネントは `apps/web/src/app/layout.tsx` から（間接的にでも）render されるか？
- [ ] YES なら、`cookies()` / `headers()` / `draftMode()` を呼んでいないか？
- [ ] dynamic 関数が必要なら、layout ではなく **動的 route の page.tsx** に限定できないか？
- [ ] SSG ページ（`generateStaticParams` 持ち page）の挙動を `next build` で確認したか？
- [ ] Cloudflare Pages デプロイ前にローカル `next build` が `○ Static` として該当ページを出しているか確認したか？

## 失敗事例: R2 依存ページに generateStaticParams を付けると notFound が永久固着 (2026-06-22)

**R2 snapshot を読んで描画する動的 route に `generateStaticParams` を付けてはならない。** 付けると
そのページは `● (SSG)` として **ビルド時に prerender** されるが、`next build` 時点では R2 を読めない
(Worker binding が無い・S3 creds も公開 URL も build env に渡らない)。R2 read が null/throw に落ちると
ページは **notFound として prerender** され、**この OpenNext 構成では ISR 再生成が効かない**ため
(`x-nextjs-stale-time: 4294967294` = 実質無限)、再デプロイまで「〜が見つかりません」が**永久配信**される。

### 症状 (本番で確認)

- `/ranking/<key>` 全件が「ランキングが見つかりません」(HTTP 200・タイトルだけ fallback)
- `/areas/<code>` が「地域の特徴が見つかりません」、`/areas/<code>/cities/<city>` が「市区町村が見つかりません」
- レスポンスヘッダ: `x-nextjs-prerender: 1` / `x-nextjs-cache: STALE` / `x-nextjs-stale-time: 4294967294`
- 一方 `/` (force-dynamic)・`/category/<key>`・`/areas/<code>/<themeSlug>` (generateStaticParams 無し=`ƒ`) は正常
  → **ランタイムの R2 binding は正常**。問題は「ビルド時に焼かれた notFound が固着」しているページに限定

### 原因の連鎖

1. `generateStaticParams` が静的キー列 (`KNOWN_RANKING_KEYS` / 47県 / `PHASE_1_SSG_CITIES`) を返す → 全件 `● SSG`
2. ビルド時のページ描画で R2 read (`readRankingItemFromR2` 等) が `ok(null)` を返す
   (`isNextProductionBuild()` ガード or 空 miniflare R2) → `notFound()` で prerender
3. ISR が効かないため、その notFound prerender が再デプロイまで配信され続ける

### 正しいパターン (R2 依存の動的 route)

**`generateStaticParams` を付けず `revalidate` だけ置く** → `ƒ`(オンデマンド ISR)。ランタイムに R2 を
読んで初回描画 → 結果を ISR キャッシュ。`category` / `areas/[areaCode]/[themeSlug]` がこの方式で正常稼働。

```typescript
// ✅ R2 を読む動的 route: generateStaticParams を付けない
export const revalidate = 86400;   // ƒ (オンデマンド) になり、ランタイムで R2 を読む
// ❌ export const generateStaticParams = ...   // ● SSG 化 → build 時 R2 不可 → notFound 固着

// 例外: blog/[slug]・survey/[surveyKey] は generateStaticParams を持つが、ビルド時に
// R2 を読んで GOOD な内容を prerender できる (build ガードが無い) ため `● SSG` のままで正常。
// 「build 時に実データを読めるか」で判定する。読めないなら ƒ にする。
```

> SSG にしたい (build 時に R2 を読んで静的化) 場合は、build env に R2 read 経路を与える必要があるが、
> 全件 (例: ranking 2575 件) を build で読むと generateStaticParams が肥大化し build が重くなる (不採用)。
> R2 依存ページは原則 `ƒ` オンデマンド ISR を採用する。

## 検証コマンド

```bash
# ローカルで SSG / Dynamic 区分を確認
cd apps/web && npm run build 2>&1 | grep -E "Route|○|ƒ|Static|Dynamic" | head -50

# R2 依存ページ (ranking/[rankingKey]・areas/[areaCode]・areas/[areaCode]/cities/[cityCode]) は
# ƒ (Dynamic) であること。● (SSG) になっていたら generateStaticParams 混入 → notFound 固着の再発。
#
# 本番でデプロイ後に notFound 固着が無いか実測:
curl -s -A "Mozilla/5.0 (compatible; Googlebot/2.1)" https://stats47.jp/ranking/annual-sunshine-duration \
  | grep -o '<title>[^<]*</title>'   # 「ランキングが見つかりません」なら固着
```

`next build` で R2 依存ページが `● (Static)` になっていれば、generateStaticParams の混入 = notFound 固着の再発。
(逆に cookies()/headers() の混入は静的コンテンツページを `ƒ` 化する別事象 — 上の cookies ルールを参照)

### 多層の機械検知 (3 層)

「全ページを叩く」必要はない。障害は **per-route-template** で起きる (ある route の全ページが同時に死ぬ) ため、
**route ごとに代表 1 件**で全インシデントを捕捉できる。notFound は HTTP **200** を返すので
**status ではなく `<title>` の content** を見ること (status だけ見る warm-cache はすり抜けた)。

| 層 | タイミング | ツール | 性質 |
|---|---|---|---|
| ① 静的ガード | PR / pre-commit (**build 前**) | `node .claude/scripts/lib/check-r2-route-ssg.cjs` | 既知 R2 route への generateStaticParams 再混入。env 非依存・即時。route リストは手動保守 |
| ② **prerender scan (主)** | **deploy 前 (build 後)** | `bash .github/scripts/check-prerender-notfound.sh apps/web` | **最も汎用的・精密**。prerender HTML の `<title>` を直接走査。原因/route 非依存・新 route 自動カバー・誤検知ゼロ |
| ③ スモークテスト | deploy 後 (workflow gate) | `bash .github/scripts/smoke-test-routes.sh [BASE_URL]` | 本番の live content を route 代表 1 件ずつ検査。runtime 障害も拾う |

- **② が本命の機械チェック**。`deploy-workers.yml` の build 後・deploy 前に gate 配線済 → notFound prerender が
  あれば deploy をブロック (broken 版を本番に出さない)。実証: 3472 prerender を走査し壊れた 52 件 (areas 47 +
  ranking 5) だけ検知、blog/survey/正常 ranking は素通り (誤検知ゼロ)。
- ① は build 不要で速いが route を手動保守。③ は deploy 後だが runtime 障害 (例: areaType 不一致) も拾える。
- preview URL があれば ③ をデプロイ前にも使える: `bash .github/scripts/smoke-test-routes.sh https://<preview>`

### なぜ ESLint (per-file lint) では精密に弾けないか

「`generateStaticParams` + R2 reader import」を ESLint で弾く案は **誤検知する**。`blog/[slug]` `survey/[surveyKey]`
も同じ表面パターン (generateStaticParams + R2 読み + `● SSG`) を持つが、**build 時に R2 を読めて GOOD title で
prerender されるため安全**。安全/危険の差は「build 時 render が notFound を返すか」という**意味的差**で、
per-file の静的解析では見えない。→ **ビルド産物の `<title>` を観測する ② が唯一精密**(GOOD title は素通り、
notFound title だけ弾く)。lint で early feedback が欲しい範囲は ① (既知 route の手動リスト) で補う。

### ローカル build での再現性

- `areas/[areaCode]` 系は **getAreaProfileAction が build 時 null を返す**ため、ローカル build でも notFound
  prerender される → ② はローカル `next build` 出力でも検知できる。
- `ranking/[rankingKey]` 系は `apps/web/.env.development` の `R2_PUBLIC_FETCH_URL` で**ローカルは R2 を読めて
  GOOD prerender** になり再現しない。**CI build (R2 不可)** でのみ全件 notFound 化する → ② を CI で走らせるのが要。

## 関連

- 失敗 commit: `ebad87c2 fix: revert EXP-004 layout async cookies() — ranking pages 500 fix` (2026-05-10)
- 失敗事例 (本ファイル §generateStaticParams 固着): 2026-06-22 — ranking 全件 + areas/cities が notFound 固着
- 関連 memory: `feedback_nextjs_ssg_cookies.md` / `feedback_cloudflare_workers_env_r2_skip.md` / `feedback_home_pure_ssg_r2_empty.md`

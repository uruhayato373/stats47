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

## 検証コマンド

```bash
# ローカルで SSG / Dynamic 区分を確認
cd apps/web && npm run build 2>&1 | grep -E "Route|○|ƒ|Static|Dynamic" | head -50

# ranking/[rankingKey] が ○ Static (SSG) のままか確認
# ƒ Dynamic に変わっていたら本ルール違反
```

`next build` 出力で `○ (Static)` が `ƒ (Dynamic)` になっていれば、cookies()/headers() の流入経路が混入している。

## 関連

- 失敗 commit: `ebad87c2 fix: revert EXP-004 layout async cookies() — ranking pages 500 fix` (2026-05-10)
- 改善策カタログ: `docs/04_レビュー/performance-report/psi-improvement-strategy-2026-05-16.md` §3.A.A1
- auto memory: `feedback_nextjs_ssg_cookies.md`

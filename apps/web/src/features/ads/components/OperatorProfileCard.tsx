import Link from "next/link";

import { SurfaceCard } from "@/components/surface";

/**
 * 運営者 (KAZU) のプロフィール専用カード。
 *
 * OperatorPromoCard (プロフィール + アフィリエイトバナー一体型) からプロフィール部だけを
 * 切り出した静的カード。アフィリエイトを含まないため PR 表記・計測・ランダム軸は不要で、
 * Server Component としてそのまま SSG に焼き込める。
 * ブログ詳細 (PC) の右レール最上部で使用する (フッター上のグローバルカードは lg 以上で非表示)。
 */
export function OperatorProfileCard() {
  return (
    <SurfaceCard>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        このブログを書いている人
      </p>
      <div className="flex items-center gap-3">
        <img
          src="/images/stats47-author-avatar-256.webp"
          alt=""
          width={44}
          height={44}
          className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">KAZU</p>
          <p className="text-xs text-muted-foreground">
            元県庁職員 → AI 独学 → 転職・独立 / stats47 運営者
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        e-Stat の公式統計をもとに、47 都道府県の統計データをわかりやすく可視化しています。
      </p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs">
        <Link
          href="/blog/koumuin-ai-tenshoku-1500man"
          className="font-semibold text-primary underline underline-offset-2"
        >
          体験記を読む
        </Link>
        <Link href="/about" className="text-muted-foreground underline underline-offset-2">
          運営者について
        </Link>
      </div>
    </SurfaceCard>
  );
}

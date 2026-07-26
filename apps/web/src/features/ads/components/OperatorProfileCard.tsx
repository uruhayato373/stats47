import Image from 'next/image';
import Link from 'next/link';

import { cn } from '@stats47/components';

import { SurfaceCard } from '@/components/surface';

import { OPERATOR_PROFILE } from '@/config/operator-profile';

interface OperatorProfileCardProps {
  className?: string;
}

/**
 * 運営者 (KAZU) のプロフィール専用カード。
 *
 * OperatorPromoCard (プロフィール + アフィリエイトバナー一体型) からプロフィール部だけを
 * 切り出した静的カード。アフィリエイトを含まないため PR 表記・計測・ランダム軸は不要で、
 * Server Component としてそのまま SSG に焼き込める。
 * ブログ詳細 (PC) の右レール最上部で使用する (フッター上のグローバルカードは lg 以上で非表示)。
 */
export function OperatorProfileCard({
  className,
}: OperatorProfileCardProps = {}) {
  return (
    <SurfaceCard className={cn('flex flex-col', className)}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
        このブログを書いている人
      </p>
      <div className="flex items-center gap-3">
        <Image
          src={OPERATOR_PROFILE.avatarSrc}
          alt={OPERATOR_PROFILE.avatarAlt}
          width={44}
          height={44}
          className="h-11 w-11 flex-shrink-0 rounded-full object-cover"
        />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {OPERATOR_PROFILE.name}
          </p>
          <p className="text-xs text-muted-foreground">
            元県庁職員 → AI 独学 → 転職・独立 / stats47 運営者
          </p>
        </div>
      </div>
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
        e-Stat の公式統計をもとに、47
        都道府県の統計データをわかりやすく可視化しています。
      </p>
      <div className="mt-auto flex flex-wrap gap-x-3 gap-y-1 pt-3 text-xs">
        <Link
          href={OPERATOR_PROFILE.links.story}
          className="font-semibold text-primary underline underline-offset-2"
        >
          体験記を読む
        </Link>
        <Link
          href={OPERATOR_PROFILE.links.about}
          className="text-muted-foreground underline underline-offset-2"
        >
          運営者について
        </Link>
      </div>
    </SurfaceCard>
  );
}

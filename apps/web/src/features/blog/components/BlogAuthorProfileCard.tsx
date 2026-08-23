import Image from 'next/image';
import Link from 'next/link';

import { Instagram, Youtube } from 'lucide-react';

import { SurfaceCard } from '@/components/surface';

import { OPERATOR_PROFILE } from '@/config/operator-profile';

function XIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-4 w-4 fill-current"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231Zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77Z" />
    </svg>
  );
}

const socialLinkClass =
  'inline-flex h-9 w-9 items-center justify-center text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * ブログ右レール専用の運営者プロフィール。
 *
 * 記事一覧と記事詳細で共用し、ホームの省スペース版 OperatorProfileCard とは
 * 情報密度の責務を分ける。プロフィール本文と URL は operator-profile.ts が SSOT。
 */
export function BlogAuthorProfileCard({
  compact = false,
}: {
  compact?: boolean;
}) {
  if (compact) {
    return (
      <SurfaceCard className="p-4">
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
          運営者
        </p>

        <div className="mt-3 flex items-center gap-3">
          <Image
            src={OPERATOR_PROFILE.avatarSrc}
            alt={OPERATOR_PROFILE.avatarAlt}
            width={64}
            height={64}
            className="h-16 w-16 shrink-0 rounded-full border border-border object-cover"
          />
          <div className="min-w-0">
            <p className="text-sm font-bold text-foreground">
              {OPERATOR_PROFILE.name}
            </p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground">
              {OPERATOR_PROFILE.bio}
            </p>
          </div>
        </div>

        <Link
          href={OPERATOR_PROFILE.links.about}
          className="mt-3 inline-flex min-h-9 items-center text-xs font-medium text-primary transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          運営者について →
        </Link>
      </SurfaceCard>
    );
  }

  return (
    <SurfaceCard className="overflow-hidden p-0">
      <div className="p-5">
        <p className="text-[11px] font-medium tracking-[0.18em] text-muted-foreground">
          運営者
        </p>

        <div className="mt-4 flex flex-col items-center">
          <Image
            src={OPERATOR_PROFILE.avatarSrc}
            alt={OPERATOR_PROFILE.avatarAlt}
            width={112}
            height={112}
            className="h-28 w-28 rounded-full border border-border object-cover"
          />
          <p className="mt-3 text-base font-bold text-foreground">
            {OPERATOR_PROFILE.name}
          </p>
          <p className="mt-2 max-w-[18rem] text-center text-[13px] leading-relaxed text-muted-foreground">
            {OPERATOR_PROFILE.bio}
          </p>
        </div>

        <div className="mt-5">
          <p className="text-[11px] font-medium tracking-[0.12em] text-muted-foreground">
            経歴・専門領域
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-[13px] leading-relaxed text-foreground marker:text-primary">
            {OPERATOR_PROFILE.expertise.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>

        <a
          href={OPERATOR_PROFILE.links.note}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex h-10 w-full items-center justify-center rounded-full bg-primary px-4 text-center text-[13px] font-bold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          noteで統計の読み方・AI活用を発信中
        </a>

        <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-1">
            <a
              href={OPERATOR_PROFILE.links.x}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="X"
              title="X"
              className={socialLinkClass}
            >
              <XIcon />
            </a>
            <a
              href={OPERATOR_PROFILE.links.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              title="Instagram"
              className={socialLinkClass}
            >
              <Instagram aria-hidden="true" className="h-4 w-4" />
            </a>
            <a
              href={OPERATOR_PROFILE.links.youtube}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="YouTube"
              title="YouTube"
              className={socialLinkClass}
            >
              <Youtube aria-hidden="true" className="h-[18px] w-[18px]" />
            </a>
          </div>

          <Link
            href={OPERATOR_PROFILE.links.about}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
          >
            運営者について →
          </Link>
        </div>
      </div>
    </SurfaceCard>
  );
}

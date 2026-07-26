import { Instagram, Twitter, Youtube, PenLine } from 'lucide-react';

import { OPERATOR_PROFILE } from '@/config/operator-profile';

/**
 * フッター SNS アイコンリンク。
 * Server Component の Footer からそのまま render できる純粋なリンク群。
 */
export function FooterSocialLinks() {
  return (
    <div className="flex items-center gap-3">
      <a
        href={OPERATOR_PROFILE.links.x}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground transition-colors hover:text-foreground"
        aria-label="X (Twitter)"
      >
        <Twitter className="h-4 w-4" />
      </a>
      <a
        href={OPERATOR_PROFILE.links.instagram}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground transition-colors hover:text-[#E1306C]"
        aria-label="Instagram"
      >
        <Instagram className="h-4 w-4" />
      </a>
      <a
        href={OPERATOR_PROFILE.links.youtube}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground transition-colors hover:text-[#FF0000]"
        aria-label="YouTube"
      >
        <Youtube className="h-5 w-5" />
      </a>
      <a
        href={OPERATOR_PROFILE.links.note}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground transition-colors hover:text-[#41C9B4]"
        aria-label="note"
      >
        <PenLine className="h-4 w-4" />
      </a>
    </div>
  );
}

/**
 * stats47 運営者プロフィールの SSOT。
 *
 * 表示カード・フッター・About・構造化データは、この定義を参照する。
 * SNS のアカウント変更時に、表示と JSON-LD が分岐しないよう URL を集約する。
 */
export const OPERATOR_PROFILE = {
  name: 'KAZU',
  role: 'stats47 運営者 / データ可視化',
  avatarSrc: '/images/stats47-author-avatar-256.webp',
  avatarAlt: 'stats47運営者 KAZU',
  bio: '元・地方自治体職員（約20年）。公的統計を「誰でも使える形」に再設計しています。',
  description:
    '約20年間、自治体職員として統計の作る側・使う側の両方に身を置いたのち、在職中に独学でAIを学びIT・データ業界へ転職・独立。その経験を活かし、e-Statなどの一次統計を現代のUI/UXで再設計するstats47を運営しています。',
  expertise: [
    '地方自治体職員 約20年',
    '公的統計・e-Stat',
    '都道府県データ分析',
    'データ可視化・UI/UX',
    'AI・データ処理',
  ],
  links: {
    about: '/about',
    story: '/blog/koumuin-ai-tenshoku-1500man',
    note: 'https://note.com/stats47',
    x: 'https://x.com/stats47jp373',
    instagram: 'https://www.instagram.com/stats47jp/',
    youtube: 'https://www.youtube.com/@stats47jp',
  },
} as const;

/** Organization / Person の sameAs に使用する外部プロフィール URL。 */
export const OPERATOR_SOCIAL_URLS = [
  OPERATOR_PROFILE.links.note,
  OPERATOR_PROFILE.links.x,
  OPERATOR_PROFILE.links.instagram,
  OPERATOR_PROFILE.links.youtube,
] as const;

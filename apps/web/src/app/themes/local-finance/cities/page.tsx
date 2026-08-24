import { permanentRedirect } from 'next/navigation';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '市区町村の地方財政',
  robots: { index: false, follow: true },
};

export default function LegacyLocalFinanceCityThemePage() {
  permanentRedirect('/municipalities');
}

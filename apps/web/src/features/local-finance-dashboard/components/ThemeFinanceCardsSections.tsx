import { loadFinanceCards } from '../lib/load-finance-cards';

import { FinanceCardsSectionClient } from './FinanceCardsSectionClient';

/**
 * テーマの埋め込みの章の登録簿 (THEME_SECTION_REGISTRY) に載せる、地方財政の決算カードの 2 章。
 * 決算カードは同梱の JSON なので、サーバーで読んで渡す (クライアントの JS に JSON を入れない)。
 * 2026-11-12 オーナー決定: 地方財政も他のテーマと同じ共通の部品で描く (専用ページの特例をやめた)
 */
export function ThemeFinanceOverviewSection() {
  return <FinanceCardsSectionClient cards={loadFinanceCards()} part="finance-overview" />;
}

export function ThemeFinanceSustainabilitySection() {
  return <FinanceCardsSectionClient cards={loadFinanceCards()} part="finance-sustainability" />;
}

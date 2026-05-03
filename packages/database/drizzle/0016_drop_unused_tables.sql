-- Drop unused tables (PR-1 of 3-layer schema migration)
-- - component_data: 0 rows, never populated, replaced by direct e-Stat API fetch in CompositionChart
-- - port_trade_detail: 478,448 rows but no readers, slated for redesign when needed

DROP TABLE IF EXISTS `component_data`;--> statement-breakpoint
DROP TABLE IF EXISTS `port_trade_detail`;

/**
 * テンプレートレジストリ (SSOT)。
 * Phase 2 以降で実体 (templates/{powerpoint,excel,manuals,listing}/) を追加する。
 * Phase 1 は空。validator は ProductDefinition.templateIds をこのレジストリと突合するため、
 * Phase 1 では全商品の templateIds を [] にする (存在しない ID の参照を機械的に禁止する)。
 */
import type { TemplateDefinition } from "./types";

export const TEMPLATE_REGISTRY: Readonly<Record<string, TemplateDefinition>> = {} as const;

/** 有効なテンプレート ID 一覧 (Phase 1 は空)。 */
export const TEMPLATE_IDS: readonly string[] = Object.keys(TEMPLATE_REGISTRY);

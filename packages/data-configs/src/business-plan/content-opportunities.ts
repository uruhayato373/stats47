import data from '../../../../data/business-plan/plan/content-opportunities.json';
import type {
  BusinessPlanChannelIdea,
  BusinessPlanContentOpportunity,
  BusinessPlanProductIdea,
} from './types';

/**
 * コンテンツの機会・X の案・note の商品の読み込み口。記録の正本は台帳 `business-plan.content-opportunities`
 * (data/business-plan/plan/content-opportunities.json + Schema)。ID は台帳に明示して書く (配列の位置から作らない)。
 */
export const BUSINESS_PLAN_CONTENT_OPPORTUNITIES =
  data.contentOpportunities as readonly BusinessPlanContentOpportunity[];

export const BUSINESS_PLAN_X_IDEAS =
  data.xIdeas as readonly BusinessPlanChannelIdea[];

export const BUSINESS_PLAN_NOTE_PRODUCTS =
  data.noteProducts as readonly BusinessPlanProductIdea[];

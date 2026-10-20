import 'server-only';
import { readVerified } from '../../../../.claude/scripts/media/lib/storage.mjs';
import { RANKING_SAMPLE_ASSETS } from '@/lib/template-ranking-assets';

// Read the saved sample version. Missing/changed objects fail, never silently regenerate.
export async function rankingSamplePng(kind: keyof typeof RANKING_SAMPLE_ASSETS = 'bars') {
  return readVerified(RANKING_SAMPLE_ASSETS[kind].png);
}

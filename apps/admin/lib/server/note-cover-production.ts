import 'server-only';
import { NOTE_ARTICLES } from '../../../../.claude/scripts/note/catalog';
import { noteCoverCategory } from '../../../../.claude/scripts/note/catalog/cover-categories';
import { readCoverLedger, reviewCoverRevision, updateCoverLedger, type CoverBrief } from '../../../../.claude/scripts/note/lib/cover-assets.mjs';
import { assertCurrentCoverCandidate, coverProductionToken, coverProductionView, readCoverPolicies, latestCoverPolicy } from '../../../../.claude/scripts/note/lib/cover-production.mjs';
import { readStoredCover, readStoredCoverInput } from '../../../../.claude/scripts/note/lib/cover-storage.mjs';
import { projectRoot } from './project-root';

export class CoverEditError extends Error {
  constructor(message: string, public status: number) { super(message); }
}
export type CoverEdit = { action: 'brief'; revision: string; brief: CoverBrief }
  | { action: 'review'; revision: string; candidateRevisionId: string; status: 'pass' | 'needs-revision'; reason: string };

export async function saveCoverProduction(key: string, edit: CoverEdit) {
  const root = projectRoot();
  const source = NOTE_ARTICLES.find(a => a.key === key);
  if (!source) throw new CoverEditError('記事が見つかりません。', 404);
  const article = { ...source, category: noteCoverCategory(source) };
  if (edit.action === 'review') {
    const row = readCoverLedger(root).articles.find(r => r.articleKey === key);
    const view = row && coverProductionView(row, article, readCoverPolicies(root));
    if (!view?.candidateMatches || view.revision !== edit.revision || view.candidateRevisionId !== edit.candidateRevisionId)
      throw new CoverEditError('制作内容または画像が変わっています。再読込してください。', 409);
    const revision = row!.revisions.find(r => r.id === edit.candidateRevisionId)!;
    assertCurrentCoverCandidate(row!, revision.id, { article, policies: readCoverPolicies(root) });
    await readStoredCover(revision);
    await readStoredCoverInput(revision);
  }
  await updateCoverLedger(ledger => {
    const policies = readCoverPolicies(root);
    const row = ledger.articles.find(r => r.articleKey === key);
    if (!row?.production) throw new CoverEditError('制作IDが未登録です。台帳を同期してください。', 409);
    if (coverProductionToken(row, article, policies) !== edit.revision)
      throw new CoverEditError('別の操作で更新されました。入力を控えて再読込してください。', 409);
    if (edit.action === 'brief') {
      const policy = latestCoverPolicy(policies, article.category);
      const next = { ...row.production, policyId: policy.id, policyVersion: policy.version, brief: edit.brief };
      if (JSON.stringify(next) !== JSON.stringify(row.production)) row.approvedRevisionId = null;
      row.production = next;
    } else {
      const view = coverProductionView(row, article, policies);
      if (!view.candidateMatches || view.candidateRevisionId !== edit.candidateRevisionId)
        throw new CoverEditError('現在の制作内容に対応する画像だけを採用できます。', 409);
      assertCurrentCoverCandidate(row, edit.candidateRevisionId, { article, policies });
      reviewCoverRevision(row, edit.candidateRevisionId, edit.status, edit.reason);
    }
  }, root);
}

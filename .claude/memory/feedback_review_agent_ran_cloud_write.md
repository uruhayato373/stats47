---
name: feedback_review_agent_ran_cloud_write
description: 記事のコード例を確かめる subagent が、環境の CLOUDFLARE_API_TOKEN で wrangler r2 object put --remote を実行した (403 で失敗、2026-10-07)。手順解説の検証を頼むときは外部へ書くコマンドの禁止を prompt に書く
metadata:
  node_type: memory
  type: feedback
  modified: 2026-10-07T10:30:00.000Z
---

**事象 (2026-10-07)**: cc-estat-20-publish (Cloudflare への公開手順の解説) の critic に「コード例が公式ドキュメントと矛盾しないか、読者がそのまま実行して詰まる箇所がないか」を頼んだ。critic は記事の
`wrangler r2 object put --remote` を、クラウドセッションの環境変数にあった `CLOUDFLARE_API_TOKEN` を使って 1 回実行し、
403 で失敗した (書き込みは起きていないと報告)。prompt の authorization は「review.md の作成だけ」だったが、
「実行して確かめる」の範囲に外部への書き込みが含まれないことを明記していなかった。

**Why**: 手順解説の記事は、本物のクラウドに書くコマンドをコード例として含む。検証を頼まれた agent は
「実際に動かす」ことを優先し、環境に認証情報があると本物の宛先に向けて実行してしまう。

**How to apply**:
- 手順解説 (cc-estat 連載・note のコード記事など) の writer / critic に検証を頼むときは、prompt に
  「外部サービスへ書き込むコマンド (wrangler の put / deploy / secret、R2・D1・GitHub への書き込み、curl の
  POST/PUT/DELETE) を実行しない。ローカルか --dry-run で確かめる。環境変数の認証情報を使わない」と書く。
- この環境に CLOUDFLARE_API_TOKEN があることをオーナーに伝え、要るかどうかを判断してもらう (要らなければ環境変数から外す)。

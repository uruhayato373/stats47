#!/usr/bin/env python3
"""stats47 長期記憶システム CLI

Usage:
    stats47_memory.py ingest              # SessionEnd hook から呼ばれる (stdin: JSON)
    stats47_memory.py ingest --transcript /path/to/session.jsonl
    stats47_memory.py ingest-all          # 過去の全セッションを一括取り込み
    stats47_memory.py search "クエリ"     # ハイブリッド検索
    stats47_memory.py search "クエリ" --limit 10
    stats47_memory.py search "クエリ" --fts-only  # FTS5のみ（高速・モデル不要）
    stats47_memory.py stats               # DB 統計情報
"""
import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

# プロジェクトルートを sys.path に追加
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent))

from scripts.memory import db, search
from scripts.memory.chunker import parse_transcript, get_session_summary, get_session_id_from_path

TRANSCRIPTS_DIR = Path.home() / ".claude" / "projects" / "-Users-minamidaisuke-stats47"


def cmd_ingest(args):
    """セッションのトランスクリプトを取り込み"""
    transcript_path = None

    if "--transcript" in args:
        idx = args.index("--transcript")
        if idx + 1 < len(args):
            transcript_path = args[idx + 1]
    else:
        # stdin から JSON を読む (SessionEnd hook)
        try:
            stdin_data = sys.stdin.read()
            if stdin_data.strip():
                hook_input = json.loads(stdin_data)
                transcript_path = hook_input.get("transcript_path")
        except (json.JSONDecodeError, EOFError):
            pass

    if not transcript_path:
        print("Error: transcript_path が指定されていません", file=sys.stderr)
        sys.exit(1)

    transcript_path = Path(transcript_path)
    if not transcript_path.exists():
        print(f"Error: ファイルが見つかりません: {transcript_path}", file=sys.stderr)
        sys.exit(1)

    session_id = get_session_id_from_path(transcript_path)

    conn = db.get_connection()
    db.init_schema(conn)

    if db.session_exists(conn, session_id):
        print(f"Skip: {session_id} (already ingested)", file=sys.stderr)
        conn.close()
        return

    # チャンク化
    t0 = time.time()
    chunks = parse_transcript(transcript_path)
    if not chunks:
        print(f"Skip: {session_id} (no chunks)", file=sys.stderr)
        conn.close()
        return

    # ベクトル化
    try:
        from scripts.memory.embedder import embed_documents
        texts = [c["question"] + "\n" + c["answer"] for c in chunks]
        embeddings = embed_documents(texts)
    except Exception as e:
        print(f"Warning: ベクトル化スキップ ({e})", file=sys.stderr)
        embeddings = [None] * len(chunks)

    # DB に保存
    now = datetime.now(timezone.utc).isoformat()
    summary = get_session_summary(chunks)

    db.insert_session(conn, session_id, str(transcript_path), now, len(chunks), summary)

    for i, chunk in enumerate(chunks):
        emb = embeddings[i] if i < len(embeddings) else None
        db.insert_chunk(
            conn, session_id, chunk["chunk_index"],
            chunk["question"], chunk["answer"],
            chunk.get("skills_used"), chunk.get("domain"),
            now, emb,
        )

    conn.commit()
    conn.close()

    elapsed = time.time() - t0
    print(f"Ingested: {session_id} ({len(chunks)} chunks, {elapsed:.1f}s)", file=sys.stderr)


def cmd_ingest_all(args):
    """過去の全セッションを一括取り込み"""
    jsonl_files = sorted(TRANSCRIPTS_DIR.glob("*.jsonl"))
    total = len(jsonl_files)
    print(f"Found {total} session transcripts", file=sys.stderr)

    conn = db.get_connection()
    db.init_schema(conn)

    # 既存セッションを取得
    existing = set()
    for row in conn.execute("SELECT session_id FROM sessions").fetchall():
        existing.add(row[0])
    conn.close()

    to_process = [f for f in jsonl_files if get_session_id_from_path(f) not in existing]
    print(f"To process: {len(to_process)} (skipping {total - len(to_process)} existing)", file=sys.stderr)

    for i, f in enumerate(to_process):
        print(f"[{i+1}/{len(to_process)}] {f.stem[:20]}...", file=sys.stderr, end=" ")
        try:
            cmd_ingest(["--transcript", str(f)])
        except Exception as e:
            print(f"Error: {e}", file=sys.stderr)

    # 完了統計
    conn = db.get_connection()
    stats = db.get_stats(conn)
    conn.close()
    print(f"\nDone: {stats['sessions']} sessions, {stats['chunks']} chunks, {stats['db_size_mb']}MB", file=sys.stderr)


def cmd_search(args):
    """ハイブリッド検索"""
    if not args:
        print("Usage: stats47_memory.py search \"クエリ\" [--limit N] [--fts-only]", file=sys.stderr)
        sys.exit(1)

    query = args[0]
    limit = 5
    fts_only = "--fts-only" in args

    if "--limit" in args:
        idx = args.index("--limit")
        if idx + 1 < len(args):
            limit = int(args[idx + 1])

    conn = db.get_connection()
    db.init_schema(conn)

    t0 = time.time()

    query_embedding = None
    if not fts_only:
        try:
            from scripts.memory.embedder import embed_query
            query_embedding = embed_query(query)
        except Exception as e:
            print(f"Warning: ベクトル検索無効 ({e}), FTS5のみ", file=sys.stderr)

    results = search.hybrid_search(conn, query, query_embedding, limit)
    elapsed = time.time() - t0

    conn_stats = db.get_stats(conn)
    conn.close()

    if not results:
        print(f"検索結果なし: \"{query}\"")
        return

    print(f"=== 記憶検索: \"{query}\" ({len(results)}件, {elapsed*1000:.0f}ms) ===\n")

    for i, r in enumerate(results):
        date = r["created_at"][:10] if r["created_at"] else "?"
        domain = r["domain"] or "-"
        score = r["score"]
        skills = r.get("skills_used", "")

        print(f"[{i+1}] {date} (score: {score:.3f}, domain: {domain})")
        # question の先頭100文字
        q = r["question"][:100].replace("\n", " ")
        print(f"  Q: {q}")
        # answer の先頭200文字
        a = r["answer"][:200].replace("\n", " ")
        print(f"  A: {a}")
        if skills and skills != "null":
            print(f"  Skills: {skills}")
        print()

    print(f"---\nチャンク総数: {conn_stats['chunks']} | DB: {conn_stats['db_size_mb']}MB")


def cmd_stats(args):
    """DB 統計情報"""
    conn = db.get_connection()
    db.init_schema(conn)
    stats = db.get_stats(conn)

    # ドメイン別集計
    domain_counts = conn.execute(
        "SELECT domain, COUNT(*) FROM chunks GROUP BY domain ORDER BY COUNT(*) DESC"
    ).fetchall()

    conn.close()

    print("=== stats47 長期記憶 統計 ===\n")
    print(f"セッション数: {stats['sessions']}")
    print(f"チャンク数:   {stats['chunks']}")
    print(f"ベクトル数:   {stats['vec_count']}")
    print(f"DB サイズ:    {stats['db_size_mb']}MB")
    print(f"最古:         {stats['oldest'] or '-'}")
    print(f"最新:         {stats['newest'] or '-'}")

    if domain_counts:
        print("\nドメイン別:")
        for domain, count in domain_counts:
            print(f"  {domain or '(なし)':15s} {count}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    command = sys.argv[1]
    args = sys.argv[2:]

    if command == "ingest":
        cmd_ingest(args)
    elif command == "ingest-all":
        cmd_ingest_all(args)
    elif command == "search":
        cmd_search(args)
    elif command == "stats":
        cmd_stats(args)
    else:
        print(f"Unknown command: {command}", file=sys.stderr)
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()

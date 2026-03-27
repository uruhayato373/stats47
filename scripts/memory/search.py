"""ハイブリッド検索 (FTS5 + sqlite-vec + RRF + 時間減衰)"""
import math
from collections import defaultdict
from datetime import datetime, timezone

from . import db

RRF_K = 60
HALF_LIFE_DAYS = 30
SEARCH_LIMIT = 30  # 各検索エンジンの取得上限


def time_decay(created_at: str) -> float:
    """半減期30日の時間減衰スコア"""
    try:
        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
    except (ValueError, AttributeError):
        return 0.5
    now = datetime.now(timezone.utc)
    days = (now - dt).total_seconds() / 86400
    return math.pow(0.5, days / HALF_LIFE_DAYS)


def search_fts(conn, query: str, limit: int = SEARCH_LIMIT) -> list[tuple[int, float]]:
    """FTS5 trigram 検索。(chunk_id, rank) のリストを返す"""
    if len(query) < 3:
        return []
    try:
        # trigram は MATCH でフレーズ検索
        rows = conn.execute(
            "SELECT rowid, rank FROM chunks_fts WHERE chunks_fts MATCH ? ORDER BY rank LIMIT ?",
            (f'"{query}"', limit),
        ).fetchall()
        return [(r[0], r[1]) for r in rows]
    except Exception:
        return []


def search_vec(conn, query_embedding: list[float], limit: int = SEARCH_LIMIT) -> list[tuple[int, float]]:
    """sqlite-vec ベクトル類似検索。(chunk_id, distance) のリストを返す"""
    try:
        vec_bytes = db.serialize_embedding(query_embedding)
        rows = conn.execute(
            "SELECT chunk_id, distance FROM chunks_vec WHERE embedding MATCH ? ORDER BY distance LIMIT ?",
            (vec_bytes, limit),
        ).fetchall()
        return [(r[0], r[1]) for r in rows]
    except Exception:
        return []


def hybrid_search(conn, query: str, query_embedding: list[float] | None = None, limit: int = 5) -> list[dict]:
    """FTS5 + vec のハイブリッド検索 (RRF + 時間減衰)"""
    scores: dict[int, float] = defaultdict(float)

    # FTS5 検索
    fts_results = search_fts(conn, query)
    for rank, (chunk_id, _) in enumerate(fts_results):
        scores[chunk_id] += 1.0 / (RRF_K + rank)

    # ベクトル検索
    if query_embedding:
        vec_results = search_vec(conn, query_embedding)
        for rank, (chunk_id, _) in enumerate(vec_results):
            scores[chunk_id] += 1.0 / (RRF_K + rank)

    if not scores:
        return []

    # チャンク詳細を取得
    chunk_ids = list(scores.keys())
    placeholders = ",".join("?" * len(chunk_ids))
    rows = conn.execute(
        f"""SELECT c.id, c.session_id, c.chunk_index, c.question, c.answer,
                   c.skills_used, c.domain, c.created_at, s.summary
            FROM chunks c
            JOIN sessions s ON c.session_id = s.session_id
            WHERE c.id IN ({placeholders})""",
        chunk_ids,
    ).fetchall()

    # 時間減衰を適用
    results = []
    for row in rows:
        chunk_id = row[0]
        decay = time_decay(row[7])
        final_score = scores[chunk_id] * decay
        results.append({
            "chunk_id": chunk_id,
            "session_id": row[1],
            "chunk_index": row[2],
            "question": row[3],
            "answer": row[4],
            "skills_used": row[5],
            "domain": row[6],
            "created_at": row[7],
            "session_summary": row[8],
            "score": final_score,
        })

    results.sort(key=lambda x: -x["score"])
    return results[:limit]

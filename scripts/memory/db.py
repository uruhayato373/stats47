"""SQLite スキーマ定義・CRUD 操作"""
import sqlite3
import struct
from pathlib import Path

DB_PATH = Path.home() / ".claude" / "projects" / "-Users-minamidaisuke-stats47" / "memory.db"
EMBEDDING_DIM = 768  # Ruri v3-310m

def _load_vec_extension(conn: sqlite3.Connection) -> bool:
    """sqlite-vec 拡張をロード"""
    try:
        import sqlite_vec
        conn.enable_load_extension(True)
        sqlite_vec.load(conn)
        conn.enable_load_extension(False)
        return True
    except Exception:
        return False


def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    _load_vec_extension(conn)
    return conn


def init_schema(conn: sqlite3.Connection):
    """テーブル・インデックスを作成"""
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS sessions (
            session_id TEXT PRIMARY KEY,
            transcript_path TEXT,
            ended_at TEXT NOT NULL,
            turn_count INTEGER,
            summary TEXT
        );

        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            session_id TEXT NOT NULL REFERENCES sessions(session_id),
            chunk_index INTEGER NOT NULL,
            question TEXT NOT NULL,
            answer TEXT NOT NULL,
            skills_used TEXT,
            domain TEXT,
            created_at TEXT NOT NULL,
            UNIQUE(session_id, chunk_index)
        );

        CREATE INDEX IF NOT EXISTS idx_chunks_session ON chunks(session_id);
        CREATE INDEX IF NOT EXISTS idx_chunks_domain ON chunks(domain);
    """)

    # FTS5 (trigram tokenizer)
    try:
        conn.execute("""
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
                question, answer,
                content='chunks', content_rowid='id',
                tokenize='trigram'
            )
        """)
    except sqlite3.OperationalError:
        pass  # already exists

    # FTS sync triggers
    for sql in [
        """CREATE TRIGGER IF NOT EXISTS chunks_ai AFTER INSERT ON chunks BEGIN
            INSERT INTO chunks_fts(rowid, question, answer) VALUES (new.id, new.question, new.answer);
        END""",
        """CREATE TRIGGER IF NOT EXISTS chunks_ad AFTER DELETE ON chunks BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, question, answer) VALUES ('delete', old.id, old.question, old.answer);
        END""",
        """CREATE TRIGGER IF NOT EXISTS chunks_au AFTER UPDATE ON chunks BEGIN
            INSERT INTO chunks_fts(chunks_fts, rowid, question, answer) VALUES ('delete', old.id, old.question, old.answer);
            INSERT INTO chunks_fts(rowid, question, answer) VALUES (new.id, new.question, new.answer);
        END""",
    ]:
        try:
            conn.execute(sql)
        except sqlite3.OperationalError:
            pass

    # sqlite-vec virtual table
    try:
        conn.execute(f"""
            CREATE VIRTUAL TABLE IF NOT EXISTS chunks_vec USING vec0(
                chunk_id INTEGER PRIMARY KEY,
                embedding float[{EMBEDDING_DIM}]
            )
        """)
    except sqlite3.OperationalError:
        pass


def serialize_embedding(vec: list[float]) -> bytes:
    """float32 リストをバイト列に変換"""
    return struct.pack(f"{len(vec)}f", *vec)


def deserialize_embedding(data: bytes) -> list[float]:
    n = len(data) // 4
    return list(struct.unpack(f"{n}f", data))


def insert_session(conn, session_id: str, transcript_path: str, ended_at: str, turn_count: int, summary: str):
    conn.execute(
        "INSERT OR IGNORE INTO sessions (session_id, transcript_path, ended_at, turn_count, summary) VALUES (?, ?, ?, ?, ?)",
        (session_id, transcript_path, ended_at, turn_count, summary),
    )


def insert_chunk(conn, session_id: str, chunk_index: int, question: str, answer: str,
                 skills_used: str | None, domain: str | None, created_at: str, embedding: list[float] | None):
    cursor = conn.execute(
        """INSERT INTO chunks (session_id, chunk_index, question, answer, skills_used, domain, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (session_id, chunk_index, question, answer, skills_used, domain, created_at),
    )
    chunk_id = cursor.lastrowid

    if embedding and chunk_id:
        try:
            conn.execute(
                "INSERT INTO chunks_vec (chunk_id, embedding) VALUES (?, ?)",
                (chunk_id, serialize_embedding(embedding)),
            )
        except sqlite3.OperationalError:
            pass  # vec extension not available


def session_exists(conn, session_id: str) -> bool:
    row = conn.execute("SELECT 1 FROM sessions WHERE session_id = ?", (session_id,)).fetchone()
    return row is not None


def get_stats(conn) -> dict:
    stats = {}
    stats["sessions"] = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    stats["chunks"] = conn.execute("SELECT COUNT(*) FROM chunks").fetchone()[0]
    try:
        stats["vec_count"] = conn.execute("SELECT COUNT(*) FROM chunks_vec").fetchone()[0]
    except Exception:
        stats["vec_count"] = 0
    row = conn.execute("SELECT MIN(ended_at), MAX(ended_at) FROM sessions").fetchone()
    stats["oldest"] = row[0]
    stats["newest"] = row[1]
    db_size = DB_PATH.stat().st_size if DB_PATH.exists() else 0
    stats["db_size_mb"] = round(db_size / 1024 / 1024, 1)
    return stats

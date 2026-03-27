"""Ruri v3-310m ベクトル化ラッパー（遅延ロード）"""
import sys

MODEL_NAME = "cl-nagoya/ruri-v3-310m"
DOC_PREFIX = "検索文書: "
QUERY_PREFIX = "検索クエリ: "

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(MODEL_NAME)
        print(f"Ruri v3 loaded (dim={_model.get_sentence_embedding_dimension()})", file=sys.stderr)
    return _model


def embed_documents(texts: list[str]) -> list[list[float]]:
    """ドキュメント用ベクトル化（バッチ）"""
    if not texts:
        return []
    model = _get_model()
    prefixed = [DOC_PREFIX + t for t in texts]
    embeddings = model.encode(prefixed, show_progress_bar=False, convert_to_numpy=True)
    return [e.tolist() for e in embeddings]


def embed_query(query: str) -> list[float]:
    """検索クエリ用ベクトル化"""
    model = _get_model()
    embedding = model.encode(QUERY_PREFIX + query, show_progress_bar=False, convert_to_numpy=True)
    return embedding.tolist()

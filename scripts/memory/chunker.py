"""JSONL トランスクリプトを Q&A チャンクに変換"""
import json
from datetime import datetime, timezone
from pathlib import Path

# stats47 のスキルカテゴリ → ドメイン推定用キーワード
DOMAIN_KEYWORDS = {
    "blog": ["ブログ", "記事", "blog", "article", "publish", "draft"],
    "sns": ["SNS", "YouTube", "Instagram", "TikTok", "twitter", "投稿", "キャプション", "Remotion"],
    "db": ["D1", "SQLite", "database", "ranking_data", "ranking_items", "sync", "migrate"],
    "estat": ["e-Stat", "estat", "統計表", "statsDataId", "cdCat"],
    "theme": ["テーマ", "theme", "IndicatorSet", "panelTabs", "indicator"],
    "analytics": ["GA4", "GSC", "Search Console", "Analytics", "PV", "imp"],
    "note": ["note.com", "note記事", "note投稿"],
    "dev": ["テスト", "ビルド", "デプロイ", "CI", "型チェック", "tsc"],
    "management": ["週次", "計画", "レビュー", "NSM", "成長ループ"],
    "ui": ["UI", "デザイン", "melta", "コンポーネント", "レスポンシブ"],
    "ranking": ["ランキング", "ranking", "OGP", "サムネイル"],
    "ads": ["アフィリエイト", "A8", "広告", "バナー", "AdSense"],
}

MAX_ANSWER_LEN = 2000
MIN_QUESTION_LEN = 10


def detect_domain(text: str) -> str | None:
    """テキストからドメインを推定"""
    scores: dict[str, int] = {}
    for domain, keywords in DOMAIN_KEYWORDS.items():
        score = sum(1 for kw in keywords if kw.lower() in text.lower())
        if score > 0:
            scores[domain] = score
    if not scores:
        return None
    return max(scores, key=scores.get)


def extract_skills(messages: list[dict]) -> list[str]:
    """assistant メッセージから使用スキル名を抽出"""
    skills = set()
    for msg in messages:
        content = msg.get("content", "")
        if not isinstance(content, list):
            continue
        for block in content:
            if not isinstance(block, dict):
                continue
            if block.get("type") == "tool_use":
                name = block.get("name", "")
                if name == "Skill":
                    inp = block.get("input", {})
                    skill_name = inp.get("skill", "")
                    if skill_name:
                        skills.add(skill_name)
                elif name:
                    skills.add(name)
    # 多すぎる場合はスキルツール名のみに絞る
    if len(skills) > 10:
        skill_tools = {s for s in skills if not s[0].isupper()}  # Bash, Read 等を除外
        return sorted(skill_tools) if skill_tools else sorted(list(skills)[:10])
    return sorted(skills)


def extract_text_from_content(content) -> str:
    """content フィールドからテキスト部分のみ抽出"""
    if isinstance(content, str):
        return content
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict):
                if block.get("type") == "text":
                    parts.append(block.get("text", ""))
            elif isinstance(block, str):
                parts.append(block)
        return "\n".join(parts)
    return ""


def parse_transcript(path: str | Path) -> list[dict]:
    """JSONL トランスクリプトをパースして Q&A チャンクのリストを返す"""
    path = Path(path)
    if not path.exists():
        return []

    messages = []
    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                raw = json.loads(line)
                # JSONL 形式: {type, message: {role, content}} または {type, content}
                msg_type = raw.get("type")
                if msg_type in ("user", "assistant"):
                    inner = raw.get("message", raw)
                    role = inner.get("role", msg_type)
                    content = inner.get("content", "")
                    messages.append({"type": role, "content": content, "_raw": raw})
            except json.JSONDecodeError:
                continue

    if len(messages) < 2:
        return []

    # user/assistant ペアを形成
    chunks = []
    i = 0
    while i < len(messages):
        if messages[i]["type"] != "user":
            i += 1
            continue

        content = messages[i]["content"]
        # tool_result のみの user メッセージはスキップ
        if isinstance(content, list) and all(
            isinstance(b, dict) and b.get("type") == "tool_result" for b in content
        ):
            i += 1
            continue

        question = extract_text_from_content(content)

        # 直後の assistant メッセージを収集
        assistant_msgs = []
        j = i + 1
        while j < len(messages) and messages[j]["type"] == "assistant":
            assistant_msgs.append(messages[j])
            j += 1

        if not assistant_msgs:
            i = j
            continue

        answer_parts = []
        for msg in assistant_msgs:
            text = extract_text_from_content(msg["content"])
            if text:
                answer_parts.append(text)
        answer = "\n".join(answer_parts)

        # answer の長さ制限
        if len(answer) > MAX_ANSWER_LEN:
            answer = answer[:1500] + "\n...\n" + answer[-500:]

        # 短い question は前チャンクと結合
        if len(question.strip()) < MIN_QUESTION_LEN and chunks:
            prev = chunks[-1]
            prev["question"] += "\n" + question
            prev["answer"] += "\n---\n" + answer
            prev["assistant_msgs"].extend(assistant_msgs)
        else:
            skills = extract_skills(assistant_msgs)
            chunks.append({
                "question": question.strip(),
                "answer": answer.strip(),
                "skills_used": json.dumps(skills, ensure_ascii=False) if skills else None,
                "assistant_msgs": assistant_msgs,  # 内部用、保存しない
            })

        i = j

    # ドメイン推定・タイムスタンプ
    result = []
    for idx, chunk in enumerate(chunks):
        combined_text = chunk["question"] + " " + chunk["answer"]
        domain = detect_domain(combined_text)
        chunk.pop("assistant_msgs", None)
        chunk["chunk_index"] = idx
        chunk["domain"] = domain
        result.append(chunk)

    return result


def get_session_summary(chunks: list[dict]) -> str:
    """チャンクリストから1行サマリを生成（LLM不使用）"""
    if not chunks:
        return ""
    first_q = chunks[0].get("question", "")
    return first_q[:100]


def get_session_id_from_path(path: str | Path) -> str:
    """トランスクリプトパスからセッションIDを抽出"""
    return Path(path).stem

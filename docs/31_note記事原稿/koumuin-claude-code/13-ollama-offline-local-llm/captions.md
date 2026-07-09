---
type: sns-captions
slug: ollama-offline-local-llm
article_title: ローカル LLM (Ollama) × Claude Code で完全オフライン業務
created: 2026-05-18
---

# ローカル LLM (Ollama) × Claude Code で完全オフライン業務 — SNS 拡散キャプション

## X (旧 Twitter) — 公開時投稿 (140 字以内、本文 URL 別添前提)

Ollama でローカル LLM (Llama 3.1 / Qwen 2.5 等) を動かして、Claude Code から `ANTHROPIC_BASE_URL` を litellm proxy 経由で向ける構成。16GB メモリで 7B モデルが実用速度。個人情報・基幹系データを扱える反面、精度は Claude 4 系より劣るので使い分けが鍵。

#ClaudeCode #公務員 #LocalLLM

## X — 追い投稿 (公開 1 週間後、別角度の切り口で再投稿、140 字以内)

ローカル LLM は「個人情報含有の単純作業」に振り、Claude 4 系は「精度が要る高度な作業」に振る使い分けが現実解。3 層ネットワーク × AI 利用可能性マトリクスを記事内で整理しました。

#公務員 #LGWAN

## Instagram — フィード投稿用キャプション (2200 字以内、改行は 2-3 行ずつ)

「個人情報や基幹系データを AI に処理させたいけど、クラウドには送れない」——公務員が AI 活用で最後に当たる壁です。

解決策の 1 つが「ローカル LLM」。Ollama という仕組みで、Llama 3.1 / Qwen 2.5 / Gemma 3 / Phi 4 などの OSS LLM を自分の PC で動かせます。

Claude Code の `ANTHROPIC_BASE_URL` を `litellm` proxy 経由で Ollama に向ければ、Claude Code の UI のままローカル推論が可能。16GB メモリの一般 PC で 7B モデルが実用速度 (10-20 token/sec) で動作します。

クラウドに送らないので、個人情報・基幹系データを扱えます (規程確認は必須)。

ただし精度は Claude 4 系より明確に劣ります。
だからこそ使い分けが鍵。
(1) ローカル LLM:「個人情報含有の単純作業」専用
(2) Claude 4 系:「精度が要る高度な作業」
の 2 トラック運用が現実解です。

3 層ネットワーク × AI 利用可能性マトリクスを記事内で整理し、どのデータをどこで扱うかの判定フローを公開しました。

note 有料記事 (¥1,500) では、Ollama インストール手順、litellm 設定、推奨モデルの精度比較表を収録しました。

#Claude #ClaudeCode #公務員 #自治体DX #LocalLLM #Ollama #Llama #LGWAN #生成AI #業務効率化 #DX #公務員ライフ #自治体 #個人情報保護

## ハッシュタグ候補

- 主要: #Claude #ClaudeCode #公務員 #自治体DX
- 業務系: #LocalLLM #Ollama #LGWAN #個人情報保護
- 拡散系: #生成AI #業務効率化 #DX

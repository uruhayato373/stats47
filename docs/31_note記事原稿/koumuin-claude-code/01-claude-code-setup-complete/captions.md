---
type: sns-captions
slug: claude-code-setup-complete
article_title: 自治体職員のための Claude Code 環境構築 完全版 (Windows / Mac / WSL 別)
created: 2026-05-18
---

# 自治体職員のための Claude Code 環境構築 完全版 (Windows / Mac / WSL 別) — SNS 拡散キャプション

## X (旧 Twitter) — 公開時投稿 (140 字以内、本文 URL 別添前提)

公務員が Claude Code を始める最初の壁は環境構築。庁内 PC・私物 PC・WSL2 でつまずく場所がそれぞれ違います。Node.js のバージョン、プロキシ 3 点セット、長いパス問題まで、Windows / Mac / WSL 別で手順を整理しました。

#ClaudeCode #公務員 #自治体DX

## X — 追い投稿 (公開 1 週間後、別角度の切り口で再投稿、140 字以内)

「庁費購入は禁忌、私物 PC + テザリングで完結」。Claude Code の業務利用を始める前に、稟議でつまずかない動き方を最初に決めるのが定石です。月 ¥3,000-5,000 で個人完結する構成を整理しました。

#ClaudeCode #公務員

## Instagram — フィード投稿用キャプション (2200 字以内、改行は 2-3 行ずつ)

「Claude Code を始めたいけど、最初の環境構築でつまずく」——公務員からよく聞く声です。

庁内 PC は Node.js が v14 / v16 のままだったり、プロキシ経由でしか外に出られなかったり。Windows + PowerShell でつまずく人もいれば、Mac でもターミナル操作に慣れていなくて手が止まることも。

本記事では、Windows / Mac / WSL2 の 3 環境別に「最短ルート」と「庁内ネットワーク経由」の両方をまとめました。

ポイントは 4 つ。
(1) Node.js は v20 以上必須、まず `node -v` で確認
(2) プロキシ 3 点セット (HTTPS_PROXY / npm config / NODE_EXTRA_CA_CERTS)
(3) Windows は WSL2 (Ubuntu 22.04) が圧倒的に楽
(4) 私物 PC + iPhone テザリングで自宅完結が最も安全

庁費購入は稟議で 2-3 ヶ月止まる前提で、個人契約 (月 ¥3,000-5,000) から始めるのが現実解です。

詳細は note の有料記事 (¥1,500) で。SVG 図解 5 種類と「つまずいたら見る」チェックリストを収録しています。

#Claude #ClaudeCode #公務員 #自治体DX #生成AI #業務効率化 #DX #環境構築 #WSL #エンジニア #公務員ライフ #働き方改革 #自治体

## ハッシュタグ候補

- 主要: #Claude #ClaudeCode #公務員 #自治体DX
- 業務系: #環境構築 #WSL #Node #プロキシ
- 拡散系: #生成AI #業務効率化 #DX #働き方改革

/* Search Option D — Discovery + ネイティブ収益
   - 検索結果の上下にネイティブ広告・スポンサー枠
   - クエリと関連する書籍・ふるさと納税アフィリエイト
   - メルマガ・ダウンロード CTA */

function SearchOptionD() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[{ label: "ホーム" }, { label: "検索", current: true }]} />
      </div>

      {/* Top search */}
      <header style={{ padding: "12px 24px 0" }}>
        <h1 className="h1" style={{ fontSize: 26 }}>検索: <span style={{ color: "var(--primary)" }}>{SEARCH_QUERY}</span></h1>
        <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{SEARCH_RESULTS.length}件のヒット (0.12秒)</div>
      </header>

      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "10px 14px", border: "2px solid var(--primary)", borderRadius: 12,
          background: "#fff", boxShadow: "var(--shadow-sm)",
        }}>
          {React.cloneElement(Icons.Search, { className: "icon icon-lg", style: { color: "var(--primary)" } })}
          <input value={SEARCH_QUERY} readOnly style={{
            flex: 1, border: 0, outline: "none", font: "inherit", fontSize: 16, fontWeight: 500,
          }} />
          <button className="btn btn-primary">再検索</button>
        </div>
        {/* Type tabs */}
        <div style={{ marginTop: 10, display: "flex", gap: 6, flexWrap: "wrap" }}>
          {[["all", "すべて", 6], ["ranking", "ランキング", 4], ["blog", "ブログ", 2]].map(([k, lbl, n]) => (
            <span key={k} style={{
              padding: "5px 12px", borderRadius: 999,
              border: `1px solid ${k === "all" ? "var(--primary)" : "var(--border)"}`,
              background: k === "all" ? "var(--primary-50)" : "#fff",
              color: k === "all" ? "var(--primary)" : "var(--fg-2)",
              fontSize: 12, fontWeight: k === "all" ? 700 : 500,
            }}>{lbl} ({n})</span>
          ))}
        </div>
      </div>

      <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "flex-start" }}>
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Top result (highlighted) */}
          <div className="card" style={{
            padding: 16,
            background: "linear-gradient(135deg, var(--primary-50), #fff)",
            borderColor: "var(--primary-100)",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span className="pill primary">⭐️ 関連度の高い結果</span>
              <span className="muted" style={{ fontSize: 11 }}>クエリと完全一致</span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <div style={{ width: 100, flexShrink: 0 }}>
                <TileMapMini color="#1d4ed8" size={8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: "var(--primary)" }}>
                  <Highlighted html={SEARCH_RESULTS[0].snippet.replace(/<mark>東京都<\/mark>/, "東京都")} />
                </div>
                <a href="#" style={{ fontSize: 16, fontWeight: 800, textDecoration: "none", color: "var(--fg)", display: "block", marginTop: 4 }}>
                  {SEARCH_RESULTS[0].title} — 47都道府県ランキング
                </a>
                <div style={{ marginTop: 6, display: "flex", gap: 12, fontSize: 12, color: "var(--muted)" }}>
                  <span>1位: <strong>{SEARCH_RESULTS[0].top1}</strong> {SEARCH_RESULTS[0].top1Val}</span>
                  <span>· 47件のデータ</span>
                  <span>· {SEARCH_RESULTS[0].latestYear}年</span>
                </div>
                <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                  <a href="#" className="btn btn-primary btn-sm">ランキングを見る →</a>
                  <button className="btn btn-sm">
                    {React.cloneElement(Icons.Download, { className: "icon icon-sm" })}
                    CSV
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* ★ Native sponsored results */}
          <div className="card" style={{ background: "#fffbeb", borderColor: "#fde68a", padding: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", background: "#92400e", color: "#fff", borderRadius: 4, letterSpacing: "0.06em" }}>PR · スポンサー</span>
              <span className="muted" style={{ fontSize: 11 }}>「{SEARCH_QUERY}」に関連する商品・サービス</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {[
                { title: "東京駅限定 銘菓詰め合わせ 16個入", price: "¥3,240", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)", source: "Amazon" },
                { title: "東京都の特産品 ふるさと納税 寄附", price: "¥10,000〜", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)", source: "ふるさとチョイス" },
                { title: "人口減少社会のデザイン", price: "¥1,980", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)", source: "Amazon" },
              ].map((g, i) => (
                <a key={i} href="#" style={{
                  display: "flex", gap: 10, padding: 10,
                  background: "#fff", borderRadius: 8,
                  border: "1px solid var(--border)",
                  textDecoration: "none", color: "var(--fg)",
                }}>
                  <div style={{ width: 50, height: 70, background: g.thumb, borderRadius: 4, flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 9.5, color: "var(--muted)" }}>{g.source}</div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, lineHeight: 1.35, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", marginTop: 2 }}>{g.title}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#b45309", marginTop: 4 }}>{g.price}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Regular results */}
          <div className="eyebrow" style={{ marginTop: 4 }}>その他の結果</div>
          {SEARCH_RESULTS.slice(1, 4).map(r => (
            <a key={r.id} href="#" className="card" style={{
              display: "flex", gap: 12, padding: 14,
              textDecoration: "none", color: "var(--fg)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: r.type === "ranking" ? "var(--primary-50)" : "#fce7f3",
                color: r.type === "ranking" ? "var(--primary)" : "#9d174d",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                {React.cloneElement(r.type === "ranking" ? Icons.Trend : Icons.External, { className: "icon icon-lg" })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="pill" style={{
                    background: r.type === "ranking" ? "var(--primary-50)" : "#fce7f3",
                    color: r.type === "ranking" ? "var(--primary)" : "#9d174d",
                  }}>{r.type === "ranking" ? "ランキング" : "ブログ"}</span>
                  <span className="muted" style={{ fontSize: 11 }}>{r.category}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
                  <Highlighted html={r.snippet || r.description} />
                </div>
              </div>
            </a>
          ))}

          {/* In-feed AdSense */}
          <div>
            <div className="div-label" style={{ marginBottom: 6 }}>広告</div>
            <AdSlot height={100} label="" />
          </div>

          {/* Last result */}
          {SEARCH_RESULTS.slice(4).map(r => (
            <a key={r.id} href="#" className="card" style={{
              display: "flex", gap: 12, padding: 14,
              textDecoration: "none", color: "var(--fg)",
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: 8, flexShrink: 0,
                background: r.type === "ranking" ? "var(--primary-50)" : "#fce7f3",
                color: r.type === "ranking" ? "var(--primary)" : "#9d174d",
                display: "inline-flex", alignItems: "center", justifyContent: "center",
              }}>
                {React.cloneElement(r.type === "ranking" ? Icons.Trend : Icons.External, { className: "icon icon-lg" })}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span className="pill" style={{ background: "var(--primary-50)", color: "var(--primary)" }}>ランキング</span>
                  <span className="muted" style={{ fontSize: 11 }}>{r.category}</span>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.4 }}>{r.title}</div>
                <div style={{ fontSize: 12.5, color: "var(--muted)", lineHeight: 1.6, marginTop: 4 }}>
                  <Highlighted html={r.snippet || r.description} />
                </div>
              </div>
            </a>
          ))}

          {/* End-of-list CTA */}
          <div style={{
            padding: 18, borderRadius: 12,
            background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
            color: "#fff", display: "flex", alignItems: "center", gap: 14,
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>もっと深掘り</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>「{SEARCH_QUERY}」の関連データを CSV で一括取得</div>
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 4 }}>ヒット 6件 × 47都道府県 × 6年分</div>
            </div>
            <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
              {React.cloneElement(Icons.Download, { className: "icon" })}
              データを取得
            </button>
          </div>
        </main>

        {/* Right */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Related queries */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">関連する検索</div>
            </div>
            <div className="side-list" style={{ padding: 6 }}>
              {["東京都 人口推移", "人口 全国平均", "東京 高齢化", "人口密度 ランキング"].map(q => (
                <a key={q} href="#"><span>{q}</span><span className="meta">→</span></a>
              ))}
            </div>
          </div>

          {/* Native books */}
          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">この検索に関連する書籍</div>
              <span className="pill">PR</span>
            </div>
            <div style={{ padding: 8, display: "flex", flexDirection: "column", gap: 6 }}>
              {[
                { title: "人口減少社会のデザイン", author: "広井良典", price: "¥1,980", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
                { title: "未来の年表", author: "河合雅司", price: "¥880", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
              ].map((b, i) => <BookCard key={i} book={b} compact />)}
            </div>
          </div>

          <div className="card" style={{ padding: 10 }}>
            <div className="div-label" style={{ marginBottom: 8, fontSize: 10 }}>広告</div>
            <AdSlot height={250} label="" />
          </div>

          {/* Newsletter */}
          <div className="card" style={{ padding: 12, background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div className="h3" style={{ color: "var(--primary)", marginBottom: 4 }}>📧 検索アラート</div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.5, marginBottom: 8 }}>
              「{SEARCH_QUERY}」の新着結果をメールで通知
            </div>
            <input placeholder="you@example.com" style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12, marginBottom: 6 }} />
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>登録</button>
          </div>
        </aside>
      </div>
    </div>
  );
}

window.SearchOptionD = SearchOptionD;

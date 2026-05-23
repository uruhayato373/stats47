/* Tag Option D — Discovery + ネイティブ収益
   - タグハブ風 + ふるさと納税 + 関連書籍 + メルマガ */

function TagOptionD() {
  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" }, { label: "タグ一覧" },
          { label: TAG.name, current: true },
        ]} />
      </div>

      {/* HERO */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
          color: "#fff", padding: 28, position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.08, background: "radial-gradient(circle at 80% 30%, #fff, transparent 50%)" }} />
          <div style={{ position: "relative", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.7, fontWeight: 700 }}>タグ · ブログ</div>
              <h1 style={{
                fontSize: 50, fontWeight: 800, margin: "8px 0 12px",
                letterSpacing: "-0.02em",
                display: "inline-flex", alignItems: "baseline", gap: 6,
              }}>
                <span style={{ opacity: 0.5, fontSize: 26, fontWeight: 600 }}>#</span>
                {TAG.name}
              </h1>
              <p style={{ fontSize: 14.5, opacity: 0.85, lineHeight: 1.7, margin: "0 0 18px", maxWidth: 480 }}>
                {TAG.description}
              </p>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
                  {React.cloneElement(Icons.Mail, { className: "icon" })} フォロー
                </button>
                <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                  {React.cloneElement(Icons.Share, { className: "icon" })} 共有
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
              {[
                ["記事数", TAG.articleCount, "件"],
                ["累計閲覧", `${(TAG.totalReads / 1000).toFixed(1)}k`, "回"],
                ["フォロワー", TAG.followers, "人"],
                ["関連タグ", TAG.relatedTags.length, "件"],
              ].map(([k, v, u], i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.08)", padding: 14, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 10.5, opacity: 0.65, fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}>{k}</div>
                  <div className="mono" style={{ fontSize: 26, fontWeight: 800, marginTop: 4 }}>
                    {v}<span style={{ fontSize: 11, opacity: 0.65, fontWeight: 500, marginLeft: 3 }}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Related tags carousel */}
      <div style={{ padding: "18px 24px 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span className="eyebrow">関連タグ:</span>
        {TAG.relatedTags.map(t => (
          <a key={t.name} href="#" style={{
            padding: "5px 12px", borderRadius: 999,
            background: "#fff", border: "1px solid var(--border)",
            fontSize: 12.5, color: "var(--fg-2)", textDecoration: "none",
          }}>#{t.name} <span className="muted" style={{ fontSize: 10 }}>{t.count}</span></a>
        ))}
      </div>

      <div style={{ padding: "20px 24px 24px", display: "grid", gridTemplateColumns: "1fr 300px", gap: 20, alignItems: "flex-start", maxWidth: 1400, margin: "0 auto" }}>
        <main style={{ minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Articles top 3 */}
          <section>
            <div className="between" style={{ marginBottom: 12 }}>
              <div className="h2">⭐️ 「{TAG.name}」の注目記事</div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {TAG_ARTICLES.slice(0, 3).map(a => (
                <a key={a.slug} href="#" className="card" style={{
                  padding: 0, textDecoration: "none", color: "var(--fg)",
                  display: "flex", flexDirection: "column", overflow: "hidden",
                }}>
                  <div style={{ aspectRatio: "1200/630", background: a.thumb, position: "relative" }}>
                    <span className="pill primary" style={{
                      position: "absolute", top: 8, left: 8,
                      background: "rgba(255,255,255,0.95)",
                    }}>{a.category}</span>
                  </div>
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.4 }}>{a.title}</div>
                    <div style={{ marginTop: "auto", fontSize: 11, color: "var(--muted)", display: "flex", justifyContent: "space-between" }}>
                      <span>{a.date}</span>
                      <span>👁 {a.views.toLocaleString()}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* ★ Native books for this tag */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="h2">「{TAG.name}」に関する書籍</div>
                <span className="pill">PR</span>
              </div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>もっと見る ›</a>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { title: "人口減少社会のデザイン", author: "広井良典", price: "¥1,980", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
                { title: "地方消滅", author: "増田寛也 編著", price: "¥902", thumb: "linear-gradient(135deg, #bfdbfe, #3b82f6)" },
                { title: "未来の年表", author: "河合雅司", price: "¥880", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
                { title: "縮減ニッポンの再構築", author: "山下祐介", price: "¥1,540", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
              ].map((b, i) => <BookCard key={i} book={b} />)}
            </div>
          </section>

          {/* Remaining articles */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">過去の記事</div>
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>新着順</option><option>人気順</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
              {TAG_ARTICLES.slice(3).map(a => (
                <a key={a.slug} href="#" className="card" style={{
                  padding: 0, textDecoration: "none", color: "var(--fg)",
                  display: "grid", gridTemplateColumns: "140px 1fr", overflow: "hidden",
                }}>
                  <div style={{ background: a.thumb }} />
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div><span className="pill">{a.category}</span></div>
                    <div style={{
                      fontSize: 13.5, fontWeight: 700, lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>{a.title}</div>
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                      <span>{a.date}</span><span>👁 {a.views.toLocaleString()}</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>

          {/* AdSense */}
          <div>
            <div className="div-label" style={{ marginBottom: 6 }}>広告</div>
            <AdSlot height={120} label="" />
          </div>
        </main>

        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div className="h3" style={{ color: "var(--primary)", marginBottom: 4 }}>📧 タグをフォロー</div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.55, marginBottom: 8 }}>
              「{TAG.name}」の新着記事をメールで通知
            </div>
            <input placeholder="you@example.com" style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12, marginBottom: 6 }} />
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>登録する</button>
          </div>

          <RelatedRankingsCard items={TAG.relatedRankings} />

          <div className="card">
            <div className="card-header" style={{ padding: "10px 12px" }}>
              <div className="h3">関連タグ</div>
            </div>
            <div style={{ padding: 10, display: "flex", flexWrap: "wrap", gap: 4 }}>
              {TAG.relatedTags.map(t => (
                <a key={t.name} href="#" style={{
                  fontSize: 11, padding: "3px 8px", borderRadius: 999,
                  background: "var(--bg-subtle)", border: "1px solid var(--border)",
                  color: "var(--fg-2)", textDecoration: "none",
                }}>#{t.name}</a>
              ))}
            </div>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

window.TagOptionD = TagOptionD;

/* Tag Option B — タグハブ (Discovery)
   - 大型ヒーロー: タグ名 + 説明 + 統計
   - フィーチャー記事 (大カード) + 通常記事グリッド
   - 関連タグカルーセル
   - サイドにタグ統計 + 関連ランキング */

function TagOptionB() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ブログ" }, { label: "タグ一覧" },
          { label: TAG.name, current: true },
        ]} />
      </div>

      {/* ★ HERO */}
      <section style={{
        padding: "30px 24px 28px",
        background: "linear-gradient(135deg, #eff6ff 0%, #fff 70%)",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 320px", gap: 30, alignItems: "center" }}>
          <div>
            <div className="eyebrow" style={{ color: "var(--primary)" }}>タグ · ブログ</div>
            <h1 style={{
              fontSize: 56, fontWeight: 800, margin: "6px 0 12px",
              letterSpacing: "-0.02em",
              display: "inline-flex", alignItems: "baseline", gap: 6,
            }}>
              <span style={{ color: "var(--muted)", fontSize: 28, fontWeight: 600 }}>#</span>
              {TAG.name}
            </h1>
            <p style={{ fontSize: 15, color: "var(--muted)", margin: "0 0 18px", lineHeight: 1.7, maxWidth: 580 }}>
              {TAG.description}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn btn-primary">
                {React.cloneElement(Icons.Mail, { className: "icon" })}
                このタグをフォロー
              </button>
              <button className="btn">
                {React.cloneElement(Icons.Share, { className: "icon" })}
                共有
              </button>
            </div>
          </div>
          {/* Stats panel */}
          <div className="card" style={{ padding: 18 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>このタグの統計</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                ["記事数", TAG.articleCount, "件"],
                ["累計閲覧", TAG.totalReads.toLocaleString(), "回"],
                ["フォロワー", TAG.followers, "人"],
                ["関連タグ", TAG.relatedTags.length, "件"],
              ].map(([k, v, u], i) => (
                <div key={i}>
                  <div className="muted" style={{ fontSize: 10.5, fontWeight: 600 }}>{k}</div>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800, color: "var(--primary)" }}>
                    {v}<span style={{ fontSize: 10, color: "var(--muted)", fontWeight: 500, marginLeft: 2 }}>{u}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Related tags carousel */}
      <section style={{ padding: "18px 24px 0", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span className="eyebrow" style={{ flexShrink: 0 }}>関連するタグ:</span>
          {TAG.relatedTags.map(t => (
            <a key={t.name} href="#" style={{
              padding: "5px 12px", borderRadius: 999,
              background: "#fff", border: "1px solid var(--border)",
              fontSize: 12.5, color: "var(--fg-2)", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 4,
              fontWeight: 500,
            }}>#{t.name}<span className="muted" style={{ fontSize: 10 }}>{t.count}</span></a>
          ))}
        </div>
      </section>

      <div style={{ padding: "24px 24px 24px", display: "grid", gridTemplateColumns: "1fr 280px", gap: 20, alignItems: "flex-start", maxWidth: 1400, margin: "0 auto" }}>
        <main style={{ minWidth: 0 }}>
          {/* Feature article */}
          <section style={{ marginBottom: 20 }}>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">⭐️ 注目記事</div>
            </div>
            <a href="#" className="card" style={{
              padding: 0, textDecoration: "none", color: "var(--fg)",
              display: "grid", gridTemplateColumns: "1.4fr 1fr", overflow: "hidden",
              minHeight: 280,
            }}>
              <div style={{ background: TAG_ARTICLES[0].thumb }} />
              <div style={{ padding: 24, display: "flex", flexDirection: "column", justifyContent: "center", gap: 12 }}>
                <div>
                  <span className="pill primary">{TAG_ARTICLES[0].category}</span>
                  <span className="pill" style={{ marginLeft: 4 }}>👁 {TAG_ARTICLES[0].views.toLocaleString()}</span>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.3 }}>{TAG_ARTICLES[0].title}</div>
                <p style={{ fontSize: 13, color: "var(--muted)", lineHeight: 1.65, margin: 0 }}>
                  2024年データで読み解く、47都道府県の人口動態と地方の人口減少…
                </p>
                <div style={{ marginTop: 4, display: "flex", gap: 4 }}>
                  {TAG_ARTICLES[0].tags.map(t => <Tag key={t}>{t}</Tag>)}
                </div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {TAG_ARTICLES[0].date} · 読了 {TAG_ARTICLES[0].readMinutes}分
                </div>
              </div>
            </a>
          </section>

          {/* Rest */}
          <section>
            <div className="between" style={{ marginBottom: 10 }}>
              <div className="h2">最近の記事 <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{TAG.articleCount - 1}件</span></div>
              <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
                <option>新着順</option><option>人気順</option>
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
              {TAG_ARTICLES.slice(1).map(a => (
                <a key={a.slug} href="#" className="card" style={{
                  padding: 0, textDecoration: "none", color: "var(--fg)",
                  display: "grid", gridTemplateColumns: "140px 1fr", overflow: "hidden",
                }}>
                  <div style={{ background: a.thumb }} />
                  <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 6 }}>
                    <div>
                      <span className="pill">{a.category}</span>
                    </div>
                    <div style={{
                      fontSize: 13.5, fontWeight: 700, lineHeight: 1.4,
                      overflow: "hidden", display: "-webkit-box",
                      WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                    }}>{a.title}</div>
                    <div style={{ marginTop: "auto", display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)" }}>
                      <span>{a.date}</span>
                      <span>👁 {a.views.toLocaleString()} · {a.readMinutes}分</span>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </section>
        </main>

        {/* Sidebar */}
        <aside style={{ position: "sticky", top: 16, display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="card">
            <div className="card-header" style={{ padding: "12px 14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {React.cloneElement(Icons.Trend, { className: "icon", style: { color: "var(--primary)" } })}
                <div className="h3">「{TAG.name}」関連ランキング</div>
              </div>
            </div>
            <div className="card-body" style={{ padding: 6 }}>
              <div className="side-list">
                {TAG.relatedRankings.map(r => (
                  <a key={r.key} href="#"><span>{r.title}</span><span className="meta">{r.unit}</span></a>
                ))}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 14, background: "linear-gradient(135deg, var(--primary-50), #fff)", borderColor: "var(--primary-100)" }}>
            <div className="h3" style={{ color: "var(--primary)", marginBottom: 4 }}>📧 タグをフォロー</div>
            <div className="muted" style={{ fontSize: 11.5, lineHeight: 1.55, marginBottom: 8 }}>
              「{TAG.name}」の新着記事をメールでお知らせ
            </div>
            <input placeholder="you@example.com" style={{ width: "100%", padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12, marginBottom: 6 }} />
            <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center" }}>登録する</button>
          </div>

          <AdSlot height={250} />
        </aside>
      </div>
    </div>
  );
}

window.TagOptionB = TagOptionB;

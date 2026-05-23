/* Category Option D — ストーリー型 + ネイティブ収益最大化
   - ヒーロー(カテゴリ説明 + カテゴリ全体のKPI 4枚)
   - 注目ランキング (大カード 3枚)
   - 全件テーブル
   - ネイティブアフィリエイト (テーマに合った書籍)
   - 関連記事 + メルマガ CTA + AdSense
   - CSV "データパック" 訴求 */

function CategoryOptionD() {
  const [norm, setNorm] = React.useState("total");

  return (
    <div className="page" style={{ background: "#fafbfc" }}>
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "カテゴリ" }, { label: CATEGORY.name, current: true },
        ]} />
      </div>

      {/* ★ HERO */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          borderRadius: 16, overflow: "hidden",
          background: "linear-gradient(135deg, #0b1220 0%, #1e3a8a 60%, #2563eb 100%)",
          color: "#fff", padding: 28, position: "relative",
        }}>
          <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(circle at 80% 20%, #fff, transparent 50%)" }} />
          <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", background: "rgba(255,255,255,0.18)", borderRadius: 999, letterSpacing: "0.04em", textTransform: "uppercase", display: "inline-block" }}>カテゴリ</div>
              <h1 style={{ margin: "10px 0 0", fontSize: 38, fontWeight: 800, letterSpacing: "-0.01em" }}>
                {CATEGORY.icon} {CATEGORY.name}
              </h1>
              <p style={{ margin: "10px 0 18px", fontSize: 14.5, lineHeight: 1.7, opacity: 0.85, maxWidth: 540 }}>
                {CATEGORY.description}
              </p>
              <div style={{ display: "flex", gap: 14, fontSize: 11.5, opacity: 0.8 }}>
                <span>📊 {CATEGORY.totalRankings}件のランキング</span>
                <span>⭐️ 注目{FEATURED_RANKINGS.length}件</span>
                <span>🔄 更新: {CATEGORY.lastUpdated}</span>
              </div>
              <div style={{ marginTop: 18, display: "flex", gap: 8 }}>
                <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700 }}>
                  {React.cloneElement(Icons.Download, { className: "icon" })}
                  カテゴリ全件CSV
                </button>
                <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}>
                  {React.cloneElement(Icons.Share, { className: "icon" })}
                  共有
                </button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {[
                { label: "全国総人口", v: "1.24", u: "億人", note: "2024年" },
                { label: "高齢化率", v: "29.8", u: "%", note: "+0.6 vs 2019" },
                { label: "東京シェア", v: "11.3", u: "%", note: "全国の" },
                { label: "減少率トップ", v: "▲14.5", u: "%", note: "秋田県" },
              ].map((k, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.08)", padding: 14, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.12)",
                }}>
                  <div style={{ fontSize: 10.5, opacity: 0.65, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 600 }}>{k.label}</div>
                  <div className="mono" style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                    {k.v} <span style={{ fontSize: 11, opacity: 0.65, fontWeight: 500 }}>{k.u}</span>
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{k.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Featured */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 12 }}>
          <div className="eyebrow">1. 注目のランキング</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
          {FEATURED_RANKINGS.slice(0, 3).map(r => <FeaturedRankingCardLarge key={r.key} r={r} />)}
        </div>
      </section>

      {/* All rankings */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div className="eyebrow">2. 全{CATEGORY.totalRankings}件のランキング</div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <div className="seg">
              {[
                ["total", "総数"],
                ["per_pop", "人口あたり"],
                ["per_area", "面積あたり"],
              ].map(([k, lbl]) => (
                <button key={k} className={"item" + (norm === k ? " active" : "")} onClick={() => setNorm(k)}>{lbl}</button>
              ))}
            </div>
            <select className="select" style={{ padding: "5px 10px", fontSize: 12 }}>
              <option>更新日順</option>
              <option>注目順</option>
            </select>
            <button className="btn btn-primary btn-sm">
              {React.cloneElement(Icons.Download, { className: "icon icon-sm" })}
              CSV
            </button>
          </div>
        </div>
        <div className="card">
          <table className="rk">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>指標</th>
                <th>1位</th>
                <th style={{ textAlign: "right" }}>値</th>
                <th>推移</th>
                <th style={{ width: 60 }}></th>
              </tr>
            </thead>
            <tbody>
              {ALL_RANKINGS.slice(0, 10).map((r, i) => (
                <tr key={r.key}>
                  <td className="mono" style={{ color: "var(--muted)" }}>{i + 1}</td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, background: r.color, borderRadius: 2 }} />
                      <a href="#" style={{ color: "var(--fg)", textDecoration: "none", fontWeight: 600 }}>{r.title}</a>
                      {r.featured && <span style={{ fontSize: 10 }}>⭐️</span>}
                    </div>
                  </td>
                  <td style={{ fontSize: 12.5 }}>{r.top}</td>
                  <td className="mono value" style={{ textAlign: "right" }}>{r.topVal} <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: 11 }}>{r.unit}</span></td>
                  <td><Sparkline data={r.trend} color={r.color} w={70} h={22} /></td>
                  <td style={{ textAlign: "right" }}><a href="#" className="btn btn-sm btn-ghost">→</a></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{ textAlign: "center", marginTop: 10 }}>
          <button className="btn">残り{ALL_RANKINGS.length - 10}件をすべて表示</button>
        </div>
      </section>

      {/* Native affiliate */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="between" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="eyebrow">3. このカテゴリで読む</span>
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

      {/* Data pack + Newsletter */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>4. データを活用する</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div className="card" style={{
            padding: 18, display: "flex", gap: 14, alignItems: "center",
            background: "linear-gradient(135deg, var(--primary-50), #fff)",
            borderColor: "var(--primary-100)",
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { width: 24, height: 24 } })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--primary)" }}>{CATEGORY.name} データパック</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                {CATEGORY.totalRankings}件のランキング × 47都道府県 × 6年分を一括ダウンロード
              </div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <button className="btn btn-primary btn-sm">CSV (zip)</button>
                <button className="btn btn-sm">JSON</button>
                <button className="btn btn-sm">Excel</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 18, display: "flex", gap: 14, alignItems: "center" }}>
            <div style={{ width: 52, height: 52, borderRadius: 12, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Mail, { className: "icon icon-lg", style: { width: 24, height: 24 } })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3">カテゴリの更新通知</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{CATEGORY.name}のデータが更新されたらメールでお知らせ</div>
              <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                <input placeholder="you@example.com" style={{ flex: 1, padding: "7px 10px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12 }} />
                <button className="btn btn-primary btn-sm">登録</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* AdSense */}
      <section style={{ padding: "24px 24px 0" }}>
        <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
        <AdSlot height={120} label="" />
      </section>

      {/* Related articles */}
      <section style={{ padding: "24px 24px 24px" }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>5. このカテゴリに関する記事</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
          {[
            { title: "東京一極集中はなぜ進むのか — 人口・経済・産業の3視点", date: "2025-03-15" },
            { title: "秋田県の人口減少率はなぜ全国最大なのか", date: "2025-02-20" },
            { title: "高齢化率1位の秋田 — 医療・介護の課題", date: "2025-01-30" },
          ].map((a, i) => (
            <a key={i} href="#" className="card" style={{ padding: 14, textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{
                height: 100, borderRadius: 8,
                background: ["linear-gradient(135deg, #dbeafe, #1d4ed8)", "linear-gradient(135deg, #fde68a, #f59e0b)", "linear-gradient(135deg, #fbcfe8, #ec4899)"][i],
              }} />
              <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.4 }}>{a.title}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: "auto" }}>{a.date}</div>
            </a>
          ))}
        </div>
      </section>
    </div>
  );
}

window.CategoryOptionD = CategoryOptionD;

/* Home Option D — Revenue-Optimized (収益 + 回遊最大化)
   - ヒーロー → 注目ランキング → カテゴリ → ★ ふるさと納税 → 注目記事 → メルマガ + データパック
   - すべての CTA が明確 */

function HomeOptionD() {
  return (
    <div className="page" style={{ background: "#fff" }}>
      {/* Hero */}
      <section style={{
        padding: "40px 24px 30px",
        background: "linear-gradient(135deg, #0b1220, #1e3a8a)",
        color: "#fff", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.1, background: "radial-gradient(circle at 80% 30%, #fff, transparent 50%)" }} />
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 380px", gap: 30, alignItems: "center", position: "relative" }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", opacity: 0.7, fontWeight: 700 }}>stats47 ─ 47都道府県データ</div>
            <h1 style={{ fontSize: 46, fontWeight: 800, letterSpacing: "-0.02em", lineHeight: 1.1, margin: "8px 0 16px" }}>
              あなたの県は<br/><span style={{ color: "#60a5fa" }}>何位？</span>
            </h1>
            <p style={{ fontSize: 15, opacity: 0.85, lineHeight: 1.7, margin: "0 0 18px", maxWidth: 540 }}>
              <strong>1,800以上の統計</strong>で47都道府県をランキング。地図・グラフ・CSV ダウンロードで自由に使えます。
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn" style={{ background: "#fff", color: "#0b1220", borderColor: "transparent", fontWeight: 700, padding: "10px 16px" }}>
                {React.cloneElement(Icons.Trend, { className: "icon" })}
                ランキングを見る
              </button>
              <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)", padding: "10px 16px" }}>
                {React.cloneElement(Icons.Search, { className: "icon" })}
                キーワード検索
              </button>
              <button className="btn" style={{ background: "transparent", color: "#fff", borderColor: "rgba(255,255,255,0.3)", padding: "10px 16px" }}>
                {React.cloneElement(Icons.Download, { className: "icon" })}
                データを取得
              </button>
            </div>
            <div style={{ marginTop: 18, display: "flex", gap: 18 }}>
              {HOME_STATS.map((s, i) => (
                <div key={i}>
                  <div className="mono" style={{ fontSize: 22, fontWeight: 800 }}>
                    {s.value}<span style={{ fontSize: 12, opacity: 0.7 }}>{s.suffix}</span>
                  </div>
                  <div style={{ fontSize: 10.5, opacity: 0.6, marginTop: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* mini map */}
          <div style={{ background: "rgba(255,255,255,0.06)", borderRadius: 14, padding: 18, border: "1px solid rgba(255,255,255,0.1)" }}>
            <div style={{ fontSize: 11, opacity: 0.7, letterSpacing: "0.06em", textAlign: "center", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>地図から探す</div>
            <JapanInteractiveMap highlight="13" />
          </div>
        </div>
      </section>

      {/* Featured rankings */}
      <section style={{ padding: "40px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>⭐️ 注目のランキング</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべて見る →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_FEATURED.map(r => <FeaturedHomeCard key={r.key} r={r} />)}
          </div>
        </div>
      </section>

      {/* ★ Furusato Nozei native */}
      <section style={{ padding: "40px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{
            borderRadius: 14, overflow: "hidden",
            background: "linear-gradient(135deg, #fef3c7, #fff)",
            border: "1px solid #fde68a",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: "1px solid #fde68a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 24 }}>🎁</span>
                <div>
                  <div className="h2" style={{ color: "#92400e", fontSize: 20 }}>地域から選ぶ ふるさと納税</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>都道府県の人気返礼品ピックアップ</div>
                </div>
                <span className="pill" style={{ background: "#92400e", color: "#fff", marginLeft: 8 }}>PR</span>
              </div>
              <a href="#" className="btn" style={{ background: "#b45309", color: "#fff", borderColor: "#b45309" }}>都道府県から探す →</a>
            </div>
            <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              {[
                { region: "北海道", title: "夕張メロン 2玉ギフト", price: "¥12,000〜", thumb: "linear-gradient(135deg, #bbf7d0, #16a34a)" },
                { region: "山形県", title: "佐藤錦 さくらんぼ 500g", price: "¥10,000〜", thumb: "linear-gradient(135deg, #fbcfe8, #ec4899)" },
                { region: "宮崎県", title: "黒毛和牛 すき焼き用 500g", price: "¥15,000〜", thumb: "linear-gradient(135deg, #fde68a, #f59e0b)" },
                { region: "沖縄県", title: "石垣島マンゴー 1kg", price: "¥10,000〜", thumb: "linear-gradient(135deg, #fef3c7, #fbbf24)" },
              ].map((g, i) => (
                <a key={i} href="#" style={{
                  display: "flex", flexDirection: "column", gap: 8, padding: 10,
                  background: "#fff", borderRadius: 10, border: "1px solid var(--border)",
                  textDecoration: "none", color: "var(--fg)",
                }}>
                  <div style={{ height: 100, borderRadius: 8, background: g.thumb }} />
                  <div>
                    <div style={{ fontSize: 10.5, color: "var(--muted)", fontWeight: 600 }}>{g.region}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35, marginTop: 2 }}>{g.title}</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#b45309", marginTop: 4 }}>寄附 {g.price}</div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Themes */}
      <section style={{ padding: "40px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>🔬 テーマで分析</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>テーマ一覧 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 8 }}>
            {HOME_THEMES.slice(0, 12).map(t => (
              <a key={t.key} href="#" className="card" style={{ padding: 12, textAlign: "center", textDecoration: "none", color: "var(--fg)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                <div style={{ fontSize: 22 }}>{t.icon}</div>
                <div style={{ fontSize: 11.5, fontWeight: 600 }}>{t.name}</div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* AdSense */}
      <section style={{ padding: "40px 24px 0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div className="div-label" style={{ marginBottom: 8 }}>広告</div>
          <AdSlot height={100} label="" />
        </div>
      </section>

      {/* Articles */}
      <section style={{ padding: "40px 24px 0", background: "#fafbfc" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 0" }}>
          <div className="between" style={{ marginBottom: 16 }}>
            <h2 className="h2" style={{ fontSize: 22 }}>📝 統計ブログ</h2>
            <a href="#" style={{ fontSize: 13, color: "var(--primary)", textDecoration: "none", fontWeight: 600 }}>すべての記事 →</a>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {HOME_ARTICLES.map(a => (
              <a key={a.slug} href="#" className="card" style={{ padding: 0, textDecoration: "none", color: "var(--fg)", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <div style={{ aspectRatio: "1200/630", background: a.thumb }} />
                <div style={{ padding: 12 }}>
                  <span className="pill">{a.category}</span>
                  <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.4, marginTop: 4, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{a.title}</div>
                  <div className="muted" style={{ fontSize: 11, marginTop: 6 }}>{a.date}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Data pack + Newsletter */}
      <section style={{ padding: "30px 24px 40px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
          <div className="card" style={{
            padding: 22, display: "flex", gap: 14, alignItems: "center",
            background: "linear-gradient(135deg, var(--primary-50), #fff)",
            borderColor: "var(--primary-100)",
          }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg", style: { width: 28, height: 28 } })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--primary)", fontSize: 16 }}>データを活用する</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.55 }}>
                1,800指標 × 47都道府県 × 30年 = 250万件以上のデータをCSV/JSON/Excelで取得可能。
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <button className="btn btn-primary btn-sm">データ取得ページへ</button>
                <button className="btn btn-sm">サンプル</button>
              </div>
            </div>
          </div>
          <div className="card" style={{ padding: 22, display: "flex", gap: 14, alignItems: "center", background: "linear-gradient(135deg, #f0fdfa, #fff)", borderColor: "#a7f3d0" }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: "var(--accent)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {React.cloneElement(Icons.Mail, { className: "icon icon-lg", style: { width: 28, height: 28 } })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--accent)", fontSize: 16 }}>新着データ通知</div>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 2, lineHeight: 1.55 }}>
                注目ランキングの更新と編集部の解説記事を週1回お届け。
              </div>
              <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
                <input placeholder="you@example.com" style={{ flex: 1, padding: "8px 12px", border: "1px solid var(--border)", borderRadius: 6, font: "inherit", fontSize: 12 }} />
                <button className="btn btn-primary btn-sm">登録</button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

window.HomeOptionD = HomeOptionD;

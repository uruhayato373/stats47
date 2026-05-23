/* Option D — ヒーロー・メトリック＋ネイティブ収益 (収益と UX のバランス)
   上部: 巨大なメトリックヒーロー (現在の単位/年/エリアを大きく表示, タブ切替, CSV CTA)
   コンテンツ内に "ネイティブ" 形式のアフィリエイト/AdSenseを溶け込ませる。
   PCで滞在時間と回遊率を引き上げる重厚な構成。 */

function OptionD() {
  const [unit, setUnit] = React.useState("total");
  const [year, setYear] = React.useState("2024");
  const [area, setArea] = React.useState("pref");

  return (
    <div className="page">
      <div style={{ padding: "16px 24px 0" }}>
        <Breadcrumb items={[
          { label: "ホーム" }, { label: "ランキング" },
          { label: "人口・世帯" }, { label: "総人口", current: true },
        ]} />
      </div>

      {/* ★ Hero card */}
      <div style={{ padding: "12px 24px 0" }}>
        <div style={{
          border: "1px solid var(--border)",
          borderRadius: 16,
          background: "linear-gradient(160deg, #f5f8ff 0%, #ffffff 60%)",
          padding: 22,
          display: "grid", gridTemplateColumns: "1fr 1fr",
          gap: 24, alignItems: "stretch",
          position: "relative", overflow: "hidden",
        }}>
          {/* L: title + tabs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14, minWidth: 0 }}>
            <div>
              <div className="eyebrow" style={{ color: "var(--primary)" }}>人口・世帯 / 総人口</div>
              <h1 className="h1" style={{ fontSize: 32, marginTop: 2 }}>都道府県の総人口ランキング</h1>
              <div className="muted" style={{ fontSize: 12.5, marginTop: 6 }}>
                総務省統計局「人口推計」 · データ年度 2024年 · 最終更新 2025-04-12
              </div>
            </div>

            {/* unit tabs as pills */}
            <div>
              <div className="eyebrow" style={{ marginBottom: 6 }}>計算方法を切替</div>
              <div style={{ display: "inline-flex", padding: 4, border: "1px solid var(--border)", borderRadius: 999, background: "#fff", boxShadow: "var(--shadow-sm)" }}>
                {[
                  { id: "total", label: "総数", icon: Icons.Sigma },
                  { id: "per_pop", label: "人口あたり", icon: Icons.Users },
                  { id: "per_area", label: "面積あたり", icon: Icons.Area },
                ].map((t) => {
                  const active = unit === t.id;
                  return (
                    <button key={t.id} onClick={() => setUnit(t.id)}
                      style={{
                        display: "inline-flex", alignItems: "center", gap: 6,
                        border: 0, padding: "8px 16px", borderRadius: 999,
                        background: active ? "var(--primary)" : "transparent",
                        color: active ? "#fff" : "var(--muted)",
                        cursor: "pointer", font: "inherit", fontWeight: active ? 600 : 500, fontSize: 13,
                      }}>
                      {React.cloneElement(t.icon, { className: "icon icon-sm" })}
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* meta controls + CTA */}
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <div className="select" style={{ background: "#fff" }}>
                {React.cloneElement(Icons.Calendar, { className: "icon icon-sm" })}
                <select style={{ border: 0, background: "transparent", font: "inherit" }} value={year} onChange={(e) => setYear(e.target.value)}>
                  {["2024", "2023", "2022", "2020", "2015"].map((y) => <option key={y}>{y}年</option>)}
                </select>
              </div>
              <div className="seg" style={{ background: "#fff" }}>
                <button className={"item" + (area === "pref" ? " active" : "")} onClick={() => setArea("pref")}>都道府県</button>
                <button className={"item" + (area === "city" ? " active" : "")} onClick={() => setArea("city")}>市区町村</button>
              </div>
              <div style={{ flex: 1 }} />
              <button className="btn btn-primary" style={{ padding: "9px 14px" }}>
                {React.cloneElement(Icons.Download, { className: "icon" })}
                CSV をダウンロード
              </button>
              <button className="btn" title="共有">
                {React.cloneElement(Icons.Share, { className: "icon" })}
              </button>
            </div>
          </div>

          {/* R: hero stat */}
          <div style={{
            background: "#0b1220",
            color: "#fff",
            borderRadius: 12,
            padding: 22,
            display: "flex", flexDirection: "column", justifyContent: "space-between",
            gap: 14, position: "relative", overflow: "hidden",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", opacity: 0.65 }}>1位</div>
                <div style={{ fontSize: 30, fontWeight: 800, marginTop: 2 }}>東京都</div>
              </div>
              <span className="pill" style={{ background: "rgba(255,255,255,0.12)", color: "#fff" }}>2024年</span>
            </div>

            <div className="mono" style={{ fontSize: 56, fontWeight: 800, lineHeight: 1 }}>
              1,401<span style={{ fontSize: 20, opacity: 0.8, marginLeft: 4 }}>万人</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {[
                ["全国合計", "1.24 億人"],
                ["全国平均", "264 万人"],
                ["最少", "鳥取県 53 万"],
              ].map(([k, v], i) => (
                <div key={i}>
                  <div style={{ fontSize: 10.5, opacity: 0.6, letterSpacing: "0.04em" }}>{k}</div>
                  <div className="mono" style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>

            {/* glow */}
            <div style={{
              position: "absolute", right: -60, top: -60, width: 200, height: 200,
              background: "radial-gradient(circle, rgba(59,130,246,0.4), transparent 70%)",
            }} />
          </div>
        </div>
      </div>

      {/* main grid */}
      <div style={{ padding: "16px 24px 0", display: "flex", gap: 16 }}>
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Map + Table */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div className="card">
              <div className="card-header">
                <div className="h2">地図</div>
                <MapLegend />
              </div>
              <div className="jp-map" style={{ padding: 12 }}>
                <JapanMap height={420} />
              </div>
            </div>
            <div className="card">
              <div className="card-header">
                <div className="h2">順位表（TOP 12）</div>
                <a href="#" className="btn btn-sm btn-ghost">47件すべて
                  {React.cloneElement(Icons.ChevronRight, { className: "icon icon-sm" })}
                </a>
              </div>
              <RankingTable rows={TOP_DATA} unit="人" />
            </div>
          </div>

          {/* ★ Native affiliate row */}
          <div className="card">
            <div className="card-header" style={{ background: "var(--bg-subtle)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {React.cloneElement(Icons.Sparkle, { className: "icon icon-lg", style: { color: "var(--accent)" } })}
                <div className="h2">ランキング上位の都道府県・関連商品</div>
                <span className="pill">PR</span>
              </div>
              <a href="#" className="muted" style={{ fontSize: 12, textDecoration: "none" }}>すべて見る ›</a>
            </div>
            <div style={{ padding: 12, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
              <AffiliateCard region="東京都" item="東京ばな奈 16個入 詰合せ" price="¥2,160" />
              <AffiliateCard region="神奈川" item="鎌倉ハム 6種化粧箱セット" price="¥4,800" />
              <AffiliateCard region="大阪府" item="551蓬莱 豚まん 10個" price="¥3,500" />
              <AffiliateCard region="愛知県" item="ひつまぶし 名古屋備長 2食" price="¥6,480" />
            </div>
            <div className="card-footer">アフィリエイトリンクが含まれます。価格は表示時点のものです。</div>
          </div>

          {/* CSV reminder card */}
          <div className="card" style={{ padding: 16, display: "flex", alignItems: "center", gap: 16, background: "var(--primary-50)", borderColor: "var(--primary-100)" }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: "var(--primary)", color: "#fff", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              {React.cloneElement(Icons.Download, { className: "icon icon-lg" })}
            </div>
            <div style={{ flex: 1 }}>
              <div className="h3" style={{ color: "var(--primary)" }}>このデータを使う</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                47都道府県 × 6年分の時系列を含む CSV を、クレジット表記すれば無料で商用利用できます。
              </div>
            </div>
            <button className="btn btn-primary">
              {React.cloneElement(Icons.Download, { className: "icon" })}
              CSV
            </button>
            <button className="btn">JSON</button>
            <button className="btn">Excel</button>
          </div>

          {/* Stream-native AdSense */}
          <div style={{ position: "relative" }}>
            <div className="eyebrow" style={{ marginBottom: 6 }}>広告</div>
            <AdSlot height={120} label="Native In-feed AdSense" />
          </div>

          {/* AI insight */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {React.cloneElement(Icons.Sparkle, { className: "icon", style: { color: "var(--accent)" } })}
                <div className="h2">データの考察</div>
              </div>
              <span className="muted" style={{ fontSize: 11 }}>AI生成</span>
            </div>
            <div className="card-body" style={{ fontSize: 13.5, color: "var(--fg-2)", lineHeight: 1.75 }}>
              東京都・神奈川県・大阪府の上位3都府県で全国人口の約24%を占めており、人口集中の傾向が続いています。一方で、人口減少率トップの秋田県は2010年比で12.4%の減少となっており、地方の人口減少が進行しています…
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <RelatedSidebar>
            <AdSlot height={250} />
            <div className="card">
              <div className="card-header">
                <div className="h3">メルマガ登録</div>
              </div>
              <div className="card-body" style={{ fontSize: 12.5 }}>
                <p style={{ margin: 0, color: "var(--muted)" }}>
                  毎月の新着ランキングを配信。
                </p>
                <input type="email" placeholder="you@example.com" style={{
                  width: "100%", marginTop: 8,
                  padding: "8px 10px", border: "1px solid var(--border)",
                  borderRadius: 6, font: "inherit",
                }} />
                <button className="btn btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}>登録する</button>
              </div>
            </div>
          </RelatedSidebar>
        </aside>
      </div>

      <div style={{ height: 24 }} />
    </div>
  );
}

window.OptionD = OptionD;

# Competitive Analysis: stats47 iOS App (統計で見る都道府県)

**Author**: Alex (Product Manager)
**Date**: 2026-03-16
**Status**: Research Complete
**Purpose**: Evaluate the competitive landscape for a potential stats47 iOS app in the Japanese market

---

## Executive Summary

The Japanese market for prefecture-level statistics visualization on mobile is **dramatically underserved**. No existing iOS app combines comprehensive government statistics data with modern visualization, ranking, and correlation analysis capabilities. The competitive landscape consists of:

- **Quiz/gamification apps** that use prefecture data as entertainment (not serious data tools)
- **Travel logging apps** that track visited prefectures (not statistics)
- **Government tools** that are desktop-first and unusable on mobile
- **Web-based competitors** (todoran, uub.jp) that have no native or PWA mobile apps

stats47 already holds 1,800+ ranking indicators -- approximately 3x the scale of the largest web competitor (todoran at ~1,500) and 7x the government's published "Statistical Observations of Prefectures" (406 indicators). An iOS app would enter a market with **zero direct competitors** at the feature level.

The primary strategic question is not "can we compete?" but rather "what is the right form factor?" -- native iOS app vs. PWA vs. investing further in the mobile web experience.

---

## 1. Direct Competitors on the iOS App Store (Japan)

### 1.1 Prefecture Statistics / Data Apps

| App | Category | Rating | Reviews | Price | Revenue Model | Key Features | Weakness vs stats47 |
|-----|----------|--------|---------|-------|---------------|-------------|---------------------|
| **アプリDe統計** (Ministry of Internal Affairs) | Reference | ~2.5 (est.) | Very few | Free | Government-funded | GPS-based local stats lookup, "City Stat" by municipality, "Pocket Statistics" by category | Abandoned (last major update ~2015), minimal visualization, no rankings, no comparison tools |
| **マップDe統計** (Ministry of Internal Affairs) | Reference | N/A | Minimal | Free | Government-funded | Tablet-only, GIS-based statistical maps, same ID as jSTAT MAP web | Android-only tablet app, not on iOS, no rankings |

**Key Finding**: The Japanese government released official statistics apps (アプリDe統計 for iOS/Android, マップDe統計 for Android tablets) around 2014-2015, but these appear to be effectively **abandoned** with no meaningful updates in years. The government has since shifted focus to web-based tools (jSTAT MAP, Japan Dashboard).

### 1.2 Prefecture Quiz / Gamification Apps

| App | Category | Rating | Reviews | Price | Revenue Model | Key Features | Weakness vs stats47 |
|-----|----------|--------|---------|-------|---------------|-------------|---------------------|
| **都道府県ランキングバトル47** | Education/Game | ~3.5 (est.) | Limited | Free | Ads | Uses prefecture data (test scores, convenience stores, desired neighborhoods) as game mechanics; players "conquer" other prefectures | Entertainment-only; no real data exploration; limited data depth; no visualization |
| **都道府県対抗! IQランキング** | Game | ~3.0 (est.) | Limited | Free | Ads | Daily brain training with scores aggregated by prefecture | Not a data app at all; uses prefectures only as a competitive frame |
| **すいすい都道府県クイズ** | Education | ~4.0 (est.) | Moderate | Free | Ads | Prefecture location quizzes, capital quizzes, knowledge quizzes including agricultural product rankings | Quiz-focused; no data exploration; static data |
| **あそんでまなべる 日本地図パズル** | Education | ~4.3 (est.) | Significant | Free | Ads | Map puzzle game with weekly rankings | Geography learning only; no statistics |
| **日本地名パズル** | Education | ~4.2 (est.) | Moderate | Free | Ads | Prefecture, capital, and municipality puzzle with ranking | Geography learning only |

### 1.3 Prefecture Travel / Tracking Apps

| App | Category | Rating | Reviews | Price | Revenue Model | Key Features | Weakness vs stats47 |
|-----|----------|--------|---------|-------|---------------|-------------|---------------------|
| **経県値 (Keiken-chi)** | Travel | **4.6** | **10,280** | Free | Ads (likely) | Track visited prefectures with 6-level scoring (lived/stayed/visited/landed/transited/unvisited); color-coded maps; multiple map creation; sharing | Monthly 120K active users; strongest "prefecture app" on iOS but focused entirely on travel logging, not statistics |
| **都道府県制覇 - My Japan Map** | Travel | ~4.4 (est.) | Moderate | Free | Ads + IAP (est.) | Mark visited prefectures; 10 map slots; CSV export | Travel logging only; no data analysis |
| **たびちず (Tabichizu)** | Travel | ~4.0 (est.) | Moderate | Free | Ads | GPS-based auto-tracking of visited prefectures/municipalities; push notifications | Location-based; no statistics |
| **市町村制覇** | Travel/Game | ~4.2 (est.) | Moderate | Free | Ads | Location-based game to visit municipalities | Gamified travel; no data |

**Key Finding**: 経県値 (Keiken-chi) is the most successful prefecture-themed app with 10,280 reviews and 4.6-star rating, demonstrating strong user interest in prefecture-centric mobile experiences. However, it is purely a travel tracking tool with zero statistical content.

---

## 2. Indirect Competitors

### 2.1 Web-Based Prefecture Data Services (Primary Competitors)

These are stats47's true competitors, but none have mobile apps:

| Service | Indicators | Features | Mobile Experience | Revenue Model |
|---------|-----------|----------|-------------------|---------------|
| **とどラン (todo-ran.com)** | ~1,500 rankings | Population-adjusted rankings, correlation coefficients, east-west divide analysis, deep editorial interpretation | Responsive web (basic); no app | Ads (Google AdSense) |
| **都道府県データランキング (uub.jp/pdr)** | 263 themes / 1,843 data points | Bar graphs, prefecture maps, detailed tables; part of larger uub.jp site with municipal data since Meiji era | Desktop/mobile web; no app | Ads |
| **stats47.jp (current)** | **1,800+ rankings** | Choropleth maps, standardized scores (偏差値), correlation analysis, time series, blog, SNS content generation | **Responsive web (Cloudflare Pages)** | AdSense, affiliate, note articles |

### 2.2 Government Data Platforms

| Service | Indicators | Features | Mobile Experience | Notes |
|---------|-----------|----------|-------------------|-------|
| **Japan Dashboard (Digital Agency + Cabinet Office)** | ~691 indicators, 7 categories | Prefecture/municipality comparison, scatter plots, time series (up to 4 indicators), CSV/XLSX download | "Displays small on smartphones; PC/tablet recommended" | Launched July 2025; closest government equivalent to stats47; free |
| **e-Stat (政府統計の総合窓口)** | ~2,720 basic items for prefectures | Raw data search, download, basic visualization, ranking view | Web-based; poor mobile UX | Primary data source for stats47 |
| **RESAS (地域経済分析システム)** | ~7 map categories | Population dynamics, industrial structure, tourism, human flows | Web-based; "recommended Chrome/Edge" | Focused on economic analysis for local government policy |
| **jSTAT MAP** | Census + statistical mesh data | GIS-based statistical map creation, area analysis | Web-based; no mobile app | Powerful but complex; analyst-focused |
| **統計でみる都道府県のすがた** (Statistics Bureau) | 406 indicators (2026 edition) | Published PDF/Excel; basic comparison tables | PDF only | Annual publication; no interactive features |

### 2.3 Media & Business Intelligence

| Service | Type | Prefecture Data Features | Mobile App | Revenue |
|---------|------|-------------------------|------------|---------|
| **東洋経済 都市データパック** | Publication | 800+ items for all municipalities; "Livability Ranking" | Via 日経テレコン subscription | 22,000 yen/year (2025 edition); B2B |
| **ダイヤモンド・オンライン** | Media | SDGs survey rankings, happiness rankings by prefecture | iOS/Android app (news) | Subscription (business news) |
| **日経ビジネス** | Media | Occasional prefecture ranking features | iOS/Android app (news) | Subscription |
| **Numbeo** | International | Japan city-level cost of living, quality of life | iOS/Android app | Freemium |

### 2.4 Real Estate / Demographics Platforms

| Service | Type | Prefecture Data Features | Mobile App |
|---------|------|-------------------------|------------|
| **LIFULL HOME'S 住まいインデックス** | Real estate | Regional price maps, area comparison, livability stats | Part of LIFULL HOME'S app |
| **SUUMO** | Real estate | "Most Desired Town Rankings"; area-level data | SUUMO app |

---

## 3. Market Size and Opportunity

### 3.1 Japan App Market Context

| Metric | Value | Source |
|--------|-------|--------|
| Japan mobile app market (2024) | USD 18.0 billion | Grand View Research |
| Japan mobile app market (2030 projected) | USD 46.5 billion | Grand View Research |
| Japan education apps market (2024) | USD 366.7 million | IMARC Group |
| Japan education apps market (2033 projected) | USD 2,118.9 million (CAGR 21.52%) | IMARC Group |
| Japan consumer app spending (2024) | USD 16.5 billion (3rd globally) | Sensor Tower |
| Japan per-capita app spending | Highest in the world | Sensor Tower |
| Subscription apps as % of Japan app revenue | ~30% | Market Research Future |

### 3.2 User Interest Signals

**Search demand indicators**:
- "都道府県ランキング" (prefecture ranking) -- consistently high search volume in Japan
- "都道府県比較" (prefecture comparison) -- growing search demand
- "〇〇県 ランキング" (specific prefecture ranking) -- long-tail queries with high commercial intent
- Google publishes annual "Prefecture-specific search rankings" (47都道府県別ランキング) every year, indicating strong public interest

**Content consumption patterns**:
- とどラン has been active since 2009 and published books based on its data, proving sustained demand
- uub.jp maintains 263 themes with 1,843 data points, updated regularly
- 経県値 app has 120K monthly active users, proving prefecture-themed apps can achieve meaningful scale
- stats47.jp's note articles on prefecture data receive engagement (data rankings as "shareable content")
- Google's 2024/2025 annual search ranking report specifically breaks down trends by all 47 prefectures

**Educational market alignment**:
- とどラン data is actively used in high school "Information I" (情報I) curriculum for data science education
- Statistics Bureau actively promotes "Let's Stat!!!" campaign to improve public statistical literacy
- Japan's education reforms emphasize data literacy, creating institutional demand

### 3.3 Potential User Segments

| Segment | Size Estimate | Willingness to Pay | Use Case |
|---------|--------------|--------------------|---------:|
| **Casual browsers / trivia fans** | Large (millions) | Low (ad-supported) | "What rank is my prefecture?" browsing |
| **Students (high school / university)** | ~5M enrolled | Low-Medium (freemium) | 情報I curriculum, research projects, thesis data |
| **Local government employees** | ~2.7M (total public servants) | Medium (employer may fund) | Policy reports, budget justification, inter-prefecture comparison |
| **Journalists / media** | Tens of thousands | Medium | Quick data lookup for articles |
| **Business / marketing professionals** | Hundreds of thousands | Medium-High | Market research, site selection, regional strategy |
| **Researchers / academics** | Tens of thousands | Medium | Regional analysis, data source |
| **Prefecture enthusiasts / geography fans** | Niche but engaged | Medium | Deep exploration, sharing |

---

## 4. Revenue Models Used by Competitors

### 4.1 Current Revenue Model Landscape

| Model | Used By | Notes |
|-------|---------|-------|
| **Ad-supported (free)** | 経県値, quiz apps, とどラン, uub.jp | Dominant model for prefecture apps; limited revenue per user |
| **Government-funded (free)** | アプリDe統計, RESAS, Japan Dashboard, e-Stat | No monetization; budget-constrained updates |
| **B2B publication (paid)** | 東洋経済 都市データパック (22,000 yen/year) | Targeted at enterprises and researchers |
| **News subscription** | ダイヤモンド, 日経 | Prefecture data is minor feature within larger news product |
| **Freemium with IAP** | Some quiz apps | Typically ad removal or additional quiz packs |

### 4.2 Revenue Model Recommendations for stats47 iOS

Based on the Japan market context where subscription apps account for ~30% of app revenue and freemium apps generate 98% of global mobile revenue, the recommended approach:

**Tier 1: Free (Ad-Supported)**
- All 1,800+ rankings browsable
- Basic visualization (bar charts, tables)
- Single-indicator choropleth maps
- AdMob banner + interstitial ads

**Tier 2: Premium (Subscription - 480 yen/month or 3,800 yen/year)**
- Ad-free experience
- Correlation analysis (scatter plots with two indicators)
- Time-series animation
- Prefecture profile dashboards
- CSV export of any ranking data
- Offline access to saved rankings

**Tier 3: Pro (Subscription - 980 yen/month or 7,800 yen/year)**
- Everything in Premium
- Custom multi-indicator comparison dashboards
- API access for data integration
- Priority data updates
- Advanced choropleth customization (breakpoints, color schemes)

**Alternative: One-Time Purchase**
- 800-1,200 yen for permanent ad removal + premium features
- Lower lifetime value but simpler for users; well-suited to Japanese market preferences

---

## 5. Key Differentiators stats47 Could Have

### 5.1 What Existing Apps/Services Lack

| Gap in Market | Who Has This Gap | stats47's Advantage |
|---------------|-----------------|---------------------|
| **No iOS app exists for serious prefecture statistics** | All web competitors (todoran, uub.jp) | First-mover advantage in a proven market |
| **Government apps are abandoned** | アプリDe統計 (last real update ~2015) | Active development with modern tech stack |
| **Quiz apps have no real data depth** | All quiz/game apps | 1,800+ indicators vs. a handful of trivia facts |
| **Travel apps have no statistics** | 経県値, 都道府県制覇 | Bridge the "visited" experience with "what's special about this place" data |
| **Japan Dashboard is not mobile-friendly** | Digital Agency dashboard | "Displays small on smartphones" per their own documentation |
| **No app offers correlation analysis** | All competitors (only todoran on web) | Unique "why does this matter?" insight layer |
| **No app offers time-series visualization** | All competitors | See how prefectures change over decades |
| **No app has "prefecture profile" dashboards** | All competitors | Holistic view of one prefecture's strengths and weaknesses |
| **No app combines data + editorial context** | All except todoran (web only) | Blog + AI content + expert annotations |
| **No app leverages e-Stat API directly** | All except government tools | Real-time data freshness with user-friendly presentation |

### 5.2 stats47's Existing Strengths (Moat for iOS)

| Strength | Detail | iOS Opportunity |
|----------|--------|----------------|
| **Scale: 1,800+ ranking indicators** | 3x todoran (~1,500), 7x government publication (406), 7x uub.jp (263 themes) | Largest prefecture dataset ever available on mobile |
| **Correlation analysis** | Automated correlation between any two indicators | Unique feature; no competitor has this on any platform in app form |
| **Modern visualization** | Choropleth maps, tile maps, scatter plots, time-series charts via D3.js | Visual quality far exceeds any competitor |
| **AI-generated content** | FAQ, analysis per ranking page via Gemini | Contextual insights that todoran provides manually but at 10x scale |
| **SNS content pipeline** | Remotion-based auto-generation of Instagram/TikTok/YouTube/X content | App users as content amplifiers |
| **Domain expertise** | Operator is former prefectural government employee (20 years) | E-E-A-T credibility that no competitor matches |
| **CSV/data export** | Structured, clean data ready for professional use | Business/research users willing to pay |
| **Cloudflare infrastructure** | D1 database, edge-served, global CDN | Fast API responses for mobile app backend |
| **Existing web traffic + content** | Blog, note articles, SNS presence | Cross-promotion channel for app launch |

### 5.3 Potential iOS-Specific Features

| Feature | Description | Differentiation |
|---------|-------------|-----------------|
| **"My Prefecture" widget** | iOS home screen widget showing daily ranking trivia for your prefecture | Drives daily engagement; no competitor has this |
| **Push notification: "Today's Ranking"** | Daily notification with surprising ranking fact | Retention mechanism |
| **Apple Watch complication** | Prefecture rank display on watch face | Novelty factor |
| **Siri Shortcuts** | "Hey Siri, what rank is Tokyo for population?" | Voice-first data access |
| **Offline mode** | Cache frequently viewed rankings for subway/flight use | Critical in Japan (subway commuters) |
| **Share as image** | One-tap generation of shareable ranking cards for LINE/X | Social amplification |
| **Location-aware** | Auto-detect prefecture and show local rankings on launch | Personalized first experience |
| **AR overlay (future)** | Point camera at scenery, see local statistics overlay | Experimental but unique |

---

## 6. Strategic Recommendation

### 6.1 Build vs. PWA vs. Enhance Mobile Web

| Option | Pros | Cons | Effort | Recommendation |
|--------|------|------|--------|----------------|
| **Native iOS app** | Best UX; widgets; push notifications; App Store discoverability; offline; Siri | High dev effort; separate codebase (Swift/SwiftUI); App Store review process; maintenance burden | XL (3-6 months) | Defer to Phase 2 |
| **PWA (Progressive Web App)** | Shares web codebase (Next.js); installable; offline capable; no App Store gatekeeping | No widgets; limited push on iOS; no Siri; "Add to Home Screen" friction; no App Store SEO | M (4-6 weeks) | **Recommended: Phase 1** |
| **Enhance mobile web only** | Minimal effort; existing infrastructure | No install; no push; no offline; no app store presence | S (2-3 weeks) | Already ongoing |
| **React Native / Expo** | Cross-platform (iOS + Android); shared logic with Next.js; native feel | Still significant effort; bridge overhead; two platforms to maintain | L (2-4 months) | Consider for Phase 2 |

### 6.2 Phased Approach

**Phase 1 (Q2 2026): PWA Enhancement**
- Add PWA manifest + service worker to existing Next.js site
- Offline caching of recently viewed rankings
- "Add to Home Screen" prompt for mobile visitors
- Mobile-optimized "Prefecture Profile" page
- Validate mobile engagement metrics before native investment
- **Success gate**: 500+ PWA installs, 3+ sessions/week per installed user

**Phase 2 (Q4 2026): Native iOS App (if Phase 1 validates demand)**
- Swift/SwiftUI native app with D1 API backend
- Home screen widgets ("Today's Ranking")
- Push notifications for new data releases
- Siri Shortcuts for voice queries
- Premium subscription tier
- **Success gate**: 10K downloads in first 60 days, 4.5+ star rating

**Phase 3 (2027): Platform Expansion**
- Android app (Kotlin/Compose or React Native)
- iPad-optimized experience with side-by-side comparison
- Apple Watch complication
- Enterprise/education licensing

### 6.3 RICE Score

| Factor | Value | Notes |
|--------|-------|-------|
| Reach | 50K users/quarter (Japan, prefecture data interest) | Based on search volume for 都道府県ランキング + stats47 existing traffic |
| Impact | 2 (High) | Opens new distribution channel; no direct competitor |
| Confidence | 50% | Validated interest (web traffic, competitor MAUs) but unvalidated willingness to install/pay |
| Effort | 4 person-months (PWA Phase 1: 1.5; Native Phase 2: 2.5) | Solo developer; AI-assisted |
| **RICE Score** | **(50K x 2 x 0.5) / 4 = 12,500** | High priority -- but Phase 1 (PWA) recommended to validate before Phase 2 |

---

## 7. Competitive Positioning Matrix

```
                    DATA DEPTH (# of indicators)
                    Low                          High
                +-----------------+-----------------+
   Mobile      |  Quiz/Game Apps  |                 |
   Experience  |  (ランキング      |   ** stats47    |
   (Good)      |   バトル47)      |   iOS App **    |
                |  経県値          |   (OPPORTUNITY) |
                +-----------------+-----------------+
   Mobile      |  アプリDe統計     |   とどラン       |
   Experience  |  (abandoned)     |   uub.jp        |
   (Poor)      |                  |   Japan Dashboard|
                |                  |   e-Stat/RESAS  |
                +-----------------+-----------------+
```

The upper-right quadrant is **entirely empty**. No product combines deep statistical data with a good mobile experience. This is the opportunity.

---

## 8. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Low downloads (market too niche) | Medium | High | Phase 1 PWA validates demand before native investment |
| Japan Dashboard improves mobile experience | Medium | Medium | stats47 has 3x more indicators + editorial context + correlation analysis |
| Government releases updated statistics app | Low | High | Government track record shows abandonment; stats47 iterates faster |
| Apple review rejection (data content issues) | Low | Low | No UGC; all government public data; straightforward app |
| Monetization insufficient for development cost | Medium | Medium | PWA-first approach keeps costs minimal until validated |
| Solo developer bandwidth | High | High | PWA shares existing codebase; native app could be phased |
| とどラン launches an app | Low | Medium | stats47 has 3x more indicators and superior visualization |

---

## 9. Conclusion

The competitive analysis reveals a clear market gap: **no iOS app exists that provides comprehensive, well-visualized Japanese prefecture statistics**. The closest competitors are either web-only platforms with dated UIs (todoran, uub.jp), abandoned government apps (アプリDe統計), or entertainment-focused quiz apps with shallow data.

stats47 is uniquely positioned to fill this gap given its 1,800+ indicators (largest in the market), modern visualization stack, AI-generated content, and domain expertise from a former government statistician. The recommended approach is a phased PWA-first strategy to validate mobile demand before committing to a native iOS build.

The key question is not whether the opportunity exists -- it clearly does -- but whether the solo developer's bandwidth can sustain an additional platform. The PWA approach mitigates this risk by reusing the existing Next.js codebase while still enabling "app-like" mobile experiences.

---

## Sources

- [経県値 App Store](https://apps.apple.com/jp/app/%E7%B5%8C%E7%9C%8C%E5%80%A4-%E3%81%91%E3%81%84%E3%81%91%E3%82%93%E3%81%A1-%E6%97%A5%E6%9C%AC%E5%9C%B0%E5%9B%B3%E3%81%AB%E8%89%B2%E3%82%92%E3%81%A4%E3%81%91%E3%82%8B%E6%97%85%E3%81%AE%E8%A8%98%E9%8C%B2-%E6%97%85%E8%A1%8C%E8%A8%98/id1396539079)
- [都道府県ランキングバトル47 App Store](https://apps.apple.com/jp/app/%E9%83%BD%E9%81%93%E5%BA%9C%E7%9C%8C%E3%83%A9%E3%83%B3%E3%82%AD%E3%83%B3%E3%82%B0%E3%83%90%E3%83%88%E3%83%AB47/id1609356244)
- [とどラン - 都道府県別統計とランキングで見る県民性](https://todo-ran.com/)
- [都道府県データランキング (uub.jp)](https://uub.jp/pdr/)
- [Japan Dashboard - Digital Agency](https://www.digital.go.jp/en/resources/japandashboard)
- [e-Stat API - アプリDe統計 iOS版](https://www.e-stat.go.jp/api/info-cat/news/start_2-0)
- [RESAS 地域経済分析システム](https://resas.go.jp/)
- [jSTAT MAP 統計GIS](https://www.e-stat.go.jp/gis)
- [Japan Education Apps Market - IMARC Group](https://www.imarcgroup.com/japan-education-apps-market)
- [Japan App Market Statistics - Business of Apps](https://www.businessofapps.com/data/japan-app-market/)
- [Japan App Trends 2025 - Adjust](https://www.adjust.com/blog/japan-app-trends-2025/)
- [東洋経済 都市データパック 2025](https://str.toyokeizai.net/databook/dbs_toshidata/)
- [stats47.jp](https://stats47.jp)
- [経県値 リニューアル プレスリリース (月間12万人利用)](https://prtimes.jp/main/html/rd/p/000000003.000108704.html)
- [統計でみる都道府県のすがた - 統計局](https://www.stat.go.jp/data/k-sugata/)
- [prefecture-stat GitHub (web dashboard)](https://github.com/kikeda1102/prefecture-stat)
- [Japan Mobile Application Market - Grand View Research](https://www.grandviewresearch.com/horizon/outlook/mobile-application-market/japan)
- [RevenueCat State of Subscription Apps 2025](https://www.revenuecat.com/state-of-subscription-apps-2025/)

# stats47 iOS App Monetization Strategy

**Author**: Alex (Product Manager)
**Date**: 2026-03-16
**Status**: Draft -- Opportunity Assessment
**Decision needed by**: Before iOS development kickoff

---

## Executive Summary

This document evaluates 5 monetization strategies for a native iOS version of stats47 (統計で見る都道府県). The recommendation is a **hybrid freemium + contextual advertising model** as the primary revenue driver, supplemented by targeted in-app purchases and a future B2B/education licensing play.

The core tension: stats47's web identity is built on free, accurate, public-data visualization. Any iOS monetization must preserve that identity while capturing the higher willingness-to-pay that native app users demonstrate versus web visitors.

**Key insight**: The iOS app should not replicate the website. It should be a **companion tool** optimized for mobile use cases (quick lookups, widgets, offline reference, share-ready charts) that the web cannot serve well. This differentiation justifies a paywall for premium features without cannibalizing the free web experience.

---

## Current State Assessment

### Web Product (stats47.jp)

| Asset | Volume |
|-------|--------|
| Ranking indicators | 1,878 (prefecture-level) |
| Blog articles | 141 published |
| Correlation analysis pairs | 121,480 |
| Area profiles | 12,440 (47 prefectures x 260+ indicators) |
| YouTube videos | 71 (55,101 total views, 21 subscribers) |
| AdSense placements | 4 active |
| Affiliate ads registered | 23 (A8.net + 4 other ASPs) |

### Current Revenue Model

- AdSense (display ads, 4 placements)
- Affiliate banners (23 ads registered, CTR/CVR data not yet measured)
- Monthly fixed costs: approximately 1,000 JPY
- Revenue target: cost recovery, not profit maximization

### Traffic Maturity

The web product is in early growth. The roadmap shows Sprint 1-2 (distribution + measurement) is underway with PV targets of 30,000/month at 3 months and 100,000/month at 6 months. These are aspirational targets with no confirmed baseline yet.

**Implication for iOS**: An iOS app launch before the web product reaches meaningful scale (50,000+ monthly PV) would be premature. The strategies below assume an iOS launch timed after the web product has validated product-market fit and established organic distribution.

---

## Market Context

### Japanese App Store Economics (2026)

| Factor | Value | Source |
|--------|-------|--------|
| Apple commission (Small Business Program) | 10% on App Store IAP | Apple Developer (Japan-specific, effective Dec 2025) |
| Apple commission (standard) | 21% + 5% IAP fee = 26% | Apple Developer |
| Apple commission (web link payment) | 15% (10% for SBP) | Apple Developer |
| Japanese consumption tax (JCT) | 10% collected by Apple | Apple Developer |
| Monthly subscription prices vs. US | ~57% lower in Japan | Mirava market data |
| Annual plan pricing vs. US | 75-110% of US baseline | Mirava market data |
| Utility app download-to-trial rate | 24% | RevenueCat 2025 |
| Hard paywall conversion (median) | 10.7% by day 35 | RevenueCat 2025 |
| Freemium conversion (median) | 2.1% by day 35 | RevenueCat 2025 |
| Trial-to-paid (7-day trial) | ~27% | RevenueCat 2025 |
| Trial-to-paid (optimal 17-32 day) | ~46% | RevenueCat 2025 |

### Competitive Landscape

There is **no direct iOS competitor** in the Japanese prefecture statistics visualization space. Adjacent apps include:

| App | Model | Pricing | Relevance |
|-----|-------|---------|-----------|
| Keikenti (経県値) | Free + IAP | Free (maps), 300-500 JPY for extras | Prefecture travel tracker, gamified |
| My Japan Map (都道府県制覇) | Free + Ads | Free with ads | Prefecture visited tracker |
| RESAS (政府) | Free web | Free | Government regional analysis (web only, no iOS app) |
| e-Stat (政府) | Free web | Free | Raw data portal (web only) |
| stats-japan.com | Free web | Free | Prefecture comparisons (web only, English) |

The absence of a native iOS app for Japanese prefecture data visualization represents a genuine market gap. No app currently provides ranked, visualized, time-series prefecture statistics in a polished mobile-native experience.

### Japanese App Pricing Norms

Reference/utility apps in Japan typically price subscriptions at:

| Tier | Monthly | Annual | Examples |
|------|---------|--------|----------|
| Micro | 100-300 JPY | 800-2,400 JPY | Weather widgets, simple reference |
| Standard | 300-600 JPY | 2,400-4,800 JPY | Productivity tools, news aggregators |
| Premium | 600-1,500 JPY | 4,800-9,800 JPY | Professional tools, language learning |

stats47 fits the **Micro-to-Standard** tier. The data is publicly available (e-Stat), so the value is in curation, visualization, and mobile-native convenience -- not in proprietary data access.

---

## Strategy 1: Freemium with Premium Subscription ("stats47 Pro")

**Recommended as primary monetization model.**

### Design Rationale

The freemium model preserves the "public data should be free" ethos while monetizing the significant curation, visualization, and convenience value the app adds on top of raw e-Stat data. The key is drawing the free/paid line at **convenience and depth**, not at **access**.

### Free Tier (Attracts and retains users)

| Feature | Limitation |
|---------|-----------|
| Browse all 1,878 rankings | Full access to top-10 per ranking; full 47-prefecture list behind Pro |
| View choropleth maps | Static maps only; no time-series animation |
| Area profile (home prefecture) | 1 prefecture set as "home"; others behind Pro |
| Search rankings by keyword | Full access |
| Daily "Today's Stat" push notification | 1 random interesting stat daily |
| Blog article reading | Full access (drives engagement) |
| Basic charts | Bar charts for current year only |
| Ad-supported | Banner ads on list views, interstitial between sections |

### Pro Tier (Converts power users)

| Feature | Value Proposition |
|---------|-------------------|
| Full 47-prefecture rankings | See every prefecture for every indicator |
| Time-series charts (10+ years of data) | Trend analysis -- "How has my prefecture changed?" |
| Correlation explorer | "What predicts high income?" -- the 121,480-pair analysis |
| Multi-prefecture comparison | Side-by-side compare any 2-5 prefectures |
| iOS widgets (3 sizes) | Home screen stats: "Your prefecture rank today" |
| Offline data cache | Use on trains, planes, areas with poor signal |
| Export charts as images | Share-ready PNG with stats47 watermark |
| Ad-free experience | Clean, distraction-free interface |
| Area profiles for all 47 prefectures | Complete regional deep-dives |
| Bar chart race playback | Animated ranking changes over time |

### Pricing Recommendation

| Plan | Price (JPY) | Apple net (after 10% SBP commission) | User perception |
|------|-------------|--------------------------------------|-----------------|
| Monthly | 300 JPY | 270 JPY | Low-commitment entry point |
| Annual | 2,400 JPY (200 JPY/month effective) | 2,160 JPY | 33% discount signals commitment value |
| Lifetime | 4,800 JPY (one-time) | 4,320 JPY | For hardcore data enthusiasts |

**Why 300 JPY/month**: This is the psychological "vending machine drink" price point in Japan. It sits at App Store Tier 4 (300 JPY), the most common subscription entry point for Japanese utility apps. Going higher (480-600 JPY) risks pricing out the casual audience; going lower (100-200 JPY) undervalues the product and reduces ARPU to unsustainable levels.

**Why offer Lifetime**: Japanese users historically show strong preference for one-time purchases over subscriptions (lower subscription fatigue tolerance than US market). The lifetime option at 16 months' equivalent captures users who would otherwise never subscribe.

### Revenue Projection

**Assumptions**:
- iOS app downloads: 500/month (organic + web cross-promotion)
- Download-to-trial rate: 15% (conservative; benchmark is 24% for utility apps)
- Trial-to-paid conversion: 25% (7-day free trial)
- Monthly churn: 8%
- Annual/lifetime mix: 40% monthly, 45% annual, 15% lifetime

| Scenario | Monthly Downloads | Paying Users (steady state) | Monthly Revenue (JPY) | Annual Revenue (JPY) |
|----------|-------------------|----------------------------|----------------------|---------------------|
| Pessimistic | 300 | ~45 | 10,800 | 129,600 |
| Base case | 500 | ~95 | 22,800 | 273,600 |
| Optimistic | 1,000 | ~210 | 50,400 | 604,800 |

After Apple's 10% SBP commission:

| Scenario | Annual Developer Revenue (JPY) |
|----------|-------------------------------|
| Pessimistic | ~116,600 |
| Base case | ~246,200 |
| Optimistic | ~544,300 |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low conversion (free is "good enough") | High | High | Ensure Pro features deliver clear, visible value; use "teaser" previews |
| Users choose lifetime, capping LTV | Medium | Medium | Delay lifetime offer until 6 months post-launch; test elasticity |
| Churn after novelty wears off | High | Medium | Monthly "new rankings" updates; widget engagement loop |
| Development cost exceeds revenue | Medium | High | MVP scope: 3 months Swift dev max; use web API, not rebuild |

### Validation Experiment

Before building the iOS app, validate demand:
1. Add a "Get the iOS app" email signup form on stats47.jp
2. Target: 200 signups in 60 days = proceed; <50 = defer
3. Survey signups on willingness to pay: "Would you pay 300 JPY/month for offline access + widgets + ad-free?"
4. Target: >30% say "yes" or "probably"

---

## Strategy 2: Contextual Advertising (Ad-Supported Free Tier)

**Recommended as complement to freemium (funds the free tier).**

### Design Rationale

Ads in the free tier serve two purposes: (1) generate baseline revenue from non-paying users, and (2) create a mild friction that makes the ad-free Pro tier more attractive. The key is ad placement that feels contextual, not intrusive.

### Ad Placement Strategy

| Placement | Format | Frequency | UX Impact |
|-----------|--------|-----------|-----------|
| Ranking list footer | Native banner (320x50) | Every ranking page | Low -- below content |
| Between ranking items (position 5) | Native in-feed | Every ranking list | Low -- looks like content |
| Area profile header | Medium rectangle (300x250) | Each profile view | Medium -- visible but skippable |
| Interstitial (full screen) | Interstitial | After every 5th screen transition | Medium -- time-gated, skippable after 3s |
| "Explore more" section | Native content ad | End of article | Low -- contextual recommendation |

### Contextual Ad Categories (High CPM Potential)

The app's content naturally aligns with high-value ad verticals in Japan:

| User is viewing | Contextual ad category | Example advertisers | Estimated CPM (JPY) |
|-----------------|----------------------|---------------------|---------------------|
| Housing/rent rankings | Real estate, moving services | SUUMO, Homes.co.jp, Sakai Moving | 300-800 |
| Income/employment data | Job search, career services | Recruit, doda, Bizreach | 500-1,200 |
| Education rankings | Cram schools, universities | Benesse, Z-kai | 400-900 |
| Healthcare data | Insurance, health services | Lifenet, SBI Insurance | 300-700 |
| Tourism/attractions | Travel booking, hotels | Jalan, Rakuten Travel | 200-500 |
| Cost of living data | Financial services, fintech | SBI Securities, Money Forward | 400-1,000 |
| General browsing | Standard display | Google AdMob default | 50-150 |

### Revenue Projection

**Assumptions**:
- Daily active users (free tier): 200-1,000
- Average sessions/day per user: 1.5
- Ad impressions per session: 3
- Blended eCPM: 200 JPY (contextual premium vs. standard)

| Scenario | DAU (Free) | Monthly Impressions | Monthly Revenue (JPY) |
|----------|-----------|---------------------|----------------------|
| Pessimistic | 200 | 27,000 | 5,400 |
| Base case | 500 | 67,500 | 13,500 |
| Optimistic | 1,000 | 135,000 | 27,000 |

### Implementation

- **Ad network**: Google AdMob (primary) + contextual native ads via A8.net Smart (for affiliate-style contextual units)
- **Mediation**: AdMob mediation with fallback to lower-CPM networks
- **Frequency capping**: Maximum 1 interstitial per 5-minute session; no interstitials on first launch

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Low eCPM for niche content | Medium | Medium | Use contextual targeting; avoid generic AdMob-only |
| User attrition from ad fatigue | Medium | High | Strict frequency caps; "remove ads" as Pro upsell |
| Apple review rejection (ad density) | Low | High | Follow Apple HIG; no ads in onboarding flow |

---

## Strategy 3: In-App Purchases (One-Time, a la Carte)

**Recommended as supplement to subscription for users who resist recurring payments.**

### Design Rationale

Japanese consumers show higher resistance to app subscriptions compared to one-time purchases. Offering specific utility features as one-time unlocks captures users who will never subscribe but would pay for a specific capability.

### IAP Catalog

| Product | Price (JPY) | Type | Target User |
|---------|-------------|------|-------------|
| CSV Export Pack (single ranking) | 120 JPY | Consumable | Students, researchers needing 1-2 datasets |
| CSV Export Pack (10 rankings) | 480 JPY | Consumable | Journalists, consultants |
| CSV Export Unlimited | 1,500 JPY | Non-consumable (permanent) | Power analysts |
| Chart Image Export (high-res, no watermark) | 240 JPY | Non-consumable | Presenters, bloggers |
| Widget Pack (all widget types) | 360 JPY | Non-consumable | iOS customization enthusiasts |
| Offline Data Pack (all prefectures) | 480 JPY | Non-consumable | Travelers, areas with poor connectivity |
| "Prefecture Deep Dive" report (PDF, per prefecture) | 300 JPY | Consumable | Relocation researchers |

### Design Decisions

**Why offer both subscription and IAP**: RevenueCat data shows that apps offering both subscription and one-time purchases see 15-20% higher total revenue than subscription-only apps, because they capture the "I want this one thing" user who would otherwise pay nothing.

**Why consumable CSV exports**: Re-purchase revenue from researchers who need updated data quarterly. The 10-pack offers volume discount (40% off single price) to encourage larger purchases.

**Pricing logic**: All IAPs are priced below the annual subscription cost (2,400 JPY). Any user who buys 3+ IAPs gets a prompt: "You've spent 720 JPY on individual features. Get everything with Pro for 2,400 JPY/year." This upsell funnel is proven effective in utility apps.

### Revenue Projection

| Scenario | Monthly IAP Purchases | Avg. Transaction (JPY) | Monthly Revenue (JPY) |
|----------|----------------------|----------------------|----------------------|
| Pessimistic | 15 | 300 | 4,500 |
| Base case | 40 | 350 | 14,000 |
| Optimistic | 100 | 400 | 40,000 |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| IAPs cannibalize subscription revenue | Medium | Medium | Price IAPs so 3+ purchases > 1 month subscription; upsell prompt |
| Low demand for CSV/PDF on mobile | High | Low | Test with web users first; defer if <5 purchases/month |
| Support burden for export issues | Low | Low | Automated generation, no custom work |

---

## Strategy 4: B2B / Institutional Licensing

**Recommended as future opportunity (12+ months post-launch). Do not pursue at launch.**

### Design Rationale

Local governments, regional banks, consulting firms, and educational institutions regularly need prefecture-level statistical data for reports and presentations. stats47's curated, visualized data could save these organizations significant preparation time. However, B2B sales require relationship-building and a sales process that conflicts with solo-developer operations.

### Product Offerings

#### 4-A. Education Site License

| Feature | Detail |
|---------|--------|
| Product | stats47 Pro access for all students/faculty |
| Pricing | 50,000 JPY/year per institution |
| Includes | Unlimited Pro accounts via school email domain, CSV export, embeddable charts |
| Target | Universities (economics, geography, regional studies departments), high schools |
| Value proposition | "Replace the 2-hour e-Stat data wrangling exercise with 5-minute stats47 lookups" |

#### 4-B. API Access (Developer/Enterprise)

| Tier | Rate Limit | Price (JPY/month) | Target |
|------|-----------|-------------------|--------|
| Free | 100 requests/day | 0 | Hobbyist developers |
| Starter | 1,000 requests/day | 3,000 | Small apps, personal projects |
| Business | 10,000 requests/day | 15,000 | SaaS products, media companies |
| Enterprise | Custom | Custom quote | Government, large corporations |

#### 4-C. Custom Prefecture Reports

| Product | Price | Delivery |
|---------|-------|----------|
| Single prefecture analysis (PDF, 10-15 pages) | 30,000 JPY | Automated + light editorial |
| Comparative analysis (2-5 prefectures) | 50,000 JPY | Automated + editorial |
| Custom indicator analysis | 80,000-150,000 JPY | Semi-custom, 1 week delivery |

### Revenue Projection

| Offering | Year 1 Volume | Year 1 Revenue (JPY) |
|----------|--------------|---------------------|
| Education licenses | 2-5 institutions | 100,000 - 250,000 |
| API access (Starter) | 5-10 subscribers | 180,000 - 360,000 |
| API access (Business) | 1-3 subscribers | 180,000 - 540,000 |
| Custom reports | 3-5 reports | 90,000 - 750,000 |
| **Total Year 1** | | **550,000 - 1,900,000** |

### Why Defer

1. **Solo developer cannot do B2B sales.** B2B requires outreach, demos, invoicing, contract negotiation, and support SLAs -- all of which are incompatible with current operations.
2. **No proven demand.** Zero inbound inquiries to date. B2B is only worth building when organic demand signals emerge.
3. **iOS app is B2C first.** The app store is a consumer distribution channel. B2B should be web/API-first.

### Trigger Conditions to Pursue

| Signal | Threshold | Action |
|--------|-----------|--------|
| Inbound inquiries from institutions | 3+ in a quarter | Build a "For Teams" landing page |
| API requests from unknown IPs | Consistent pattern from corporate IPs | Launch API waitlist |
| Education-related search traffic | >5% of GSC queries are education-related | Contact 3 universities for pilot |

---

## Strategy 5: Premium Content + Data Storytelling

**Recommended as medium-term play (6+ months post-launch).**

### Design Rationale

The app's most differentiated value is not raw data -- it is the **interpretation and storytelling** around that data. Blog articles, correlation discoveries, and "Why does Prefecture X rank #1 in Y?" narratives are content that users will pay for if packaged correctly.

### Product Offerings

#### 5-A. "Data Story" In-App Magazine (Monthly)

| Feature | Detail |
|---------|--------|
| Format | 3-5 curated data stories per month, app-exclusive |
| Content | "The correlation between ramen shops and snowfall", "Why Okinawa ranks last in savings but first in happiness" |
| Pricing | Included in Pro subscription |
| Non-subscriber access | 1 free story/month; rest behind paywall |
| Purpose | Retention mechanism -- gives subscribers a reason to open the app monthly |

#### 5-B. "Prefecture Deep Dive" Series (IAP)

| Feature | Detail |
|---------|--------|
| Format | Comprehensive 15-20 page analysis per prefecture |
| Content | 50+ indicators, historical trends, correlations, comparison with similar prefectures, livability analysis |
| Pricing | 300 JPY per prefecture or 4,800 JPY for all 47 |
| Target | People considering relocation, local government staff, journalists covering regional stories |

#### 5-C. Annual "State of Japan's Prefectures" Report

| Feature | Detail |
|---------|--------|
| Format | 50+ page PDF/interactive report |
| Content | Year-in-review of major ranking changes, emerging trends, prefecture mobility analysis |
| Pricing | 1,200 JPY (digital) |
| Target | Media, researchers, government officials |
| Distribution | iOS app IAP + web download |

### Revenue Projection

| Product | Monthly Volume | Monthly Revenue (JPY) |
|---------|---------------|----------------------|
| Data Stories (retention, not direct revenue) | -- | Included in Pro (retention value) |
| Prefecture Deep Dives | 10-30 purchases | 3,000 - 9,000 |
| Annual Report | 50-200 purchases (annual spike) | 5,000 - 20,000 (amortized monthly) |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Content creation burden on solo developer | High | High | Use AI-assisted generation (existing Gemini pipeline); limit to 3 stories/month |
| Low demand for paid data content | Medium | Medium | Test with free blog articles first; measure engagement before paywalling |
| Quality inconsistency | Medium | Medium | Establish editorial template; use existing 141 blog articles as style guide |

---

## Consolidated Revenue Model

### Year 1 Projection (First 12 months post-iOS launch)

| Revenue Stream | Pessimistic | Base Case | Optimistic |
|----------------|------------|-----------|------------|
| Pro Subscription | 116,600 | 246,200 | 544,300 |
| Advertising (free tier) | 64,800 | 162,000 | 324,000 |
| In-App Purchases | 54,000 | 168,000 | 480,000 |
| Premium Content | 36,000 | 96,000 | 228,000 |
| B2B/Institutional | 0 | 0 | 0 |
| **Total (JPY)** | **271,400** | **672,200** | **1,576,300** |
| **Total after Apple commission (10% SBP)** | **244,260** | **604,980** | **1,418,670** |
| **Monthly average (JPY)** | **~20,400** | **~50,400** | **~118,200** |

### Year 2 Projection (With B2B starting)

| Revenue Stream | Base Case |
|----------------|-----------|
| Pro Subscription (2x growth) | 492,400 |
| Advertising | 243,000 |
| In-App Purchases | 210,000 |
| Premium Content | 144,000 |
| B2B/Institutional | 350,000 |
| **Total (JPY)** | **~1,439,400** |
| **Monthly average (JPY)** | **~119,950** |

### Cost Structure

| Cost Item | Monthly (JPY) | Annual (JPY) |
|-----------|---------------|-------------|
| Apple Developer Program | 833 (9,800/year) | 9,800 |
| Cloudflare (web + API) | 500 | 6,000 |
| Domain | 300 | 3,600 |
| AdMob integration | 0 | 0 |
| RevenueCat (subscription management, free tier) | 0 | 0 |
| **Total fixed costs** | **~1,633** | **~19,400** |

**Break-even**: At base case revenue, the iOS app covers its costs from month 1. The real question is whether revenue justifies the **development time opportunity cost** (estimated 200-400 hours for MVP).

---

## Priority Matrix

| Strategy | Revenue Potential | Implementation Ease | UX Impact | Time to Revenue | Recommended Priority |
|----------|------------------|--------------------|-----------|-----------------|--------------------|
| 1. Freemium Subscription | High | Medium | Positive (Pro = better UX) | 1-2 months post-launch | **#1 -- Core model** |
| 2. Contextual Advertising | Medium | Easy | Mild negative (free tier only) | Immediate at launch | **#2 -- Day 1 revenue** |
| 3. In-App Purchases | Medium | Medium | Neutral | 1 month post-launch | **#3 -- Supplement** |
| 5. Premium Content | Medium-Low | Hard (content creation) | Positive (more content) | 6+ months | **#4 -- Retention play** |
| 4. B2B Licensing | High (per deal) | Very Hard (sales process) | None | 12+ months | **#5 -- Opportunistic** |

---

## Recommended Implementation Roadmap

### Phase 0: Validation (Before any iOS development)

**Duration**: 60 days. **Cost**: 0 JPY. **Goal**: Prove demand exists.

| Action | Success Criteria | Timeline |
|--------|-----------------|----------|
| Add "iOS app waitlist" to stats47.jp | 200+ signups | 60 days |
| Survey waitlist on pricing | >30% willing to pay 300 JPY/month | Day 30-60 |
| Track mobile web traffic in GA4 | >15% of traffic from iOS Safari | Ongoing |
| Monitor App Store searches for related terms | Keyword volume for 都道府県 統計, 県別ランキング | Day 1-30 |

**Decision gate**: If <100 signups in 60 days, defer iOS development and focus on web growth.

### Phase 1: MVP Launch (Months 1-3 of development)

Ship the minimum app with:
- Free tier: Top-10 rankings, home prefecture profile, basic search, ads
- Pro trial: 7-day free trial, then 300 JPY/month or 2,400 JPY/year
- Pro features: Full rankings, time-series charts, ad-free, 1 widget type
- Ads: AdMob banners + 1 native placement

**Do NOT include at launch**: CSV export, correlation explorer, offline mode, IAPs, premium content. These are Phase 2.

### Phase 2: Monetization Expansion (Months 4-6)

Based on Phase 1 data:
- If Pro conversion > 3%: Add lifetime plan, correlation explorer, more widgets
- If Pro conversion < 1%: Reduce free tier generosity (show top-5 instead of top-10)
- Add IAP catalog (CSV export, chart export, widget pack)
- If DAU > 500: Add contextual native ads (real estate, job search)
- Launch first "Data Story" content series

### Phase 3: Scale + B2B (Months 7-12)

- Prefecture Deep Dive content series
- Annual report
- API access (if demand signals emerge)
- Education pilot (if 3+ university inquiries)

---

## What We Are NOT Building (and Why)

| Request/Idea | Reason for Rejection | Revisit Condition |
|-------------|---------------------|-------------------|
| Android app | iOS first to validate model; Android only if iOS proves revenue | iOS reaches 1,000+ paying users |
| Social features (comments, leaderboards) | Not a social app; adds moderation burden | Never (out of scope) |
| User-generated content / custom rankings | Compromises data accuracy brand | Never (out of scope) |
| Gamification (badges, streaks) | Does not align with "serious data" positioning | Only if retention D30 < 10% |
| Push notification monetization | Damages trust irreversibly | Never |
| Paywall on blog articles | Blog is the SEO/acquisition funnel; paywalling kills growth | Never |
| "Best prefecture to live" composite score | Violates core value of objective data presentation | Never (see monetization strategy doc) |

---

## Open Questions (Must Resolve Before Development)

| Question | Owner | Deadline | Impact |
|----------|-------|----------|--------|
| Is web traffic sufficient to cross-promote iOS app? | PM | Phase 0 results | Go/no-go for entire initiative |
| Can existing web API serve iOS app, or is a separate API layer needed? | Engineering | Before dev start | Scope and timeline |
| Will Apple approve an app built primarily on government open data? | PM (Apple review research) | Before dev start | Legal/compliance |
| Does the Small Business Program 10% commission apply from day 1? | PM | Before dev start | Revenue projections |
| What is the actual mobile (iOS) share of current web traffic? | PM (GA4) | Phase 0 | Demand validation |

---

## Appendix A: Apple Commission Scenarios for stats47

Under Japan's Mobile Software Competition Act (effective Dec 2025), stats47 has three commission options:

| Option | Commission Rate | Best For |
|--------|----------------|----------|
| App Store + Apple IAP (Small Business Program) | 10% | Default for < $1M revenue. Simplest implementation. **Recommended.** |
| App Store + Web Link Payment | 15% (10% SBP) | If building own payment page (adds complexity for marginal savings) |
| Alternative Marketplace | 5% Core Technology Fee | Only viable at very high volume; discovery disadvantage |

**Recommendation**: Use App Store with Apple IAP under the Small Business Program (10% commission). The simplicity and discovery benefits far outweigh the commission cost at stats47's scale.

---

## Appendix B: Comparable App Revenue Benchmarks

| App Category | Region | ARPU (Monthly, JPY) | Source |
|-------------|--------|---------------------|--------|
| Weather (premium) | Japan | 200-400 | Industry estimates |
| Reference/dictionary | Japan | 150-300 | Industry estimates |
| News aggregator (premium) | Japan | 300-600 | Public pricing |
| Language learning | Global | 800-1,500 | Public pricing |
| Productivity (small tools) | Japan | 200-500 | Industry estimates |

stats47 Pro at 300 JPY/month is positioned at the upper end of reference apps and the lower end of productivity tools -- appropriate for the value delivered.

---

## Summary Recommendation

**Build the iOS app only after web traffic reaches 50,000 monthly PV and Phase 0 validation succeeds.** When building, launch with a freemium model (300 JPY/month Pro subscription) plus contextual ads in the free tier. Supplement with targeted IAPs in Phase 2. Defer B2B and premium content until organic demand signals emerge.

The most realistic Year 1 outcome is 50,000-70,000 JPY/month in combined revenue (subscriptions + ads + IAPs). This is meaningful for a solo developer project but does not justify rushing iOS development ahead of web product-market fit validation.

**The web product is the foundation. The iOS app is the monetization amplifier. Build the foundation first.**

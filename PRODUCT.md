# Product

## Platform

web

## Users

Primary: Singapore residents and family caregivers checking what infectious disease is going around near home, often on behalf of an older parent or a young child. They arrive with an everyday question ("Is dengue bad in Tampines right now?", "Should Mum get her flu jab?") and want a plain answer and something to do.

Secondary (one step deeper, never in the way of residents): community organisers, school, childcare and eldercare staff who use the outlook and "What if we act now?" planning tools.

Visits come from both phone and desktop; neither is assumed dominant.

## Product Purpose

Kampung Health Radar is a personal, non-commercial concept by Andy showing how Singapore's weekly infectious disease figures could become readable: a map by planning area, a 3-month outlook, plain-language advice, and a flu jab guide. It answers three questions: What is going around? Is it getting better or worse? What can I do?

Success: a resident understands the situation for their area in seconds, without alarm, and leaves with a concrete next step (clear stagnant water, check a flu jab record, book a jab).

## Positioning

Official bulletins are written for specialists. This turns the same kind of weekly data into a neighbourhood map, an honest outlook with uncertainty bands, and advice in plain words, and is candid about every estimate it makes.

## Operating Context

- Four diseases: Dengue, HFMD, Flu & colds (respiratory polyclinic visits), COVID-19 (estimated).
- Views: national map view with disease cards, story, outlook chart, plan slider, actions, top areas, planner details; area view after search or map click; week timeline with play; Flu jab guide page (Am I due?, Flu right now, season, which vaccine, travel, where/cost, record, news); Legal & data sources page; How this works and Add data dialogs.
- Data: data/weekly.csv, area-factors.csv, flu-updates.csv, planning-areas.geojson, context.json. Everything is recomputed in the browser; uploaded CSV rows live in the tab only.

## Capabilities and Constraints

- Static site on GitHub Pages: plain HTML, CSS and JS, D3 7.9.0 from cdnjs, no build step or framework.
- All disease figures are illustrative (made up). Flu vaccine advice, dates and prices are real, summarised from CDA, MOH, HealthHub and CDC.
- Not affiliated with CDA, MOH, NEA or any agency; must never look like an official government site (no government logos, crests or official design).
- Privacy: no accounts, analytics, cookies or tracking; answers stay in the browser.

## Brand Commitments

- Name: "Kampung Health Radar" stays.
- All current copy stays word for word: headlines, disclaimers, flu guide and legal text.
- Voice: calm, plain, reassuring, never alarming. A dark map colour is not a warning.
- The existing radar-sweep logo is not binding and may be replaced.
- Visual identity (decided 26 Oct 2026, after two rounds of replacement directions were rejected): keep the current look (deep-blue dark theme and light theme, blue/orange data colours, Bricolage Grotesque and Public Sans) and refine it. Craft reference: Apple Health and Apple Weather (calm, rounded, big clear numbers). No themed cultural motifs.

## Evidence on Hand

- Illustrative weekly data 2012 to Oct 2026, URA Master Plan 2019 planning area boundaries, flu vaccine updates and subsidised prices.
- No testimonials, users, partners or endorsements exist; none may be invented.

## Product Principles

1. Answer the resident's question first; planner depth sits one step behind.
2. Calm over alarm: show level and direction honestly, with context for what "usual" means.
3. Label every estimate. Illustrative must never be mistaken for official or real.
4. Always end with something the person can do.
5. Personal and experimental; never borrow the authority of a government look.

## Accessibility & Inclusion

Inferred from the audience (older residents and caregivers, not yet confirmed as a formal standard): WCAG 2.2 AA contrast, generous text sizes, full keyboard use, reduced-motion support, colour never the only signal on the map and charts.

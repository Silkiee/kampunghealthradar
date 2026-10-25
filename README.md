# Kampung Health Radar

A concept showing how Singapore's weekly infectious disease figures could be turned into a map, a 3-month outlook and plain-language advice for the public.

> **All disease figures in this project are illustrative: made up to look realistic, not real data and not taken from CDA or any other source.** For real figures, see cda.gov.sg.
>
> Personal experimental project, not an official source. Built and run by one person in their own time and at their own cost; no organisation funds or sponsors it. Not affiliated with or endorsed by CDA, MOH or NEA. Area-level figures are spread from the illustrative national figures, not local reports; accurate area-level figures would need local data from agencies such as NEA and URA, which this project does not have. See the [Legal & data sources](https://silkiee.github.io/kampunghealthradar/#legal) page.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The page structure: header, side panel, map, flu jab guide and Legal & data sources page. |
| `css/styles.css` | All the styles, including the light and dark colours. |
| `js/main.js` | Starts the site: loads the data files, then the scripts below in order, then draws the page. |
| `js/model.js` | Reads the weekly data and works out the 3-month outlook. No page code. |
| `js/flu-rules.js` | The flu jab advice rules behind "Am I due?" and "Travelling soon?". No page code. |
| `js/config.js` | The four diseases, map levels and the page's current state. |
| `js/compute.js` | Turns the data into what the page shows: weekly values, area shares and colour levels. |
| `js/panel.js` | The left panel and the outlook chart. |
| `js/map.js` | The map and the timeline. |
| `js/controls.js` | Clicks, search, sliders and the Add data dialog. |
| `js/flu-guide.js` | The flu jab guide page. |
| `js/pages.js` | Switching between the map, the flu jab guide and the Legal page. |
| `data/weekly.csv` | The illustrative numbers behind the dashboard, one row per week and indicator. |
| `data/area-factors.csv` | Made-up local factors that make some planning areas run hotter or cooler each week (illustrative hot spots on the map). |
| `data/flu-updates.csv` | Vaccine dates, prices and official flu news for the flu jab guide (real, in our own words), plus one illustrative past flu peak. Edit this file when CDA announces something new. |
| `data/planning-areas.geojson` | URA planning area shapes, with approximate resident numbers and age shares (made up for areas with few or no residents). |
| `data/context.json` | Illustrative background facts for the story text, such as the main dengue serotype. |
| `README.md` | This guide. |

The page has no build step and no framework: GitHub Pages serves these files as they are. Charts and the map use D3.js from cdnjs, and the fonts come from Google Fonts.

## Running it on your computer

The page loads its data files, which browsers only allow from a web address, so double-clicking `index.html` shows a message instead of the dashboard. To try it on your computer, open the folder with any local web server, for example the free Live Server extension in VS Code. Nothing needs to be installed to publish it: GitHub Pages serves the files as they are.

The **flu jab guide** opens from the "Flu jab guide" button, or directly at `…/kampunghealthradar/#flu-jab`. Share that link on its own if you only want the guide.

---

## Data dictionary (`data/weekly.csv`)

Every value in this file is made up. It covers 2012 to week 43 of 2026 and has the same layout as the figures in a weekly infectious disease bulletin, but none of the values are copied from one.

| Column | Meaning |
|---|---|
| `year` | Epidemiological year |
| `week` | Epidemiological week (E-week) number |
| `week_start` | Sunday that starts the week (optional) |
| `indicator` | One of the names below |
| `value` | The number |
| `source` | Where it came from. Every row says it is illustrative |

| Indicator | Meaning | Years |
|---|---|---|
| `dengue_cases` | Dengue cases that week (dengue fever + DHF) | 2012–2026 |
| `hfmd_daily` | Average daily polyclinic attendances for HFMD | 2023–2026 |
| `ari_daily` | Average daily polyclinic attendances for acute upper respiratory infections | 2012–2026 |
| `flu_positivity` | % of flu-like illness samples positive for influenza | 2026 |
| `covid_positivity` | % of respiratory samples positive for COVID-19 (use 0.5 for "<1%") | 2026 |
| `dengue_hospital` | Dengue hospital admissions that week | 2026 (from week 6) |
| `median5y_dengue_cases` | Median of the same week in 2021–2025 of this file | 2026 |
| `median5y_ari_daily`, `median5y_hfmd_daily` | Median of the same week in 2021–2025 (HFMD: 2023–2025) of this file | 2026 |

## Map hot spots (`data/area-factors.csv`)

Every value in this file is made up. One row per disease (`dengue`, `hfmd`, `flu`, `covid`) and planning area (URA code, such as `TM` for Tampines), with one column per week of 2026 (`w1` to `w52`).

Each area's share of the national figure is its population-and-age weight multiplied by that week's factor. Shares are rescaled every week so the areas always add up to the national figure. A factor above 1 means the area runs hotter than its population alone would suggest that week; below 1 means cooler. The factors are set so the latest week (week 43) shows mostly Very low and Low areas, with one Very high area for each disease, and then drift so local clusters rise and fade over the year. When `data/weekly.csv` gains a new latest week, the factors are made again so the spread targets the new week.

## Flu jab guide (`data/flu-updates.csv`)

| Column | Meaning |
|---|---|
| `kind` | What the row is: `vaccine_nh`, `vaccine_sh`, `past_peak`, `price_adult`, `price_child` or `update` |
| `date` | `YYYY-MM-DD` (or `YYYY-MM`). For vaccines, the date it arrives or is expected |
| `label` | Name shown on the page (vaccine name, price group, update title) |
| `value` | Vaccines: `expected` or `available`. Prices: dollars per dose (`0` = free). Past peak: the % (illustrative) |
| `note` | Vaccines: the text on the vaccine card. Updates: a short summary in plain words |
| `link` | Source page |

**When the new Northern Hemisphere vaccine reaches clinics:** in the `vaccine_nh` row, change `expected` to `available` and set `date` to the day it arrived. The headline, tiles, "Am I due?" answers and travel advice all switch over on their own.

**When CDA publishes a new flu update:** add an `update` row with the date, title, a 2–3 sentence summary in `note`, and the link. Newest updates show first.

**If prices change:** edit the `price_adult` or `price_child` rows.

The "Am I due?" rules follow CDA's September 2026 advice (get the Northern Hemisphere vaccine; people in recommended groups who haven't had a flu jab can have the Southern Hemisphere one now and the new one 8 weeks later). When CDA changes its advice, the rules in `js/flu-rules.js` need updating too.

## How the numbers are made (short version)
- **Illustrative data:** every weekly value comes from a simple model with realistic seasons (dengue peaks in mid-year; coughs, colds and flu peak from December to February with a smaller mid-year rise; HFMD rises during school terms) and an invented history of bigger and smaller years. Flu activity drives the respiratory visits, so the flu and respiratory figures move together. Dengue hospital admissions are about 1 in 5 cases. The "usual" week is the median of the same week in the past 5 years of the file. The dengue alert and epidemic lines (mean + 1 and 2 SD of 2016–2025) and the respiratory "busy" lines (70th and 90th percentile of 2021–2025) are worked out from the same data.
- **Outlook:** the average of the last three weeks, shaped by the same months in past years, plus the recent direction fading out over time. The bands come from testing the method on every earlier week of the current year.
- **"What if we act now?":** each round of infection shrinks in proportion to the cut in spread, after a short delay; 15% of cases (e.g. picked up overseas) are left untouched.
- **Map:** national figures spread across the URA planning areas by approximate population and age profile (plus a mild east/north-east and landed-housing weighting for dengue), then shifted by made-up local hot spots from `data/area-factors.csv`. The 21 areas where few or no people live (such as Downtown Core, Tuas and the water catchments) have small made-up resident numbers; only the Western Islands and North-Eastern Islands are left out. Colours compare each area with a typical week for Singapore. The area shapes come from URA's open planning-area boundaries, but the numbers inside them are not real local data. Accurate area-level figures would need local data from agencies such as NEA and URA, which this project does not have.
- **Flu jab guide:** "Flu right now" uses weekly flu positivity (Low under 10%, Moderate 10–24%, High 25%+, our own bands). "When flu season usually comes" averages the illustrative respiratory polyclinic visits by month for 2012–2025. The answers in "Am I due?" and "Travelling soon?" are worked out in the browser; nothing is saved or sent.

Sources: disease figures are illustrative and made up for this project. Flu jab guide: CDA flu vaccination and flu situation updates (Sep 2026, advice only); National Adult and Childhood Immunisation Schedules; MOH vaccination subsidies; CDC flu advice for travellers; URA Master Plan 2019 planning area boundaries (data.gov.sg).

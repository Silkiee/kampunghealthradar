# Kampung Health Radar

A concept showing how Singapore's weekly infectious disease figures could be turned into a map, a 3-month outlook and plain-language advice for the public.

> **All disease figures in this project are illustrative: made up to look realistic, not real data and not taken from CDA or any other source.** For real figures, see cda.gov.sg.
>
> Personal experimental project, not an official source. Built and run by one person in their own time and at their own cost; no organisation funds or sponsors it. Not affiliated with or endorsed by CDA, MOH or NEA. Area-level figures are spread from the illustrative national figures, not local reports; accurate area-level figures would need local data from agencies such as NEA and URA, which this project does not have. See the [Legal & data sources](https://silkiee.github.io/kampunghealthradar/#legal) page.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The whole dashboard. Open it in a browser and it works. |
| `data/weekly.csv` | The illustrative numbers behind the dashboard, one row per week and indicator. |
| `data/flu-updates.csv` | Vaccine dates, prices and official flu news for the flu jab guide (real, in our own words), plus one illustrative past flu peak. Edit this file when CDA announces something new. |
| `README.md` | This guide. |

When the site is hosted on GitHub Pages, the dashboard reads `data/weekly.csv` and `data/flu-updates.csv` automatically. If you open `index.html` straight from your computer, it uses a built-in copy of the same data.

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

The "Am I due?" rules follow CDA's September 2026 advice (get the Northern Hemisphere vaccine; people in recommended groups who haven't had a flu jab can have the Southern Hemisphere one now and the new one 8 weeks later). When CDA changes its advice, the rules in `index.html` need updating too.

## How the numbers are made (short version)
- **Illustrative data:** every weekly value comes from a simple model with realistic seasons (dengue peaks in mid-year; coughs, colds and flu peak from December to February with a smaller mid-year rise; HFMD rises during school terms) and an invented history of bigger and smaller years. Flu activity drives the respiratory visits, so the flu and respiratory figures move together. Dengue hospital admissions are about 1 in 5 cases. The "usual" week is the median of the same week in the past 5 years of the file. The dengue alert and epidemic lines (mean + 1 and 2 SD of 2016–2025) and the respiratory "busy" lines (70th and 90th percentile of 2021–2025) are worked out from the same data.
- **Outlook:** the average of the last three weeks, shaped by the same months in past years, plus the recent direction fading out over time. The bands come from testing the method on every earlier week of the current year.
- **"What if we act now?":** each round of infection shrinks in proportion to the cut in spread, after a short delay; 15% of cases (e.g. picked up overseas) are left untouched.
- **Map:** national figures spread across the 55 URA planning areas by approximate population and age profile (plus a mild east/north-east and landed-housing weighting for dengue). Colours compare each area with a typical week for Singapore. The area shapes come from URA's open planning-area boundaries, but the numbers inside them are not real local data. Accurate area-level figures would need local data from agencies such as NEA and URA, which this project does not have.
- **Flu jab guide:** "Flu right now" uses weekly flu positivity (Low under 10%, Moderate 10–24%, High 25%+, our own bands). "When flu season usually comes" averages the illustrative respiratory polyclinic visits by month for 2012–2025. The answers in "Am I due?" and "Travelling soon?" are worked out in the browser; nothing is saved or sent.

Sources: disease figures are illustrative and made up for this project. Flu jab guide: CDA flu vaccination and flu situation updates (Sep 2026, advice only); National Adult and Childhood Immunisation Schedules; MOH vaccination subsidies; CDC flu advice for travellers; URA Master Plan 2019 planning area boundaries (data.gov.sg).

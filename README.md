# Kampung Health Radar

Singapore's Weekly Infectious Disease Bulletin, turned into a map, a 3-month outlook and plain-language advice for the public.

> Independent prototype. Not affiliated with or endorsed by CDA, MOH or NEA. Area-level figures are illustrative estimates, not local reports.

## What's in this folder

| File | What it is |
|---|---|
| `index.html` | The whole dashboard. Open it in a browser and it works. |
| `data/weekly.csv` | The numbers behind the dashboard, one row per week and indicator. Edit this file to add new weeks. |
| `README.md` | This guide. |

When the site is hosted on GitHub Pages, the dashboard reads `data/weekly.csv` automatically. If you open `index.html` straight from your computer, it uses a built-in copy of the same data.

---

## Data dictionary (`data/weekly.csv`)

| Column | Meaning |
|---|---|
| `year` | Epidemiological year |
| `week` | Epidemiological week (E-week) number |
| `week_start` | Sunday that starts the week (optional) |
| `indicator` | One of the names below |
| `value` | The number |
| `source` | Where it came from (optional, for your own records) |

| Indicator | Meaning | Where it is in the bulletin |
|---|---|---|
| `dengue_cases` | Dengue notifications that week (dengue fever + DHF) | Page 1 table, or "The number of dengue notifications was …" |
| `hfmd_daily` | Average daily polyclinic attendances for HFMD | Page 1, "Polyclinic attendances" |
| `ari_daily` | Average daily polyclinic attendances for acute upper respiratory infections | Page 1, "Polyclinic attendances" |
| `flu_positivity` | % of flu-like illness samples positive for influenza | ARI page, "COVID-19 and Influenza" |
| `covid_positivity` | % of respiratory samples positive for COVID-19 (use 0.5 for "<1%") | ARI page, "COVID-19 and Influenza" |
| `dengue_hospital` | Dengue hospital admissions that week | Dengue page text |
| `median5y_dengue_cases` | 5-year median for that week (DF + DHF) | Page 1 table, "Median" column |
| `median5y_ari_daily`, `median5y_hfmd_daily` | 5-year median polyclinic attendances | Page 1, "Polyclinic attendances" |

## How the numbers are made (short version)
- **Outlook:** the average of the last three weeks, shaped by the same months in past years, plus the recent direction fading out over time. The bands come from testing the method on every earlier week of the current year.
- **"What if we act now?":** each round of infection shrinks in proportion to the cut in spread, after a short delay; 15% of cases (e.g. picked up overseas) are left untouched.
- **Map:** national figures spread across the 55 URA planning areas by approximate population and age profile (plus a mild east/north-east and landed-housing weighting for dengue). Colours compare each area with a typical week for Singapore.
- **2025 weeks 38–53** were read off the bars in the charts of the EW37 2026 bulletin; that method matches the printed weeks to within 1 case.
- **2012–2024** come from the yearly Weekly Infectious Disease Bulletin spreadsheets: `dengue_cases` (Dengue + DHF columns) and `ari_daily` (Acute Upper Respiratory Tract infections) for every week, and `hfmd_daily` for 2023–2024 only. Before 2023 the spreadsheets give HFMD as weekly notified cases, a different measure, so those years are left out. 2019 uses the complete, revised sheet in the 2020 spreadsheet. Blank DHF cells in 2014 are counted as 0.
- **Respiratory visits 2020–2022:** kept as published. 2020 is low (COVID-19). 2021 and 2022 are much higher than other years (about 6,000 and 12,000 a day, against about 2,500) and don't match the 5-year median CDA prints now, so read those years with care.

Sources: CDA Weekly Infectious Diseases Bulletin 2026 (cda.gov.sg); Weekly Infectious Disease Bulletin yearly spreadsheets 2012–2025; URA Master Plan 2019 planning area boundaries (data.gov.sg).

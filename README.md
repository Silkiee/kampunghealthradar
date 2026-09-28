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

## Put it on GitHub and get a public link (no coding needed)

You only need a web browser.

### 1. Create a GitHub account
Go to <https://github.com> and sign up (free).

### 2. Create a repository (a project folder on GitHub)
1. Click the **+** at the top right, then **New repository**.
2. Repository name: `kampung-health-radar`
3. Choose **Public** (GitHub Pages is free for public repositories).
4. Leave the other boxes unticked. Click **Create repository**.

### 3. Upload the files
1. On the new, empty repository page, click the link **uploading an existing file**.
2. Unzip `kampung-health-radar.zip` on your computer.
3. Drag **everything inside** the unzipped folder (`index.html`, `README.md` and the `data` folder) onto the upload area. Chrome and Edge accept a dragged folder. If yours doesn't, upload `index.html` and `README.md` first, then see the note below for `data/weekly.csv`.
4. Scroll down, type a short message such as `First version`, and click **Commit changes**.

> **If the data folder didn't upload:** click **Add file → Create new file**, type `data/weekly.csv` as the name (the slash creates the folder), paste the contents of `weekly.csv`, and commit.

### 4. Turn on GitHub Pages (the free hosting)
1. In the repository, click **Settings** (top menu), then **Pages** (left menu).
2. Under **Build and deployment → Source**, choose **Deploy from a branch**.
3. Under **Branch**, choose `main` and `/ (root)`, then click **Save**.
4. Wait 1–2 minutes and refresh. A box appears with your link:
   `https://YOUR-USERNAME.github.io/kampung-health-radar/`

That link is what you share.

### 5. Update the data each week
1. Open `data/weekly.csv` in the repository and click the **pencil** icon (Edit).
2. Add new rows at the bottom, for example for E-week 38:
   ```
   2026,38,2026-09-20,dengue_cases,70,CDA bulletin EW38
   2026,38,2026-09-20,ari_daily,2600,CDA bulletin EW38
   2026,38,2026-09-20,hfmd_daily,17,CDA bulletin EW38
   2026,38,2026-09-20,flu_positivity,40,CDA bulletin EW38
   2026,38,2026-09-20,covid_positivity,2,CDA bulletin EW38
   2026,38,2026-09-20,median5y_dengue_cases,190,CDA bulletin EW38
   2026,38,2026-09-20,median5y_ari_daily,2400,CDA bulletin EW38
   2026,38,2026-09-20,median5y_hfmd_daily,17,CDA bulletin EW38
   ```
   (These values are examples. Use the real figures from the bulletin.)
3. Click **Commit changes**. The live site updates within a minute or two. The latest week, headlines, forecasts and map all recalculate on their own.

### Make the forecast more trustworthy: add past years
The outlook learns the seasonal pattern from past years. Right now it has only 2025. data.gov.sg publishes weekly bulletin counts going back about 10 years. Add those years as extra rows (same columns, e.g. `2019,23,,dengue_cases,…`) and the dashboard will use them. The `week_start` and `source` columns can be left empty.

You can also test extra data without editing GitHub: click **Add data** in the dashboard and upload a CSV. That only lasts until you close the tab.

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

Sources: CDA Weekly Infectious Diseases Bulletin 2026 (cda.gov.sg); URA Master Plan 2019 planning area boundaries (data.gov.sg).

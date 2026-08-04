# Munda Crop Intelligence

Munda is a static React 19 + Tailwind CSS 4 application that turns local climate data into explainable crop recommendations. It is designed to run entirely on GitHub Pages without PHP, a database, API keys, or a separate backend.

## What it does

- Searches towns worldwide or uses browser geolocation.
- Fetches a live 14-day weather and soil outlook from Open-Meteo.
- Aggregates the last five complete years of ERA5 history into monthly climate patterns.
- Falls back to NASA POWER climatology if historical weather is unavailable.
- Ranks 18 crops against temperature, rainfall, humidity, soil type, water access, and the near-term forecast.
- Explains each result through component scores, strengths, risks, confidence, and practical field actions.
- Shows location-filtered agricultural reporting from GDELT, with direct source-search links when the live feed is busy.
- Saves the latest analysis locally in the browser and supports print/PDF export.
- Provides a privacy-friendly contact form that opens a prepared email draft.

The recommendation method is an **explainable weighted agronomic model**, not a trained machine-learning model. A validated ML model would require representative local records covering soil, seed variety, planting date, farm management, weather, pests, and harvest outcomes.

## Local development

Requirements: Node.js 20.19 or newer and npm.

```bash
npm install
npm run dev
```

Open the local address printed by Vite. No `.env` file or API key is required.

Useful commands:

```bash
npm run test       # Run recommendation and climate-processing tests
npm run build      # Create the static site in dist/
npm run preview    # Preview the production build locally
npm run check      # Run tests, then build
npm run check:live # Optional end-to-end check against the live data providers
```

## Deploying to GitHub Pages

The repository includes `.github/workflows/deploy-pages.yml`. It tests and builds the application, uploads `dist/`, and deploys it using GitHub's official Pages actions.

1. Commit and push the project to the `main` branch.
2. Open the repository on GitHub and go to **Settings > Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Open the repository's **Actions** tab and select **Deploy Munda to GitHub Pages**.
5. Wait for both the `build` and `deploy` jobs to become green.
6. Open `https://vicente101.github.io/Smartgrow/`.

Every later push to `main` automatically tests and republishes the site. Navigation uses URL hashes, such as `#/advisor`, so refreshing an internal page works reliably on static hosting. A `404.html` redirect also recovers old path-style links.

If the root still shows 404, confirm that the Pages source is **GitHub Actions**, the latest workflow run succeeded, and the repository name still matches `Smartgrow`.

## Static architecture

| Area | Implementation |
| --- | --- |
| Interface | React and Tailwind CSS, bundled by Vite |
| Icons | Solar Icons React package by 480 Design (CC BY 4.0) |
| Routing | Small hash router compatible with GitHub Pages |
| Crop catalogue | Version-controlled JavaScript data in `resources/js/data/crops.js` |
| Recommendation engine | Browser-side explainable scoring in `resources/js/services/recommendation.js` |
| Weather and climate | Open-Meteo with NASA POWER fallback |
| Place search | Open-Meteo Geocoding |
| Reverse geocoding | Nominatim / OpenStreetMap, with a coordinate fallback |
| Agricultural news | Browser-accessible GDELT DOC API with source-search fallbacks |
| Persistence | Browser local storage with expiry-aware caches |
| Contact | A generated `mailto:` draft; no personal data is stored by the site |

## Recommendation weights

| Signal | Future month | Current month |
| --- | ---: | ---: |
| Monthly temperature | 38% | 31% |
| Monthly rainfall / water access | 34% | 27% |
| Relative humidity | 16% | 13% |
| Soil compatibility | 12% | 12% |
| 14-day outlook | — | 17% |

Crop profiles use tolerance and optimum bands rather than a single minimum/maximum check. Confidence reflects the availability of live forecast data, historical climate, and farmer-supplied soil information.

## External data and privacy

The default non-commercial setup uses no paid keys:

- [Open-Meteo](https://open-meteo.com/) — forecast, soil variables, geocoding, and historical weather.
- [NASA POWER](https://power.larc.nasa.gov/) — agroclimatology fallback.
- [Nominatim](https://nominatim.org/) and [OpenStreetMap contributors](https://www.openstreetmap.org/copyright) — reverse geocoding.
- [GDELT](https://www.gdeltproject.org/) — global news discovery.
- [Solar Icons](https://www.figma.com/community/file/1166831539721848736) — interface iconography by 480 Design.

Coordinates are sent only to the listed data providers when an analysis is requested. Results and caches remain in the user's browser. Review each provider's attribution and usage terms before commercial or high-volume deployment.

## Agronomic limitation

Munda is decision support, not a replacement for a current soil test, district planting calendar, certified seed guidance, pest surveillance, or a local extension officer. Weather-model output and public news feeds can be incomplete or delayed, so the interface exposes sources and confidence rather than presenting recommendations as certainty.

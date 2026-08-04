# Munda Crop Intelligence

Munda is a Laravel 12 + React 19 + Tailwind CSS 4 application that turns local climate data into explainable crop recommendations. It replaces the original static PHP prototype with a responsive SPA, server-side API integrations, an agronomic scoring engine, location-aware agricultural news, persistent contact messages, caching, validation, and automated tests.

## What it does

- Searches towns worldwide or uses browser geolocation.
- Fetches a 14-day weather and soil outlook from Open-Meteo.
- Aggregates the last five complete years of ERA5 climate history by month.
- Falls back to NASA POWER climatology if the history service is unavailable.
- Ranks 18 crops against temperature, rainfall, humidity, soil type, water access, and the near-term forecast.
- Explains every score with component scores, strengths, risks, and field actions.
- Displays location-filtered agricultural headlines from GDELT with Google News RSS fallback.
- Saves the latest report in the browser and supports print/PDF export.
- Stores validated contact messages in the application database.

The recommendation model is deliberately described as an **explainable weighted agronomic model**, not machine learning. A genuine trained model should only replace or complement it after representative local soil, planting, management, and harvest-outcome data is collected.

## Requirements

- PHP 8.2+
- Composer 2
- Node.js 20+
- SQLite (default), MySQL, or PostgreSQL
- PHP extensions: cURL, PDO SQLite (for the default database), and SimpleXML

## Local setup

```bash
composer install
cp .env.example .env
php artisan key:generate
php artisan migrate --seed
npm install
npm run build
php artisan serve
```

On Windows PowerShell, use `Copy-Item .env.example .env` instead of `cp`.

For active development, the Laravel scaffold also provides:

```bash
composer run dev
```

This starts Laravel, Vite, the queue listener, and the log viewer together.

## Deploying the full application

GitHub Pages only serves static files and cannot run Laravel/PHP or the database-backed API. Keep this repository on GitHub, but deploy the application to Render using the included `Dockerfile` and `render.yaml` Blueprint.

1. Generate a production application key locally:

   ```bash
   php artisan key:generate --show
   ```

   Copy the complete value beginning with `base64:`. Never commit it to Git.

2. Commit and push the project, including `Dockerfile`, `docker/`, and `render.yaml`.
3. In the [Render Dashboard](https://dashboard.render.com/), choose **New > Blueprint** and connect this GitHub repository.
4. Select the branch containing `render.yaml`. Render will create the Docker web service and PostgreSQL database defined by the Blueprint.
5. When prompted for `APP_KEY`, paste the key generated in step 1, then apply the Blueprint.
6. Wait for the first deployment to finish and open the assigned `https://...onrender.com` address. The `/up` endpoint is the health check.
7. In the GitHub repository, open **Settings > Pages** and unpublish the old Pages site so visitors are not sent to its 404 page.

Every push to the connected branch will trigger a new deployment. The startup script caches Laravel configuration, runs outstanding migrations, and safely refreshes the crop catalogue with its idempotent seeder.

Render's free web services sleep when idle, so the first request after inactivity can be slow. Free Render PostgreSQL databases also expire after 30 days; use a paid Render database or another persistent PostgreSQL provider for a permanent public deployment.

If deployment reports `No application encryption key has been specified`, set the Render service's `APP_KEY` environment variable to the complete generated `base64:` value and redeploy. Do not upload `.env`, `vendor`, or `node_modules`.

## Verification

```bash
npm run check
npm audit
```

The feature tests fake external providers, so they are fast and deterministic. Live provider responses are cached: forecasts for 45 minutes, news for 30 minutes, geocoding for 30 days, and climate baselines for 30 days.

## Recommendation method

For a selected location and planting month, the backend scores each crop using:

| Signal | Future month | Current month |
| --- | ---: | ---: |
| Monthly temperature | 38% | 31% |
| Monthly rainfall / water access | 34% | 27% |
| Relative humidity | 16% | 13% |
| Soil compatibility | 12% | 12% |
| 14-day outlook | — | 17% |

Crop requirements use tolerance and optimum bands instead of a single minimum/maximum test. Results also include a confidence level that reflects whether live forecast data and farmer-supplied soil information were available.

## External services

No paid keys are required for the default non-commercial setup.

- [Open-Meteo](https://open-meteo.com/) — forecast, geocoding, soil variables, and ERA5 historical weather. Attribution is required; review its limits before commercial deployment.
- [NASA POWER](https://power.larc.nasa.gov/) — agroclimatology fallback.
- [Nominatim](https://nominatim.org/) — reverse geocoding for device coordinates. Follow the public usage policy at scale.
- [GDELT](https://www.gdeltproject.org/) — global news discovery.
- [Google News](https://news.google.com/) — RSS fallback when GDELT is slow or sparse.

All endpoint URLs can be overridden in `.env`; see `.env.example`.

## Important agronomic limitation

Munda is decision support, not a replacement for a current soil test, district planting calendar, certified seed guidance, pest surveillance, or a local extension officer. Weather-model output and public news feeds can be incomplete or delayed, so the UI exposes the source and confidence rather than presenting a recommendation as certainty.

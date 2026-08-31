# wttr-web

A terminal-style weather dashboard powered by [wttr.in](https://wttr.in) and themed after the user's Kitty configuration.

## Features

- Browser geolocation weather
- Manual city or coordinate search
- Today, three-day, and hourly forecast views
- Rain, clear-weather, and wind filters
- Metric and imperial units
- Responsive CLI interface with no build step or dependencies
- Automatic deployment to GitHub Pages

## GitHub Pages

1. Create a GitHub repository and push these files.
2. In `Settings → Pages → Build and deployment`, select `GitHub Actions`.
3. A push to `main` automatically runs `.github/workflows/deploy.yml`.

The app talks directly to wttr.in. No API key, application server, or third-party data proxy is required.

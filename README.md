# [wttr://web](https://johnny-taake.github.io/WTTR-Web/)

<p align="center">
  <a href="https://johnny-taake.github.io/WTTR-Web/">
    <img src="./assets/wttr-web-icon.png" alt="wttr://web terminal weather icon" width="144" />
  </a>
</p>

<p align="center">
  A terminal-style weather dashboard powered by <a href="https://wttr.in">wttr.in</a> and themed after the user's Kitty configuration.
  <br />
  <strong><a href="https://johnny-taake.github.io/WTTR-Web/">Open wttr://web ↗</a></strong>
</p>

<a href="https://johnny-taake.github.io/WTTR-Web/">
  <img src="./assets/wttr-web-preview.png" alt="Full-page preview of the wttr://web weather dashboard" />
</a>

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
3. A push to `master` automatically runs `.github/workflows/deploy.yml`.

The app talks directly to wttr.in. No API key, application server, or third-party data proxy is required.

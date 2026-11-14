# Biblioteka Polska im. M. Reja w Kitchener

Static website for browsing and searching the library catalog (`66 Shanley Street, Kitchener Ontario N2H3N9`), backed by Google Sheets and hosted on GitHub Pages.

## Project Links

- **Live Website:** https://bibliotekareja.github.io/biblioteka/
- **GitHub Repository:** https://github.com/bibliotekareja/biblioteka
- **Google Sheet ID:** `1zl6_bYFixtMKgmQr2JdjEunpFzvxB3pNQCYJPX8Jw2A` (hosted under the Biblioteka Google account; sharing set to **Anyone with the link → Viewer**)

## Updating the Catalog

- **Edit books directly in Google Sheets:** Any additions, edits, or removals in the Google Sheet appear on the live website on page reload—no GitHub Pages redeploy is needed.
- **Include additional tabs (e.g. `Swiatowa 1`):**
  1. Open the tab in Google Sheets and copy its `#gid=...` number from the URL.
  2. Add the tab GIDs to `SHEET_GIDS` in `script.js`, for example:
     ```js
     const SHEET_GIDS = ['1517421410', '123456789'];
     ```
     (Leaving `SHEET_GIDS = []` loads the first tab automatically.)
  3. Commit and push to `main`.

## Updating the Website

1. Edit `index.html`, `style.css`, `script.js`, or images locally.
2. Commit and push to `main`:
   ```bash
   git add -A
   git commit -m "Describe your update"
   git push origin main
   ```
3. GitHub Pages automatically rebuilds from `main` (`/ (root)`). If your browser shows old styles or cached assets right after a deploy, do a hard refresh (`Ctrl+Shift+R`).

# Biblioteka Polska im. M. Reja w Kitchener

Static website for browsing and searching the library catalog, backed by Google Sheets and hosted on GitHub Pages.

## Setup

### 1. Google Sheets (Biblioteka Google Account)
1. Sign in to the Biblioteka Google account and upload/open `biblioteka.xlsx` in Google Drive, then save it as a **Google Sheet** (**File → Save as Google Sheets**).
2. Clean up any test rows or helper formula columns if needed.
3. Click **Share → General access → Anyone with the link (Viewer)**.
4. Copy the Sheet ID from the URL:
   ```text
   https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
   ```
5. Paste that `<SHEET_ID>` into `script.js`:
   ```js
   const SHEET_ID = 'YOUR_SHEET_ID_HERE';
   ```
   - By default (`SHEET_GIDS = []`), the site loads the first tab.
   - To combine multiple tabs (e.g. `Polska1` and `Swiatowa 1`), add each tab's `#gid=...` value from the browser URL to `SHEET_GIDS`, e.g. `const SHEET_GIDS = ['0', '123456789'];`.

### 2. GitHub Pages (Biblioteka GitHub Account)
1. Create a public repository on the Biblioteka GitHub account (sign up / log in with the Biblioteka Google email).
2. Add the remote and push `main`:
   ```bash
   git remote add origin https://github.com/<org-or-user>/<repo>.git
   git push -u origin main
   ```
3. In the repository on GitHub, go to **Settings → Pages**:
   - **Source:** Deploy from a branch
   - **Branch:** `main` / `/ (root)`
   - Click **Save**

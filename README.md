## Birthday RSVP Site

This project will be a simple 1st birthday RSVP webpage (Vercel-ready) that saves responses into Google Sheets.

### Local preview
- Open `index.html` in your browser.

### Connect to Google Sheets (free)
1. Create a new Google Sheet (example name: `Birthday RSVP`).
2. In the sheet, go to **Extensions → Apps Script**.
3. Copy/paste the code from `google-apps-script/Code.gs` into your Apps Script project.
4. Click **Deploy → New deployment**:
   - Type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. Copy the Web App URL.
6. Paste that URL into `config.js` as `window.RSVP_CONFIG.endpoint`.

Now your RSVP submissions will appear in a sheet tab named `RSVP`.

### Deploy to Vercel (free)
- Create a new Vercel project
- Import this repository
- Framework preset: “Other”
- Build command: none
- Output directory: root



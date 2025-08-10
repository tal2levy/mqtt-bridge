# Romanian Learning App (A1-B1)

This project provides a PWA and backend for learning Romanian using only content from a Google Drive folder.

## Features
- Multi-language UI: Hebrew (RTL) default, switchable to Russian or English.
- Guided course A1→B1 with grammar, vocabulary, listening, reading, writing, speaking.
- SRS practice for vocabulary and sentences with audio.
- Conversational tutor that uses only Drive-sourced content.
- Exam simulator with items sourced from Drive.
- Automatic daily ingest from Google Drive with delta support.
- "What's new" feed and "Updated to: DD.MM.YYYY" indicator.
- PWA frontend with optional future Expo mobile app.

## Local Setup
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Set environment variables**
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SERVICE_ACCOUNT_KEY` (JSON string)
   - `DRIVE_FOLDER_ID` (defaults to `1K5iqMAgXlW2F_0kz_GYVVDEY28ltuA15`)
   - `DATABASE_URL` (sqlite file path, defaults to `./romanian.db`)
3. **Run ingest**
   ```bash
   node romanian-app/backend/ingest.js
   ```
4. **Start backend**
   ```bash
   node romanian-app/backend/index.js
   ```
5. **Open frontend**: `romanian-app/frontend/index.html` in a browser.

## Production
- Use any Node hosting provider for the backend.
- Serve `frontend` as static files (supports PWA install).
- Schedule `ingest.js` daily (e.g., via cron) to sync Drive content.

## Mock Data
If Drive access isn't available, the app uses files in `mock_data/` as sample content. Replace with real content once permissions are granted.

## Database Schema
See [backend/schema.sql](backend/schema.sql).

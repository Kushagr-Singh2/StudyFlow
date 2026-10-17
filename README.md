# StudyFlow

A lightweight study planner for subjects, phases, topic checklists, daily focus, session notes, backups, and screenshot-to-plan import.

## Features
- Manage subjects, phases, and topics
- Track completed topics and overall progress
- Build a daily focus list and write session notes
- Export/import a JSON backup
- Import study-plan screenshots and review the extracted structure before saving
- Local-first plan storage: each browser profile has its own plans
- Terms, privacy policy, and SVG favicon

## Run locally
1. Install Node.js LTS.
2. Run `npm install`.
3. Copy `.env.example` to `.env` and add your own API key to `GEMINI_API_KEY`.
4. Run `npm start` in this folder.
5. Open `index.html` with VS Code Live Server (or another local static server). The frontend uses `http://localhost:3001/api/parse-plan` locally.

## Deploy to Vercel
1. **Do not upload `.env` or `node_modules`.** They are excluded from the deployment package.
2. Push this folder's contents to a GitHub repository.
3. In Vercel, import that repository. Keep the project root at the folder containing `index.html`, `package.json`, and `vercel.json`.
4. In Vercel → Project → Settings → Environment Variables, add `GEMINI_API_KEY` with a newly rotated key and `GEMINI_MODEL` with `gemini-3.8-flash`. Apply to Production and Preview as appropriate.
5. Deploy. The `api/parse-plan.js` serverless function handles screenshot import; the static frontend calls `/api/parse-plan` on the deployed site.
6. Test the app in two different browser profiles. Plans should remain separate because they are stored in each browser's local storage.

## Custom domain
After the first successful deployment, open Vercel → Project → Settings → Domains, add a domain you own, then follow the DNS records Vercel provides at your domain registrar. Vercel assigns HTTPS after DNS verification. You must own or purchase the domain; this project cannot register it for you. You can use the free `*.vercel.app` address until then.

## Privacy and limitations
- Study plans stay in browser local storage and do not sync across devices.
- Screenshot import sends selected images to the server and then to Google's Gemini AI service for extraction. The provider is not named in the app's main interface, but is disclosed in the Privacy Policy.
- Online screenshot import is limited to three images at a time, each under 1.5 MB, to stay within serverless request limits.
- Screenshot import consumes the project's API quota. Share the link with people you trust, monitor usage, and rotate the API key if it is ever exposed.
- This project does not currently have user accounts, cross-device sync, or a database.

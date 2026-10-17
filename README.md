# SemReady

A lightweight semester study planner for university students. Organise subjects, phases, topics, daily focus, study notes, and exam preparation; export backups; and turn syllabus screenshots into editable plans.

## Features
- Manage subjects, phases, and topics
- Track completed topics and overall progress
- Build a daily focus list and write session notes
- Export/import a JSON backup
- Import study-plan screenshots and review extracted structure before saving
- Local-first plan storage: each browser profile has its own plans
- Privacy policy, terms, and SVG favicon

## Deploy on Vercel
1. Push the project files to your GitHub repository.
2. Import or redeploy the repository in Vercel. The project uses a Vercel serverless function at `api/parse-plan.js`.
3. In Vercel → Project → Settings → Environment Variables, add `GEMINI_API_KEY` with your own Gemini API key for screenshot import. Optionally set `GEMINI_MODEL`.
4. Redeploy after changing environment variables.

Never commit `.env` or paste API keys into source code. `.env.example` is a safe template for local setup.

## Local development
- Install Node.js (LTS).
- Run `npm install`.
- Copy `.env.example` to `.env` and add your own `GEMINI_API_KEY`.
- Run `npm start` for the Express local API.
- For production hosting, Vercel uses `api/parse-plan.js`; set the API key in Vercel Environment Variables.

## Privacy and limitations
- Study plans stay in browser local storage and do not sync across devices.
- Screenshot import sends selected images to Google's Gemini AI service for extraction. Avoid uploading sensitive or confidential material.
- Online screenshot import is limited to three images at a time, each under 900 KB.
- Screenshot import consumes the project's API quota. Monitor usage and rotate the API key if it is ever exposed.
- This project does not currently have user accounts, cross-device sync, or a database.

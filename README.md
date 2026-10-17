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

## Custom domain
After the first successful deployment, open Vercel → Project → Settings → Domains, add a domain you own, then follow the DNS records Vercel provides at your domain registrar. Vercel assigns HTTPS after DNS verification. You must own or purchase the domain; this project cannot register it for you. You can use the free `*.vercel.app` address until then.

## Privacy and limitations
- Study plans stay in browser local storage and do not sync across devices.
- Screenshot import sends selected images to the server and then to Google's Gemini AI service for extraction. The provider is not named in the app's main interface, but is disclosed in the Privacy Policy.
- Online screenshot import is limited to three images at a time, each under 1.5 MB, to stay within serverless request limits.
- Screenshot import consumes the project's API quota. Share the link with people you trust, monitor usage, and rotate the API key if it is ever exposed.
- This project does not currently have user accounts, cross-device sync, or a database.

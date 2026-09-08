# Private Thoughts

Build a voice note app called Thoughts

Core features:

- Record voice memos using the device microphone, with start/pause/stop controls and a running timer

- Store recordings locally in the browser (IndexedDB) — no backend, no cloud upload

- List view of all notes with title, date, and duration; playback, rename, delete, and search

Security:

- App opens to a lock screen — no content visible until unlocked

- Primary unlock: fingerprint/biometric via the WebAuthn API

- Fallback unlock: a password set on first use, stored as a salted hash (never plain text)

- Auto-lock after a set period of inactivity or when the tab loses focus

Design:

- Light/dark mode toggle

- Color palette: blue only — soft sky blue for light mode, deep navy for dark mode, mid-blue accent for buttons and highlights

- Clean, minimal, rounded UI, mobile-first layout

Technical:

- Build this as a Progressive Web App: include a manifest.json, app icons, and a service worker that caches the app shell so it works fully offline

- All data stays on-device

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/df24837a-544d-4261-9005-ab5166db7a12).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

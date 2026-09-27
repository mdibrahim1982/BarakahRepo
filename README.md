# Barakah Routine — Kids Daily Productivity Tracker

A React + Vite app to track Muaadh (7th grade) and Khateejah (5th grade)'s
daily routine, with one coin bucket per activity.

## Run it locally

```bash
npm install
npm run dev
```

Then open the URL Vite prints (usually `http://localhost:5173`).

## Kid login

- The app opens on a login screen — "Assalaamu Alaikum! Hey, Who're You?"
  — where a kid picks their name and types their password, which is just
  their own name (e.g. Muaadh's password is `Muaadh`). This isn't real
  security, just a nice ritual and a way to greet whoever's using the
  device with a short welcome message before the app opens.
- The login is remembered for the browser tab's session (`sessionStorage`)
  so refreshing the page doesn't force a re-login, but closing the tab
  does. A **👋 not you?** link next to the kid tabs logs out back to the
  login screen at any time.

## Digital clock, timestamps & coin animation

- A digital clock (HH:MM:SS + weekday/date) sits on the right side of the
  banner, ticking every second.
- Every activity now records the exact time it was tapped (not just the
  timed prayer buttons) — that time shows next to "Coin earned" on the
  card, in the day-end review, and in the Weeks history.
- Whenever an activity is marked done, a short tip — a paraphrased Hadith
  or Islamic reminder relevant to that activity's category (prayer,
  Qur'an, study, discipline, or play) — pops up centered on the page for
  4 seconds, and only then does a coin visibly fly from the button to
  that activity's bucket. The bucket is credited right away in state —
  the tip/animation is just a visual pause before it, not a delay in
  scoring.

## ☁️ Cloud sync (Firestore) — every device shares the same data

This app now syncs through a Firebase/Firestore cloud database, so a kid's
coins earned on one phone/tablet/laptop show up immediately on every other
device that opens the same app — no manual exporting for day-to-day use.

**One-time setup (already done for this project, documented here for
reference / in case you ever need to redo it):**

1. `src/firebase.js` holds the Firebase Web config (`apiKey`, `projectId`,
   etc.). This is safe to have in the public source — for a client-side
   web app this config is **not** a secret; it just tells the browser
   which Firebase project to talk to. Actual access control is done by
   the Firestore **Security Rules** below, not by hiding this file.
2. In the [Firebase console](https://console.firebase.google.com) →
   your project → **Build → Firestore Database → Rules**, use:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /app/state {
         allow read, write: if true;
       }
       match /{document=**} {
         allow read, write: if false;
       }
     }
   }
   ```
   This opens read/write to exactly one document (`app/state`, where the
   whole app's data lives) and denies everything else by default. It's
   intentionally simple since this app has no real user accounts (the kid
   "login" is just a friendly name/password ritual, not Firebase Auth) —
   treat this like a shared family whiteboard, not a bank vault. **Test
   mode** rules (Firestore's default for a new project) work short-term
   but **expire after 30 days** and then lock everyone out — replace them
   with the rules above so it keeps working.
3. Run `npm install` after pulling these changes — it adds the `firebase`
   package to `node_modules`.

**How it works day to day:**
- A small **☁️ Synced** / **🔄 Connecting…** / **📴 Offline** / **💾 Local
  dev mode** pill sits under the kid tabs so you can see the connection
  status at a glance.
- **Local development never touches the cloud.** Running the app on
  `localhost`/`127.0.0.1` (i.e. `npm run dev` or `npm run preview` on your
  own machine) automatically stays on plain `localStorage` only — it
  never reads or writes the shared Firestore document. This means testing
  changes locally can't ever overwrite or corrupt the real family data
  that other devices are syncing to; the pill shows **💾 Synced to local
  storage (dev mode)** in this case. Only a real deployed origin (the
  GitHub Pages URL) uses the cloud. If you ever need to test the actual
  cloud path locally, temporarily change the `IS_LOCAL_DEV` check in
  `src/App.jsx` — just remember to revert it before committing.
- If a device is briefly offline, it keeps working from its local cache
  and pushes any changes once it reconnects (Firestore's built-in offline
  persistence). If it's the very first time *any* device has connected,
  whatever was already in that device's local storage is uploaded once to
  seed the shared cloud copy, so earlier testing data isn't lost.
- The **👨‍👩‍👧 Parent** tab still has **⬇️ Export** / **⬆️ Import**
  buttons — these aren't needed for normal cross-device use anymore, but
  are kept as a manual backup/restore tool (e.g. before trying something
  risky, or to snapshot progress before a "Pay & empty buckets").

## Rendering on tablets / older browsers

If a specific tablet shows a blank page, it's most likely one of:

1. **It hasn't connected to the shared cloud data yet.** Check the small
   status pill under the kid tabs — if it says "📴 Offline" or is stuck on
   "🔄 Connecting…", that tablet can't reach Firestore right now (Wi-Fi
   issue, or the tablet's browser blocking the connection). It should
   still show the login screen and *something* (its local cache or a
   blank day), not a truly blank white/black screen with nothing at all —
   that's a different, real problem covered below.
2. **An old/outdated browser on the tablet.** Cheaper or older Android
   tablets often ship with an outdated WebView/browser that can't run
   modern JavaScript at all, which silently blanks the whole page with no
   error shown. `vite.config.js` now sets `build.target: 'es2015'` so a
   **production build** (`npm run build` + `npm run preview`, or hosting
   the `dist/` folder) is transpiled for much older browsers — this does
   **not** apply to `npm run dev`, which always needs a fairly modern
   browser no matter what. If you're testing on a tablet, use the built
   version, not the dev server, and try updating that tablet's browser
   app if possible.

## Weeks page

- The **Weeks** tab (next to **Today**) shows a full month for whichever
  kid is currently active, split into Week 1 / Week 2 / Week 3... tabs (7
  days each). Each row is one date with its weekday, a ✅/❌/➖ per
  activity, and that day's ₹ total, plus a week total at the bottom. Use
  ◀ ▶ to move between months.

## Parent weekly progress

- The **👨‍👩‍👧 Parent** tab (parent passcode required, same as below) shows
  both kids side by side for the current week: total ₹, total coins, any
  carried-forward penalty owed, and a per-activity coins/₹ breakdown —
  a quick comparison without switching kid tabs or digging into the Weeks
  page. Tap **🔒 Lock parent view** to close it again.

## Parent passcode & admin testing

- Tapping **Lock day & finish** asks for the parent passcode (`Fathi@143`)
  before it opens the day-end review screen, where every coin the kid
  claimed today is listed for you to **Approve** or **Reject** — rejecting
  removes that coin from the bucket. Anything left unreviewed stays
  approved. This is the check against a kid over-claiming something like
  On Control or Obeyed, since only the kid was there to witness it.
- The same passcode also gates the **👨‍👩‍👧 Parent** weekly progress tab and
  the **₹ per coin** setting.
- A **🔧 Reset Today** button (bottom of the Today page,
  same passcode) resets today's activities back to a fresh, unlocked state
  — even after the day has already been locked — so you can test the flow
  again without waiting for a new day. It also reverses any coins that
  were already credited today, so the weekly bucket stays accurate.

## The 10 activities & buckets

Each activity has its own bucket. A filled coin = ₹5 (editable at the top).

1. **Wake Up** — a live-clock "Push Now" button. Push it by 6:00 AM for a
   coin; push it after and it's marked missed. Every other activity stays
   locked until this is done on time (a parent can override this).
2. **Fajr Prayer** — same push-button idea, with a 15-minute grace window
   (deadline 6:30 AM).
3. **Quran Recitation**, 4. **Academic Study** (now before Dhuhr),
   5. **Dhuhr Prayer**, 6. **Asr Prayer** — each unlocks at 3:45 PM,
   7. **Maghrib Prayer** — unlocks at 6:00 PM,
   8. **Isha Prayer** — unlocks at 7:45 PM. Each is a single
   "Completed on Time?" button that fills the bucket the moment it's
   pressed, once its unlock time has passed.
9. **On Control** — a kid-pressed button confirming mobile use stayed
   within the two allowed windows (5:00–5:30 PM after Asr, 9:45–10:00 PM
   after Isha, shown in the hint text). Reviewed by the parent at day end.
10. **Obeyed 😊** — a kid-pressed button for obeying parents today.
    Reviewed by the parent at day end.

## Day & week cycle

- Locking the day (button at the bottom) marks anything still pending as
  missed, then folds every filled bucket into that week's totals. A new day
  also auto-locks the previous one if you didn't get to it.
- Each new calendar date starts fresh and fully locked-down again (gated on
  Wake Up).
- "Pay & empty buckets" clears the week's coins once you've handed over the
  cash reward.
- Everything is saved in the browser's local storage, per device.

## Customizing

- Activities, deadlines, grace periods and hints live in
  `src/data/activities.js`.
- Colors and layout live in `src/App.css`.
- The parent/admin passcode is set in `src/App.jsx` (`ADMIN_PASSCODE`). It's
  a simple deterrent for young kids, not real security — anyone who opens
  the source file can see it.

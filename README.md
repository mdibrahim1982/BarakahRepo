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

## Analog clock & coin animation

- A rich analog clock (hour/minute/second hands, tick marks) sits on the
  right side of the banner, ticking every second.
- Whenever an activity is marked done, a short tip — a paraphrased Hadith
  or Islamic reminder relevant to that activity's category (prayer,
  Qur'an, study, discipline, or play) — pops up for about 1.7 seconds,
  and only then does a coin visibly fly from the button to that
  activity's bucket. The bucket is credited right away in state — the
  tip/animation is just a visual pause before it, not a delay in scoring.

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
- A **🔧 Admin: reset today for testing** button (bottom of the Today page,
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

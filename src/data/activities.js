// One coin bucket per activity. Every activity is independent — none is
// gated on another one being completed first (see App.jsx).
//
// control types:
//  - "timedPush": a live-clock push button. Pressing after the deadline
//    (target [+ graceMinutes]) marks it missed instead of done — no coin.
//    If the activity also sets `lateLabel` + `lateCredit`, a second
//    button is shown alongside "Push Now" so a genuinely late prayer can
//    still be self-reported for a smaller, fixed credit (see Fajr below
//    and App.jsx pressLateButton). There's no penalty for being late —
//    only a smaller credit than praying on time.
//  - "simple": a single button (default label "Completed on Time?",
//    overridable per-activity with `buttonLabel`). Pressing fills the
//    bucket immediately. If `visibleAfter` ("HH:MM") is set, the button
//    stays hidden behind a lock note until that time of day.
//
// Every activity's coin is provisional until the parent approves or
// rejects it in the day-end review (see App.jsx / DayReviewModal.jsx).
// A rejection reverses the coin AND deducts a further ₹5 penalty that
// carries forward — untouched by day or week resets — until it's paid
// off by a future week's earnings (see kid.debt in App.jsx).
export const ACTIVITIES = [
  {
    id: 'fajr',
    label: 'Fajr Prayer',
    category: 'prayer',
    control: 'timedPush',
    target: '06:00',
    lateLabel: 'Late Comer 🐢',
    lateCredit: 3,
    lateDeadline: '07:00',
    hint: 'Push "Push Now" by 6:00 AM for full credit, or "Late Comer" between 6:00–7:00 AM for a ₹3 credit. Closes after 7:00 AM.',
  },
  {
    id: 'quran',
    label: 'Quran Recitation',
    category: 'quran',
    control: 'simple',
    buttonLabel: 'Quran Recitation 📖',
    hint: '15 minutes, right after Fajr',
  },
  {
    id: 'hadith',
    label: 'Read Hadith',
    category: 'quran',
    icon: '📗',
    tint: '#EDE7F4',
    control: 'simple',
    buttonLabel: 'Completed',
    fixedCredit: 2,
    hint: 'Read one Hadith with its meaning. Fixed credit: ₹2.',
  },
  {
    id: 'study',
    label: 'Academic Study',
    category: 'study',
    control: 'simple',
    buttonLabel: 'Academic Study 📚',
    hint: 'Homework & lessons, before Dhuhr',
  },
  {
    id: 'dhuhr',
    label: 'Dhuhr Prayer',
    category: 'prayer',
    control: 'simple',
    visibleAfter: '15:45',
    hint: 'School days: mark after school hours. Sundays: at prayer time. Unlocks at 3:45 PM.',
  },
  {
    id: 'asr',
    label: 'Asr Prayer',
    category: 'prayer',
    control: 'simple',
    visibleAfter: '15:45',
    hint: 'School days: mark after school hours. Sundays: at prayer time. Unlocks at 3:45 PM.',
  },
  {
    id: 'maghrib',
    label: 'Maghrib Prayer',
    category: 'prayer',
    control: 'simple',
    visibleAfter: '18:00',
    hint: '4th prayer. Unlocks at 6:00 PM.',
  },
  {
    id: 'isha',
    label: 'Isha Prayer',
    category: 'prayer',
    control: 'simple',
    visibleAfter: '19:45',
    hint: '5th prayer. Unlocks at 7:45 PM.',
  },
  {
    id: 'mobile',
    label: 'Mobile Viewing',
    category: 'discipline',
    control: 'simple',
    buttonLabel: 'On Control 📵',
    hint: 'Allowed: 5:00–5:30 PM after Asr (30 min) and 9:45–10:00 PM after Isha (15 min). Reviewed by parent at day end.',
  },
  {
    id: 'obey',
    label: 'Obeyed Parents',
    category: 'discipline',
    icon: '👪',
    tint: '#F3ECDD',
    control: 'simple',
    buttonLabel: 'Yes off course',
    hint: 'Reviewed by parent at day end.',
  },
  {
    id: 'outdoor',
    label: 'Playing Outdoors',
    category: 'play',
    control: 'simple',
    buttonLabel: 'Oh Yes 👍',
    fixedCredit: 3,
    hint: 'Time outside, away from screens. Reviewed by parent at day end. Fixed credit: ₹3.',
  },
]

export const DEFAULT_REWARD = 5 // ₹ per coin (one coin per activity per day, on time)

// Short column headers for the compact Weeks history table.
export const SHORT_LABELS = {
  fajr: 'Fajr',
  quran: 'Qurʼan',
  hadith: 'Hadith',
  study: 'Study',
  dhuhr: 'Dhuhr',
  asr: 'Asr',
  maghrib: 'Maghrib',
  isha: 'Isha',
  mobile: 'MobileView',
  obey: 'Obeyed',
  outdoor: 'Outdoors',
}


export const CATEGORY_COLORS = {
  prayer: { dot: '#1F6F6B', tint: '#E3F0EE', icon: '🕌' },
  quran: { dot: '#8A5FA8', tint: '#F0E9F5', icon: '📖' },
  study: { dot: '#3E6AC9', tint: '#E7EDFA', icon: '📚' },
  discipline: { dot: '#C97B84', tint: '#F8E9EA', icon: '📱' },
  play: { dot: '#4FA65B', tint: '#E7F4E9', icon: '🌳' },
}

export const KIDS = [
  { id: 'muaadh', name: 'Muaadh', grade: '7th Grade', color: '#1F6F6B', initial: 'M' },
  { id: 'katheejah', name: 'Katheejah', grade: '5th Grade', color: '#C97B84', initial: 'K' },
]

export function todayKey(d = new Date()) {
  return d.toISOString().slice(0, 10) // YYYY-MM-DD
}

export function monthKey(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function weekNumberInMonth(d = new Date()) {
  return Math.ceil(d.getDate() / 7)
}

// "Week 1" = days 1-7 of the month, "Week 2" = 8-14, etc. This keeps the
// coin-bucket week the same grouping shown on the Weeks page.
export function weekKey(d = new Date()) {
  return `${monthKey(d)}-W${weekNumberInMonth(d)}`
}

export function daysInMonth(monthId) {
  const [y, m] = monthId.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}

export function formatMonthLabel(monthId) {
  const [y, m] = monthId.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
}

export function addMonths(monthId, delta) {
  const [y, m] = monthId.split('-').map(Number)
  const d = new Date(y, m - 1 + delta, 1)
  return monthKey(d)
}

// All weeks in a month, each with its date-id list, for the Weeks page.
export function weeksInMonth(monthId) {
  const total = daysInMonth(monthId)
  const [y, m] = monthId.split('-').map(Number)
  const numWeeks = Math.ceil(total / 7)
  const weeks = []
  for (let w = 1; w <= numWeeks; w++) {
    const startDay = (w - 1) * 7 + 1
    const endDay = Math.min(w * 7, total)
    const dates = []
    for (let d = startDay; d <= endDay; d++) {
      dates.push(`${monthId}-${String(d).padStart(2, '0')}`)
    }
    weeks.push({ weekNum: w, id: `${monthId}-W${w}`, startDay, endDay, dates })
  }
  return weeks
}

// Build a real Date for "HH:MM" on the given YYYY-MM-DD date, so a
// timedPush button can be compared against the actual current time.
export function deadlineDate(dateId, timeStr, graceMinutes = 0) {
  const [y, m, d] = dateId.split('-').map(Number)
  const [hh, mm] = timeStr.split(':').map(Number)
  const dt = new Date(y, m - 1, d, hh, mm, 0, 0)
  if (graceMinutes) dt.setMinutes(dt.getMinutes() + graceMinutes)
  return dt
}

// True once `now` has reached HH:MM on the given date. No visibleAfter
// means "always visible" (true).
export function hasReachedTime(now, dateId, timeStr) {
  if (!timeStr) return true
  return now >= deadlineDate(dateId, timeStr)
}

// "15:45" -> "3:45 PM"
export function formatTimeLabel(timeStr) {
  const [hh, mm] = timeStr.split(':').map(Number)
  const period = hh >= 12 ? 'PM' : 'AM'
  const h12 = hh % 12 === 0 ? 12 : hh % 12
  return `${h12}:${String(mm).padStart(2, '0')} ${period}`
}

export function blankDay() {
  const activities = {}
  ACTIVITIES.forEach((a) => {
    activities[a.id] = { status: 'pending', time: '', reviewed: null, credit: 0, penalty: 0 }
  })
  return { activities, locked: false }
}

// Backfills any activity ids missing from a previously-saved day (e.g. a
// day saved before a new activity, like "hadith", was added to the list
// above). Without this, reading `entry.status` on a missing entry crashes
// the whole render — which is exactly what a blank/black screen on reload
// looks like.
export function withAllActivities(day) {
  let changed = false
  const activities = { ...day.activities }
  ACTIVITIES.forEach((a) => {
    if (!activities[a.id]) {
      activities[a.id] = { status: 'pending', time: '', reviewed: null, credit: 0, penalty: 0 }
      changed = true
    }
  })
  return changed ? { ...day, activities } : day
}

export function blankWeek() {
  const activities = {}
  const activityCash = {}
  ACTIVITIES.forEach((a) => {
    activities[a.id] = 0
    activityCash[a.id] = 0
  })
  return { cash: 0, activities, activityCash }
}

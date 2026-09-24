import React, { useEffect, useMemo, useRef, useState } from 'react'
import {
  ACTIVITIES,
  DEFAULT_REWARD,
  CATEGORY_COLORS,
  KIDS,
  todayKey,
  weekKey,
  monthKey,
  deadlineDate,
  hasReachedTime,
  formatTimeLabel,
  blankDay,
  blankWeek,
  withAllActivities,
} from './data/activities.js'
import WeeksView from './components/WeeksView.jsx'
import PasscodeModal from './components/PasscodeModal.jsx'
import DayReviewModal from './components/DayReviewModal.jsx'

// Bumped to v6: Fajr penalty replaced with a separate "Late Comer" credit
// button, and per-activity cash is now tracked exactly (credit stored per
// entry) instead of assumed as coins × rate — old v5 saves aren't compatible.
const STORAGE_KEY = 'barakahRoutine:v6'
const FLIGHT_MS = 650
const ADMIN_PASSCODE = 'Fathi@143'

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw)
  } catch (e) {
    console.error('Could not read saved data', e)
  }
  const initial = { rewardRate: DEFAULT_REWARD, kids: {} }
  KIDS.forEach((k) => {
    initial.kids[k.id] = { days: {}, weeks: {}, debt: 0 }
  })
  return initial
}

// Migrate data saved by an older version of the app (no `debt` field yet).
function ensureDebtField(kidData) {
  return kidData.debt == null ? { ...kidData, debt: 0 } : kidData
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Could not save data', e)
  }
}

// Closing a day only turns leftover "pending" rows into "missed" —
// coins are already credited the moment each activity is marked done.
function closeDay(day) {
  const activities = { ...day.activities }
  ACTIVITIES.forEach((a) => {
    if (activities[a.id].status === 'pending') activities[a.id] = { ...activities[a.id], status: 'missed' }
  })
  return { ...day, activities, locked: true }
}

function ensureToday(kidDataIn, todayId) {
  const kidData = ensureDebtField(kidDataIn)
  const days = { ...kidData.days }
  const weeks = { ...kidData.weeks }

  Object.keys(days).forEach((dateId) => {
    days[dateId] = withAllActivities(days[dateId])
    if (dateId !== todayId && !days[dateId].locked) {
      days[dateId] = closeDay(days[dateId])
    }
  })

  if (!days[todayId]) days[todayId] = blankDay()

  return { ...kidData, days, weeks }
}

export default function App() {
  const [state, setState] = useState(loadState)
  const [activeKid, setActiveKid] = useState(KIDS[0].id)
  const [now, setNow] = useState(new Date())
  const [flights, setFlights] = useState([])
  const [view, setView] = useState('today') // 'today' | 'weeks'
  const [viewMonth, setViewMonth] = useState(monthKey(new Date()))
  const [pendingAction, setPendingAction] = useState(null) // { title, message, run }
  const [reviewOpen, setReviewOpen] = useState(false)
  const [rateUnlocked, setRateUnlocked] = useState(false)
  const bucketRefs = useRef({})

  const todayId = todayKey(now)
  const weekId = weekKey(now)
  const rate = state.rewardRate ?? DEFAULT_REWARD

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    setState((prev) => {
      const next = { ...prev, kids: { ...prev.kids } }
      KIDS.forEach((k) => {
        next.kids[k.id] = ensureToday(prev.kids[k.id], todayId)
      })
      return next
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todayId])

  useEffect(() => saveState(state), [state])

  const kidData = state.kids[activeKid]
  // withAllActivities guards the very first render too (before the
  // migration effect below has run), so a saved day missing a newer
  // activity id can never crash the render.
  const day = withAllActivities(kidData?.days?.[todayId] || blankDay())
  const week = kidData?.weeks?.[weekId] || blankWeek()

  function launchCoin(activityId, originEl) {
    const bucketEl = bucketRefs.current[activityId]
    if (!originEl || !bucketEl) return
    const fromRect = originEl.getBoundingClientRect()
    const toRect = bucketEl.getBoundingClientRect()
    const from = { x: fromRect.left + fromRect.width / 2, y: fromRect.top + fromRect.height / 2 }
    const to = { x: toRect.left + toRect.width / 2, y: toRect.top + toRect.height / 2 }
    const id = `${activityId}-${Date.now()}-${Math.random()}`
    setFlights((prev) => [...prev, { id, from, to }])
    setTimeout(() => setFlights((prev) => prev.filter((f) => f.id !== id)), FLIGHT_MS + 50)
  }

  // `credit` is the rupee amount this entry earns — normally the current
  // per-coin rate, but a fixed, smaller amount for a self-reported late
  // Fajr (see pressLateButton). Stored on the entry itself so later rate
  // changes, rejections, and admin resets all stay accurate.
  function completeActivity(activityId, status, time, originEl, credit = rate) {
    setState((prev) => {
      const kid = ensureDebtField(prev.kids[activeKid])
      const currentDay = withAllActivities(kid.days[todayId] || blankDay())
      if (currentDay.locked) return prev
      if (currentDay.activities[activityId].status !== 'pending') return prev

      const nextDay = {
        ...currentDay,
        activities: {
          ...currentDay.activities,
          [activityId]: { status, time: time || '', reviewed: null, credit: status === 'done' ? credit : 0, penalty: 0 },
        },
      }
      const currentWeek = kid.weeks[weekId] || blankWeek()
      const nextWeek =
        status === 'done'
          ? {
              cash: currentWeek.cash + credit,
              activities: { ...currentWeek.activities, [activityId]: (currentWeek.activities[activityId] || 0) + 1 },
              activityCash: {
                ...currentWeek.activityCash,
                [activityId]: (currentWeek.activityCash?.[activityId] || 0) + credit,
              },
            }
          : currentWeek

      return {
        ...prev,
        kids: {
          ...prev.kids,
          [activeKid]: {
            ...kid,
            days: { ...kid.days, [todayId]: nextDay },
            weeks: { ...kid.weeks, [weekId]: nextWeek },
          },
        },
      }
    })
    if (status === 'done' && originEl) launchCoin(activityId, originEl)
  }

  // "Push Now": on-time press earns the full coin; a press after the
  // deadline is simply missed (no coin, no penalty) — a genuinely late
  // prayer should instead be logged with the "Late Comer" button below.
  function pressTimedButton(activity, e) {
    const pressedAt = new Date()
    const deadline = deadlineDate(todayId, activity.target, activity.graceMinutes || 0)
    const status = pressedAt <= deadline ? 'done' : 'missed'
    const timeStr = pressedAt.toTimeString().slice(0, 8)
    completeActivity(activity.id, status, timeStr, e.currentTarget, rate)
  }

  // "Late Comer": self-report that the prayer happened, just after the
  // deadline but before the activity's own lateDeadline (e.g. 7:00 AM for
  // Fajr). Always counts as done, but for a smaller, fixed credit
  // (`lateCredit`) instead of the full per-coin rate.
  function pressLateButton(activity, e) {
    const pressedAt = new Date()
    if (activity.lateDeadline && pressedAt >= deadlineDate(todayId, activity.lateDeadline, 0)) return
    const timeStr = pressedAt.toTimeString().slice(0, 8)
    completeActivity(activity.id, 'done', timeStr, e.currentTarget, activity.lateCredit)
  }

  function lockDay() {
    setState((prev) => {
      const kid = prev.kids[activeKid]
      const currentDay = withAllActivities(kid.days[todayId] || blankDay())
      if (currentDay.locked) return prev
      return {
        ...prev,
        kids: { ...prev.kids, [activeKid]: { ...kid, days: { ...kid.days, [todayId]: closeDay(currentDay) } } },
      }
    })
  }

  // Parent taps "Lock day & finish" -> passcode -> day-review screen, so a
  // kid can self-report a coin (e.g. On Control, Obeyed) but a parent still
  // has the final say before it's locked in for the day.
  function requestDayReview() {
    if (day.locked) return
    setPendingAction({
      title: 'Parent passcode required',
      message: `Review ${activeKidInfo.name}'s coins for today before locking.`,
      run: () => setReviewOpen(true),
    })
  }

  // Approving just marks the coin as checked — it was already credited the
  // moment the kid tapped the button, so nothing about the coin changes.
  function approveEntry(activityId) {
    setState((prev) => {
      const kid = prev.kids[activeKid]
      const currentDay = withAllActivities(kid.days[todayId] || blankDay())
      const entry = currentDay.activities[activityId]
      if (!entry || entry.status !== 'done') return prev
      const nextDay = {
        ...currentDay,
        activities: { ...currentDay.activities, [activityId]: { ...entry, reviewed: 'approved' } },
      }
      return { ...prev, kids: { ...prev.kids, [activeKid]: { ...kid, days: { ...kid.days, [todayId]: nextDay } } } }
    })
  }

  // Rejecting takes back a coin the kid claimed but the parent doesn't
  // believe — the entry is marked rejected, the earlier credit is undone,
  // AND a further ₹5 penalty is added to the kid's carried-forward debt
  // (not just this week's bucket), so it keeps reducing payouts on
  // remaining days and weeks until it's fully paid off.
  const REJECT_PENALTY = 5

  function rejectEntry(activityId) {
    setState((prev) => {
      const kid = ensureDebtField(prev.kids[activeKid])
      const currentDay = withAllActivities(kid.days[todayId] || blankDay())
      const entry = currentDay.activities[activityId]
      if (!entry || entry.status !== 'done') return prev
      const earnedCredit = entry.credit || 0

      const nextDay = {
        ...currentDay,
        activities: {
          ...currentDay.activities,
          [activityId]: { ...entry, status: 'rejected', reviewed: 'rejected', penalty: (entry.penalty || 0) + REJECT_PENALTY },
        },
      }
      const currentWeek = kid.weeks[weekId] || blankWeek()
      const nextWeek = {
        cash: Math.max(0, currentWeek.cash - earnedCredit),
        activities: {
          ...currentWeek.activities,
          [activityId]: Math.max(0, (currentWeek.activities[activityId] || 0) - 1),
        },
        activityCash: {
          ...currentWeek.activityCash,
          [activityId]: Math.max(0, (currentWeek.activityCash?.[activityId] || 0) - earnedCredit),
        },
      }
      return {
        ...prev,
        kids: {
          ...prev.kids,
          [activeKid]: {
            ...kid,
            days: { ...kid.days, [todayId]: nextDay },
            weeks: { ...kid.weeks, [weekId]: nextWeek },
            debt: kid.debt + REJECT_PENALTY,
          },
        },
      }
    })
  }

  function finishReview() {
    setReviewOpen(false)
    lockDay()
  }

  // Pays out this week's bucket minus any carried-forward debt (from
  // rejection penalties). If the debt is bigger than the bucket, the
  // bucket just covers what it can and the remainder of the debt keeps
  // carrying forward into future weeks.
  function resetWeek() {
    const debtNow = kidData?.debt || 0
    const payout = Math.max(0, week.cash - debtNow)
    const confirmMsg =
      debtNow > 0
        ? `Empty all buckets for ${activeKidInfo.name}? ₹${Math.min(week.cash, debtNow).toFixed(2)} of this week's ₹${week.cash.toFixed(2)} goes toward carried-forward penalties, paying out ₹${payout.toFixed(2)}.`
        : `Empty all buckets for ${activeKidInfo.name} after paying out this week's ₹${week.cash.toFixed(2)}?`
    if (!window.confirm(confirmMsg)) return
    setState((prev) => {
      const kid = ensureDebtField(prev.kids[activeKid])
      const remainingDebt = Math.max(0, debtNow - week.cash)
      return {
        ...prev,
        kids: {
          ...prev.kids,
          [activeKid]: { ...kid, weeks: { ...kid.weeks, [weekId]: blankWeek() }, debt: remainingDebt },
        },
      }
    })
  }

  // Admin/testing provision: works even after the day is locked. Reverts
  // any coins already credited today, reverses any rejection penalty
  // added today, and resets today back to a blank, unlocked day so
  // buttons can be tested again.
  function adminResetToday() {
    setState((prev) => {
      const kid = ensureDebtField(prev.kids[activeKid])
      const currentDay = withAllActivities(kid.days[todayId] || blankDay())
      const currentWeek = kid.weeks[weekId] || blankWeek()
      const nextWeek = {
        cash: currentWeek.cash,
        activities: { ...currentWeek.activities },
        activityCash: { ...currentWeek.activityCash },
      }
      let debtToRevert = 0
      ACTIVITIES.forEach((a) => {
        const entry = currentDay.activities[a.id]
        if (entry?.status === 'done') {
          const earnedCredit = entry.credit || 0
          nextWeek.activities[a.id] = Math.max(0, (nextWeek.activities[a.id] || 0) - 1)
          nextWeek.cash = Math.max(0, nextWeek.cash - earnedCredit)
          nextWeek.activityCash[a.id] = Math.max(0, (nextWeek.activityCash[a.id] || 0) - earnedCredit)
        }
        if (entry?.penalty) debtToRevert += entry.penalty
      })
      return {
        ...prev,
        kids: {
          ...prev.kids,
          [activeKid]: {
            ...kid,
            days: { ...kid.days, [todayId]: blankDay() },
            weeks: { ...kid.weeks, [weekId]: nextWeek },
            debt: Math.max(0, kid.debt - debtToRevert),
          },
        },
      }
    })
  }

  function requestAdminReset() {
    setPendingAction({
      title: 'Admin passcode required',
      message: `Reset today's activities for ${activeKidInfo.name} for testing (even though today may be locked)?`,
      run: adminResetToday,
    })
  }

  function setRewardRate(value) {
    setState((prev) => ({ ...prev, rewardRate: value }))
  }

  // Kids share this device, so the ₹-per-coin rate stays hidden behind the
  // parent passcode instead of sitting in plain view in the header.
  function requestRateUnlock() {
    if (rateUnlocked) {
      setRateUnlocked(false)
      return
    }
    setPendingAction({
      title: 'Parent passcode required',
      message: '₹ per coin is a parent-only setting.',
      run: () => setRateUnlocked(true),
    })
  }

  function confirmPasscode(code) {
    if (code !== ADMIN_PASSCODE) return false
    pendingAction?.run()
    setPendingAction(null)
    return true
  }

  const activeKidInfo = KIDS.find((k) => k.id === activeKid)
  const debt = kidData?.debt || 0
  const todayCash = useMemo(
    () => ACTIVITIES.reduce((n, a) => n + (day.activities[a.id]?.status === 'done' ? day.activities[a.id].credit || 0 : 0), 0),
    [day],
  )
  const maxDaily = ACTIVITIES.reduce((n, a) => n + (a.fixedCredit ?? rate), 0)

  return (
    <div className="app">
      <header className="hero-banner">
        <span className="hero-motif hero-motif-crescent" aria-hidden="true">☾</span>
        <span className="hero-motif hero-motif-quran" aria-hidden="true">📖</span>
        <span className="hero-motif hero-motif-books" aria-hidden="true">📚</span>
        <span className="hero-motif hero-motif-football" aria-hidden="true">⚽</span>
        <span className="hero-motif hero-motif-badminton" aria-hidden="true">🏸</span>
        <span className="hero-motif hero-motif-cricket" aria-hidden="true">🏏</span>
        <div className="hero-banner-text">
          <p className="hero-kicker">🕌 Deen &nbsp;·&nbsp; 📚 Studies &nbsp;·&nbsp; 🌳 Play</p>
          <h1>Barakah Routine</h1>
          <p className="subtitle">Daily habits, prayers &amp; discipline tracker</p>
        </div>
      </header>

      <div className="view-tabs">
        <button className={`view-tab ${view === 'today' ? 'active' : ''}`} onClick={() => setView('today')}>
          Today
        </button>
        <button className={`view-tab ${view === 'weeks' ? 'active' : ''}`} onClick={() => setView('weeks')}>
          Weeks
        </button>
      </div>

      <div className="kid-tabs-row">
        <nav className="kid-tabs">
          {KIDS.map((k) => (
            <button
              key={k.id}
              className={`kid-tab ${activeKid === k.id ? 'active' : ''}`}
              style={{ '--kid-color': k.color }}
              onClick={() => {
                setActiveKid(k.id)
                setRateUnlocked(false)
              }}
            >
              <span className="avatar">{k.initial}</span>
              <span>
                <strong>{k.name}</strong>
                <small>{k.grade}</small>
              </span>
            </button>
          ))}
        </nav>
        <AnalogClock time={now} />
      </div>

      {view === 'weeks' ? (
        <WeeksView days={kidData.days} rate={rate} viewMonth={viewMonth} onMonthChange={setViewMonth} />
      ) : (
        <>
          <section className="summary-bar">
            <div className="summary-card">
              <span className="summary-label">Today</span>
              <span className="summary-value">
                ₹ {todayCash.toFixed(2)} / {maxDaily.toFixed(0)}
              </span>
            </div>
            <div className="summary-card highlight">
              <span className="summary-label">This week's buckets</span>
              <span className="summary-value">₹ {week.cash.toFixed(2)}</span>
            </div>
            {debt > 0 && (
              <div className="summary-card debt-card">
                <span className="summary-label">Carried penalty (owed)</span>
                <span className="summary-value">− ₹ {debt.toFixed(2)}</span>
              </div>
            )}
            {rateUnlocked && (
              <div className="reward-setting">
                <label htmlFor="rate">₹ per coin</label>
                <input
                  id="rate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={rate}
                  onChange={(e) => setRewardRate(Number(e.target.value))}
                />
              </div>
            )}
            <button className="rate-toggle-btn" onClick={requestRateUnlock}>
              {rateUnlocked ? '🔒 Hide ₹/coin' : '⚙️ ₹/coin (parent)'}
            </button>
            <button className="pay-btn" onClick={resetWeek}>
              💰 Pay &amp; empty buckets
            </button>
          </section>

          {day.locked && (
            <div className="locked-banner">
              🔒 Today is locked. Great work — come back tomorrow for a fresh day.
            </div>
          )}

          <div className="bucket-grid">
            {ACTIVITIES.map((a) => (
              <Bucket
                key={a.id}
                activity={a}
                coins={week.activities[a.id] || 0}
                cash={week.activityCash?.[a.id] || 0}
                bucketRef={(el) => (bucketRefs.current[a.id] = el)}
              />
            ))}
          </div>

          <div className="quran-verse-banner">
            <div className="verse-arabic" dir="rtl" lang="ar">
              إِنَّ ٱللَّهَ عَلِيمٌۢ بِمَا كُنتُمْ تَعْمَلُونَ
            </div>
            <div className="verse-translation">
              &ldquo;Surely Allah fully knows what you used to do.&rdquo;
            </div>
            <div className="verse-reference">Al Qur'aan (Surah An-Nahl, Verse 28)</div>
          </div>

          <div className="activity-list">
            {ACTIVITIES.map((activity) => {
              const entry = day.activities[activity.id]
              // Every activity stands on its own — none is gated on another
              // activity being done first. Only its own time rule applies.
              const unlocked = !day.locked
              const timeReached = hasReachedTime(now, todayId, activity.visibleAfter)
              const pastDeadline =
                activity.control === 'timedPush'
                  ? now >= deadlineDate(todayId, activity.target, activity.graceMinutes || 0)
                  : false
              const pastLateDeadline =
                activity.control === 'timedPush' && activity.lateDeadline
                  ? now >= deadlineDate(todayId, activity.lateDeadline, 0)
                  : false
              return (
                <ActivityCard
                  key={activity.id}
                  activity={activity}
                  entry={entry}
                  unlocked={unlocked}
                  locked={day.locked}
                  timeReached={timeReached}
                  pastDeadline={pastDeadline}
                  pastLateDeadline={pastLateDeadline}
                  now={now}
                  onPressTimed={(e) => pressTimedButton(activity, e)}
                  onPressLate={(e) => pressLateButton(activity, e)}
                  onSimple={(e) => completeActivity(activity.id, 'done', '', e.currentTarget, activity.fixedCredit ?? rate)}
                />
              )
            })}
          </div>

          <div className="footer-actions">
            <button className="lock-btn" onClick={requestDayReview} disabled={day.locked}>
              <span className="lock-btn-icon">{day.locked ? '🔒' : '✅'}</span>
              {day.locked ? 'Day locked' : 'Lock day & finish'}
            </button>
            <p className="footer-note">
              Every coin is worth ₹{rate.toFixed(2)}. Locking the day marks any still-pending
              activity as missed (empty bucket).
            </p>
            <button className="admin-btn" onClick={requestAdminReset}>
              🔧 Admin: reset today for testing
            </button>
          </div>
        </>
      )}

      {flights.map((f) => (
        <FlyingCoin key={f.id} from={f.from} to={f.to} duration={FLIGHT_MS} />
      ))}

      {pendingAction && (
        <PasscodeModal
          title={pendingAction.title}
          message={pendingAction.message}
          onConfirm={confirmPasscode}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {reviewOpen && (
        <DayReviewModal
          kidName={activeKidInfo.name}
          day={day}
          rate={rate}
          onApprove={approveEntry}
          onReject={rejectEntry}
          onFinish={finishReview}
          onCancel={() => setReviewOpen(false)}
        />
      )}
    </div>
  )
}

function AnalogClock({ time }) {
  const seconds = time.getSeconds()
  const minutes = time.getMinutes() + seconds / 60
  const hours = (time.getHours() % 12) + minutes / 60
  const secDeg = seconds * 6
  const minDeg = minutes * 6
  const hourDeg = hours * 30
  const dateStr = time.toLocaleDateString(undefined, { weekday: 'short', day: '2-digit', month: 'short' })

  const point = (deg, r) => {
    const rad = ((deg - 90) * Math.PI) / 180
    return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) }
  }
  const hourEnd = point(hourDeg, 22)
  const minEnd = point(minDeg, 32)
  const secEnd = point(secDeg, 35)

  return (
    <div className="banner-clock" aria-label={`Current time ${time.toTimeString().slice(0, 5)}`}>
      <svg viewBox="0 0 100 100" className="analog-clock">
        <circle cx="50" cy="50" r="47" className="clock-rim" />
        <circle cx="50" cy="50" r="41" className="clock-face" />
        {Array.from({ length: 12 }).map((_, i) => {
          const major = i % 3 === 0
          const p1 = point(i * 30, major ? 33 : 36.5)
          const p2 = point(i * 30, 39.5)
          return (
            <line
              key={i}
              x1={p1.x}
              y1={p1.y}
              x2={p2.x}
              y2={p2.y}
              className={major ? 'clock-tick clock-tick-major' : 'clock-tick'}
            />
          )
        })}
        <line x1="50" y1="50" x2={hourEnd.x} y2={hourEnd.y} className="clock-hand clock-hand-hour" />
        <line x1="50" y1="50" x2={minEnd.x} y2={minEnd.y} className="clock-hand clock-hand-minute" />
        <line x1="50" y1="50" x2={secEnd.x} y2={secEnd.y} className="clock-hand clock-hand-second" />
        <circle cx="50" cy="50" r="3" className="clock-pivot" />
      </svg>
      <span className="banner-clock-date">{dateStr}</span>
    </div>
  )
}

function FlyingCoin({ from, to, duration }) {
  const [pos, setPos] = useState({ x: from.x, y: from.y, scale: 1, opacity: 1 })

  useEffect(() => {
    const raf = requestAnimationFrame(() => setPos({ x: to.x, y: to.y, scale: 0.6, opacity: 0.5 }))
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div
      className="flying-coin"
      style={{
        left: pos.x,
        top: pos.y,
        transform: `translate(-50%, -50%) scale(${pos.scale})`,
        opacity: pos.opacity,
        transitionDuration: `${duration}ms`,
      }}
    >
      🪙
    </div>
  )
}

function Bucket({ activity, coins, cash, bucketRef }) {
  const colors = CATEGORY_COLORS[activity.category]
  const fillPct = Math.min(coins / 7, 1) * 100
  return (
    <div className="bucket-card" style={{ '--bucket-color': colors.dot }}>
      <div className="bucket-shape" ref={bucketRef}>
        <span className="bucket-shine" aria-hidden="true" />
        <div className="bucket-fill" style={{ height: `${fillPct}%`, background: colors.dot }} />
        <span className="bucket-coins">🪙 {coins}</span>
      </div>
      <div className="bucket-label">{activity.label}</div>
      <div className="bucket-cash">₹{cash.toFixed(0)}</div>
    </div>
  )
}

function ActivityCard({ activity, entry, unlocked, locked, timeReached, pastDeadline, pastLateDeadline, now, onPressTimed, onPressLate, onSimple }) {
  const colors = CATEGORY_COLORS[activity.category]
  const timeGated = activity.control === 'simple' && entry.status === 'pending' && !timeReached
  const finalOutcome = entry.status === 'done' || entry.status === 'rejected'
  const state = locked
    ? finalOutcome
      ? entry.status
      : 'locked'
    : !unlocked
      ? 'waiting'
      : timeGated
        ? 'timegate'
        : entry.status
  const wide = activity.control === 'timedPush'

  return (
    <div
      className={`activity-card state-${state}${wide ? ' activity-card--wide' : ''}`}
      style={{ '--activity-color': colors.dot }}
    >
      <span className="activity-card-sheen" aria-hidden="true" />
      <div className="activity-top">
        <span className="activity-icon" style={{ background: activity.tint || colors.tint, color: colors.dot }}>
          {activity.icon || colors.icon}
        </span>
        <div className="activity-label">{activity.label}</div>
      </div>
      {activity.hint && (
        <div className="activity-hint" title={activity.hint}>
          {activity.hint}
        </div>
      )}

      <div className="activity-control">
        {activity.control === 'timedPush' && (
          <TimedPushControl
            activity={activity}
            entry={entry}
            unlocked={unlocked}
            pastDeadline={pastDeadline}
            pastLateDeadline={pastLateDeadline}
            now={now}
            onPress={onPressTimed}
            onPressLate={onPressLate}
          />
        )}
        {activity.control === 'simple' &&
          (timeGated ? (
            <span className="time-gate-note">🔒 Unlocks at {formatTimeLabel(activity.visibleAfter)}</span>
          ) : (
            <button className="btn btn-done" disabled={!unlocked || entry.status !== 'pending'} onClick={onSimple}>
              {activity.buttonLabel || 'Completed on Time?'}
            </button>
          ))}
      </div>

      <StatusBadge
        state={state}
        time={entry.time}
        reviewed={entry.reviewed}
        credit={entry.credit}
        unlockTime={activity.visibleAfter && formatTimeLabel(activity.visibleAfter)}
      />
    </div>
  )
}

function TimedPushControl({ activity, entry, unlocked, pastDeadline, pastLateDeadline, now, onPress, onPressLate }) {
  const deadlineLabel =
    activity.target + (activity.graceMinutes ? ` + ${activity.graceMinutes} min grace` : '')
  const pending = entry.status === 'pending'
  // Base lock: the activity is closed off (day locked, or already
  // completed) regardless of time. Within that, the deadline decides
  // which single button is open — "Push Now" before 6:00 AM, "Late
  // Comer" from 6:00 AM up to its own lateDeadline (e.g. 7:00 AM), after
  // which both buttons close for the day.
  const baseLocked = !unlocked || !pending
  const pushDisabled = baseLocked || pastDeadline
  const lateDisabled = baseLocked || !pastDeadline || pastLateDeadline

  return (
    <div className="timed-push">
      {pending && unlocked && <span className="live-clock">{now.toTimeString().slice(0, 8)}</span>}
      <div className="timed-push-buttons">
        <button className="btn btn-done" disabled={pushDisabled} onClick={onPress}>
          Push Now
        </button>
        {activity.lateLabel && (
          <button className="btn btn-late" disabled={lateDisabled} onClick={onPressLate}>
            {activity.lateLabel}
          </button>
        )}
      </div>
      <span className="deadline-note">
        Deadline: {deadlineLabel}
        {activity.lateLabel
          ? ` · "${activity.lateLabel}" credits ₹${activity.lateCredit}${
              activity.lateDeadline ? ` until ${formatTimeLabel(activity.lateDeadline)}` : ''
            }`
          : ''}
      </span>
    </div>
  )
}

function StatusBadge({ state, time, reviewed, credit, unlockTime }) {
  const creditNote = credit ? ` · ₹${credit}` : ''
  const doneLabel =
    reviewed === 'approved'
      ? `Coin approved${creditNote}${time ? ` · ${time.slice(0, 5)}` : ''}`
      : `Coin earned${creditNote}${time ? ` · ${time.slice(0, 5)}` : ''} · pending parent review`
  const map = {
    done: { label: doneLabel, className: reviewed === 'approved' ? 'badge-done' : 'badge-pending' },
    rejected: { label: 'Coin rejected by parent', className: 'badge-missed' },
    missed: { label: 'Missed', className: 'badge-missed' },
    waiting: { label: 'Locked', className: 'badge-waiting' },
    locked: { label: 'Day closed', className: 'badge-waiting' },
    pending: { label: 'Ready', className: 'badge-pending' },
    timegate: { label: `Not yet${unlockTime ? ` · from ${unlockTime}` : ''}`, className: 'badge-waiting' },
  }
  const info = map[state] || map.pending
  return <span className={`badge ${info.className}`}>{info.label}</span>
}

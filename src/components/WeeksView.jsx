import React, { useEffect, useState } from 'react'
import {
  ACTIVITIES,
  SHORT_LABELS,
  weeksInMonth,
  formatMonthLabel,
  addMonths,
  todayKey,
} from '../data/activities.js'

export default function WeeksView({ days, rate, viewMonth, onMonthChange }) {
  const weeks = weeksInMonth(viewMonth)
  const [selectedWeek, setSelectedWeek] = useState(weeks[0]?.weekNum || 1)
  const todayId = todayKey()

  useEffect(() => {
    setSelectedWeek(1)
  }, [viewMonth])

  const week = weeks.find((w) => w.weekNum === selectedWeek) || weeks[0]

  function dayTotal(dateId) {
    const d = days[dateId]
    if (!d) return 0
    return ACTIVITIES.reduce((sum, a) => {
      const entry = d.activities[a.id]
      if (entry?.status !== 'done') return sum
      return sum + (entry.credit ?? rate)
    }, 0)
  }

  const weekTotal = week ? week.dates.reduce((sum, dateId) => sum + dayTotal(dateId), 0) : 0

  return (
    <div className="weeks-view">
      <div className="month-nav">
        <button className="ghost-btn" onClick={() => onMonthChange(addMonths(viewMonth, -1))}>
          ◀
        </button>
        <span className="month-label">{formatMonthLabel(viewMonth)}</span>
        <button className="ghost-btn" onClick={() => onMonthChange(addMonths(viewMonth, 1))}>
          ▶
        </button>
      </div>

      <div className="week-tabs">
        {weeks.map((w) => (
          <button
            key={w.id}
            className={`week-tab ${w.weekNum === selectedWeek ? 'active' : ''}`}
            onClick={() => setSelectedWeek(w.weekNum)}
          >
            Week {w.weekNum}
            <small>
              {w.startDay}–{w.endDay}
            </small>
          </button>
        ))}
      </div>

      {week && (
        <div className="week-table-wrap">
          <table className="week-table">
            <thead>
              <tr>
                <th>Date</th>
                {ACTIVITIES.map((a) => (
                  <th key={a.id} title={a.label}>
                    {SHORT_LABELS[a.id]}
                  </th>
                ))}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {week.dates.map((dateId) => {
                const d = days[dateId]
                const isFuture = dateId > todayId
                return (
                  <tr key={dateId} className={dateId === todayId ? 'row-today' : ''}>
                    <td className="date-cell">
                      <div className="date-day">
                        {new Date(dateId).toLocaleDateString(undefined, { weekday: 'short' })}
                      </div>
                      <div className="date-num">{dateId.slice(8, 10)}</div>
                    </td>
                    {ACTIVITIES.map((a) => {
                      const status = d?.activities?.[a.id]?.status
                      let icon = '➖'
                      if (status === 'done') icon = '✅'
                      else if (status === 'missed') icon = '❌'
                      else if (status === 'rejected') icon = '🚫'
                      else if (isFuture) icon = '·'
                      return (
                        <td key={a.id} className="status-cell" title={`${a.label}: ${status || (isFuture ? 'not yet' : 'no data')}`}>
                          {icon}
                        </td>
                      )
                    })}
                    <td className="total-cell">₹{dayTotal(dateId).toFixed(0)}</td>
                  </tr>
                )
              })}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={ACTIVITIES.length + 1}>Week {selectedWeek} total</td>
                <td className="total-cell">₹{weekTotal.toFixed(0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}

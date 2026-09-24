import React from 'react'
import { ACTIVITIES } from '../data/activities.js'

// Shown after the parent passcode, right before a day locks. Every activity
// the kid marked "done" today is listed here so the parent can Approve it
// (nothing changes, the coin stays) or Reject it (the coin is taken back).
// This is the check against a kid over-claiming something like On Control
// or Obeyed, which nobody but the kid witnessed in the moment.
export default function DayReviewModal({ kidName, day, rate, onApprove, onReject, onFinish, onCancel }) {
  const claimed = ACTIVITIES.filter((a) => day.activities[a.id]?.status === 'done')
  const reviewedCount = claimed.filter((a) => day.activities[a.id]?.reviewed).length
  const allReviewed = claimed.length === 0 || reviewedCount === claimed.length

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="modal-card review-card">
        <h3>Review {kidName}'s coins</h3>
        <p className="modal-message">
          {claimed.length === 0
            ? 'No coins were claimed today — nothing to review.'
            : 'Approve or reject each coin claimed today. Rejected coins are removed from the bucket.'}
        </p>

        <div className="review-list">
          {claimed.map((a) => {
            const entry = day.activities[a.id]
            const reviewed = entry.reviewed
            return (
              <div key={a.id} className={`review-row ${reviewed ? `review-row-${reviewed}` : ''}`}>
                <div className="review-row-info">
                  <span className="review-row-label">{a.label}</span>
                  <span className="review-row-time">
                    {entry.time ? entry.time.slice(0, 5) : 'Marked done'} · ₹{(entry.credit ?? rate).toFixed(2)}
                  </span>
                </div>
                {reviewed ? (
                  <span className={`review-verdict verdict-${reviewed}`}>
                    {reviewed === 'approved' ? '✅ Approved' : '❌ Rejected'}
                  </span>
                ) : (
                  <div className="review-actions">
                    <button className="btn btn-done" onClick={() => onApprove(a.id)}>
                      Approve
                    </button>
                    <button className="btn btn-missed" onClick={() => onReject(a.id)}>
                      Reject
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <p className="review-hint">
          {claimed.length > 0 && !allReviewed
            ? 'Anything left unreviewed stays approved and keeps its coin.'
            : null}
        </p>

        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Review later
          </button>
          <button type="button" className="btn btn-done" onClick={onFinish}>
            Finish &amp; lock day
          </button>
        </div>
      </div>
    </div>
  )
}

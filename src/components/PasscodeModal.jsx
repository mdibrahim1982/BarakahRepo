import React, { useState } from 'react'

export default function PasscodeModal({ title, message, onConfirm, onCancel }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')

  function submit(e) {
    e.preventDefault()
    const ok = onConfirm(code)
    if (!ok) {
      setError('Incorrect passcode. Try again.')
      setCode('')
    }
  }

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <form className="modal-card" onSubmit={submit}>
        <h3>{title}</h3>
        {message && <p className="modal-message">{message}</p>}
        <input
          type="password"
          autoFocus
          placeholder="Enter passcode"
          value={code}
          onChange={(e) => {
            setCode(e.target.value)
            setError('')
          }}
        />
        {error && <p className="modal-error">{error}</p>}
        <div className="modal-actions">
          <button type="button" className="ghost-btn" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-done">
            Confirm
          </button>
        </div>
      </form>
    </div>
  )
}

import React, { useState } from 'react'

// A light, fun "who's there?" gate — not real security (the password is
// just the kid's own name), just a nice ritual before the app opens, and a
// simple way to remember whose buttons are getting tapped this session.
export default function LoginGate({ kids, onLogin }) {
  const [picked, setPicked] = useState(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [welcome, setWelcome] = useState(null)

  function submit(e) {
    e.preventDefault()
    if (!picked) return
    if (password.trim().toLowerCase() !== picked.name.trim().toLowerCase()) {
      setError("Hmm, that's not quite right. Try again!")
      setPassword('')
      return
    }
    setError('')
    setWelcome(picked)
    setTimeout(() => onLogin(picked.id), 1400)
  }

  if (welcome) {
    return (
      <div className="login-gate">
        <div className="login-card login-welcome">
          <span className="login-welcome-icon" aria-hidden="true">🌟</span>
          <h1>Welcome, {welcome.name}!</h1>
          <p>Let's make today a great one — Deen, studies, and play.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="login-gate">
      <div className="login-card">
        <span className="login-moon" aria-hidden="true">☾</span>
        <h1>Assalaamu Alaikum!</h1>
        <p className="login-question">Hey, Who're You?</p>

        <div className="login-kid-picker">
          {kids.map((k) => (
            <button
              key={k.id}
              type="button"
              className={`login-kid-btn ${picked?.id === k.id ? 'active' : ''}`}
              style={{ '--kid-color': k.color }}
              onClick={() => {
                setPicked(k)
                setError('')
                setPassword('')
              }}
            >
              <span className="avatar">{k.initial}</span>
              <strong>{k.name}</strong>
            </button>
          ))}
        </div>

        {picked && (
          <form className="login-form" onSubmit={submit}>
            <label htmlFor="login-password">Password (hint: it's your name!)</label>
            <input
              id="login-password"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={`Enter ${picked.name}'s password`}
            />
            {error && <p className="login-error">{error}</p>}
            <button type="submit" className="btn btn-done login-submit">
              Log In
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

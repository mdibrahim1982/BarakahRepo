import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './App.css'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }
  static getDerivedStateFromError(error) {
    return { error }
  }
  componentDidCatch(error, info) {
    console.error('Barakah Routine crashed:', error, info)
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            minHeight: '100vh',
            background: '#FBF7F0',
            color: '#2B2620',
            fontFamily: 'system-ui, sans-serif',
            padding: '24px',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ fontSize: '20px' }}>Something went wrong</h1>
          <p>The app hit an error and couldn't render. Details below:</p>
          <pre
            style={{
              whiteSpace: 'pre-wrap',
              background: '#fff',
              border: '1px solid #E7DFD1',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '12px',
              overflowX: 'auto',
            }}
          >
            {String(this.state.error?.stack || this.state.error)}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              marginTop: '12px',
              padding: '10px 18px',
              borderRadius: '10px',
              border: 'none',
              background: '#1F6F6B',
              color: '#fff',
              fontWeight: 600,
            }}
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
)

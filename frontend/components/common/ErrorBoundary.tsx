import React from 'react'

interface ErrorBoundaryProps {
  children: React.ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="container" style={{ padding: '2rem', textAlign: 'center' }}>
          <p style={{ marginBottom: '1rem' }}>
            Something went wrong. Please refresh the page.
          </p>
          <button type="button" onClick={() => window.location.reload()}>
            Refresh
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

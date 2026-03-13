import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** When provided, show this button instead of Refresh; on click calls this then resets the boundary. */
  onRecovery?: () => void
  recoveryLabel?: string
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Mix Bitch error:', error, errorInfo)
  }

  handleRecovery = () => {
    this.props.onRecovery?.()
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      const { onRecovery, recoveryLabel } = this.props
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-table">
          <h1 className="text-xl font-bold text-cedar-dark mb-2">Something went wrong</h1>
          <p className="text-text-secondary text-sm mb-4">
            {onRecovery ? 'You can start a new game or refresh the page.' : 'Please refresh the page to try again.'}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            {onRecovery && (
              <button
                type="button"
                onClick={this.handleRecovery}
                className="px-4 py-2 rounded-lg bg-cedar text-white font-medium"
              >
                {recoveryLabel ?? 'New game'}
              </button>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-felt border border-cedar/50 text-cedar-dark font-medium"
            >
              Refresh
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

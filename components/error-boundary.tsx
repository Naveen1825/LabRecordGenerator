"use client"

import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  }

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  private handleRetry = () => {
    window.location.reload()
  }

  public render() {
    if (this.state.hasError) {
      if (this.state.error?.name === 'ChunkLoadError') {
        return (
          <div className="flex h-screen flex-col items-center justify-center p-4 text-center">
            <h2 className="mb-4 text-2xl font-bold">Failed to Load Page</h2>
            <p className="mb-6 text-gray-600">
              The page could not be loaded. This might be due to a network issue or an outdated version of the app.
            </p>
            <button
              onClick={this.handleRetry}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        )
      }

      return this.props.fallback || (
        <div className="flex h-screen items-center justify-center p-4">
          <div className="text-center">
            <h2 className="mb-2 text-xl font-semibold">Something went wrong</h2>
            <p className="mb-4 text-gray-600">Please refresh the page or try again later.</p>
            <button
              onClick={this.handleRetry}
              className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

import { Component } from 'react'
import { withTranslation } from 'react-i18next'

/**
 * Catches a render error in a page so it does not take the whole app down.
 *
 * Without this, one thrown error unmounts everything and leaves a blank screen —
 * behind a bar that means the app is simply gone mid-shift, with no way back
 * except knowing to reload. The rail and nav stay mounted outside this boundary,
 * so the other sections remain reachable.
 *
 * Must be a class: there is no hook equivalent of componentDidCatch.
 */
class ErrorBoundaryBase extends Component {
  constructor(props) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, info) {
    console.error('Page crashed:', error, info?.componentStack)
  }

  componentDidUpdate(prevProps) {
    // Navigating away from a broken page should clear the error, otherwise the
    // boundary keeps showing it over whatever the user opens next.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
      this.setState({ error: null })
    }
  }

  render() {
    const { error } = this.state
    const { t, children } = this.props

    if (!error) return children

    return (
      <div className="page-error" role="alert">
        <h2>{t('pageErrorTitle')}</h2>
        <p>{t('pageErrorBody')}</p>
        <pre className="page-error-detail">{error.message}</pre>
        <div className="page-error-actions">
          <button
            type="button"
            className="btn-shell is-primary"
            onClick={() => this.setState({ error: null })}
          >
            {t('pageErrorRetry')}
          </button>
          <button
            type="button"
            className="btn-shell"
            onClick={() => window.location.reload()}
          >
            {t('pageErrorReload')}
          </button>
        </div>
      </div>
    )
  }
}

export const ErrorBoundary = withTranslation()(ErrorBoundaryBase)

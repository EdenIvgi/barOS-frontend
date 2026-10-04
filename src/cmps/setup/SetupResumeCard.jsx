import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { Link } from 'react-router-dom'
import { setupService } from '../../services/setup.service'

const TOTAL_STEPS = 4

/**
 * The offer to finish setting the bar up.
 *
 * Shows on the screens a half-finished bar actually lands on — the dashboard and
 * the book — so the way back is wherever they are, not only where they started.
 * It asks for its own state and renders nothing unless there is something to
 * offer, so a host screen just drops it in and passes nothing.
 */
export function SetupResumeCard() {
  const { t } = useTranslation()
  const user = useSelector(state => state.userModule.loggedInUser)
  const [state, setState] = useState(null)

  useEffect(() => {
    // Only an admin can run setup, and the endpoint is admin-only, so nobody
    // else asks for it.
    if (user?.role !== 'admin') return
    setupService.getState()
      .then(setState)
      .catch(() => { /* the card is an offer, not something worth an error for */ })
  }, [user])

  if (!setupService.isPending(state)) return null

  function dismiss() {
    setupService.finish()
      .then(() => setState(prev => ({ ...prev, status: 'done' })))
      .catch(() => { /* leaving the card up is better than a dead end */ })
  }

  return (
    <div className="dash-card setup-resume">
      <div className="setup-resume-text">
        <h3 className="dash-card-title">{t('setupResumeTitle')}</h3>
        <p className="setup-resume-sub">
          {t('setupResumeProgress', { done: setupService.doneCount(state), total: TOTAL_STEPS })}
        </p>
      </div>
      <div className="setup-resume-actions">
        <button type="button" className="btn-shell" onClick={dismiss}>
          {t('setupDismiss')}
        </button>
        <Link to="/setup" className="btn-shell is-primary">{t('setupContinue')}</Link>
      </div>
    </div>
  )
}

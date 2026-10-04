import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { userService } from '../../services/user.service.js'

/**
 * Step four: bring the staff in.
 *
 * The invite code already existed on both the server and the client, with no
 * screen anywhere that showed it to anyone — so until now the only way to join a
 * bar was for its admin to find a code they had never been shown. This is where
 * they get it.
 */
export function StepTeam() {
  const { t } = useTranslation()
  const [code, setCode] = useState(null)
  const [error, setError] = useState(null)
  const [hasFailed, setHasFailed] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    userService.getInviteCode()
      // userService unwraps the response, so this resolves to the code itself.
      .then(code => setCode(code || null))
      // Flag the failure rather than translating here, so `t` stays out of this
      // effect's deps and a language switch cannot refetch the code.
      .catch(err => {
        setError(err?.response?.data?.error || null)
        setHasFailed(true)
      })
  }, [])

  async function copy() {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be refused; the code is on screen to copy by hand.
      setCopied(false)
    }
  }

  return (
    <div className="setup-team">
      <p className="setup-step-help">{t('inviteCodeDesc')}</p>

      {hasFailed && <p className="bar-book-error">{error || t('inviteCodeError')}</p>}

      {!hasFailed && (
        <div className="setup-code">
          <code className="setup-code-value" dir="ltr">{code || '…'}</code>
          <button type="button" className="btn-shell" onClick={copy} disabled={!code}>
            {copied ? t('inviteCodeCopied') : t('inviteCodeCopy')}
          </button>
        </div>
      )}
    </div>
  )
}

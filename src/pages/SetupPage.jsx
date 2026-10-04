import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { useNavigate, Navigate } from 'react-router-dom'
import { AppShell } from '../cmps/AppShell'
import { barBookService } from '../services/barBook.service.js'
import { setupService } from '../services/setup.service.js'
import { SETUP_TEMPLATES, templateToPage, defaultChosen } from '../cmps/setup/setupTemplates.js'
import { StepBook } from '../cmps/setup/StepBook.jsx'
import { StepSuppliers } from '../cmps/setup/StepSuppliers.jsx'
import { emptySupplierRows, rowsToContacts } from '../cmps/setup/supplierRows.js'
import { StepProducts } from '../cmps/setup/StepProducts.jsx'
import { StepTeam } from '../cmps/setup/StepTeam.jsx'

const STEPS = ['book', 'suppliers', 'products', 'team']

/**
 * Setting up a new bar.
 *
 * Signing up used to land on a dashboard of zeros with an empty book, which tells
 * a new bar nothing about what the app is for. A bar book is whatever that bar
 * decides to keep, so the app cannot guess it — this is the asking.
 *
 * Each step writes as it finishes rather than everything landing at the end, so
 * leaving halfway keeps whatever was already chosen.
 */
export function SetupPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useSelector(state => state.userModule.loggedInUser)
  const isAdmin = user?.role === 'admin'

  const [stepIndex, setStepIndex] = useState(0)
  const [chosen, setChosen] = useState(defaultChosen())
  const [supplierRows, setSupplierRows] = useState(emptySupplierRows())
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setupService.getState()
      .then(state => {
        // Someone who already finished should not be walked through it again.
        if (state?.status === 'done') {
          navigate('/home', { replace: true })
          return
        }
        // Coming back from the dashboard resumes where they stopped rather than
        // making them click past the steps they already did.
        const firstUndone = STEPS.findIndex(s => !state?.steps?.[s])
        if (firstUndone > 0) setStepIndex(firstUndone)
      })
      .catch(() => { /* a failed read is not a reason to block the flow */ })
  }, [navigate])

  if (!isAdmin) return <Navigate to="/home" replace />

  const step = STEPS[stepIndex]
  const isLast = stepIndex === STEPS.length - 1

  /** Adds pages to the book without disturbing any that are already there. */
  async function appendPages(newPages) {
    if (newPages.length === 0) return
    const current = await barBookService.getContent()
    await barBookService.saveContent({
      pages: [...(current?.pages || []), ...newPages],
      baseUpdatedAt: current?.updatedAt,
    })
  }

  async function commitStep() {
    if (step === 'book') {
      const pages = SETUP_TEMPLATES
        .filter(tpl => chosen.includes(tpl.id))
        .map(templateToPage)
      await appendPages(pages)
    }

    if (step === 'suppliers') {
      const contacts = rowsToContacts(supplierRows)
      if (contacts.length > 0) {
        // Prefer the contacts page the book step may have just created, so the
        // suppliers land in it rather than in a second page of the same kind.
        const current = await barBookService.getContent()
        const pages = current?.pages || []
        const existing = pages.find(p => p.type === 'contacts')
        const nextPages = existing
          ? pages.map(p => p === existing
            ? { ...p, contacts: [...(p.contacts || []), ...contacts] }
            : p)
          : [...pages, {
            _id: crypto.randomUUID(),
            type: 'contacts',
            customTitle: { he: 'ספקים', en: 'Suppliers' },
            contacts,
          }]
        await barBookService.saveContent({ pages: nextPages, baseUpdatedAt: current?.updatedAt })
      }
    }

    await setupService.markStep(step)
  }

  async function next() {
    setIsSaving(true)
    setError(null)
    try {
      await commitStep()
      if (isLast) {
        await setupService.finish()
        navigate('/bar-book', { replace: true })
      } else {
        setStepIndex(i => i + 1)
      }
    } catch (err) {
      // Stay on this step with the input intact rather than advancing past a
      // write that did not land.
      setError(err?.response?.data?.error || err?.message || t('setupSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  function skip() {
    if (isLast) {
      setupService.finish().finally(() => navigate('/home', { replace: true }))
      return
    }
    setStepIndex(i => i + 1)
  }

  function leave() {
    navigate('/home', { replace: true })
  }

  function toggleTemplate(id) {
    setChosen(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  return (
    <AppShell
      title={t('setupTitle')}
      subtitle={t('setupStepOf', { step: stepIndex + 1, total: STEPS.length })}
      actions={
        <button type="button" className="btn-shell" onClick={leave}>
          {t('setupLater')}
        </button>
      }
    >
      <section className="setup-page">
        <ol className="setup-progress">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={'setup-pip' + (i === stepIndex ? ' is-current' : '') + (i < stepIndex ? ' is-done' : '')}
            >
              <span className="setup-pip-dot" aria-hidden="true" />
              <span className="setup-pip-label">{t(`setupStep_${s}`)}</span>
            </li>
          ))}
        </ol>

        <div className="setup-body">
          <h2 className="setup-step-title">{t(`setupTitle_${step}`)}</h2>
          <p className="setup-step-help">{t(`setupHelp_${step}`)}</p>

          {step === 'book' && <StepBook chosen={chosen} onToggle={toggleTemplate} />}
          {step === 'suppliers' && <StepSuppliers rows={supplierRows} onChange={setSupplierRows} />}
          {step === 'products' && <StepProducts />}
          {step === 'team' && <StepTeam />}

          {error && <p className="bar-book-error">{error}</p>}
        </div>

        <div className="setup-actions">
          <button type="button" className="btn-shell" onClick={skip} disabled={isSaving}>
            {t('setupSkip')}
          </button>
          <button type="button" className="btn-shell is-primary" onClick={next} disabled={isSaving}>
            {isSaving ? t('loading') : isLast ? t('setupFinish') : t('setupNext')}
          </button>
        </div>
      </section>
    </AppShell>
  )
}

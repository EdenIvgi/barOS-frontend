import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'

/**
 * Step three: stock.
 *
 * The real work already exists — Stock has an Excel import that matches rows
 * against existing products and can create the ones it cannot match. Rebuilding a
 * cut-down version of it inside a wizard would be a worse copy of a working tool,
 * so this step points at it and gets out of the way.
 */
export function StepProducts() {
  const { t } = useTranslation()

  return (
    <div className="setup-products">
      <p className="setup-step-help">{t('setupProductsHelp')}</p>
      <Link to="/items-management" className="btn-shell is-primary setup-products-link">
        {t('setupProductsOpen')}
      </Link>
      <p className="setup-step-note">{t('setupProductsNote')}</p>
    </div>
  )
}

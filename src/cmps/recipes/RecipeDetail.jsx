import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { getLangText } from '../../services/translate.service'
import { recipeService } from '../../services/recipe.service'

/**
 * One recipe, with the bar's own shelf marked against it: every line says
 * whether that bottle is in stock, so a missing measure is visible where it
 * matters rather than only as a count on the card.
 */
export function RecipeDetail({ recipe, ingredientsBySlug, lang, onCopyToMine, onClose }) {
  const { t } = useTranslation()

  useEffect(() => {
    function onKey(ev) { if (ev.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const steps = recipe.instructions?.[lang]?.length
    ? recipe.instructions[lang]
    : recipe.instructions?.he || recipe.instructions?.en || []

  const missing = new Set(recipe.missing || [])
  const missingOptional = new Set(recipe.missingOptional || [])

  return createPortal(
    <div className="recipe-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="recipe-modal" role="dialog" aria-label={getLangText(recipe.title, lang)}>
        <header className="recipe-modal-head">
          <h2>{getLangText(recipe.title, lang)}</h2>
          <button type="button" className="btn-icon" aria-label={t('close')} onClick={onClose}>×</button>
        </header>

        {recipe.imageUrl && <img className="recipe-detail-image" src={recipe.imageUrl} alt="" />}

        <p className="recipe-modal-meta">
          {[
            recipe.method && t(`method_${recipe.method}`, recipe.method),
            recipe.glass && t(`glass_${recipe.glass}`, recipe.glass),
            recipe.produces && t('recipeProduces', {
              name: ingredientsBySlug[recipe.produces]?.[lang] || recipe.produces,
            }),
          ].filter(Boolean).join(' · ')}
        </p>

        <h3>{t('ingredients')}</h3>
        <ul className="recipe-lines">
          {(recipe.ingredients || []).map((line, i) => {
            const ing = ingredientsBySlug[line.ingredientId]
            // Nothing is claimed about a line the catalogue cannot place: it is
            // neither in stock nor missing, because the bar never said.
            const isUnmapped = !line.ingredientId
            const isMissing = missing.has(line.ingredientId) || missingOptional.has(line.ingredientId)
            return (
              <li key={i} className={isUnmapped ? 'is-unknown' : isMissing ? 'is-missing' : 'is-present'}>
                <span className="recipe-line-amount">{recipeService.formatAmount(line, t)}</span>
                {/* An unmapped line still has the words someone wrote. */}
                <span className="recipe-line-name">{ing?.[lang] || line.rawText || line.ingredientId}</span>
                {line.isOptional && <span className="recipe-line-note">{t('recipeOptional')}</span>}
                {line.isGarnish && <span className="recipe-line-note">{t('recipeGarnish')}</span>}
                {/* Said in words, not only by colour: the list is read by someone
                    deciding what to pour, sometimes in a dark bar. */}
                <span className="recipe-line-stock">
                  {isUnmapped ? t('recipeUnknownStock') : isMissing ? t('recipeOutOfStock') : t('recipeInStock')}
                </span>
              </li>
            )
          })}
        </ul>

        {steps.length > 0 && (
          <>
            <h3>{t('instructions')}</h3>
            <ol className="recipe-steps">
              {steps.map((step, i) => <li key={i}>{step}</li>)}
            </ol>
          </>
        )}

        <footer className="recipe-modal-foot">
          {/* A recipe the bar already owns is edited, so only the shared library's has anything to copy. */}
          {recipe.source === 'library' && (
            <button type="button" className="btn-shell is-primary" onClick={() => onCopyToMine(recipe)}>
              {t('recipeCopyToMine')}
            </button>
          )}
          <button type="button" className="btn-shell" onClick={onClose}>{t('close')}</button>
        </footer>
      </div>
    </div>,
    document.body
  )
}

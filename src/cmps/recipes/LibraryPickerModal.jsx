import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { recipeService } from '../../services/recipe.service'
import { getLangText } from '../../services/translate.service'

/**
 * Picking a recipe out of the library, from inside the Bar Book.
 *
 * The same copy is reachable from the recipe library itself, but that is the
 * wrong moment for it: someone building the book's recipe page is already here,
 * and sending them to another screen to come back is the kind of errand that
 * ends with the page staying empty.
 */
export function LibraryPickerModal({ existingSlugs, lang, onPick, onClose }) {
  const { t } = useTranslation()
  const [recipes, setRecipes] = useState([])
  const [ingredients, setIngredients] = useState([])
  const [query, setQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    Promise.all([recipeService.query({ limit: 200 }), recipeService.getIngredients()])
      .then(([res, ings]) => {
        setRecipes(res.recipes || [])
        setIngredients(ings)
      })
      .catch(() => setHasError(true))
      .finally(() => setIsLoading(false))
  }, [])

  const ingredientsBySlug = useMemo(
    () => Object.fromEntries(ingredients.map(ing => [ing.slug, ing])),
    [ingredients]
  )

  const shown = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return recipes
    return recipes.filter(r =>
      `${r.title?.he || ''} ${r.title?.en || ''}`.toLowerCase().includes(needle)
    )
  }, [recipes, query])

  return createPortal(
    <div className="recipe-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="recipe-modal" role="dialog" aria-label={t('recipeFromLibrary')}>
        <header className="recipe-modal-head">
          <h2>{t('recipeFromLibrary')}</h2>
          <button type="button" className="btn-icon" aria-label={t('close')} onClick={onClose}>×</button>
        </header>

        <input
          type="search"
          className="recipes-search"
          placeholder={t('recipesSearchPlaceholder')}
          value={query}
          onChange={ev => setQuery(ev.target.value)}
        />

        {isLoading && <p className="recipe-import-hint">{t('loadingRecipes')}</p>}
        {hasError && <p className="product-scanner-error">{t('recipesLoadError')}</p>}

        {!isLoading && !hasError && (
          <ul className="library-pick-list">
            {shown.map(recipe => {
              const already = recipe.slug && existingSlugs.includes(recipe.slug)
              return (
                <li key={recipe._id || recipe.slug}>
                  <button
                    type="button"
                    className="library-pick"
                    disabled={already}
                    onClick={() => onPick(recipeService.toBookRecipe(recipe, ingredientsBySlug))}
                  >
                    <span className="library-pick-name">{getLangText(recipe.title, lang)}</span>
                    <span className="library-pick-meta">
                      {already
                        ? t('recipeAlreadyInBook')
                        : (recipe.ingredients || [])
                            .filter(line => !line.isGarnish)
                            .map(line => ingredientsBySlug[line.ingredientId]?.[lang] || line.ingredientId)
                            .join(' · ')}
                    </span>
                  </button>
                </li>
              )
            })}
            {!shown.length && <li className="recipe-import-hint">{t('recipesNone')}</li>}
          </ul>
        )}

        <footer className="recipe-modal-foot">
          <button type="button" className="btn-shell" onClick={onClose}>{t('close')}</button>
        </footer>
      </div>
    </div>,
    document.body
  )
}

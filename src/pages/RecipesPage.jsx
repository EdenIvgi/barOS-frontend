import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppShell } from '../cmps/AppShell'
import { Loader } from '../cmps/Loader'
import { RecipeList } from '../cmps/recipes/RecipeList'
import { RecipeDetail } from '../cmps/recipes/RecipeDetail'
import { RecipeImportModal } from '../cmps/recipes/RecipeImportModal'
import { recipeService } from '../services/recipe.service'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

const AVAILABILITY = ['all', 'canMake', 'missingOne']
const KINDS = ['all', 'cocktail', 'syrup']
const SCOPES = ['all', 'bar', 'library']

/**
 * The recipe library.
 *
 * The question this page exists to answer is "what can I pour right now", so the
 * shelf is part of every row: each recipe says what the bar is short of for it,
 * and the list leads with the ones it is closest to being able to make.
 *
 * The shared library and the bar's own recipes are one list here. Which one a
 * recipe came from is a label on it, not a place to go looking.
 */
export function RecipesPage() {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'

  const [recipes, setRecipes] = useState([])
  const [total, setTotal] = useState(0)
  const [availableCount, setAvailableCount] = useState(0)
  const [ingredients, setIngredients] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [hasLoadError, setHasLoadError] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [reloadToken, setReloadToken] = useState(0)
  const [filterBy, setFilterBy] = useState({ q: '', availability: 'all', kind: 'all', scope: 'all' })

  const ingredientsBySlug = useMemo(
    () => Object.fromEntries(ingredients.map(ing => [ing.slug, ing])),
    [ingredients]
  )

  useEffect(() => {
    recipeService.getIngredients()
      .then(setIngredients)
      .catch(() => setHasLoadError(true))
  }, [])

  useEffect(() => {
    let isCurrent = true
    setIsLoading(true)

    // The server filters, because availability is computed from the bar's stock
    // and only the server knows it.
    const query = {
      q: filterBy.q || undefined,
      availability: filterBy.availability === 'all' ? undefined : filterBy.availability,
      kind: filterBy.kind === 'all' ? undefined : filterBy.kind,
      scope: filterBy.scope === 'all' ? undefined : filterBy.scope,
      limit: 200,
    }

    const timer = setTimeout(() => {
      recipeService.query(query)
        .then(res => {
          if (!isCurrent) return
          setHasLoadError(false)
          setRecipes(res.recipes || [])
          setTotal(res.total || 0)
          setAvailableCount(res.availableCount || 0)
        })
        .catch(() => isCurrent && setHasLoadError(true))
        .finally(() => isCurrent && setIsLoading(false))
    }, filterBy.q ? 300 : 0)

    return () => { isCurrent = false; clearTimeout(timer) }
    // Deliberately not depending on `t`: i18next hands back a new function on
    // every render, so a translator in this list turns one fetch into a loop
    // that only stops when the rate limiter starts refusing. Failures are held
    // as state and worded during render instead.
  }, [filterBy, reloadToken])

  // The library's copy is read-only and shared, so the bar gets its own to
  // adapt. Identity fields stay behind: sending the library's _id would update
  // rather than create. librarySlug is kept so the origin is still known.
  async function onCopyToMine(recipe) {
    const copy = { ...recipe, librarySlug: recipe.slug }
    for (const key of ['_id', 'slug', 'source', 'isLibrary']) delete copy[key]
    try {
      await recipeService.save(copy)
      setSelected(null)
      setReloadToken(n => n + 1)
      showSuccessMsg(t('recipeCopied'))
    } catch {
      setHasLoadError(true)
    }
  }

  // Adding an ingredient mid-import must be felt immediately: the pickers on
  // screen are the ones that need the new entry.
  const onCreateIngredient = useCallback(async draft => {
    const created = await recipeService.addIngredient(draft)
    setIngredients(prev => [...prev, created])
    return created
  }, [])

  function onImported(result) {
    setIsImporting(false)
    setReloadToken(n => n + 1)
    if (result?.added) showSuccessMsg(t('recipeImportAdded', { count: result.added }))
    if (result?.skipped?.length) showErrorMsg(t('recipeImportSkipped', { count: result.skipped.length }))
  }

  function setFilter(patch) {
    setFilterBy(prev => ({ ...prev, ...patch }))
  }

  return (
    <AppShell
      title={t('recipesTitle')}
      subtitle={t('recipesSubtitle', { count: total, ingredients: availableCount })}
      flush
      actions={
        <button type="button" className="btn-shell is-primary" onClick={() => setIsImporting(true)}>
          {t('recipeImportTitle')}
        </button>
      }
    >
      <div className="recipes-bar">
        <input
          type="search"
          className="recipes-search"
          placeholder={t('recipesSearchPlaceholder')}
          value={filterBy.q}
          onChange={ev => setFilter({ q: ev.target.value })}
        />

        <div className="recipes-chips" role="group" aria-label={t('recipesFilterAvailability')}>
          {AVAILABILITY.map(value => (
            <button
              key={value}
              type="button"
              className={'chip' + (filterBy.availability === value ? ' is-on' : '')}
              aria-pressed={filterBy.availability === value}
              onClick={() => setFilter({ availability: value })}
            >
              {t(`recipesFilter_${value}`)}
            </button>
          ))}
        </div>

        <div className="recipes-chips" role="group" aria-label={t('recipesFilterKind')}>
          {KINDS.map(value => (
            <button
              key={value}
              type="button"
              className={'chip' + (filterBy.kind === value ? ' is-on' : '')}
              aria-pressed={filterBy.kind === value}
              onClick={() => setFilter({ kind: value })}
            >
              {t(`recipesKind_${value}`)}
            </button>
          ))}
        </div>

        <div className="recipes-chips" role="group" aria-label={t('recipesFilterScope')}>
          {SCOPES.map(value => (
            <button
              key={value}
              type="button"
              className={'chip' + (filterBy.scope === value ? ' is-on' : '')}
              aria-pressed={filterBy.scope === value}
              onClick={() => setFilter({ scope: value })}
            >
              {t(`recipesScope_${value}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading && <Loader />}
      {!isLoading && hasLoadError && <p className="empty-detail">{t('recipesLoadError')}</p>}

      {!isLoading && !hasLoadError && (
        <RecipeList
          recipes={recipes}
          ingredientsBySlug={ingredientsBySlug}
          lang={lang}
          onSelect={setSelected}
        />
      )}

      {isImporting && (
        <RecipeImportModal
          ingredients={ingredients}
          lang={lang}
          onCreateIngredient={onCreateIngredient}
          onClose={() => setIsImporting(false)}
          onSaved={onImported}
        />
      )}

      {selected && (
        <RecipeDetail
          recipe={selected}
          ingredientsBySlug={ingredientsBySlug}
          lang={lang}
          onCopyToMine={onCopyToMine}
          onClose={() => setSelected(null)}
        />
      )}
    </AppShell>
  )
}

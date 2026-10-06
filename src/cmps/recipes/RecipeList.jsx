import { useTranslation } from 'react-i18next'
import { getLangText } from '../../services/translate.service'

/**
 * A card says three things: what it is, whether you can make it, and if not,
 * what you are missing. The third is the one that gets acted on - "you are one
 * bottle away" is a shopping list, "unavailable" is a dead end.
 */
export function RecipeList({ recipes, ingredientsBySlug, lang, onSelect }) {
  const { t } = useTranslation()

  if (!recipes.length) {
    return <p className="empty-detail">{t('recipesNone')}</p>
  }

  return (
    <ul className="recipe-grid">
      {recipes.map(recipe => (
        <li key={recipe._id || recipe.slug}>
          <button
            type="button"
            className={'recipe-card' + (recipe.canMake ? ' can-make' : '')}
            onClick={() => onSelect(recipe)}
          >
            <span className="recipe-card-head">
              <span className="recipe-card-title">{getLangText(recipe.title, lang)}</span>
              {recipe.produces && <span className="recipe-tag">{t('recipesKind_syrup')}</span>}
              {recipe.source === 'bar' && <span className="recipe-tag is-own">{t('recipeOwn')}</span>}
            </span>

            <span className="recipe-card-ingredients">
              {(recipe.ingredients || [])
                .filter(line => !line.isGarnish)
                .map(line => ingredientsBySlug[line.ingredientId]?.[lang] || line.ingredientId)
                .join(' · ')}
            </span>

            <span className="recipe-card-foot">
              {recipe.canMake ? (
                <span className="recipe-status is-ok">✓ {t('recipeCanMake')}</span>
              ) : (
                <span className={'recipe-status' + (recipe.missingCount === 1 ? ' is-close' : '')}>
                  {t('recipeMissing', { count: recipe.missingCount })}
                  {': '}
                  {recipe.missing
                    .map(slug => ingredientsBySlug[slug]?.[lang] || slug)
                    .join(', ')}
                </span>
              )}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

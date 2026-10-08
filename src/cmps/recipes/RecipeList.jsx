import { useTranslation } from 'react-i18next'
import { getLangText } from '../../services/translate.service'

/**
 * One titled area of recipes.
 *
 * A card says three things: what it is, whether you can make it, and if not,
 * what you are missing. The third is the one that gets acted on - "you are one
 * bottle away" is a shopping list, "unavailable" is a dead end.
 *
 * The area keeps its heading when it is empty rather than disappearing: a bar
 * that has written nothing yet still needs to see where its own recipes will go.
 */
export function RecipeList({ recipes, ingredientsBySlug, lang, onSelect, title, emptyText }) {
  const { t } = useTranslation()

  return (
    <section className="recipe-section">
      {title && (
        <h2 className="recipe-section-head">
          <span className="recipe-section-title">{title}</span>
          <span className="recipe-section-count">{recipes.length}</span>
        </h2>
      )}

      {!recipes.length
        ? <p className="empty-detail">{emptyText || t('recipesNone')}</p>
        : <RecipeGrid recipes={recipes} ingredientsBySlug={ingredientsBySlug} lang={lang} onSelect={onSelect} />}
    </section>
  )
}

function RecipeGrid({ recipes, ingredientsBySlug, lang, onSelect }) {
  const { t } = useTranslation()

  return (
    <ul className="recipe-grid">
      {recipes.map(recipe => (
        <li key={recipe._id || recipe.slug}>
          <button
            type="button"
            className={'recipe-card' + (recipe.canMake ? ' can-make' : '')}
            onClick={() => onSelect(recipe)}
          >
            {recipe.imageUrl && <img className="recipe-card-thumb" src={recipe.imageUrl} alt="" loading="lazy" />}
            <span className="recipe-card-head">
              <span className="recipe-card-title">{getLangText(recipe.title, lang)}</span>
              {recipe.produces && <span className="recipe-tag">{t('recipesKind_syrup')}</span>}
            </span>

            <span className="recipe-card-ingredients">
              {(recipe.ingredients || [])
                .filter(line => !line.isGarnish)
                .map(line => ingredientsBySlug[line.ingredientId]?.[lang] || line.rawText || line.ingredientId)
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

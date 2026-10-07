import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { IngredientPicker } from './IngredientPicker'
import { emptyLine } from './recipeDraft'
import { ImagePicker } from '../ImagePicker'

const UNITS = ['ml', 'cl', 'oz', 'g', 'dash', 'drop', 'tsp', 'tbsp', 'leaf', 'sprig', 'piece', 'slice', 'rim', 'pinch', 'wedge']
const METHODS = ['', 'stirred', 'shaken', 'built', 'blended', 'prep']

/**
 * Writing one recipe by hand.
 *
 * The same editor serves a recipe typed from scratch and one being corrected
 * after an import, because they are the same job: say what goes in it, how much,
 * and what to do. Measures are structured rather than free text - that is what
 * lets the shelf answer whether this can be poured tonight.
 */
export function RecipeEditor({ recipe, ingredients, lang, onChange, onCreateIngredient }) {
  const { t } = useTranslation()
  const [stepsText, setStepsText] = useState(() => (recipe.instructions?.[lang] || recipe.instructions?.he || []).join('\n'))

  function setField(patch) {
    onChange({ ...recipe, ...patch })
  }

  function setLine(index, patch) {
    setField({ ingredients: recipe.ingredients.map((line, i) => (i === index ? { ...line, ...patch } : line)) })
  }

  function commitSteps(text) {
    // One step to a line: the simplest thing a person can type that still comes
    // out as an ordered list.
    const steps = text.split('\n').map(s => s.trim()).filter(Boolean)
    const other = lang === 'he' ? 'en' : 'he'
    setField({ instructions: { ...recipe.instructions, [lang]: steps, [other]: recipe.instructions?.[other] || [] } })
  }

  return (
    <div className="recipe-editor">
      <div className="form-row">
        <div className="form-group">
          <label>{t('nameHe')}</label>
          <input
            type="text"
            className="edit-input"
            value={recipe.title?.he || ''}
            onChange={ev => setField({ title: { ...recipe.title, he: ev.target.value } })}
          />
        </div>
        <div className="form-group">
          <label>{t('nameEn')}</label>
          <input
            type="text"
            className="edit-input"
            value={recipe.title?.en || ''}
            onChange={ev => setField({ title: { ...recipe.title, en: ev.target.value } })}
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>{t('recipeMethod')}</label>
          <select className="edit-input" value={recipe.method || ''} onChange={ev => setField({ method: ev.target.value })}>
            {METHODS.map(m => (
              <option key={m} value={m}>{m ? t(`method_${m}`) : t('recipeMethodNone')}</option>
            ))}
          </select>
        </div>
        <div className="form-group">
          <label>{t('recipeGlass')}</label>
          <input
            type="text"
            className="edit-input"
            value={recipe.glass || ''}
            onChange={ev => setField({ glass: ev.target.value })}
          />
        </div>
        <div className="form-group">
          <label>{t('recipeProducesLabel')}</label>
          {/* A syrup makes an ingredient other recipes ask for; saying so here is
              what connects the two. */}
          <IngredientPicker
            value={recipe.produces || ''}
            ingredients={ingredients}
            lang={lang}
            onChange={slug => setField({ produces: slug || null })}
            onCreate={onCreateIngredient}
          />
        </div>
      </div>

      <div className="form-group">
        <label>{t('recipePhoto')}</label>
        {recipe.imageUrl && <img className="recipe-detail-image" src={recipe.imageUrl} alt="" />}
        <ImagePicker value={recipe.imageUrl || ''} onChange={url => setField({ imageUrl: url })} />
      </div>

      <label className="recipe-editor-label">{t('ingredients')}</label>
      <ul className="recipe-editor-lines">
        {(recipe.ingredients || []).map((line, index) => (
          <li key={index}>
            <input
              type="number"
              className="edit-input recipe-amount"
              min="0"
              step="any"
              value={line.amount ?? ''}
              placeholder={t('recipeAmount')}
              onChange={ev => setLine(index, { amount: ev.target.value === '' ? null : Number(ev.target.value) })}
            />
            <select className="edit-input recipe-unit" value={line.unit || 'ml'} onChange={ev => setLine(index, { unit: ev.target.value })}>
              {UNITS.map(u => <option key={u} value={u}>{t(`unit_${u}`)}</option>)}
            </select>

            <IngredientPicker
              value={line.ingredientId}
              rawText={line.rawText}
              ingredients={ingredients}
              lang={lang}
              onChange={slug => setLine(index, { ingredientId: slug })}
              onCreate={onCreateIngredient}
            />

            <label className="recipe-flag">
              <input type="checkbox" checked={!!line.isOptional} onChange={ev => setLine(index, { isOptional: ev.target.checked })} />
              {t('recipeOptionalShort')}
            </label>
            <label className="recipe-flag">
              <input type="checkbox" checked={!!line.isGarnish} onChange={ev => setLine(index, { isGarnish: ev.target.checked })} />
              {t('recipeGarnishShort')}
            </label>

            <button
              type="button"
              className="btn-icon"
              aria-label={t('delete')}
              onClick={() => setField({ ingredients: recipe.ingredients.filter((_, i) => i !== index) })}
            >×</button>
          </li>
        ))}
      </ul>

      <button
        type="button"
        className="btn-add-item"
        onClick={() => setField({ ingredients: [...(recipe.ingredients || []), emptyLine()] })}
      >
        + {t('recipeAddIngredient')}
      </button>

      <label className="recipe-editor-label" htmlFor="recipe-steps">{t('instructions')}</label>
      <textarea
        id="recipe-steps"
        className="edit-input recipe-steps-input"
        rows={5}
        value={stepsText}
        placeholder={t('recipeStepsPlaceholder')}
        onChange={ev => setStepsText(ev.target.value)}
        onBlur={ev => commitSteps(ev.target.value)}
      />
    </div>
  )
}

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import * as XLSX from 'xlsx'
import { RecipeEditor } from './RecipeEditor'
import { emptyRecipe } from './recipeDraft'
import { IngredientPicker } from './IngredientPicker'
import { recipeService } from '../../services/recipe.service'

const TABS = ['write', 'paste', 'excel']

/**
 * Getting recipes in, three ways.
 *
 * Typing is what stops a bar at twenty recipes, so the two bulk routes matter
 * more than the single form: pasting whatever was collected elsewhere, and a
 * spreadsheet someone already keeps. The spreadsheet route costs nothing - its
 * ingredients are matched against the catalogue locally - while pasted text is
 * read by a model.
 *
 * Both land in the same place: a review step. Nothing is saved until someone has
 * looked at it, because a measure read wrongly looks exactly like a recipe.
 */
export function RecipeImportModal({ ingredients, lang, onCreateIngredient, onClose, onSaved }) {
  const { t } = useTranslation()
  const [tab, setTab] = useState('write')
  const [text, setText] = useState('')
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState(null)
  const [candidates, setCandidates] = useState(null)
  const [single, setSingle] = useState(emptyRecipe)

  async function parsePasted() {
    setIsBusy(true)
    setError(null)
    try {
      const res = await recipeService.parseText(text)
      setCandidates(res.recipes || [])
    } catch (err) {
      setError(messageFor(err, t))
    } finally {
      setIsBusy(false)
    }
  }

  async function readSpreadsheet(ev) {
    const file = ev.target.files?.[0]
    ev.target.value = ''
    if (!file) return

    setIsBusy(true)
    setError(null)
    try {
      const rows = await rowsFromFile(file)
      const parsed = rowsToRecipes(rows, ingredients)
      if (!parsed.length) throw new Error(t('recipeImportNoRows'))
      setCandidates(parsed)
    } catch (err) {
      setError(err?.message || t('recipeImportFailed'))
    } finally {
      setIsBusy(false)
    }
  }

  async function saveCandidates() {
    setIsBusy(true)
    setError(null)
    try {
      const res = await recipeService.saveMany(candidates)
      onSaved(res)
    } catch (err) {
      setError(messageFor(err, t))
    } finally {
      setIsBusy(false)
    }
  }

  async function saveSingle() {
    setIsBusy(true)
    setError(null)
    try {
      await recipeService.save(single)
      onSaved({ added: 1, skipped: [] })
    } catch (err) {
      setError(messageFor(err, t))
    } finally {
      setIsBusy(false)
    }
  }

  const unmapped = (candidates || []).reduce(
    (sum, recipe) => sum + recipe.ingredients.filter(line => !line.ingredientId).length,
    0
  )

  return createPortal(
    <div className="recipe-overlay" onClick={ev => ev.target === ev.currentTarget && onClose()}>
      <div className="recipe-modal is-wide" role="dialog" aria-label={t('recipeImportTitle')}>
        <header className="recipe-modal-head">
          <h2>{candidates ? t('recipeReviewTitle') : t('recipeImportTitle')}</h2>
          <button type="button" className="btn-icon" aria-label={t('close')} onClick={onClose}>×</button>
        </header>

        {!candidates && (
          <>
            <div className="recipes-chips">
              {TABS.map(name => (
                <button
                  key={name}
                  type="button"
                  className={'chip' + (tab === name ? ' is-on' : '')}
                  aria-pressed={tab === name}
                  onClick={() => { setTab(name); setError(null) }}
                >
                  {t(`recipeImport_${name}`)}
                </button>
              ))}
            </div>

            {tab === 'write' && (
              <RecipeEditor
                recipe={single}
                ingredients={ingredients}
                lang={lang}
                onChange={setSingle}
                onCreateIngredient={onCreateIngredient}
              />
            )}

            {tab === 'paste' && (
              <>
                <p className="recipe-import-hint">{t('recipeImportPasteHint')}</p>
                <textarea
                  className="edit-input recipe-paste-input"
                  rows={10}
                  value={text}
                  placeholder={t('recipeImportPastePlaceholder')}
                  onChange={ev => setText(ev.target.value)}
                />
              </>
            )}

            {tab === 'excel' && (
              <>
                <p className="recipe-import-hint">{t('recipeImportExcelHint')}</p>
                <input type="file" accept=".xlsx,.xls,.csv" onChange={readSpreadsheet} />
              </>
            )}
          </>
        )}

        {candidates && (
          <>
            <p className="recipe-import-hint">
              {t('recipeReviewFound', { count: candidates.length })}
              {unmapped > 0 && ' · ' + t('recipeReviewUnmapped', { count: unmapped })}
            </p>

            <ul className="recipe-review-list">
              {candidates.map((recipe, index) => (
                <li key={index} className="recipe-review-item">
                  <input
                    type="text"
                    className="edit-input recipe-review-title"
                    value={recipe.title?.he || recipe.title?.en || ''}
                    onChange={ev => setCandidates(candidates.map((c, i) =>
                      i === index ? { ...c, title: { ...c.title, he: ev.target.value } } : c
                    ))}
                  />
                  <ul className="recipe-review-lines">
                    {recipe.ingredients.map((line, lineIndex) => (
                      <li key={lineIndex} className={line.ingredientId ? '' : 'is-unmapped'}>
                        <span className="recipe-review-raw">
                          {[line.amount, line.amount ? t(`unit_${line.unit}`) : '', line.rawText]
                            .filter(Boolean).join(' ')}
                        </span>
                        <IngredientPicker
                          value={line.ingredientId}
                          rawText={line.rawText}
                          ingredients={ingredients}
                          lang={lang}
                          onChange={slug => setCandidates(candidates.map((c, i) =>
                            i === index
                              ? { ...c, ingredients: c.ingredients.map((l, li) => li === lineIndex ? { ...l, ingredientId: slug } : l) }
                              : c
                          ))}
                          onCreate={onCreateIngredient}
                        />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="btn-shell recipe-review-drop"
                    onClick={() => setCandidates(candidates.filter((_, i) => i !== index))}
                  >
                    {t('recipeReviewDrop')}
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {error && <p className="product-scanner-error">{error}</p>}

        <footer className="recipe-modal-foot">
          {!candidates && tab === 'write' && (
            <button type="button" className="btn-shell is-primary" disabled={isBusy || !single.title?.he?.trim()} onClick={saveSingle}>
              {isBusy ? t('loading') : t('save')}
            </button>
          )}
          {!candidates && tab === 'paste' && (
            <button type="button" className="btn-shell is-primary" disabled={isBusy || !text.trim()} onClick={parsePasted}>
              {isBusy ? t('recipeImportReading') : t('recipeImportRead')}
            </button>
          )}
          {candidates && (
            <button type="button" className="btn-shell is-primary" disabled={isBusy || !candidates.length} onClick={saveCandidates}>
              {isBusy ? t('loading') : t('recipeReviewSave', { count: candidates.length })}
            </button>
          )}
          <button type="button" className="btn-shell" onClick={onClose}>{t('cancel')}</button>
        </footer>
      </div>
    </div>,
    document.body
  )
}

function messageFor(err, t) {
  const status = err?.response?.status
  if (err?.response?.data?.code === 'no_recipes' || status === 422) return t('recipeImportNoRecipes')
  if (status === 503) return t('recipeImportNotConfigured')
  if (status === 429) return t('scanTooMany')
  if (status === 413) return t('recipeImportTooLong')
  return err?.response?.data?.error || err?.message || t('recipeImportFailed')
}

async function rowsFromFile(file) {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  return XLSX.utils.sheet_to_json(sheet, { defval: '' })
}

/** The first column whose header looks like one of `names`. */
function pick(row, names) {
  const keys = Object.keys(row || {})
  for (const name of names) {
    const key = keys.find(k => k.trim().toLowerCase().includes(name))
    if (key && String(row[key]).trim()) return String(row[key]).trim()
  }
  return ''
}

const UNIT_TOKENS = {
  ml: 'ml', cl: 'cl', oz: 'oz', g: 'g', dash: 'dash', tsp: 'tsp', tbsp: 'tbsp',
  'מ"ל': 'ml', 'מ״ל': 'ml', 'גרם': 'g',
}

/**
 * A spreadsheet row per recipe: a name, ingredients one to a line, steps one to
 * a line. Ingredients are matched against the catalogue here rather than by a
 * model, so a spreadsheet import costs nothing and still arrives mapped.
 */
function rowsToRecipes(rows, ingredients) {
  const byText = new Map()
  for (const ing of ingredients) {
    for (const alias of [ing.slug, ing.he, ing.en, ...(ing.aliases || [])]) {
      const key = String(alias || '').toLowerCase().trim()
      if (key && !byText.has(key)) byText.set(key, ing.slug)
    }
  }

  return rows.map(row => {
    const title = pick(row, ['שם', 'name', 'cocktail', 'recipe', 'מתכון'])
    if (!title) return null

    const rawIngredients = pick(row, ['מצרכים', 'ingredients', 'רכיבים'])
    const rawSteps = pick(row, ['הוראות', 'instructions', 'method', 'steps', 'הכנה'])

    const lines = rawIngredients.split(/[\n;]/).map(s => s.trim()).filter(Boolean).map(line => {
      // Mirrors parseFreeText in the backend's ingredientCatalog.service.js; the
      // two live in separate repos, so change both together.
      // "60 ml gin" and "gin 60" both appear in the wild; take the first number
      // as the amount and whatever is left as the ingredient's name. Units are
      // matched by whole token because a word-boundary regex does not work on Hebrew.
      const amountMatch = line.match(/\d+(?:[.,]\d+)?/)
      const amount = amountMatch ? Number(amountMatch[0].replace(',', '.')) : null
      const rest = amountMatch ? line.replace(amountMatch[0], ' ') : line
      let unit = ''
      const nameTokens = []
      for (const token of rest.split(/\s+/).filter(Boolean)) {
        const found = UNIT_TOKENS[token.toLowerCase()]
        if (found) unit ||= found
        else nameTokens.push(token)
      }
      const rawText = nameTokens.join(' ')

      return {
        ingredientId: byText.get(rawText.toLowerCase()) || '',
        rawText: rawText || line,
        amount,
        unit: unit || 'ml',
        isOptional: false,
        isGarnish: false,
      }
    })

    const steps = rawSteps.split(/[\n;]/).map(s => s.trim()).filter(Boolean)

    return {
      title: { he: title, en: title },
      method: '',
      glass: '',
      produces: null,
      ingredients: lines,
      instructions: { he: steps, en: steps },
    }
  }).filter(Boolean)
}

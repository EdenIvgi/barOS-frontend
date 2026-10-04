import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Formik, Form, Field, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { translateField, translateArray, getLangText } from '../../services/translate.service.js'

function linesToArray(text) {
  if (!text || typeof text !== 'string') return []
  return text.split(/\r?\n/).map(s => s.trim()).filter(Boolean)
}
function arrayToLines(arr) {
  return Array.isArray(arr) ? arr.join('\n') : ''
}
function getRecipeSchema(t) {
  return Yup.object().shape({
    title: Yup.string().trim().required(t('recipeTitleRequired')),
    ingredientsText: Yup.string().trim().required(t('minOneIngredient'))
      .test('minLines', t('minOneIngredient'), v => linesToArray(v || '').length > 0),
    instructionsText: Yup.string().trim().required(t('minOneStep'))
      .test('minLines', t('minOneStep'), v => linesToArray(v || '').length > 0),
  })
}

export function RecipesView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [selectedId, setSelectedId] = useState(null)
  const [formRecipe, setFormRecipe] = useState(null)
  const [isFormOpen, setIsFormOpen] = useState(false)

  const recipes = page.items || []
  const selectedRecipe = recipes.find(r => String(r._id) === String(selectedId)) || null

  function openAdd() { setFormRecipe(null); setIsFormOpen(true) }
  function openEdit(r) { setFormRecipe(r); setIsFormOpen(true) }
  function closeForm() { setFormRecipe(null); setIsFormOpen(false) }

  async function handleSubmit(values) {
    const [title, ingredients, instructions] = await Promise.all([
      translateField(values.title.trim(), lang),
      translateArray(linesToArray(values.ingredientsText), lang),
      translateArray(linesToArray(values.instructionsText), lang),
    ])
    const payload = { title, ingredients, instructions }
    if (formRecipe) {
      onPageChange({ ...page, items: recipes.map(r => String(r._id) === String(formRecipe._id) ? { ...r, ...payload } : r) })
    } else {
      const newR = { _id: Date.now().toString(), ...payload }
      onPageChange({ ...page, items: [newR, ...recipes] })
      setSelectedId(newR._id)
    }
    closeForm()
  }

  function handleDelete(r) {
    if (!window.confirm(`${t('confirmDeleteRecipe')} "${getLangText(r.title, lang)}"?`)) return
    onPageChange({ ...page, items: recipes.filter(x => String(x._id) !== String(r._id)) })
    if (String(selectedId) === String(r._id)) setSelectedId(null)
  }

  const initialValues = formRecipe
    ? {
        title: getLangText(formRecipe.title, lang),
        ingredientsText: arrayToLines((formRecipe.ingredients || []).map(i => getLangText(i, lang))),
        instructionsText: arrayToLines((formRecipe.instructions || []).map(i => getLangText(i, lang))),
      }
    : { title: '', ingredientsText: '', instructionsText: '' }

  return (
    <div className="bar-book-recipes">
      <div className="recipes-layout">
        <div className="recipes-list-panel">
          {isAdmin && (
            <div className="recipes-panel-header">
              <button type="button" className="btn-add-recipe" onClick={openAdd}>+ {t('addRecipe')}</button>
            </div>
          )}
          <div className="recipes-index">
            {recipes.length === 0
              ? <p className="recipes-empty">{t('noRecipes')}</p>
              : recipes.map(r => (
                <button key={r._id} type="button"
                  className={`recipe-index-item ${selectedId === r._id ? 'active' : ''}`}
                  onClick={() => setSelectedId(r._id)}>
                  <span className="recipe-index-title">{getLangText(r.title, lang)}</span>
                  <span className="recipe-index-meta">{r.ingredients?.length} {t('ingredients')}</span>
                </button>
              ))
            }
          </div>
        </div>
        <div className="recipes-detail-panel">
          {selectedRecipe ? (
            <article className="recipe-detail">
              <div className="recipe-detail-header">
                <h2 className="recipe-detail-title">{getLangText(selectedRecipe.title, lang)}</h2>
                {isAdmin && (
                  <div className="recipe-detail-actions">
                    <button type="button" className="btn-edit-recipe" onClick={() => openEdit(selectedRecipe)}>{t('edit')}</button>
                    <button type="button" className="btn-delete-recipe" onClick={() => handleDelete(selectedRecipe)}>{t('delete')}</button>
                  </div>
                )}
              </div>
              <div className="recipe-detail-body">
                <div className="recipe-detail-section">
                  <h3>{t('ingredients')}</h3>
                  <ul>{(selectedRecipe.ingredients || []).map((it, i) => <li key={i}>{getLangText(it, lang)}</li>)}</ul>
                </div>
                <div className="recipe-detail-section">
                  <h3>{t('instructions')}</h3>
                  <ol>{(selectedRecipe.instructions || []).map((st, i) => <li key={i}>{getLangText(st, lang)}</li>)}</ol>
                </div>
              </div>
            </article>
          ) : (
            <div className="recipe-detail-placeholder"><p>{t('selectRecipePrompt')}</p></div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <div className="recipe-form-overlay" onClick={e => e.target === e.currentTarget && closeForm()}>
          <div className="recipe-form-container" onClick={e => e.stopPropagation()}>
            <h2>{formRecipe ? t('editingRecipe') : t('addingRecipe')}</h2>
            <Formik initialValues={initialValues} validationSchema={getRecipeSchema(t)} onSubmit={handleSubmit} enableReinitialize>
              <Form className="recipe-form">
                <div className="form-group">
                  <label>{t('recipeNameLabel')}</label>
                  <Field name="title" type="text" className="form-input" placeholder={t('recipeNamePlaceholder')} />
                  <ErrorMessage name="title" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label>{t('ingredientsLabel')}</label>
                  <Field name="ingredientsText" as="textarea" className="form-textarea" rows={6} placeholder={t('ingredientsPlaceholder')} />
                  <ErrorMessage name="ingredientsText" component="div" className="form-error" />
                </div>
                <div className="form-group">
                  <label>{t('instructionsLabel')}</label>
                  <Field name="instructionsText" as="textarea" className="form-textarea" rows={8} placeholder={t('instructionsPlaceholder')} />
                  <ErrorMessage name="instructionsText" component="div" className="form-error" />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-save">{formRecipe ? t('saveChanges') : t('addRecipe')}</button>
                  <button type="button" className="btn-cancel" onClick={closeForm}>{t('cancel')}</button>
                </div>
              </Form>
            </Formik>
          </div>
        </div>
      )}
    </div>
  )
}

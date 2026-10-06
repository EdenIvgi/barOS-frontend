import { useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Says which catalogue ingredient a line means.
 *
 * A line nobody has mapped yet is where this matters: the recipe saves either
 * way, but an unmapped line never counts towards "what can I make", so leaving
 * one unanswered quietly costs the bar the feature it came for. Hence the third
 * option - adding the ingredient to this bar's own vocabulary, right here,
 * rather than sending someone to a settings page mid-import.
 */
export function IngredientPicker({ value, ingredients, rawText, lang, onChange, onCreate }) {
  const { t } = useTranslation()
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [name, setName] = useState(rawText || '')

  async function create() {
    const trimmed = name.trim()
    if (!trimmed) return
    setIsSaving(true)
    try {
      const created = await onCreate({ he: trimmed, en: trimmed, kind: 'other', aliases: [rawText].filter(Boolean) })
      if (created?.slug) onChange(created.slug)
      setIsCreating(false)
    } finally {
      setIsSaving(false)
    }
  }

  if (isCreating) {
    return (
      <span className="ingredient-picker is-creating">
        <input
          type="text"
          className="edit-input"
          value={name}
          autoFocus
          onChange={ev => setName(ev.target.value)}
          placeholder={t('ingredientNewName')}
        />
        <button type="button" className="btn-shell is-primary" disabled={isSaving} onClick={create}>
          {isSaving ? t('loading') : t('save')}
        </button>
        <button type="button" className="btn-shell" onClick={() => setIsCreating(false)}>{t('cancel')}</button>
      </span>
    )
  }

  return (
    <span className="ingredient-picker">
      <select
        className="edit-input"
        value={value || ''}
        onChange={ev => {
          if (ev.target.value === '__new__') setIsCreating(true)
          else onChange(ev.target.value)
        }}
      >
        <option value="">{t('ingredientUnmapped')}</option>
        {ingredients.map(ing => (
          <option key={ing.slug} value={ing.slug}>
            {ing[lang] || ing.en}{ing.isCustom ? ' ★' : ''}
          </option>
        ))}
        <option value="__new__">{t('ingredientAddNew')}</option>
      </select>
    </span>
  )
}

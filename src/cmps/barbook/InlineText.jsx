import { useState } from 'react'
import { translateField, getLangText } from '../../services/translate.service.js'

/**
 * A piece of text in the book that an admin can click to rewrite.
 *
 * Every format needs the same thing — show the text, click it in edit mode, type,
 * commit on blur or Enter — and the book stores text as { he, en } so a page
 * reads in whichever language the bar is working in. Both of those live here
 * once instead of in each view.
 *
 * `raw` turns the translation off, for values that are not prose: a phone
 * number, a URL, an image address.
 */
export function InlineText({
  value,
  lang,
  isAdmin,
  multiline = false,
  placeholder = '',
  className = '',
  raw = false,
  onCommit,
}) {
  const [draft, setDraft] = useState(null)

  const text = raw ? (value || '') : getLangText(value, lang)

  async function commit() {
    const trimmed = (draft ?? '').trim()
    setDraft(null)
    if (trimmed === text) return
    if (!trimmed) {
      onCommit(raw ? '' : { he: '', en: '' })
      return
    }
    onCommit(raw ? trimmed : await translateField(trimmed, lang))
  }

  if (draft !== null) {
    const Tag = multiline ? 'textarea' : 'input'
    return (
      <Tag
        className={`bb-inline-input ${className}`}
        value={draft}
        autoFocus
        rows={multiline ? 4 : undefined}
        onChange={e => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={e => {
          if (e.key === 'Enter' && !multiline) commit()
          if (e.key === 'Escape') setDraft(null)
        }}
      />
    )
  }

  return (
    <span
      className={`bb-inline ${className} ${isAdmin ? 'is-editable' : ''}`}
      onClick={() => isAdmin && setDraft(text)}
    >
      {text || (isAdmin ? placeholder : '')}
    </span>
  )
}

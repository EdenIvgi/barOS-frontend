const BASE_URL = '/api/translate'

export async function translateField(text, sourceLang) {
  if (!text?.trim()) return { he: text || '', en: text || '' }
  // A count, a date or a price reads the same in both languages, and a table is
  // full of them — there is nothing to ask the translator for.
  if (!/\p{Letter}/u.test(text)) return { he: text, en: text }
  try {
    const res = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, sourceLang }),
      credentials: 'include',
    })
    if (!res.ok) return { [sourceLang]: text }
    return await res.json()
  } catch {
    return { [sourceLang]: text }
  }
}

export async function translateArray(arr, sourceLang) {
  return Promise.all((arr || []).map(item => translateField(item, sourceLang)))
}

// Display helper — field can be a plain string (legacy) or { he, en }
export function getLangText(field, lang) {
  if (!field && field !== 0) return ''
  if (typeof field === 'string') return field
  return field[lang] || field.he || field.en || ''
}

// Returns true if value is a plain string (needs migration)
function needsMigration(v) {
  return v && typeof v === 'string' && v.trim().length > 0
}

// Migrate all translatable plain-string fields in a page to { he, en }
async function migratePage(page) {
  let p = { ...page }
  let changed = false

  async function tf(v) {
    if (!needsMigration(v)) return v
    changed = true
    return translateField(v, 'he')
  }

  if (Array.isArray(p.headers)) {
    p.headers = await Promise.all(p.headers.map(tf))
  }

  if ((p.type === 'checklist') && Array.isArray(p.items)) {
    p.items = await Promise.all(p.items.map(async item => ({
      ...item,
      text: await tf(item.text),
    })))
  }

  if (p.type === 'checklists' && Array.isArray(p.lists)) {
    p.lists = await Promise.all(p.lists.map(async list => ({
      ...list,
      title: await tf(list.title),
      items: await Promise.all((list.items || []).map(async item => ({
        ...item,
        text: await tf(item.text),
      }))),
    })))
  }

  // A daily page is a table now; these are the three field names its rows were
  // written with before that, translated here so the shape migration that
  // follows carries whole { he, en } values into the cells.
  if (p.type === 'daily' && Array.isArray(p.tasks)) {
    p.tasks = await Promise.all(p.tasks.map(async entry => ({
      ...entry,
      day: await tf(entry.day),
      task: await tf(entry.task),
      text: await tf(entry.text),
      ...(Array.isArray(entry.items) ? { items: await Promise.all(entry.items.map(tf)) } : {}),
    })))
  }

  if (p.type === 'recipes' && Array.isArray(p.recipes)) {
    p.recipes = await Promise.all(p.recipes.map(async recipe => ({
      ...recipe,
      title: await tf(recipe.title),
      ingredients: await Promise.all((recipe.ingredients || []).map(tf)),
      instructions: await Promise.all((recipe.instructions || []).map(tf)),
    })))
  }

  return changed ? p : null
}

// Migrate all pages — returns { pages, changed }
export async function migrateAllContent(pages) {
  let anyChanged = false
  const migrated = await Promise.all(pages.map(async page => {
    const result = await migratePage(page)
    if (result) { anyChanged = true; return result }
    return page
  }))
  return { pages: migrated, changed: anyChanged }
}

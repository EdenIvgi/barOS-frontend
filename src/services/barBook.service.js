import { httpService } from './http.service'

const BASE_URL = 'barBook/'

export function getEmptyContent() {
  return { pages: [] }
}

/**
 * `headers` names the columns of a new table, when one was picked from a preset.
 * Everything else about the page is the same either way — a preset is a shortcut
 * past the blank page, not a different kind of page.
 */
export function createPage(type, title, headers) {
  // The tab strip renders `customTitle`, so a page created with a name must set it
  // here — otherwise the name is stored but never displayed.
  return {
    _id: crypto.randomUUID(),
    type,
    customTitle: title,
    ...defaultPageData(type, title),
    ...(headers?.length ? { headers, rows: [headers.map(() => '')] } : {}),
  }
}

// Column names are written out in both languages rather than translated at
// creation time: a new page should not wait on a network call to be usable.
const TABLE_COLUMNS = [
  { he: 'עמודה 1', en: 'Column 1' },
  { he: 'עמודה 2', en: 'Column 2' },
]

function defaultPageData(type, title) {
  switch (type) {
    // One list to start with, named after the page, so a new checklist opens
    // ready to type into. An empty board would ask you to name a list before you
    // could write a single item - a step nobody wants on a page you just named.
    case 'checklists': return { lists: [{ _id: crypto.randomUUID(), title, items: [] }] }
    // No longer offered - migrations.js turns these into boards.
    case 'checklist':  return { items: [] }
    // An empty first row is there so the page opens with somewhere to type.
    case 'table':      return { headers: TABLE_COLUMNS, rows: [['', '']] }
    // `daily` is no longer offered - migrations.js turns these into tables - but
    // the shape stays here so an unmigrated page still has somewhere to land.
    case 'daily':      return { headers: TABLE_COLUMNS, rows: [['', '']] }
    case 'stock':      return { headers: [], rows: [] }
    case 'recipes':    return { items: [] }
    case 'info':       return { sections: [] }
    case 'contacts':   return { contacts: [] }
    case 'links':      return { links: [] }
    case 'gallery':    return { photos: [] }
    default:           return {}
  }
}

export const barBookService = {
  getContent,
  saveContent,
  clear,
  getEmptyContent,
  createPage,
}

async function getContent() {
  return httpService.get(BASE_URL)
}

async function saveContent(content) {
  // baseUpdatedAt lets the server reject a save built on a stale copy (409)
  // instead of overwriting edits made by someone else in the meantime.
  return httpService.put(BASE_URL, content)
}

async function clear() {
  const res = await httpService.post(BASE_URL + 'clear')
  return res.content ?? res
}

import { httpService } from './http.service'

const BASE_URL = 'barBook/'

export function getEmptyContent() {
  return { pages: [] }
}

export function createPage(type, title) {
  // The tab strip renders `customTitle`, so a page created with a name must set it
  // here — otherwise the name is stored but never displayed.
  return {
    _id: crypto.randomUUID(),
    type,
    customTitle: title,
    ...defaultPageData(type),
  }
}

// Column names are written out in both languages rather than translated at
// creation time: a new page should not wait on a network call to be usable.
const DAILY_COLUMNS = [
  { he: 'יום', en: 'Day' },
  { he: 'משימה', en: 'Task' },
]

const TABLE_COLUMNS = [
  { he: 'עמודה 1', en: 'Column 1' },
  { he: 'עמודה 2', en: 'Column 2' },
]

function defaultPageData(type) {
  switch (type) {
    case 'checklists': return { lists: [] }
    case 'checklist':  return { items: [] }
    // A day-by-day plan is a table whose columns are already named. An empty
    // first row is there so the page opens with somewhere to type.
    case 'daily':      return { headers: DAILY_COLUMNS, rows: [['', '']] }
    case 'table':      return { headers: TABLE_COLUMNS, rows: [['', '']] }
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

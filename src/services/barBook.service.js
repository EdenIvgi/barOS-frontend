import { httpService } from './http.service'

const BASE_URL = 'barBook/'

export function getEmptyContent() {
  return { pages: [] }
}

export function createPage(type, title) {
  // The sidebar renders `customTitle`, so a page created with a name must set it here —
  // otherwise the name is stored but never displayed.
  return {
    _id: crypto.randomUUID(),
    type,
    customTitle: title,
    ...defaultPageData(type),
  }
}

function defaultPageData(type) {
  switch (type) {
    case 'checklists': return { lists: [] }
    case 'checklist':  return { items: [] }
    case 'daily':      return { tasks: [] }
    case 'stock':      return { headers: [], rows: [] }
    case 'recipes':    return { items: [] }
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

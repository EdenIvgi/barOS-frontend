import {
  IconChecklists,
  IconChecklist,
  IconDaily,
  IconTable,
  IconRecipes,
  IconInfo,
  IconContacts,
  IconLinks,
  IconGallery,
} from '../icons.jsx'

/**
 * The formats a Bar Book can hold.
 *
 * A bar book is whatever the manager of that bar decides to keep, so no two bars
 * have the same one. This list is the vocabulary of shapes a page can take; a
 * book is however many pages of whichever of these shapes that bar needs.
 *
 * Adding a format means an entry here, a default shape in barBook.service.js,
 * and a view component. Nothing else in the app has to know about it.
 */
export const PAGE_TYPES = [
  { type: 'checklists', Icon: IconChecklists, labelKey: 'typeChecklists' },
  { type: 'checklist',  Icon: IconChecklist,  labelKey: 'typeChecklist' },
  { type: 'daily',      Icon: IconDaily,      labelKey: 'typeDaily' },
  { type: 'table',      Icon: IconTable,      labelKey: 'typeTable' },
  // Books made before the plain table existed still hold `stock` pages. It is a
  // table with a narrower name, so it keeps rendering and keeps its icon, but a
  // new one is not worth offering beside the table it is a special case of.
  { type: 'stock',      Icon: IconTable,      labelKey: 'typeStock', isLegacy: true },
  { type: 'recipes',    Icon: IconRecipes,    labelKey: 'typeRecipes' },
  { type: 'info',       Icon: IconInfo,       labelKey: 'typeInfo' },
  { type: 'contacts',   Icon: IconContacts,   labelKey: 'typeContacts' },
  { type: 'links',      Icon: IconLinks,      labelKey: 'typeLinks' },
  { type: 'gallery',    Icon: IconGallery,    labelKey: 'typeGallery' },
]

/** The formats worth offering when adding a page. */
export const ADDABLE_PAGE_TYPES = PAGE_TYPES.filter(pt => !pt.isLegacy)

/** Formats whose page is a table of named columns. */
export const TABLE_TYPES = ['table', 'daily', 'stock']

export function getPageType(type) {
  return PAGE_TYPES.find(pt => pt.type === type) || null
}

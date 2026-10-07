import {
  IconChecklists,
  IconChecklist,
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
  // A page that holds one list is the same page holding one list; `checklist`
  // froze that count at creation and lost the ring, the counter and run mode for
  // it. migrations.js turns these into boards.
  { type: 'checklist',  Icon: IconChecklist,  labelKey: 'typeChecklist', isLegacy: true },
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

/**
 * Opening column names a table can be started from.
 *
 * What a table is for is the bar's business, not ours - a day plan and a
 * delivery log are the same page with different headers. These are shortcuts
 * past the blank page, nothing more: picking one only writes the column names,
 * which stay editable like any other cell, and picking none is the default.
 */
export const COLUMN_PRESETS = [
  {
    key: 'days',
    columns: [{ he: 'יום', en: 'Day' }, { he: 'משימה', en: 'Task' }],
  },
  {
    key: 'stock',
    columns: [{ he: 'מוצר', en: 'Product' }, { he: 'ספק', en: 'Supplier' }, { he: 'כמות', en: 'Quantity' }],
  },
  {
    key: 'equipment',
    columns: [{ he: 'ציוד', en: 'Equipment' }, { he: 'תאריך בדיקה', en: 'Checked On' }],
  },
  {
    key: 'shifts',
    columns: [{ he: 'משמרת', en: 'Shift' }, { he: 'ברמן', en: 'Bartender' }, { he: 'הערות', en: 'Notes' }],
  },
]

export function getPageType(type) {
  return PAGE_TYPES.find(pt => pt.type === type) || null
}

// The page kinds the Bar Book can hold. Shared by the tab row and the add-page
// modal, which both need the symbol and the label key.
export const PAGE_TYPES = [
  { type: 'checklists', symbol: '✓', labelKey: 'typeChecklists' },
  { type: 'checklist',  symbol: '☑', labelKey: 'typeChecklist' },
  { type: 'daily',      symbol: '◷', labelKey: 'typeDaily' },
  { type: 'stock',      symbol: '▤', labelKey: 'typeStock' },
  { type: 'recipes',    symbol: '✦', labelKey: 'typeRecipes' },
]

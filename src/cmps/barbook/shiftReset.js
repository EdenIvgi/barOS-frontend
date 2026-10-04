/**
 * Clearing checks for a new shift.
 *
 * Checklists belong to one shift: the opening list is run once when the bar opens
 * and means nothing the next evening. Everything else in the book — stock,
 * recipes, the daily tasks table — is a long-term record and is never touched
 * here.
 *
 * The reset is deliberately manual rather than a date rule, because a night shift
 * crosses midnight and would otherwise be wiped halfway through.
 */

function isChecklistPage(page) {
  return page.type === 'checklists' || page.type === 'checklist'
}

function clearItems(items) {
  return (items || []).map(item => (item.checked ? { ...item, checked: false } : item))
}

/** How many checks a reset would clear, for the confirmation prompt. */
export function countChecks(pages) {
  return (pages || []).reduce((total, page) => {
    if (page.type === 'checklists') {
      return total + (page.lists || []).reduce(
        (n, list) => n + (list.items || []).filter(i => i.checked).length,
        0,
      )
    }
    if (page.type === 'checklist') {
      return total + (page.items || []).filter(i => i.checked).length
    }
    return total
  }, 0)
}

/**
 * Returns the pages with every checklist check cleared. Pages that carry no
 * checks are returned by identity, so the rest of the book is untouched.
 */
export function resetChecks(pages) {
  return (pages || []).map(page => {
    if (!isChecklistPage(page)) return page
    if (page.type === 'checklist') {
      return { ...page, items: clearItems(page.items) }
    }
    return {
      ...page,
      lists: (page.lists || []).map(list => ({ ...list, items: clearItems(list.items) })),
    }
  })
}

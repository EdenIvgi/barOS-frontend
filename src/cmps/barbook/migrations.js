/**
 * Shape migrations for Bar Book pages.
 *
 * A daily page used to be a list of { day, task } pairs with one free-text block
 * per day; it is a table of named columns now. The conversion happens on load and
 * keeps both languages of every value, because the cells carry { he, en } just as
 * the old fields did — nothing written in a bar's book is dropped to change how
 * it is drawn.
 */

const DAY_COLUMN = { he: 'יום', en: 'Day' }
const TASK_COLUMN = { he: 'משימה', en: 'Task' }

/**
 * One day's entry becomes one row per task.
 *
 * Three shapes were written over time: a `task`, a `text`, and a list of `items`
 * under one day. A day holding several tasks turns into several rows — one task
 * to a line is the point of putting them in a table.
 */
function toRows(entry) {
  const day = entry?.day ?? ''
  if (Array.isArray(entry?.items)) {
    return entry.items.length
      ? entry.items.map(item => [day, item ?? ''])
      : [[day, '']]
  }
  return [[day, entry?.task ?? entry?.text ?? '']]
}

/** Converts the legacy daily shape to a table. Returns { pages, changed }. */
export function migrateDailyPages(pages) {
  let changed = false

  const migrated = (pages || []).map(page => {
    if (page?.type !== 'daily' || !Array.isArray(page.tasks)) return page
    changed = true

    const { tasks, ...rest } = page
    return {
      ...rest,
      headers: page.headers?.length ? page.headers : [DAY_COLUMN, TASK_COLUMN],
      rows: [...(page.rows || []), ...tasks.flatMap(toRows)],
    }
  })

  return { pages: migrated, changed }
}

/**
 * The supplier rows the setup flow collects, and how they become book contacts.
 *
 * Kept apart from the step component so that file exports only a component: a
 * mixed module breaks fast refresh for everything that imports it.
 */

export function emptySupplierRows() {
  return [{ name: '', phone: '' }, { name: '', phone: '' }, { name: '', phone: '' }]
}

/** Only rows someone actually filled in become contacts. */
export function rowsToContacts(rows) {
  return rows
    .filter(r => r.name.trim() || r.phone.trim())
    .map(r => ({
      name: { he: r.name.trim(), en: r.name.trim() },
      role: { he: 'ספק', en: 'Supplier' },
      phone: r.phone.trim(),
      note: { he: '', en: '' },
    }))
}

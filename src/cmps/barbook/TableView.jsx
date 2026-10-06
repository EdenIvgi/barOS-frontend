import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { translateField, getLangText } from '../../services/translate.service.js'

/**
 * A table, whatever the bar wants to put in one.
 *
 * Stock counts, the week's tasks, a par sheet, who is on which shift: these are
 * all the same shape — named columns and rows someone fills in — so they are one
 * format here rather than one component each. The daily tasks page is this view
 * with two columns already named; the legacy `stock` type is this view too.
 *
 * Cells carry { he, en } like the rest of the book, so a table written in Hebrew
 * still reads in English.
 */
export function TableView({ page, isAdmin, onPageChange }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.resolvedLanguage || 'he'
  const [editCell, setEditCell] = useState({ row: null, col: null, value: '' })
  const [editHeader, setEditHeader] = useState({ col: null, value: '' })

  const headers = page.headers || []
  const rows = page.rows || []

  const data = useMemo(() =>
    rows.map(row => Object.fromEntries(headers.map((_, i) => [`c${i}`, row[i] ?? ''])))
  , [rows, headers])

  const columns = useMemo(() =>
    headers.map((h, colIdx) => ({
      id: `c${colIdx}`,
      accessorKey: `c${colIdx}`,
      header: getLangText(h, lang),
      _colIdx: colIdx,
    }))
  , [headers, lang])

  const table = useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })

  async function commitCell() {
    const { row, col, value } = editCell
    setEditCell({ row: null, col: null, value: '' })
    if (row == null) return
    const translated = await translateField(value, lang)
    onPageChange({
      ...page,
      rows: rows.map((r, ri) => {
        if (ri !== row) return r
        const next = [...r]
        next[col] = translated
        return next
      }),
    })
  }

  async function commitHeader() {
    const { col, value } = editHeader
    if (col == null) return
    const newHeaders = [...headers]
    const trimmed = value.trim() || getLangText(headers[col], lang)
    newHeaders[col] = await translateField(trimmed, lang)
    onPageChange({ ...page, headers: newHeaders })
    setEditHeader({ col: null, value: '' })
  }

  async function addColumn() {
    const translated = await translateField(t('newColumn'), lang)
    onPageChange({
      ...page,
      headers: [...headers, translated],
      rows: rows.map(r => [...r, '']),
    })
  }

  function removeColumn(colIdx) {
    onPageChange({
      ...page,
      headers: headers.filter((_, i) => i !== colIdx),
      rows: rows.map(r => r.filter((_, i) => i !== colIdx)),
    })
  }

  function addRow() {
    onPageChange({ ...page, rows: [...rows, Array(headers.length).fill('')] })
  }

  function removeRow(rowIdx) {
    onPageChange({ ...page, rows: rows.filter((_, i) => i !== rowIdx) })
  }

  return (
    <div className="bb-table-view">
      <div className="bb-table-wrap">
        <table className="bb-table">
          <thead>
            <tr>
              {table.getHeaderGroups()[0]?.headers.map((header) => {
                const colIdx = header.column.columnDef._colIdx
                return (
                  <th key={header.id}>
                    {editHeader.col === colIdx ? (
                      <input
                        className="edit-input cell-input"
                        value={editHeader.value}
                        autoFocus
                        onChange={e => setEditHeader(p => ({ ...p, value: e.target.value }))}
                        onBlur={commitHeader}
                        onKeyDown={e => e.key === 'Enter' && commitHeader()}
                      />
                    ) : (
                      <span
                        className={isAdmin ? 'editable' : ''}
                        onClick={() => isAdmin && setEditHeader({ col: colIdx, value: getLangText(headers[colIdx], lang) })}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                      </span>
                    )}
                    {isAdmin && (
                      <button type="button" className="btn-icon col-delete" onClick={() => removeColumn(colIdx)} title={t('deleteColumn')}>×</button>
                    )}
                  </th>
                )
              })}
              {isAdmin && <th className="th-actions"><button type="button" className="btn-add-col" onClick={addColumn}>+</button></th>}
              {isAdmin && <th className="th-actions"></th>}
            </tr>
          </thead>
          <tbody>
            {table.getRowModel().rows.map((row, rowIdx) => (
              <tr key={row.id}>
                {row.getVisibleCells().map((cell) => {
                  const colIdx = cell.column.columnDef._colIdx
                  const isEditing = editCell.row === rowIdx && editCell.col === colIdx
                  const text = getLangText(cell.getValue(), lang)
                  return (
                    <td key={cell.id}>
                      {isEditing ? (
                        <input
                          className="edit-input cell-input"
                          value={editCell.value}
                          autoFocus
                          onChange={e => setEditCell(p => ({ ...p, value: e.target.value }))}
                          onBlur={commitCell}
                          onKeyDown={e => {
                            if (e.key === 'Enter') commitCell()
                            if (e.key === 'Escape') setEditCell({ row: null, col: null, value: '' })
                          }}
                        />
                      ) : (
                        <span
                          className={isAdmin ? 'editable' : ''}
                          onClick={() => isAdmin && setEditCell({ row: rowIdx, col: colIdx, value: text })}
                        >
                          {text}
                        </span>
                      )}
                    </td>
                  )
                })}
                {isAdmin && <td />}
                {isAdmin && (
                  <td className="td-actions">
                    <button type="button" className="btn-icon btn-delete-row" onClick={() => removeRow(rowIdx)}>×</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isAdmin && (
        <button type="button" className="btn-add-item" onClick={addRow}>+ {t('addRow')}</button>
      )}
    </div>
  )
}

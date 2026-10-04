import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from '@tanstack/react-table'
import { translateField, getLangText } from '../../services/translate.service.js'

export function StockView({ page, isAdmin, onPageChange }) {
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

  function commitCell() {
    const { row, col, value } = editCell
    if (row == null) return
    const newRows = rows.map((r, ri) => {
      if (ri !== row) return r
      const nr = [...r]
      nr[col] = value
      return nr
    })
    onPageChange({ ...page, rows: newRows })
    setEditCell({ row: null, col: null, value: '' })
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
    const newHeaders = [...headers, translated]
    const newRows = rows.map(r => [...r, ''])
    onPageChange({ ...page, headers: newHeaders, rows: newRows })
  }

  function removeColumn(colIdx) {
    const newHeaders = headers.filter((_, i) => i !== colIdx)
    const newRows = rows.map(r => r.filter((_, i) => i !== colIdx))
    onPageChange({ ...page, headers: newHeaders, rows: newRows })
  }

  function addRow() {
    onPageChange({ ...page, rows: [...rows, Array(headers.length).fill('')] })
  }

  function removeRow(rowIdx) {
    onPageChange({ ...page, rows: rows.filter((_, i) => i !== rowIdx) })
  }

  return (
    <div className="stock-page-view">
      <div className="stock-table-wrap">
        <table className="stock-table">
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
                          onClick={() => isAdmin && setEditCell({ row: rowIdx, col: colIdx, value: cell.getValue() ?? '' })}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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

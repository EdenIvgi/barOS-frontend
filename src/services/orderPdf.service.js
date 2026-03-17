import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'
import i18n from './i18.js'

const A4_W_MM = 210
const A4_H_MM = 297
const MARGIN_MM = 8
const CONTENT_H_MM = A4_H_MM - MARGIN_MM * 2

const COMBINED_ORDER_LABELS = ['הזמנה משולבת', 'Combined order', 'Combined Order']

/**
 * מייצר PDF להזמנה – תמיד בעמוד אחד. הלייאאוט משתנה אוטומטית לפי כמות הפריטים.
 * בהזמנה משולבת – מקבץ את הפריטים לפי ספק.
 */
export async function downloadOrderPdf(order, fileName, supplierName) {
  if (!order) return

  const dateStr = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : ''
  const supplierStr =
    supplierName != null && String(supplierName).trim() !== ''
      ? String(supplierName).trim()
      : order.supplier != null && String(order.supplier).trim() !== ''
        ? String(order.supplier).trim()
        : i18n.t('noSupplier')
  const items = order.items || []
  const isCombined = COMBINED_ORDER_LABELS.includes(supplierStr)
  const itemCount = items.length

  const layout = getLayout(itemCount)

  const div = document.createElement('div')
  div.setAttribute('dir', 'rtl')
  div.style.cssText = [
    'position:fixed; left:-9999px; top:0;',
    `width:${layout.width}px; padding:${layout.padding}px; box-sizing:border-box;`,
    `font-family: Arial, "David", "Heebo", sans-serif; font-size: ${layout.fontSize}px;`,
    'color:#1a1a1a; background:#fff;',
    `line-height: ${layout.lineHeight};`
  ].join(' ')

  let bodyHtml
  if (isCombined && items.some(item => item.supplier)) {
    bodyHtml = buildCombinedBody(items, layout)
  } else {
    bodyHtml = buildSimpleBody(items, layout)
  }

  div.innerHTML = [
    `<h1 style="margin:0 0 ${layout.headerGap}px; font-size:${layout.titleSize}px; border-bottom:2px solid #333; padding-bottom:4px;">הזמנה</h1>`,
    `<p style="margin:0 0 2px; font-size:${layout.fontSize}px;"><strong>תאריך:</strong> ` + escapeHtml(dateStr) + '</p>',
    isCombined
      ? `<p style="margin:0 0 ${layout.headerGap}px; font-size:${layout.fontSize}px;"><strong>${escapeHtml(supplierStr)}</strong></p>`
      : `<p style="margin:0 0 ${layout.headerGap}px; font-size:${layout.fontSize}px;"><strong>ספק:</strong> ` + escapeHtml(supplierStr) + '</p>',
    bodyHtml
  ].join('')

  document.body.appendChild(div)

  try {
    const canvas = await html2canvas(div, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    })
    document.body.removeChild(div)

    const imgW = canvas.width
    const imgH = canvas.height
    const imgHmm = imgH * (A4_W_MM / imgW)

    let w = A4_W_MM
    let h = imgHmm
    if (h > CONTENT_H_MM) {
      h = CONTENT_H_MM
      w = (imgW * CONTENT_H_MM) / imgH
    }
    const x = (A4_W_MM - w) / 2

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
    doc.addImage(canvas.toDataURL('image/png'), 'PNG', x, MARGIN_MM, w, h)

    const name = fileName || `order-${order._id || Date.now()}.pdf`
    doc.save(name.endsWith('.pdf') ? name : name + '.pdf')
  } catch (e) {
    if (div.parentNode) document.body.removeChild(div)
    throw e
  }
}

function buildSimpleBody(items, layout) {
  if (!items.length) return '<p>אין פריטים</p>'
  return '<table style="width:100%; border-collapse:collapse;">' +
    '<thead><tr style="border-bottom:2px solid #333;">' +
    `<th style="text-align:right; padding:${layout.cellPad}px;">שם מוצר</th>` +
    `<th style="text-align:center; padding:${layout.cellPad}px; width:${layout.qtyColWidth}px;">כמות</th></tr></thead>` +
    '<tbody>' +
    items.map(item =>
      '<tr style="border-bottom:1px solid #ddd">' +
      `<td style="text-align:right; padding:${layout.cellPad}px;">` + escapeHtml(String(item.name || '').trim() || '—') + '</td>' +
      `<td style="text-align:center; padding:${layout.cellPad}px;">` + (item.quantity ?? 0) + '</td></tr>'
    ).join('') +
    '</tbody></table>'
}

function buildCombinedBody(items, layout) {
  const groups = {}
  for (const item of items) {
    const key = item.supplier || i18n.t('noSupplier')
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  }

  const sections = Object.entries(groups).map(([supplier, groupItems]) =>
    `<h2 style="margin:${layout.headerGap}px 0 ${Math.max(layout.headerGap / 2, 2)}px; font-size:${Math.round(layout.titleSize * 0.8)}px; font-weight:700; color:#1a1a1a; border-bottom:2px solid #333; padding-bottom:2px;">` +
    escapeHtml(supplier) + '</h2>' +
    '<table style="width:100%; border-collapse:collapse;">' +
    '<thead><tr style="border-bottom:2px solid #333;">' +
    `<th style="text-align:right; padding:${layout.cellPad}px;">שם מוצר</th>` +
    `<th style="text-align:center; padding:${layout.cellPad}px; width:${layout.qtyColWidth}px;">כמות</th></tr></thead>` +
    '<tbody>' +
    groupItems.map(item =>
      '<tr style="border-bottom:1px solid #ddd">' +
      `<td style="text-align:right; padding:${layout.cellPad}px;">` + escapeHtml(String(item.name || '').trim() || '—') + '</td>' +
      `<td style="text-align:center; padding:${layout.cellPad}px;">` + (item.quantity ?? 0) + '</td></tr>'
    ).join('') +
    '</tbody></table>'
  )

  return sections.join('')
}

function getLayout(itemCount) {
  if (itemCount <= 10) {
    return { width: 500, padding: 20, fontSize: 14, lineHeight: 1.4, titleSize: 22, headerGap: 12, cellPad: 8, qtyColWidth: 55 }
  }
  if (itemCount <= 25) {
    return { width: 520, padding: 14, fontSize: 12, lineHeight: 1.3, titleSize: 18, headerGap: 8, cellPad: 5, qtyColWidth: 45 }
  }
  if (itemCount <= 45) {
    return { width: 540, padding: 10, fontSize: 10, lineHeight: 1.25, titleSize: 16, headerGap: 6, cellPad: 4, qtyColWidth: 40 }
  }
  if (itemCount <= 70) {
    return { width: 560, padding: 6, fontSize: 8, lineHeight: 1.2, titleSize: 13, headerGap: 4, cellPad: 2, qtyColWidth: 32 }
  }
  return { width: 580, padding: 4, fontSize: 7, lineHeight: 1.15, titleSize: 11, headerGap: 3, cellPad: 2, qtyColWidth: 28 }
}

function escapeHtml(str) {
  const span = document.createElement('span')
  span.textContent = str
  return span.innerHTML
}

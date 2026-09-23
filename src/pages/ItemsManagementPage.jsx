import { useEffect, useMemo, useRef, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { loadItems, removeItem, saveItem } from '../store/actions/item.actions'
// Categories are now loaded from items, so we don't need to load from backend
// import { loadCategories } from '../store/actions/category.actions'
import { itemService } from '../services/item.service'
import { orderService } from '../services/order.service'
import { Loader } from '../cmps/Loader'
import { ItemFilters } from '../cmps/ItemFilters'
import { ImportStockModal } from '../cmps/ImportStockModal'
import { CreateOrderModal } from '../cmps/CreateOrderModal'
import { ItemForm } from '../cmps/ItemForm'
import { AppShell } from '../cmps/AppShell'
import { IconMinus, IconPlus } from '../cmps/icons'
import { formatVolume } from '../services/util.service'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'
import * as XLSX from 'xlsx'
import { NO_SUPPLIER_KEY } from '../services/constants'

function getCategoryNameFromItem(item) {
  if (item?.category?.name) return item.category.name
  if (item?.category && typeof item.category === 'string') return item.category
  const categoryId = item?.categoryId
  if (categoryId) {
    if (typeof categoryId === 'string' && categoryId.length < 24) return categoryId
    if (typeof categoryId === 'string') return categoryId
    if (typeof categoryId === 'object') return categoryId.toString()
  }
  return null
}

export function ItemsManagementPage() {
  const { t } = useTranslation()
  const items = useSelector((storeState) => storeState.itemModule.items)
  const user = useSelector((storeState) => storeState.userModule.loggedInUser)
  // Categories are now loaded from items, so we don't need categories from store
  // const categories = useSelector((storeState) => storeState.categoryModule.categories)
  const isLoading = useSelector((storeState) => storeState.itemModule.flag.isLoading)
  const navigate = useNavigate()

  const [isEditing, setIsEditing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [filters, setFilters] = useState({
    category: '',
    supplier: '',
    stockStatus: ''
  })
  const [createOrderModal, setCreateOrderModal] = useState({
    isOpen: false,
    bySupplier: null,
    selectedSuppliers: {},
    createCombined: false
  })

  const fileInputRef = useRef(null)
  const [importState, setImportState] = useState({
    isOpen: false,
    isLoading: false,
    fileName: '',
    rows: [],
    report: null,
    error: null,
  })

  useEffect(() => {
    loadItems()
  }, [])

  const uniqueCategories = useMemo(() => {
    if (!items || !Array.isArray(items)) return []
    const categorySet = new Set()
    items.forEach((item) => {
      if (item.category) {
        if (typeof item.category === 'string') categorySet.add(item.category)
        else if (item.category.name) categorySet.add(item.category.name)
      }
      if (item.categoryId && typeof item.categoryId === 'string' && item.categoryId.length < 24) {
        categorySet.add(item.categoryId)
      }
    })
    return Array.from(categorySet).sort()
  }, [items])

  const uniqueSuppliers = useMemo(() => {
    if (!items || !Array.isArray(items)) return []
    const supplierSet = new Set()
    items.forEach((item) => {
      if (item.supplier && item.supplier.trim()) supplierSet.add(item.supplier.trim())
    })
    return Array.from(supplierSet).sort()
  }, [items])

  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return []
    return items.filter((item) => {
      if (filters.category && getCategoryNameFromItem(item) !== filters.category) return false
      if (filters.supplier && (!item.supplier || item.supplier !== filters.supplier)) return false
      if (filters.stockStatus !== '') {
        const stockQuantity = item.stockQuantity ?? 0
        const minStockLevel = item.minStockLevel || 0
        if (filters.stockStatus === 'inStock' && stockQuantity <= 0) return false
        if (filters.stockStatus === 'outOfStock' && stockQuantity > 0) return false
        if (filters.stockStatus === 'lowStock' && stockQuantity > minStockLevel) return false
      }
      return true
    })
  }, [items, filters])

  async function handleDelete(itemId) {
    if (!window.confirm(t('confirmDeleteItem'))) {
      return
    }

    try {
      setIsSaving(true)
      await removeItem(itemId)
      showSuccessMsg(t('itemDeletedSuccess'))
    } catch (error) {
      showErrorMsg(t('itemDeleteError'))
    } finally {
      setIsSaving(false)
    }
  }

  function handleEdit(item) {
    // Prepare item for editing
    const itemToEdit = { ...item }
    
    // Handle category - prioritize category string from items
    if (itemToEdit.category) {
      if (typeof itemToEdit.category === 'string') {
        // Use category string directly
        itemToEdit.categoryId = itemToEdit.category
      } else if (itemToEdit.category.name) {
        // If category is an object with name, use the name
        itemToEdit.categoryId = itemToEdit.category.name
      }
    } else if (itemToEdit.categoryId) {
      // If only categoryId exists, check if it's a string (category name) or ObjectId
      if (typeof itemToEdit.categoryId === 'object') {
        // If it's an ObjectId object, convert to string
        itemToEdit.categoryId = itemToEdit.categoryId.toString()
      } else if (typeof itemToEdit.categoryId !== 'string') {
        // If it's not a string, convert it
        itemToEdit.categoryId = String(itemToEdit.categoryId)
      }
      // If categoryId is a short string (not ObjectId), it's likely a category name
      // Keep it as is for the select
    }
    
    setEditingItem(itemToEdit)
    setIsEditing(true)
    setShowForm(true)
  }

  function handleAdd() {
    setEditingItem(itemService.getEmptyItem())
    setIsEditing(false)
    setShowForm(true)
  }

  async function onDeleteFromForm(itemId) {
    await handleDelete(itemId)
    handleCancel()
  }

  function handleCancel() {
    setShowForm(false)
    setEditingItem(null)
    setIsEditing(false)
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    try {
      setIsSaving(true)
      const itemToSave = { ...editingItem }
      
      if (itemToSave.categoryId) {
        if (typeof itemToSave.categoryId === 'string' && !itemToSave.categoryId.match(/^[0-9a-fA-F]{24}$/)) {
          itemToSave.category = itemToSave.categoryId
        } else if (typeof itemToSave.categoryId === 'object') {
          itemToSave.categoryId = itemToSave.categoryId._id || itemToSave.categoryId.toString()
        }
      }

      await saveItem(itemToSave)
      showSuccessMsg(isEditing ? t('itemUpdatedSuccess') : t('itemSavedSuccess'))
      handleCancel()
    } catch (error) {
      showErrorMsg(t('itemSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  function handleChange(ev) {
    const { name, value, type, checked } = ev.target
    setEditingItem((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? +value : value,
    }))
  }

  if (isLoading) return <Loader />

  function handleFilterChange(ev) {
    const { name, value } = ev.target
    setFilters((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  function handleClearFilters() {
    setFilters({
      category: '',
      supplier: '',
      stockStatus: ''
    })
  }

  async function handleToOrderChange(item, newToOrderValue) {
    try {
      const newToOrder = Math.max(0, Number(newToOrderValue) || 0)
      const currentStock = item.stockQuantity || 0
      const newOptimalStock = currentStock + newToOrder
      const updatedItem = { ...item, optimalStockLevel: newOptimalStock }
      await saveItem(updatedItem)
      showSuccessMsg(t('optimalUpdated'))
    } catch (error) {
      showErrorMsg(t('optimalUpdateError'))
    }
  }

  async function handleStockChange(item, newStockValue) {
    try {
      const newStock = Math.max(0, Number(newStockValue) || 0)
      const updatedItem = { ...item, stockQuantity: newStock }
      await saveItem(updatedItem)
      showSuccessMsg(t('stockUpdated'))
    } catch (error) {
      showErrorMsg(t('stockUpdateError'))
    }
  }

  function _pick(obj, candidates) {
    const keys = Object.keys(obj || {})
    for (const c of candidates) {
      const direct = obj?.[c]
      if (direct !== undefined && direct !== null && String(direct).trim() !== '') return direct
      const foundKey = keys.find(k => k.trim().toLowerCase() === c.trim().toLowerCase())
      if (foundKey) {
        const v = obj?.[foundKey]
        if (v !== undefined && v !== null && String(v).trim() !== '') return v
      }
    }
    return ''
  }

  function _toNumber(val) {
    if (val === null || val === undefined) return NaN
    if (typeof val === 'number') return val
    const s = String(val).replace(/,/g, '').trim()
    if (!s) return NaN
    return Number(s)
  }

  /** Order quantity = optimal - current. Rounded up to whole number. */
  function getToOrderQuantity(item) {
    const optimal = parseFloat(item?.optimalStockLevel)
    const current = parseFloat(item?.stockQuantity)
    if (Number.isNaN(optimal) || optimal <= 0) return 0
    const stock = Number.isNaN(current) ? 0 : current
    const toOrder = Math.max(0, optimal - stock)
    return toOrder > 0 ? Math.ceil(toOrder) : 0
  }

  async function handleImportFile(ev) {
    const file = ev.target.files?.[0]
    if (!file) return

    setImportState(prev => ({
      ...prev,
      isOpen: true,
      isLoading: true,
      fileName: file.name,
      report: null,
      error: null,
      rows: [],
    }))

    try {
      const buffer = await file.arrayBuffer()
      const wb = XLSX.read(buffer, { type: 'array' })
      const sheet = wb.Sheets[wb.SheetNames[0]]
      const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' })

      // Find header row (first row with product name / supplier columns)
      let headerRowIndex = -1
      let headers = {}

      for (let i = 0; i < rawRows.length; i++) {
        const row = rawRows[i]
        const values = Object.values(row)
        // Check if this row contains headers
        if (values.some(v => String(v).includes('שם המוצר') || String(v).includes('ספק'))) {
          headerRowIndex = i
          // Map column names to field names
          Object.keys(row).forEach(key => {
            const value = String(row[key])
            if (value.includes('שם המוצר')) headers.productName = key
            else if (value.includes('ספק')) headers.supplier = key
            else if (value.includes('כמות במלאי')) headers.stockQuantity = key
            else if (value.includes('כמה להזמין')) headers.orderQuantity = key
          })
          break
        }
      }

      if (headerRowIndex === -1) {
        // Fallback to old method if header row not found
        const parsedRows = rawRows
          .map(r => {
            const name = _pick(r, ['name', 'item', 'itemName', 'שם', 'שם מוצר', 'שם המוצר', 'מוצר', 'פריט'])
            const qtyRaw = _pick(r, [
              'stockQuantity',
              'quantity',
              'qty',
              'stock',
              'מלאי',
              'כמות',
              'כמות במלאי',
              'מלאי קיים',
            ])
            const quantity = _toNumber(qtyRaw)
            return { name: String(name || '').trim(), quantity }
          })
          .filter(r => r.name && !Number.isNaN(r.quantity))

        if (!parsedRows.length) {
          throw new Error(t('noValidRows'))
        }

        const report = await itemService.importStock(parsedRows, { dryRun: true, mode: 'set' })
        setImportState(prev => ({
          ...prev,
          isLoading: false,
          rows: parsedRows,
          report,
        }))
        return
      }

      // Process data rows (skip header row)
      const dataRows = rawRows.slice(headerRowIndex + 1)
      const categoryMapping = {
        '🍷': 'wine',
        'יין': 'wine',
        '🍺': 'alcohol',
        'אלכוהול': 'alcohol',
        '🥤': 'soft_drink',
        'משקאות': 'soft_drink',
        'אחר': 'other'
      }
      let currentCategory = 'wine'

      const parsedRows = []
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i]
        
        // Check if this row is a category header
        const productNameCol = row[headers.productName]
        if (productNameCol) {
          const productNameValue = String(productNameCol).trim()
          const isCategoryHeader = productNameValue.match(/[\u{1F300}-\u{1F9FF}]/u) || 
                                   productNameValue.includes('יין') || 
                                   productNameValue.includes('אלכוהול') || 
                                   productNameValue.includes('משקאות') ||
                                   productNameValue.includes('אחר')
          
          if (isCategoryHeader && (!row[headers.supplier] || String(row[headers.supplier]).trim() === '')) {
            // This is a category header row
            for (const [key, category] of Object.entries(categoryMapping)) {
              if (productNameValue.includes(key)) {
                currentCategory = category
                break
              }
            }
            continue // Skip category header rows
          }
        }

        // Extract item data
        const productName = row[headers.productName] ? String(row[headers.productName]).trim() : ''
        const supplier = row[headers.supplier] ? String(row[headers.supplier]).trim() : ''
        const stockQty = row[headers.stockQuantity] !== undefined && row[headers.stockQuantity] !== '' 
          ? Number(row[headers.stockQuantity]) 
          : 0
        // Extract order quantity from file column; empty = 0
        const orderQtyRaw = row[headers.orderQuantity]
        let orderQty = 0
        if (orderQtyRaw !== undefined && orderQtyRaw !== '' && orderQtyRaw !== null) {
          const parsed = Number(orderQtyRaw)
          if (!isNaN(parsed)) {
            orderQty = Math.max(0, parsed)
          }
        }

        // Skip empty rows
        if (!productName || productName === '' || productName.match(/[\u{1F300}-\u{1F9FF}]/u)) continue

        parsedRows.push({
          name: productName,
          quantity: stockQty,
          supplier: supplier,
          category: currentCategory,
          toOrder: orderQty
        })
      }

      if (!parsedRows.length) {
        throw new Error(t('noValidRows'))
      }

      const report = await itemService.importStock(parsedRows, { dryRun: true, mode: 'set' })

      setImportState(prev => ({
        ...prev,
        isLoading: false,
        rows: parsedRows,
        report,
      }))
    } catch (err) {
      const serverMsg = err?.response?.data?.error
      const message = serverMsg || err?.message || t('readFileError')
      setImportState(prev => ({
        ...prev,
        isLoading: false,
        error: message,
      }))
    } finally {
      // allow re-uploading same file
      ev.target.value = ''
    }
  }

  async function handleApplyImport() {
    try {
      setImportState(prev => ({ ...prev, isLoading: true, error: null }))
      await itemService.importStock(importState.rows, { dryRun: false, mode: 'set' })
      await loadItems()
      showSuccessMsg(t('stockUpdatedSuccess'))
      closeImportModal()
    } catch (err) {
      setImportState(prev => ({ ...prev, isLoading: false, error: err?.message || t('stockUpdateError') }))
    }
  }

  function closeImportModal() {
    setImportState({
      isOpen: false,
      isLoading: false,
      fileName: '',
      rows: [],
      report: null,
      error: null,
    })
  }

  const NO_SUPPLIER = NO_SUPPLIER_KEY

  function getSupplierFromItem(item) {
    if (!item) return ''
    const s = item.supplier ?? item.supplierName ?? ''
    if (typeof s === 'string' && s.trim() !== '') return s.trim()
    if (s && typeof s === 'object' && s.name) return String(s.name).trim()
    return ''
  }

  function openCreateOrderModal() {
    const rows = filteredItems
      .map((item) => {
        const toOrder = getToOrderQuantity(item)
        if (toOrder <= 0) return null
        const supplier = getSupplierFromItem(item) || NO_SUPPLIER
        return {
          itemId: item._id,
          name: item.name,
          quantity: toOrder,
          volumeMl: item.volumeMl || 0,
          supplier
        }
      })
      .filter(Boolean)

    if (rows.length === 0) {
      showErrorMsg(t('noProductsToOrder'))
      return
    }

    const bySupplier = {}
    for (const row of rows) {
      const key = row.supplier || NO_SUPPLIER
      if (!bySupplier[key]) bySupplier[key] = []
      bySupplier[key].push({
        itemId: row.itemId,
        name: row.name,
        quantity: row.quantity,
        volumeMl: row.volumeMl,
        supplier: key
      })
    }

    const selectedSuppliers = {}
    for (const key of Object.keys(bySupplier)) {
      selectedSuppliers[key] = true
    }
    setCreateOrderModal({ isOpen: true, bySupplier, selectedSuppliers, createCombined: false })
  }

  function closeCreateOrderModal() {
    setCreateOrderModal({ isOpen: false, bySupplier: null, selectedSuppliers: {}, createCombined: false })
  }

  function setCreateCombined(createCombined) {
    setCreateOrderModal((prev) => ({ ...prev, createCombined }))
  }

  function toggleCreateOrderSupplier(supplierName) {
    setCreateOrderModal((prev) => ({
      ...prev,
      selectedSuppliers: {
        ...prev.selectedSuppliers,
        [supplierName]: !prev.selectedSuppliers[supplierName]
      }
    }))
  }

  async function confirmCreateSelectedOrders() {
    const { bySupplier, selectedSuppliers, createCombined } = createOrderModal
    if (!bySupplier) return
    const toCreate = Object.entries(bySupplier).filter(([name]) => selectedSuppliers[name])
    if (toCreate.length === 0) {
      showErrorMsg(t('selectAtLeastOneSupplier'))
      return
    }
    try {
      let created = 0
      let totalProducts = 0
      if (createCombined && toCreate.length > 0) {
        const allItems = toCreate.flatMap(([, orderItems]) => orderItems)
        await orderService.save({
          items: allItems,
          supplier: t('combinedOrderLabel'),
          userId: user?._id || null,
          status: 'pending',
          type: 'stock_order'
        })
        created = 1
        totalProducts = allItems.length
      } else {
        for (const [supplierName, orderItems] of toCreate) {
          const firstItemId = orderItems[0]?.itemId
          const firstItem = filteredItems.find((i) => i._id === firstItemId || String(i._id) === String(firstItemId))
          const supplierToSave = (getSupplierFromItem(firstItem) || supplierName || NO_SUPPLIER).trim() || supplierName
          await orderService.save({
            items: orderItems,
            supplier: supplierToSave,
            userId: user?._id || null,
            status: 'pending',
            type: 'stock_order'
          })
          created++
          totalProducts += orderItems.length
        }
      }
      closeCreateOrderModal()
      showSuccessMsg(created === 1
        ? t('orderCreatedProducts', { n: totalProducts })
        : t('ordersCreatedProducts', { c: created, n: totalProducts }))
      navigate('/orders')
    } catch (error) {
      showErrorMsg(t('createOrdersError'))
    }
  }

  // Calculate total items to order
  const totalItemsToOrder = filteredItems.reduce((sum, item) => {
    const toOrder = getToOrderQuantity(item)
    return sum + (toOrder > 0 ? 1 : 0)
  }, 0)

  function stockStatus(item) {
    const stock = Number(item.stockQuantity) || 0
    const min = Number(item.minStockLevel) || 0
    if (stock <= 0) return 'critical'
    if (stock <= min) return 'warning'
    return 'ok'
  }

  return (
    <AppShell
      title={t('itemsManagementTitle')}
      subtitle={t('showingProducts', { count: filteredItems.length, total: items?.length || 0 })}
      actions={
        <>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: 'none' }}
            onChange={handleImportFile}
          />
          {totalItemsToOrder > 0 && (
            <button type="button" className="btn-shell" onClick={openCreateOrderModal}>
              {t('createOrder', { n: totalItemsToOrder })}
            </button>
          )}
          <button type="button" className="btn-shell" onClick={() => fileInputRef.current?.click()}>
            {t('importStockExcel')}
          </button>
          <button type="button" className="btn-shell is-primary" onClick={handleAdd}>
            {t('addProduct')}
          </button>
        </>
      }
      flush
    >
      <ItemForm
        isOpen={showForm}
        isEditing={isEditing}
        editingItem={editingItem}
        isSaving={isSaving}
        uniqueCategories={uniqueCategories}
        uniqueSuppliers={uniqueSuppliers}
        itemCount={items?.length || 0}
        onSubmit={handleSubmit}
        onChange={handleChange}
        onCancel={handleCancel}
        onDelete={onDeleteFromForm}
      />

      <CreateOrderModal
        isOpen={createOrderModal.isOpen}
        bySupplier={createOrderModal.bySupplier}
        selectedSuppliers={createOrderModal.selectedSuppliers}
        createCombined={createOrderModal.createCombined}
        onToggleSupplier={toggleCreateOrderSupplier}
        onSetCombined={setCreateCombined}
        onConfirm={confirmCreateSelectedOrders}
        onClose={closeCreateOrderModal}
      />

      <ImportStockModal
        importState={importState}
        onApply={handleApplyImport}
        onClose={closeImportModal}
      />

      {!items || items.length === 0 ? (
        <div className="empty-detail">
          <p>{t('noProductsInSystem')}</p>
          <button type="button" className="btn-shell is-primary" onClick={handleAdd}>
            {t('addFirstProduct')}
          </button>
        </div>
      ) : (
        <div className="stocktake">
          <ItemFilters
            filters={filters}
            uniqueCategories={uniqueCategories}
            uniqueSuppliers={uniqueSuppliers}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          <div className="stocktake-head" aria-hidden="true">
            <span>{t('nameColumn')}</span>
            <span className="col-vol">{t('volumeMlLabel')}</span>
            <span className="col-min">{t('alertThresholdLabel')}</span>
            <span className="col-count">{t('stock')}</span>
            <span className="col-order">{t('orderQuantity')}</span>
            <span />
          </div>

          {filteredItems.length === 0 ? (
            <p className="empty-detail">{t('noProductsMatchFilters')}</p>
          ) : (
            <ul className="stocktake-list">
              {filteredItems.map(item => (
                <StockRow
                  key={item._id}
                  item={item}
                  status={stockStatus(item)}
                  categoryName={getCategoryNameFromItem(item) ?? t('noCategory')}
                  toOrder={getToOrderQuantity(item)}
                  onStockChange={handleStockChange}
                  onToOrderChange={handleToOrderChange}
                  onEdit={handleEdit}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </AppShell>
  )
}

/**
 * One line of the stocktake. The count is the point of this screen, so it is
 * editable in place — steppers for walking the bar with one thumb, and a field
 * for typing a number straight in. Nothing here requires opening the item first.
 */
function StockRow({ item, status, categoryName, toOrder, onStockChange, onToOrderChange, onEdit }) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState(String(item.stockQuantity ?? 0))
  const [orderDraft, setOrderDraft] = useState(String(toOrder))

  // The server is the source of truth; re-sync when it sends a different number
  // (another device counted, or an Excel import landed).
  useEffect(() => { setDraft(String(item.stockQuantity ?? 0)) }, [item.stockQuantity])
  useEffect(() => { setOrderDraft(String(toOrder)) }, [toOrder])

  function commitStock(value) {
    const next = Math.max(0, Number(value) || 0)
    setDraft(String(next))
    if (next !== (Number(item.stockQuantity) || 0)) onStockChange(item, next)
  }

  function step(delta) {
    commitStock((Number(draft) || 0) + delta)
  }

  function commitOrder(value) {
    const next = Math.max(0, Number(value) || 0)
    setOrderDraft(String(next))
    if (next !== toOrder) onToOrderChange(item, next)
  }

  return (
    <li className={`stock-row is-${status}`}>
      <div className="stock-id">
        <span className="stock-name">{item.name}</span>
        <span className="stock-meta">
          {categoryName}{item.supplier ? ` · ${item.supplier}` : ''}
        </span>
      </div>

      <span className="col-vol stock-vol">{formatVolume(item.volumeMl, t)}</span>
      <span className="col-min stock-min">{item.minStockLevel || 0}</span>

      <div className="col-count stepper">
        <button
          type="button"
          className="step-btn"
          onClick={() => step(-1)}
          disabled={(Number(draft) || 0) <= 0}
          aria-label={t('decrease')}
        >
          <IconMinus />
        </button>
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className="step-input"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => commitStock(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          onFocus={e => e.target.select()}
          aria-label={`${item.name} — ${t('stock')}`}
        />
        <button type="button" className="step-btn" onClick={() => step(1)} aria-label={t('increase')}>
          <IconPlus />
        </button>
      </div>

      <div className="col-order">
        <input
          type="number"
          inputMode="numeric"
          min="0"
          className="order-input"
          value={orderDraft}
          onChange={e => setOrderDraft(e.target.value)}
          onBlur={e => commitOrder(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
          onFocus={e => e.target.select()}
          aria-label={`${item.name} — ${t('orderQuantity')}`}
        />
      </div>

      <button
        type="button"
        className="stock-edit"
        onClick={() => onEdit(item)}
        aria-label={`${t('edit')} ${item.name}`}
        title={t('edit')}
      >
        ⋯
      </button>
    </li>
  )
}

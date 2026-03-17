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
  const [editingToOrder, setEditingToOrder] = useState({})
  const [editingStock, setEditingStock] = useState({})
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
          price: item.price || 0,
          subtotal: (item.price || 0) * toOrder,
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
        price: row.price,
        subtotal: row.subtotal,
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

  return (
    <div className="items-management-page">
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
      />

      {!items || items.length === 0 ? (
        <div className="empty-state">
          <p className="empty-message">{t('noProductsInSystem')}</p>
          <button className="btn-add" onClick={handleAdd}>
            + {t('addFirstProduct')}
          </button>
        </div>
      ) : (
        <>
          <ItemFilters
            filters={filters}
            uniqueCategories={uniqueCategories}
            uniqueSuppliers={uniqueSuppliers}
            filteredCount={filteredItems.length}
            totalCount={items.length}
            onFilterChange={handleFilterChange}
            onClearFilters={handleClearFilters}
          />

          <div className="header-actions">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
            {totalItemsToOrder > 0 && (
              <button className="btn-create-order" onClick={openCreateOrderModal}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20 7L12 3L4 7M20 7L12 11M20 7V17L12 21M12 11L4 7M12 11V21M4 7V17L12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {t('createOrder', { n: totalItemsToOrder })}
              </button>
            )}
            <button
              className="btn-import"
              onClick={() => fileInputRef.current?.click()}
              title={t('importStockExcel')}
            >
              {t('uploadDocument')}
            </button>
            <button className="btn-add" onClick={handleAdd}>
              + {t('addProduct')}
            </button>
          </div>

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

          {/* Mobile card list */}
          <div className="mobile-items-list">
            <div className="mobile-list-header">
              <span className="mobile-col-name">{t('nameColumn')}</span>
              <span className="mobile-col-stock">{t('stock')}</span>
              <span className="mobile-col-order">{t('orderQuantity')}</span>
            </div>
            {filteredItems.length === 0 ? (
              <p className="empty-table-message">{t('noProductsMatchFilters')}</p>
            ) : (
              filteredItems.map((item) => {
                const toOrder = getToOrderQuantity(item)
                const itemId = item._id
                const isEditingOrder = editingToOrder[itemId]
                const isEditingStk = editingStock[itemId]
                return (
                  <div key={itemId} className="mobile-item-card">
                    <div className="mobile-col-name" onClick={() => handleEdit(item)}>
                      {item.name}
                    </div>
                    <div className="mobile-col-stock" onClick={(e) => { e.stopPropagation(); setEditingStock(prev => ({ ...prev, [itemId]: true })) }}>
                      {isEditingStk ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          defaultValue={item.stockQuantity ?? 0}
                          onBlur={(e) => {
                            handleStockChange(item, e.target.value)
                            setEditingStock(prev => { const s = { ...prev }; delete s[itemId]; return s })
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur()
                            else if (e.key === 'Escape') {
                              setEditingStock(prev => { const s = { ...prev }; delete s[itemId]; return s })
                              e.target.blur()
                            }
                          }}
                          autoFocus
                          className="mobile-inline-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={`stock-badge ${item.stockQuantity <= (item.minStockLevel || 0) ? 'low' : 'ok'}`}>
                          {item.stockQuantity ?? 0}
                        </span>
                      )}
                    </div>
                    <div className="mobile-col-order" onClick={(e) => { e.stopPropagation(); setEditingToOrder(prev => ({ ...prev, [itemId]: true })) }}>
                      {isEditingOrder ? (
                        <input
                          type="number"
                          min="0"
                          step="any"
                          defaultValue={toOrder}
                          onBlur={(e) => {
                            handleToOrderChange(item, e.target.value)
                            setEditingToOrder(prev => { const s = { ...prev }; delete s[itemId]; return s })
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.target.blur()
                            else if (e.key === 'Escape') {
                              setEditingToOrder(prev => { const s = { ...prev }; delete s[itemId]; return s })
                              e.target.blur()
                            }
                          }}
                          autoFocus
                          className="mobile-inline-input"
                          onClick={(e) => e.stopPropagation()}
                        />
                      ) : (
                        <span className={`order-badge ${toOrder > 0 ? 'needs-order' : 'ok'}`}>
                          {toOrder}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>

          <div className="table-container">
            <table className="items-table">
            <thead>
              <tr>
                <th>{t('nameColumn')}</th>
                <th>{t('category')}</th>
                <th>{t('supplier')}</th>
                <th>{t('price')}</th>
                <th>{t('stock')}</th>
                <th>{t('orderQuantity')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className="empty-table-message">
                    {t('noProductsMatchFilters')}
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const toOrder = getToOrderQuantity(item)
                  const itemId = item._id
                  const isEditingOrder = editingToOrder[itemId]

                  return (
                    <tr key={itemId}>
                      <td>
                        <div className="item-name-cell">
                          {item.imageUrl && <img src={item.imageUrl} alt={item.name} className="item-thumb" />}
                          <div>
                            <strong>{item.name}</strong>
                            {item.description && <div className="item-description">{item.description}</div>}
                          </div>
                        </div>
                      </td>
                      <td>{getCategoryNameFromItem(item) ?? t('noCategory')}</td>
                      <td>{item.supplier || '-'}</td>
                      <td>₪{item.price}</td>
                      <td>
                        <span className={`stock-badge ${item.stockQuantity <= (item.minStockLevel || 0) ? 'low' : 'ok'}`}>
                          {item.stockQuantity ?? 0}
                        </span>
                      </td>
                      <td>
                        {isEditingOrder ? (
                          <input
                            type="number"
                            min="0"
                            step="any"
                            defaultValue={toOrder}
                            onBlur={(e) => {
                              handleToOrderChange(item, e.target.value)
                              setEditingToOrder(prev => { const s = { ...prev }; delete s[itemId]; return s })
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') e.target.blur()
                              else if (e.key === 'Escape') {
                                setEditingToOrder(prev => { const s = { ...prev }; delete s[itemId]; return s })
                                e.target.blur()
                              }
                            }}
                            autoFocus
                            className="order-quantity-input"
                          />
                        ) : (
                          <span
                            className={`order-badge ${toOrder > 0 ? 'needs-order' : 'ok'}`}
                            onClick={() => setEditingToOrder(prev => ({ ...prev, [itemId]: true }))}
                            title={t('clickToEdit')}
                          >
                            {toOrder}
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button className="btn-edit" onClick={() => handleEdit(item)} title={t('edit')}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M11.333 2.00001C11.5084 1.82445 11.7163 1.68506 11.9447 1.59123C12.1731 1.4974 12.4173 1.45117 12.6637 1.45534C12.9101 1.45951 13.1523 1.51398 13.3763 1.61538C13.6003 1.71678 13.8012 1.8628 13.9667 2.04445C14.1321 2.2261 14.2585 2.43937 14.3384 2.67091C14.4182 2.90245 14.4497 3.14762 14.4307 3.39068C14.4117 3.63374 14.3426 3.86975 14.2277 4.08334L6.12001 13.3333L2.00001 14L2.66668 9.88001L10.7733 0.63001C10.8882 0.416421 11.0439 0.228215 11.2313 0.0764062C11.4187 -0.0754026 11.6339 -0.188281 11.8637 -0.25534C12.0935 -0.322399 12.3333 -0.342399 12.57 -0.31423C12.8067 -0.286061 13.0353 -0.21023 13.24 -0.09134L11.333 2.00001Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                          <button className="btn-delete" onClick={() => handleDelete(itemId)} title={t('delete')} disabled={isSaving}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M2 4H14M12.6667 4V13.3333C12.6667 13.687 12.5262 14.0261 12.2761 14.2761C12.0261 14.5262 11.687 14.6667 11.3333 14.6667H4.66667C4.31305 14.6667 3.97391 14.5262 3.72386 14.2761C3.47381 14.0261 3.33333 13.687 3.33333 13.3333V4M5.33333 4V2.66667C5.33333 2.31305 5.47381 1.97391 5.72386 1.72386C5.97391 1.47381 6.31305 1.33333 6.66667 1.33333H9.33333C9.68696 1.33333 10.0261 1.47381 10.2761 1.72386C10.5262 1.97391 10.6667 2.31305 10.6667 2.66667V4M6.66667 7.33333V11.3333M9.33333 7.33333V11.3333" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}

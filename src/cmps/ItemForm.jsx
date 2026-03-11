import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'

export function ItemForm({
  isOpen,
  isEditing,
  editingItem,
  isSaving,
  uniqueCategories,
  uniqueSuppliers,
  onSubmit,
  onChange,
  onCancel,
}) {
  const { t } = useTranslation()
  const overlayMouseDownRef = useRef(false)

  if (!isOpen) return null

  return createPortal(
    <div
      className="form-overlay"
      onMouseDown={(e) => { overlayMouseDownRef.current = (e.target === e.currentTarget) }}
      onClick={(e) => {
        if (e.target === e.currentTarget && overlayMouseDownRef.current) onCancel()
        overlayMouseDownRef.current = false
      }}
    >
      <div className="form-container" onMouseDown={() => { overlayMouseDownRef.current = false }} onClick={(e) => e.stopPropagation()}>
        {isEditing ? (
          <div className="form-header-info">
            <span className="form-header-supplier">{editingItem?.supplier || t('noSupplier')}</span>
            <span className="form-header-category">{editingItem?.categoryId || editingItem?.category || t('noCategory')}</span>
          </div>
        ) : (
          <h2>{t('addNewProduct')}</h2>
        )}
        <form onSubmit={onSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label>{t('nameHe')}:</label>
              <input type="text" name="name" value={editingItem?.name || ''} onChange={onChange} required />
            </div>

            <div className="form-group">
              <label>{t('nameEn')}:</label>
              <input type="text" name="nameEn" value={editingItem?.nameEn || ''} onChange={onChange} />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('category')}:</label>
              <input
                type="text"
                name="categoryId"
                list="category-suggestions"
                value={editingItem?.categoryId || editingItem?.category || ''}
                onChange={onChange}
                placeholder={t('enterCategory')}
                required
              />
              <datalist id="category-suggestions">
                {uniqueCategories.map((categoryName) => (
                  <option key={categoryName} value={categoryName} />
                ))}
              </datalist>
            </div>

            <div className="form-group">
              <label>{t('supplier')}:</label>
              <input
                type="text"
                name="supplier"
                list="supplier-suggestions"
                value={editingItem?.supplier || ''}
                onChange={onChange}
                placeholder={t('noSupplier')}
              />
              <datalist id="supplier-suggestions">
                {uniqueSuppliers.map((supplierName) => (
                  <option key={supplierName} value={supplierName} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('price')}:</label>
              <input type="number" name="price" value={editingItem?.price || 0} onChange={onChange} min="0" step="0.01" required />
            </div>
            <div className="form-group">
              <label>{t('stockQuantity')}:</label>
              <input type="number" name="stockQuantity" value={editingItem?.stockQuantity ?? ''} onChange={onChange} min="0" step="any" required />
            </div>
            <div className="form-group">
              <label>{t('alertThresholdLabel')}:</label>
              <input type="number" name="minStockLevel" value={editingItem?.minStockLevel ?? ''} onChange={onChange} min="0" step="any" />
            </div>
            <div className="form-group">
              <label>{t('optimalStock')}:</label>
              <input type="number" name="optimalStockLevel" value={editingItem?.optimalStockLevel ?? ''} onChange={onChange} min="0" step="any" required />
            </div>
          </div>

          <div className="form-group">
            <label>{t('imageUrl')}:</label>
            <input type="url" name="imageUrl" value={editingItem?.imageUrl || ''} onChange={onChange} />
          </div>

          <div className="form-group checkbox-group">
            <label>
              <input type="checkbox" name="isAvailable" checked={editingItem?.isAvailable || false} onChange={onChange} />
              {t('availableForOrder')}
            </label>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-save" disabled={isSaving}>
              {isSaving ? t('loading') : isEditing ? t('update') : t('save')}
            </button>
            <button type="button" className="btn-cancel" onClick={onCancel}>
              {t('cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

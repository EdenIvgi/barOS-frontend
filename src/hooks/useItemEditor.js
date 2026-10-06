import { useMemo, useState } from 'react'
import { useSelector } from 'react-redux'
import { useTranslation } from 'react-i18next'
import { itemService } from '../services/item.service'
import { removeItem, saveItem } from '../store/actions/item.actions'
import { showSuccessMsg, showErrorMsg } from '../services/event-bus.service'

/**
 * Editing a product, wherever the product is shown.
 *
 * The stocktake and the catalogue are two views of one list, so a product has to
 * be editable from either — someone noticing a wrong name while ordering should
 * not have to find the same bottle on another screen. The form, the save and the
 * category normalisation live here once rather than being copied into the second
 * page, which is how the two would drift apart.
 */
export function useItemEditor() {
  const { t } = useTranslation()
  const items = useSelector(storeState => storeState.itemModule.items)

  const [editingItem, setEditingItem] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const uniqueCategories = useMemo(() => {
    const names = new Set()
    for (const item of items || []) {
      const name = getCategoryNameFromItem(item)
      if (name) names.add(name)
    }
    return [...names].sort()
  }, [items])

  const uniqueSuppliers = useMemo(() => {
    const names = new Set()
    for (const item of items || []) {
      if (item.supplier && item.supplier.trim()) names.add(item.supplier.trim())
    }
    return [...names].sort()
  }, [items])

  function openEdit(item) {
    setEditingItem(toEditable(item))
    setIsEditing(true)
    setShowForm(true)
  }

  function openAdd() {
    setEditingItem(itemService.getEmptyItem())
    setIsEditing(false)
    setShowForm(true)
  }

  function close() {
    setShowForm(false)
    setEditingItem(null)
    setIsEditing(false)
  }

  /** Fills several fields at once, the way a scan hands back a whole product. */
  function applyPatch(patch) {
    setEditingItem(prev => ({ ...prev, ...patch }))
  }

  function handleChange(ev) {
    const { name, value, type, checked } = ev.target
    setEditingItem(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'number' ? +value : value,
    }))
  }

  async function handleSubmit(ev) {
    ev.preventDefault()
    try {
      setIsSaving(true)
      await saveItem(toSavable(editingItem))
      showSuccessMsg(isEditing ? t('itemUpdatedSuccess') : t('itemSavedSuccess'))
      close()
    } catch (error) {
      showErrorMsg(t('itemSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  async function remove(itemId) {
    if (!window.confirm(t('confirmDeleteItem'))) return
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

  async function removeFromForm(itemId) {
    await remove(itemId)
    close()
  }

  return {
    openEdit,
    openAdd,
    remove,
    uniqueCategories,
    uniqueSuppliers,
    isSaving,
    formProps: {
      isOpen: showForm,
      isEditing,
      editingItem,
      isSaving,
      uniqueCategories,
      uniqueSuppliers,
      itemCount: items?.length || 0,
      onSubmit: handleSubmit,
      onChange: handleChange,
      onScanned: applyPatch,
      onCancel: close,
      onDelete: removeFromForm,
    },
  }
}

/** The category a product belongs to, whichever shape the record carries it in. */
export function getCategoryNameFromItem(item) {
  if (item?.category?.name) return item.category.name
  if (typeof item?.category === 'string' && item.category) return item.category
  const categoryId = item?.categoryId
  if (!categoryId) return null
  return typeof categoryId === 'object' ? categoryId.toString() : String(categoryId)
}

/** The form edits a category by name, so collapse the record's shape into one. */
function toEditable(item) {
  const editable = { ...item }
  const name = getCategoryNameFromItem(item)
  if (name) editable.categoryId = name
  return editable
}

/**
 * A typed category comes back as a name, not an id. Anything that is not a
 * 24-character hex id is therefore the name of a category.
 */
function toSavable(item) {
  const toSave = { ...item }
  const { categoryId } = toSave
  if (!categoryId) return toSave
  if (typeof categoryId === 'object') {
    toSave.categoryId = categoryId._id || categoryId.toString()
  } else if (!/^[0-9a-fA-F]{24}$/.test(categoryId)) {
    toSave.category = categoryId
  }
  return toSave
}

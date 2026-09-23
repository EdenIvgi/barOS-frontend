import { httpService } from './http.service'

const BASE_URL = 'item/'

export const itemService = {
  query,
  getById,
  save,
  remove,
  updateStock,
  importStock,
  getEmptyItem,
  getDefaultFilter,
}

async function query(filterBy = {}) {
  return httpService.get(BASE_URL, filterBy)
}

async function getById(itemId) {
  return httpService.get(BASE_URL + itemId)
}

async function remove(itemId) {
  return httpService.delete(BASE_URL + itemId)
}

async function save(item) {
  if (item._id) {
    return httpService.put(BASE_URL, item)
  } else {
    return httpService.post(BASE_URL, item)
  }
}

async function updateStock(itemId, quantity) {
  return httpService.put(BASE_URL + `${itemId}/stock`, { quantity })
}

async function importStock(rows, { dryRun = true, mode = 'set', createMissing = false } = {}) {
  return httpService.post(BASE_URL + 'stock/import', { rows, dryRun, mode, createMissing })
}

function getDefaultFilter() {
  return {
    txt: '',
    categoryId: '',
    isAvailable: null,
    minPrice: '',
    maxPrice: '',
    pageIdx: 0,
    sortBy: { type: '', sortDir: 1 },
  }
}

function getEmptyItem() {
  return {
    name: '',
    nameEn: '',
    description: '',
    categoryId: '',
    supplier: '',
    volumeMl: 0,
    imageUrl: '',
    isAvailable: true,
    stockQuantity: 0,
    minStockLevel: 0,
    optimalStockLevel: 0,
    tags: [],
  }
}

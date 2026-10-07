import { httpService } from './http.service'

const BASE_URL = 'recipe/'

export const recipeService = {
    query,
    getById,
    save,
    remove,
    saveMany,
    parseText,
    getIngredients,
    addIngredient,
    formatAmount,
}

async function query(filterBy = {}) {
    return httpService.get(BASE_URL, filterBy)
}

async function getById(id) {
    return httpService.get(BASE_URL + id)
}

async function save(recipe) {
    if (recipe._id) return httpService.put(BASE_URL + recipe._id, recipe)
    return httpService.post(BASE_URL, recipe)
}

async function remove(id) {
    return httpService.delete(BASE_URL + id)
}

async function getIngredients() {
    const res = await httpService.get('ingredient')
    return res.ingredients || []
}

/** An ingredient this bar keeps that the shared catalogue does not know about. */
async function addIngredient(ingredient) {
    return httpService.post('ingredient', ingredient)
}

/** Reads recipes out of pasted text. Saves nothing - these are candidates. */
async function parseText(text) {
    return httpService.post(BASE_URL + 'parse', { text })
}

/** Saves a reviewed batch. Returns how many landed and which were already there. */
async function saveMany(recipes) {
    return httpService.post(BASE_URL + 'bulk', { recipes })
}

/** "60 ml", "2 dash", "8 leaf" - and just the ingredient when no amount is given. */
export function formatAmount(line, t) {
    if (!line?.amount) return ''
    const unit = line.unit && line.unit !== 'ml' ? t(`unit_${line.unit}`, line.unit) : t('unit_ml', 'ml')
    return `${line.amount} ${unit}`
}

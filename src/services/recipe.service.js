import { httpService } from './http.service'
import { barBookService } from './barBook.service'

const BASE_URL = 'recipe/'

export const recipeService = {
    query,
    getById,
    save,
    remove,
    getIngredients,
    addToBarBook,
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
    const res = await httpService.get(BASE_URL + 'ingredients')
    return res.ingredients || []
}

/** "60 ml", "2 dash", "8 leaf" - and just the ingredient when no amount is given. */
export function formatAmount(line, t) {
    if (!line?.amount) return ''
    const unit = line.unit && line.unit !== 'ml' ? t(`unit_${line.unit}`, line.unit) : t('unit_ml', 'ml')
    return `${line.amount} ${unit}`
}

/**
 * Copies a recipe into the bar's own book.
 *
 * The library is read-only and shared; the book is this bar's. Copying rather
 * than linking is deliberate - once it is in the book the bar can change the
 * measures to the ones it actually pours, and nobody else's book moves.
 *
 * The book is one document saved whole, so this reads the current one, appends,
 * and saves it back the same way the Bar Book page does.
 */
async function addToBarBook(recipe, ingredientsBySlug) {
    const content = await barBookService.getContent()
    const pages = Array.isArray(content?.pages) ? [...content.pages] : []

    let index = pages.findIndex(page => page.type === 'recipes')
    if (index === -1) {
        pages.push(barBookService.createPage('recipes', { he: 'מתכונים', en: 'Recipes' }))
        index = pages.length - 1
    }

    const page = pages[index]
    const items = page.items || []

    if (items.some(item => item.librarySlug && item.librarySlug === recipe.slug)) {
        return { added: false, reason: 'already' }
    }

    pages[index] = {
        ...page,
        items: [...items, toBookRecipe(recipe, ingredientsBySlug)],
    }

    await barBookService.saveContent({ pages, baseUpdatedAt: content?.updatedAt })
    return { added: true }
}

// A measure copied into the book is read, not computed, so it is written in the
// language of the line it sits on rather than left in the catalogue's shorthand.
const UNIT_LABELS = {
    ml: { he: 'מ״ל', en: 'ml' },
    cl: { he: 'ס״ל', en: 'cl' },
    oz: { he: 'אונקיה', en: 'oz' },
    g: { he: 'גרם', en: 'g' },
    dash: { he: 'דאש', en: 'dash' },
    drop: { he: 'טיפות', en: 'drops' },
    tsp: { he: 'כפית', en: 'tsp' },
    tbsp: { he: 'כף', en: 'tbsp' },
    leaf: { he: 'עלים', en: 'leaves' },
    sprig: { he: 'ענף', en: 'sprig' },
    piece: { he: 'יחידה', en: 'piece' },
    slice: { he: 'פרוסה', en: 'slice' },
    rim: { he: 'שפה', en: 'rim' },
    pinch: { he: 'קורט', en: 'pinch' },
    wedge: { he: 'פלח', en: 'wedge' },
}

/** The book stores plain { he, en } lines; the library stores structured ones. */
function toBookRecipe(recipe, ingredientsBySlug) {
    const ingredients = (recipe.ingredients || []).map(line => {
        const ing = ingredientsBySlug[line.ingredientId]
        const unit = UNIT_LABELS[line.unit] || UNIT_LABELS.ml
        const measure = lang => (line.amount ? `${line.amount} ${unit[lang]} ` : '')
        return {
            he: `${measure('he')}${ing?.he || line.ingredientId}`.trim(),
            en: `${measure('en')}${ing?.en || line.ingredientId}`.trim(),
        }
    })

    return {
        _id: Date.now().toString(),
        // Where it came from, so the same classic is not added twice.
        librarySlug: recipe.slug || '',
        title: recipe.title || { he: '', en: '' },
        ingredients,
        instructions: toSteps(recipe.instructions),
        imageUrl: '',
    }
}

function toSteps(instructions) {
    const he = instructions?.he || []
    const en = instructions?.en || []
    const length = Math.max(he.length, en.length)
    return Array.from({ length }, (_, i) => ({
        he: he[i] || en[i] || '',
        en: en[i] || he[i] || '',
    })).filter(step => step.he || step.en)
}

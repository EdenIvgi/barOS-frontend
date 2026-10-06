/**
 * The shape a recipe starts as, and the shape one line of it starts as.
 *
 * Kept beside the editor rather than inside it: a file that exports a component
 * and a helper loses fast refresh, and these are needed by the import modal too.
 */
export function emptyLine() {
  return { ingredientId: '', rawText: '', amount: null, unit: 'ml', isOptional: false, isGarnish: false }
}

export function emptyRecipe() {
  return {
    title: { he: '', en: '' },
    method: '',
    glass: '',
    produces: null,
    ingredients: [emptyLine()],
    instructions: { he: [], en: [] },
  }
}

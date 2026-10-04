/**
 * Starting points for a new bar's book.
 *
 * Content is written out in both languages rather than run through
 * `translateField`, so setting up does not wait on the translate service or fail
 * without it. A bar edits these down to its own words in the book's edit mode;
 * the point is that nobody meets an empty page on their first day.
 *
 * Adding a template is a data entry here, not a code change anywhere else.
 */

function items(pairs) {
  return pairs.map(([he, en]) => ({ text: { he, en }, checked: false }))
}

export const SETUP_TEMPLATES = [
  {
    id: 'opening',
    type: 'checklist',
    title: { he: 'צ׳ק ליסט פתיחה', en: 'Opening Checklist' },
    labelKey: 'tplOpening',
    descKey: 'tplOpeningDesc',
    build: () => ({
      items: items([
        ['בדיקת מלאי קרח', 'Check ice stock'],
        ['חיתוך גרנישים לסרוויס', 'Cut garnish for service'],
        ['ניקיון משטחי הבר', 'Clean the bar surfaces'],
        ['בדיקת חביות בירה', 'Check beer kegs'],
        ['סידור עמדת הקוקטיילים', 'Set up the cocktail station'],
        ['מילוי מיץ לימון ומי סוכר', 'Top up lemon juice and sugar syrup'],
        ['בדיקת תוקף יינות פתוחים', 'Check open wines are still good'],
      ]),
    }),
  },
  {
    id: 'closing',
    type: 'checklist',
    title: { he: 'צ׳ק ליסט סגירה', en: 'Closing Checklist' },
    labelKey: 'tplClosing',
    descKey: 'tplClosingDesc',
    build: () => ({
      items: items([
        ['ספירת קופה', 'Count the register'],
        ['שטיפת כוסות וכלי עבודה', 'Wash glassware and tools'],
        ['כיסוי וסידור גרנישים', 'Cover and store garnish'],
        ['ניקוי פוררים ושטיפתם', 'Clean and rinse the pourers'],
        ['כיבוי מקררי תצוגה', 'Turn off the display fridges'],
        ['הוצאת זבל ומחזור', 'Take out rubbish and recycling'],
        ['עדכון חוסרים לאחראי משמרת', 'Report shortages to the shift lead'],
      ]),
    }),
  },
  {
    id: 'handover',
    type: 'checklist',
    title: { he: 'צ׳ק ליסט העברת משמרת', en: 'Shift Handover' },
    labelKey: 'tplHandover',
    descKey: 'tplHandoverDesc',
    build: () => ({
      items: items([
        ['השלמת מלאי ספייר', 'Restock the spares'],
        ['עדכון על חוסרים ותקלות', 'Flag shortages and faults'],
        ['ניקיון עמדה לפני מסירה', 'Clean the station before handing over'],
        ['ספירת קופה ביניים', 'Interim register count'],
      ]),
    }),
  },
  {
    id: 'suppliers',
    type: 'contacts',
    title: { he: 'ספקים', en: 'Suppliers' },
    labelKey: 'tplSuppliers',
    descKey: 'tplSuppliersDesc',
    build: () => ({ contacts: [] }),
  },
  {
    id: 'houseRules',
    type: 'info',
    title: { he: 'נהלי בית', en: 'House Rules' },
    labelKey: 'tplHouseRules',
    descKey: 'tplHouseRulesDesc',
    build: () => ({
      sections: [
        {
          heading: { he: 'קוד לבוש', en: 'Dress code' },
          body: {
            he: 'חולצה לבנה חלקה, סינר נקי ונעליים סגורות.',
            en: 'Plain white shirt, clean apron, closed shoes.',
          },
        },
        {
          heading: { he: 'תלונות אורחים', en: 'Guest complaints' },
          body: {
            he: 'קודם מתקנים עבור האורח, אחר כך מעדכנים את אחראי המשמרת.',
            en: 'Fix it for the guest first, tell the shift lead after.',
          },
        },
      ],
    }),
  },
  {
    id: 'recipes',
    type: 'recipes',
    title: { he: 'מתכונים', en: 'Recipes' },
    labelKey: 'tplRecipes',
    descKey: 'tplRecipesDesc',
    build: () => ({ items: [] }),
  },
  {
    id: 'stock',
    type: 'stock',
    title: { he: 'טבלת מלאי', en: 'Stock Table' },
    labelKey: 'tplStock',
    descKey: 'tplStockDesc',
    build: () => ({
      headers: [
        { he: 'פריט', en: 'Item' },
        { he: 'מלאי אזורי', en: 'Par level' },
        { he: 'מלאי נוכחי', en: 'On hand' },
      ],
      rows: [],
    }),
  },
  {
    id: 'daily',
    type: 'daily',
    title: { he: 'משימות יומיות', en: 'Daily Tasks' },
    labelKey: 'tplDaily',
    descKey: 'tplDailyDesc',
    build: () => ({
      tasks: [
        { day: { he: 'ראשון', en: 'Sunday' }, task: { he: '', en: '' } },
        { day: { he: 'שני', en: 'Monday' }, task: { he: '', en: '' } },
        { day: { he: 'שלישי', en: 'Tuesday' }, task: { he: '', en: '' } },
        { day: { he: 'רביעי', en: 'Wednesday' }, task: { he: '', en: '' } },
        { day: { he: 'חמישי', en: 'Thursday' }, task: { he: '', en: '' } },
        { day: { he: 'שישי', en: 'Friday' }, task: { he: '', en: '' } },
        { day: { he: 'שבת', en: 'Saturday' }, task: { he: '', en: '' } },
      ],
    }),
  },
]

/** Turns a chosen template into a Bar Book page. */
export function templateToPage(template) {
  return {
    _id: crypto.randomUUID(),
    type: template.type,
    customTitle: template.title,
    ...template.build(),
  }
}

/** The two almost every bar runs, pre-selected so the common case is one click. */
export function defaultChosen() {
  return ['opening', 'closing']
}

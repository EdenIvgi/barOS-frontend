# Bar Book redesign

Date: 2026-10-04
Status: approved, ready to implement

## Intent

The Bar Book is not a document with pages. It is the things a bartender does on a
shift. Running a checklist is the default; editing is the rare case and belongs
behind a switch.

Success: a bartender starting an opening shift reaches any checkbox in two taps,
can see how much of a 21-item list is left without counting, and starts a clean
shift with one button. An admin can still do everything the current page allows.

## What is wrong today

`src/pages/BarBookPage.jsx` is 980 lines holding five view components.

1. Three levels of nested navigation to reach one checkbox: rail, page sidebar,
   list index, items.
2. No progress signal on lists that are genuinely long (the real data has a
   21-item opening list and a 26-item closing list).
3. Built for editing: a pencil and an x on every row, when the job is running it.
4. No shift context, though "opening" and "closing" are shift moments.
5. Checks never reset, so after a few days the boxes mean nothing.
6. On phones the nav stacks above the content, so you scroll past all of it.

## Decisions

- **Reset scope.** "New shift" clears checked state on checklists only.
  Checklists belong to a single shift; stock, recipes and daily tasks are
  long-term records and are never touched.
- **Reset trigger.** A manual button, not a date rule. A night shift crossing
  midnight would otherwise be reset mid-run.
- **Tabs.** One flat tab per page, in the order the pages already exist, keeping
  each page's type symbol and title. No grouping, no hiding pages behind a
  second level.
- **Edit mode.** One admin-only Edit switch covering the whole book. Off, there
  are no pencils, no x and no add forms anywhere, and tapping a row only checks
  it. Non-admins never see the switch and always get run mode.
- **No backend change.** The Bar Book is one document; `pages` is saved wholesale
  by the existing debounced autosave with `baseUpdatedAt` conflict detection. The
  reset is a transform over `pages` that the existing save picks up. No new
  endpoint, no schema change.

## Structure

```
src/pages/BarBookPage.jsx            ~200 lines (was 980)
src/cmps/barbook/
  BarBookTabs.jsx           flat tab row, admin rename/delete/add
  ChecklistBoard.jsx        board of cards, or one list being run
  ChecklistRunner.jsx       runs one list
  ProgressRing.jsx          done/total as a ring
  SingleChecklistView.jsx   was ChecklistPageView
  DailyView.jsx             was DailyPageView
  StockView.jsx             was StockPageView
  RecipesView.jsx           was RecipesPageView
  shiftReset.js             pure resetChecks(pages) -> pages
```

`BarBookPage` owns the document and nothing else: load and migrate, the 600ms
debounced save with conflict detection, `activePageId`, `isEditing`, and the two
header actions. Every view keeps one seam, `{ page, isAdmin, isEditing,
onPageChange }`, so a view never learns about saving, tabs, or the other pages.

`ChecklistBoard` and `ChecklistRunner` already exist, written before this spec,
and are kept.

## Data flow

Unchanged except for the reset. A view calls `onPageChange(updatedPage)`, the
page replaces that page in `pages`, and the debounced effect saves the document.

New shift is `setPages(resetChecks(pages))`. `resetChecks` is pure:

- `type: 'checklists'` -> every `lists[].items[].checked` becomes `false`
- `type: 'checklist'`  -> every `items[].checked` becomes `false`
- every other page is returned by identity

It confirms first, naming the number of checks it will clear, because it is the
only action in the book that destroys work in bulk.

## Interaction

**Tabs.** A horizontally scrollable strip under the AppShell header. The active
tab is marked by a filled underline. In edit mode each tab grows a pencil and an
x, and the add-page `+` sits at the end of the strip. The strip stays one line on
a phone and scrolls sideways, instead of stacking above the content.

**Run mode is the default.** A checklist row is one large tap target: box, text,
nothing else. Checked rows dim their text and fill the box. The runner header
carries the title, `done/total`, and the ring. Board to runner is one tap, back is
one tap, so any checkbox is two taps from the tab. In edit mode the same row taps
into a text input with an x beside it, and the runner shows a hint, because the
row changes meaning and should say so.

## Styling

Extends `src/assets/style/cmps/_BarBookPage.scss` with the `bb-board`, `bb-card`,
`runner` and `progress-ring` blocks the components reference, using existing SCSS
variables. No new design tokens.

The ring turns accent-coloured only at 100%, so "nearly there" and "done" do not
look alike at a glance. Layout uses logical properties so Hebrew RTL needs no
mirrored stylesheet. The board is a grid of `auto-fill, minmax(260px, 1fr)`: one
card per row on a phone, a board on a laptop.

## Defects to fix while moving code

- `ChecklistBoard.addList` and `ChecklistRunner.addItem` store raw strings where
  the rest of the book stores `{ he, en }`. Both must await
  `translateField(text, lang)`, matching `ChecklistsPageView`.
- Nine i18n keys the new components reference do not exist: `doneOfTotal`,
  `noItems`, `addList`, `clickToEdit`, `back`, `newShift`, `editMode`, `addTask`,
  `deleteItem`. Add to both `he` and `en` in `src/services/i18.js`.

## Error handling

Unchanged. The conflict banner, load error and loading text stay in the page
shell. The reset flows through the same save path, so a 409 on a reset surfaces
the same banner as a 409 on a checkbox.

## Verification

This repo has no test runner. Verification is `npm run lint` plus the browser
preview:

1. The book loads and the real opening and closing lists show correct counts.
2. Checking items off updates card, ring and count.
3. New shift returns the counts to zero and leaves stock and recipes untouched.
4. With Edit off, nothing anywhere in the book is editable.
5. A list added in edit mode survives a language switch.
6. Both checks repeated at mobile width and in Hebrew.

## Out of scope

Per-user check state, check history, shift records, and any notion of who checked
what. The document stays shared and last-write-wins with conflict detection, as
today.

# Account setup flow

Date: 2026-10-04
Status: approved, ready to implement

## Intent

Signing up today lands you on `/home`, which is a dashboard of zeros: no stock,
no orders, no products, and a Bar Book with nothing in it. The app gives a new
bar no idea what it is for and no way in.

A bar book is whatever that bar decides to keep, so the app cannot guess it — but
it can ask. This flow is the asking: a short pass that defines what this account
holds, run once by the person who created the bar.

Success: an admin who finishes has a book with real pages in it, their suppliers
written down, their stock imported if they had a file, and their invite code in
hand to bring the rest of the staff in. An admin who skips loses nothing and can
come back.

## Decisions

- **Scope** is the whole account: the book, suppliers, products, and the team.
- **Only the admin who created the bar** sees it. Signing up without an invite
  code creates the company and makes you its admin; signing up with one means you
  joined a bar that is already set up, and you go straight to `/home`.
- **Templates arrive pre-filled** with a short generic starter list, in Hebrew and
  English. Facing an empty page is the problem being solved, so creating empty
  pages would solve nothing.
- **Skippable at every step**, and offered again until it is finished or
  explicitly dismissed. Nobody is trapped and nothing silently disappears.

## State

A singleton `setup` document in the **tenant** database, the same shape as
`barBook` — one per bar, not per person, because it is the bar that gets set up.

```js
{
  status: 'pending' | 'done',
  steps: { book: false, suppliers: false, products: false, team: false },
  updatedAt,
}
```

A new `api/setup` module follows the existing layering (routes → controller →
service → model) and is tenant-scoped by the current auth middleware, so the
master database is untouched.

- `GET  /api/setup` — current state, creating the default document on first read.
- `PUT  /api/setup` — mark a step done, or set `status`.

Writes are per step rather than at the end, so leaving halfway keeps whatever was
already chosen.

## Routing

- New `/setup` route, protected and admin-only. A non-admin who types the URL is
  redirected to `/home`.
- `LandingPage` sends a signup with no invite code to `/setup`; everything else
  still goes to `/home`.
- While `status` is `pending`, `HomePage` shows a resume card naming how many
  steps are done, with Continue and Dismiss. Dismiss sets `status: 'done'`.

## The steps

1. **Your book.** Template cards, multi-select. Creates the chosen pages,
   pre-filled, through the existing bar book save.
2. **Suppliers.** Rows of name and phone. Creates a **Contacts page** in the book:
   `supplier` is only a free-text string on an item, so there is no supplier
   entity to populate, and contacts is where a phone number is useful anyway.
3. **Products.** Reuses the existing `importStock` Excel import, or skip. The one
   step whose real work already exists elsewhere in the app.
4. **Team.** Shows the company invite code with a copy button. `getInviteCode` and
   `regenerateInviteCode` already exist on the server with no interface anywhere,
   so this is the first place an admin can see their own code.

## Templates

`src/cmps/setup/setupTemplates.js` holds literal `{ he, en }` content. Nothing
goes through `translateField` during setup, so the flow does not wait on the
translate service or fail without it.

Shipped templates: opening checklist, closing checklist, shift-change checklist,
suppliers (contacts), recipes, house rules (info page), stock table, daily tasks.

Each template names the page type it creates and carries its starter rows, so
adding one later is a data entry, not a code change.

## Error handling

A step that fails to save surfaces the message and leaves the user on that step
with their input intact; it never advances past a write it did not complete. The
bar book writes reuse the existing `baseUpdatedAt` conflict detection.

## Verification

No test runner in this repo. `npm run lint`, then walking the whole flow in the
browser on a throwaway tenant:

1. Signup without an invite code lands on `/setup`; with one lands on `/home`.
2. Picking templates creates exactly those pages, pre-filled, in both languages.
3. Suppliers produce a contacts page whose numbers are `tel:` links.
4. Skipping out mid-flow keeps what was already created and shows the resume card.
5. Continue returns to the right step; Dismiss stops the card coming back.
6. A non-admin sent to `/setup` is redirected.

## Out of scope

Editing template content inside the wizard (the book's own edit mode does that),
inviting staff by email, and any change to how `supplier` is stored on an item.

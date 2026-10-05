# Demo login

Date: 2026-10-05
Status: approved, ready to implement

## Intent

There is no way to see BarOS without creating a bar. Anyone evaluating it — a bar
owner, someone sent a link — has to sign up, name a company, and then face an
empty app. The setup flow fixed the empty part; this fixes having to commit at all.

Success: one click on the landing page puts you inside a working bar with real
stock, orders and a filled bar book, free to change anything, touching no real
data and nobody else's demo.

## Decisions

- **A demo is public**, offered on the landing page to anyone.
- **Every demo session gets its own freshly seeded tenant.** The two requirements
  — "public" and "reset to the same state every time" — only hold together this
  way. One shared demo tenant reset on each login would mean a second visitor
  wiping the first visitor's screen mid-session, which under public traffic is
  the normal case rather than an edge case.
- **A demo can do anything inside its own tenant**, including destructive things.
  It is admin of a disposable bar, and a demo you cannot really use proves nothing.
  Reaching any other tenant stays impossible: the existing JWT carries `dbName`
  and every model is scoped by it.
- **Bounded by a cap and an expiry**, because an unauthenticated endpoint that
  creates databases is otherwise a way to fill the disk.

## Lifecycle

```
POST /api/auth/demo
  → sweep: drop demo tenants older than DEMO_TTL (2h), with their master rows
  → if live demos >= DEMO_MAX (25): reclaim the oldest instead of making one
  → create demo_<random>_db, seed it, create its user + company in master
  → sign the usual token with that dbName, set the usual cookie
```

Nothing here is scheduled: the sweep rides on the next demo login, so the project
gains no cron it has no infrastructure for. A quiet period leaves at most
`DEMO_MAX` idle databases, which is the point of the cap.

Demo tenants are recognised by their `demo_` database prefix *and* a `isDemo`
flag on their company record, so the sweep can never mistake a real bar for one.

## Seed data

`scripts/seed-demo.mjs` already builds categories, 80-odd items with real
shortages, orders including one crossing midnight, and a bar book. Its content
moves to `services/demoSeed.service.js` as `seedDemoData(db)` so the endpoint and
the script share one definition; the script becomes a thin wrapper around it.

## API

- `POST /api/auth/demo` — unauthenticated. Creates the tenant and logs in,
  returning the same shape as login so the client treats it identically.

The account is real: a user row, a hashed random password nobody is told, role
`admin`, `isDemo: true`. It is not a special case in the auth middleware, which
keeps the demo off the critical path of real authentication.

## Client

A third button on the landing auth card, under sign in and create account:
"Try the demo". It calls the endpoint, stores the user like any login, and lands
on `/home` — not `/setup`, because a demo already has a bar worth looking at.

## Error handling

Seeding touches several collections; if any step fails the partly built tenant is
dropped and its master rows removed, so a failed attempt leaves nothing behind.
The button reports the failure and stays usable.

## Verification

No test runner. `npm run lint`, then:

1. The button creates a tenant and lands in a populated app: stock, orders, book.
2. A second demo login gets a *different* tenant, and changes in one are invisible
   in the other.
3. A demo cannot read another tenant: its token's `dbName` is its own.
4. The sweep removes expired demo tenants and their master rows, and leaves real
   bars alone.
5. The cap reclaims rather than growing without limit.
6. A failed seed leaves no tenant and no master rows behind.

## Out of scope

Rate limiting by IP, which needs middleware this project does not have; a demo
that resets itself on a timer; and any banner marking the session as a demo.

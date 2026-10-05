# Light mode

Date: 2026-10-05
Status: approved, ready to implement

## Intent

The app is dark everywhere, which suits a bar at night and suits nothing else.
Stock counts get done in daylight, orders get placed from an office, and a phone
set to light shows an app that ignores it.

Success: the app opens in whatever theme the device is set to, a toggle overrides
that, and every screen is legible and deliberate in both — not a dark design with
the lights turned up.

## Decisions

- **Follows the OS, with a manual override.** Three states: Light, Dark, Auto.
  Auto is the default and tracks `prefers-color-scheme`.
- **The preference is per device**, in `localStorage` under `baros_theme`. Theme
  belongs to where you are, not who you are: the same bartender wants dark on the
  bar's dim tablet and light on their phone outside. It also needs to apply before
  login, which a per-account setting cannot.

## What makes this more than swapping colours

Three things measured in the existing stylesheets:

1. **103 hardcoded `rgba(255, 255, 255, …)` overlays** — borders, hovers, glass
   surfaces, gauge tracks. On dark these lighten a surface. On light they must
   darken one. A token swap cannot see them, so left alone they produce invisible
   borders and white-on-white hover states.
2. **28 `rgba($token, …)` calls**, which stop working the moment a token holds a
   runtime value instead of a compile-time colour.
3. **No colour in the dark palette survives on a light surface.** Measured against
   `#FAF7F2`: the brass accent reaches 2.47 where text needs 4.5, and success,
   warning and error all land near 3.0. Accent and status are therefore
   theme-dependent tokens, not shared constants.

## Approach

CSS custom properties, with the SCSS token names kept as the interface.

```scss
// _vars.scss keeps every name components already use
$bg-surface: var(--bg-surface);
$accent-primary: var(--accent-primary);
```

`:root` carries the dark values, `:root[data-theme='light']` the light ones, and
`@media (prefers-color-scheme: light)` applies light when the choice is Auto.
Because the names do not change, roughly 5,900 lines of existing rules keep
working untouched and only the ~130 spots above are edited.

**Overlays** become their own tokens rather than literals:

```
--overlay-subtle / --overlay / --overlay-strong   // raise a surface
--sunken                                          // press one in
```

Dark defines them white-based, light black-based. Every one of the 103 literals is
replaced by whichever token matches its intent.

**Alpha variants of tokens** become tokens in their own right — `--accent-subtle`,
`--accent-glow`, `--accent-focus` — since `rgba()` cannot take a `var()`.

## Palette

Dark is unchanged. Light, every value checked against the surface it sits on:

| Token | Light | Contrast |
|---|---|---|
| `--bg-deep` (ground) | `#F3EFE8` | — |
| `--bg-surface` | `#FAF7F2` | — |
| `--bg-elevated` / card | `#FFFFFF` | — |
| `--bg-sunken` | `#EDE7DD` | — |
| `--line` / `--line-strong` | `#E0D8CA` / `#CBC0AD` | — |
| `--text-primary` | `#1C1813` | 16.5 |
| `--text-secondary` | `#4A4238` | 9.2 |
| `--text-muted` | `#6B6155` | 5.7 |
| `--accent-primary` | `#8A6420` | 5.0; white on it 5.4 |
| `--color-success` | `#2E7D4F` | 4.7 |
| `--color-warning` | `#B4531F` | 4.7 |
| `--color-error` | `#B23B2A` | 5.5 |

The brass stays brass, only darkened enough to carry text. The warning and accent
collision documented for dark mode applies here too: a warning must never be
signalled by colour alone.

## Applying the theme

A small `theme.service.js` owns the rule: read the stored choice, resolve Auto
against `prefers-color-scheme`, set `data-theme` on `<html>`, and keep listening so
a device switching theme while the app is open follows along.

It is applied in `index.html` by an inline script before the app renders, so a
light-set device never flashes dark first.

A three-state control (Light / Dark / Auto) sits in the app shell beside the
existing language toggle.

## Error handling

`localStorage` can throw in private browsing, so every read and write is wrapped
and falls back to Auto. An unrecognised stored value is treated as Auto.

## Verification

No test runner. `npm run lint`, then in the browser for both themes:

1. Every page renders deliberately in light: dashboard, bar book (board and
   runner), stock, orders, setup, landing.
2. No invisible borders and no hover state that matches its own background —
   the specific failure the overlays would cause.
3. The toggle switches instantly, survives a reload, and Auto follows the OS.
4. No dark flash on load with a light-set device.
5. Contrast spot-checked on rendered pages rather than only in the palette table.

## Out of scope

Per-account theme, a third theme, and restyling anything beyond what light mode
requires.

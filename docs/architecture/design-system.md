# Design system

The app keeps the **visual identity of the V1 tracker** (`static/style.css` in the old repo): a playful, neo-brutalist look in the team's colors. It is **light only** (ADR 0009).

Every screen must follow this document. Use the shared components in `src/components/ui.tsx` instead of styling elements ad hoc. If a screen needs something new, add it there (and here) so the look stays consistent.

## Tokens

Defined once in `src/app/globals.css` (`@theme`) and used as Tailwind classes.

| Token | Value | Tailwind | Use |
|---|---|---|---|
| Navy | `#001f3a` | `bg-navy` | Header bar, logo background |
| Team yellow | `#e9b50b` | `bg-brand` | Primary buttons, table headers, form cards, active tabs |
| Ink | `#000000` | `border-ink` | All borders and hard shadows |
| Cream | `#fbfbb1` | `bg-cream` | Inputs and selects |
| Paper | `#f0f0f0` | `bg-paper` | Zebra rows, footer, disabled fields |
| Success / danger | `#04aa6d` / `#d93025` | `text-success`, `bg-danger` | Attendance ≥ goal, destructive actions |
| Hard shadow | `4px 4px 0 #000` | `shadow-brutal` | Cards, inputs, buttons, tables |
| Big shadow | `10px 10px 0 #000` | `shadow-brutal-lg` | Hero elements (home icon, kiosk code box) |
| Bubble shadow | `12px 12px 2px 1px rgb(0 0 255 / .2)` | `shadow-bubble` | Kiosk "in the lab" bubbles |
| Radius | `5px` | `rounded-brutal` | Everything boxy |
| Float | 4 s ease-in-out | `animate-float` | Kiosk bubbles (disabled with `prefers-reduced-motion`) |

**Font:** League Spartan (`next/font/google`), weight 700–900 for headings and buttons.

## Rules

- **Borders:** 2 px solid black (`border-2 border-ink`); 4 px for hero elements.
- **Shadows:** hard, offset, no blur. Pressing a button moves it into its shadow: `active:translate-x-[3px] active:translate-y-[3px] active:shadow-none`.
- **Text on yellow is black.** V1 used white on yellow, which fails WCAG contrast (about 1.9:1). V2 keeps the look with black text.
- **Header:** navy bar, white links with `#111` hover, the TEAM 1156 logo (`public/logo.avif`) on the right. Favicon: `src/app/icon.jpg`.
- **Forms:** cream inputs with a black border and shadow; the yellow "form card" (`<Card tone="brand">`) for focused tasks such as login and invites.
- **Tables:** `<Table>`, `<Th>`, `<Tr>`, `<Td>`: sticky yellow header, zebra rows, black box with a hard shadow. Put a title above with `<Section>`, not a card around it.
- **Dropdowns:** the native arrow is replaced by a bold chevron with 0.75 rem of space before the border (global `select` rule in `globals.css`). On navy, add `select-on-dark` for a white chevron.
- **Light only:** no `dark:` classes. `color-scheme: light` is set globally.

## Components (`src/components/ui.tsx`)

| Component | V1 origin |
|---|---|
| `Button` (`primary` yellow, `secondary` white, `danger` red) | `.button-confirm`, `.input__button__shadow` |
| `Card` (`white` or `brand`) | `.form` |
| `Field` + `inputClass` | `.input-user-form` |
| `Table`, `Th`, `Tr`, `Td` | `.styled-table`, `.table-wrapper` |
| `Alert`, `PageTitle`, `Section` | new, same rules |

## Charts

Hand-written SVG components in `src/components/charts/` (no chart library), following the dataviz method:

- **Series colors** (validated on white with the dataviz palette validator; all checks pass): worked hours `#2a5d9f` (`--color-chart-worked`) and goal/expected `#b8860b` (`--color-chart-goal`). The literal team navy reads as gray and the team yellow has 1.85:1 contrast, so charts use these team-family steps.
- **Marks:** columns at most 24 px wide with 4 px rounded tops; 2 px lines; 8 px end dots with a 2 px white ring; hairline `#e6e6e6` grid; clean tick values.
- **Identity is never color alone:** every chart has a legend, a hover tooltip (per column, or a crosshair on lines) and a "Ver tabela" table view. Text stays in ink, never in the series color.

## Kiosk (spec 001)

The kiosk recreates V1's attendance page:

- **Code box:** the tilted 3D box (`rotateX(10deg) rotateY(-10deg)`, 4 px border, `shadow-brutal-lg`) with the yellow tag label on its top edge (V1 said "ID DO ALUNO", V2 says "CÓDIGO"). On hover or focus it straightens up with a yellow plus black double shadow.
- **"BATER PONTO" button:** V1's pixel-style button (yellow layer over a dark dotted layer, which moves into place on hover).
- **"Pessoas no laboratório agora":** floating pill bubbles (2 px border, `rounded-[30px]`, `shadow-bubble`, `animate-float`, scale on hover) wrapping in a centered flex row.

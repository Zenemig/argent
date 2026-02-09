---
paths:
  - "components/**"
  - "app/**/*.tsx"
---

# Component Rules

## shadcn/ui

- Theme: New York style, zinc palette, dark mode default, `rounded-xl` border radius.
- Components live in `components/ui/` — these are generated. Do not hand-edit.
- Use `cn()` from `lib/utils` for conditional classes.
- Use `cva` (class-variance-authority) for component variants.
- Check the shadcn/ui registry before building custom components.
- Use Sonner (`<Toaster>`) for toast notifications, not custom solutions.

## Domain Components

- Shot Logger: bottom-anchored controls, thumb-reachable "Save Shot" button.
- Shutter/aperture pickers: scrollable wheel or quick-select grid, not dropdowns.
- Auto-fill: pre-populate new frame from previous frame's settings.
- Roll cards: camera name, film name, frame progress bar, status badge with color.
- Frame timeline: compact list (frame #, shutter, aperture, timestamp, thumbnail).

## Patterns

- Compound components for complex assemblies (Roll editor, Gear bag tabs).
- Context interface: `{ state, actions, meta }` so UI doesn't know the data source.
- `useLiveQuery` for any component displaying Dexie data (auto-updates on change).
- Dynamic import for heavy components: camera capture, export modals, chart libraries.

## Styling

- No custom CSS files. No `@apply`. Tailwind utility classes only.
- `size-*` instead of `h-* w-*` for equal dimensions.
- Mobile-first: design `sm:` breakpoint first, then scale up.
- Touch targets >= 44px for interactive elements.
- Respect `prefers-reduced-motion` and `prefers-color-scheme`.

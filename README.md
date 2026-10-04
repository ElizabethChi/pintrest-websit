# Pinspire — a Pinterest-style visual discovery feed

A pixel-faithful recreation of a Pinterest-style image discovery homepage: fixed 64 px left rail,
compact search row, single-line topic bar, and a true masonry feed of openly licensed images from
the [Openverse](https://api.openverse.org) API.

Built with React 18 + TypeScript + Vite. No UI kit, no CSS framework — the geometry is hand-written
to match the reference at 1727 × 900.

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-checks, then builds to dist/
npm run preview  # serve the production build
```

## Layout, measured against the reference

| Element | Value |
| --- | --- |
| Left rail | 64 px, fixed, 1 px `#EFEFEF` right border |
| Rail icon centres | y = 39 / 103 / 168 / 233 / 298 / 363 / 428, settings anchored near the bottom |
| Search field | starts x = 78, y = 16, 44 px tall, radius 12, background `#E7E7E2` |
| Topic row | 56 px, first label at x = 92, one line, hidden scrollbar, underline on the active item |
| First image row | y = 132 |
| Columns | 7 × 219 px, 14 px gaps, last column ends at x ≈ 1695, ~32 px of right whitespace |

Column count is derived from the **content** width (viewport − 64 px rail − 44 px of padding), not
the viewport, so it lands on 7 at 1727 px and steps down to 5 / 4 / 3 / 2 as space shrinks. Below
900 px the rail collapses into a bottom bar.

The masonry is real: every pin is placed into the currently shortest column and its height is
computed from the API's `width`/`height` metadata before the image loads, so there are no aligned
row bands, no reflow when images arrive, and no overlapping tiles.

## Images and licensing

* Primary source: `https://api.openverse.org/v1/images/` — searched from the browser (Openverse
  supports anonymous browser requests, limited to 20/min and 200/day).
* Topics fire several short queries and merge them; long natural-language queries return nothing on
  Openverse (`q=teal luxury sports car photography` → `result_count: 0`), so they are split up.
* Successful responses are cached in `sessionStorage` for 30 minutes.
* Each pin carries its creator, source page and licence, shown in the detail modal.
* If a search fails or is rate limited, the feed falls back to a few real bundled Openverse records
  (`src/data/bundledPins.ts`) and then to locally generated CC0 vector artwork
  (`src/lib/fallbackArt.ts`), so the gallery is never blank.
* A broken image URL swaps to bundled artwork instead of rendering a broken tile.

## Content safety (always on)

This feed must never surface explicit or horror imagery. Four layers, none of them switchable:

1. **Request** — every call sends `unstable__include_sensitive_results=false`. `mature` is
   deliberately omitted: the API answers `400` when both are present.
2. **Query** — user input is screened before it is sent; explicit/horror/gore/weapon/drug queries are
   refused with an explanation and no request is made (`src/lib/safety.ts`).
3. **Result** — each record is screened on `mature`, `unstable__sensitivity`, title, creator and
   tags. Anything Openverse flags, or that matches the blocklist, is dropped and counted.
4. **Source** — records without a usable image URL are discarded.

The number of screened-out results is shown in the feed and in the *Content filters* panel.

## Structure

```
src/
  App.tsx                 state, search orchestration, saving, dialogs
  lib/openverse.ts        API client: URL building, mapping, screening, caching
  lib/safety.ts           the blocklist and the query/result screens
  lib/masonry.ts          column count, card heights, shortest-column distribution
  lib/fallbackArt.ts      bundled CC0 artwork used when the API is unavailable
  components/             Sidebar, Header, SearchBar, AccountMenu, TopicNavigation,
                          MasonryFeed, MasonryColumn, ImageCard, CardActions,
                          ImageDetailModal, Popover, Dialog, Panels, Toast
```

## Interactions

Search (Enter or 700 ms debounce) · topic filters · click a card for the detail modal · three-dot
menu (Save / Share / Copy link / View source / Hide) · hover reveals the red Save button · saved
pins persist to `localStorage` · infinite scroll to page 5 (Openverse caps anonymous pagination
depth) · account, create, notifications, messages and settings menus all do something real.

Voice search uses the Web Speech API where the browser has it and says so plainly where it does not.
The camera button opens a file picker and states honestly that no recognition service is attached.

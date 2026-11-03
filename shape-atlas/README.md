# Atlas Challenge

Guess the country from its silhouette, or find a named country on the world map. All 197 countries (193 UN members + Vatican City, Palestine, Kosovo, Taiwan), four difficulty levels, and three ways to play.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (logic + data integrity)
npm run build      # static site in dist/
```

## On your phone

Atlas Challenge is an installable web app (PWA): once it's hosted on an HTTPS site, open it on your phone and
- **iPhone (Safari):** tap Share → **Add to Home Screen**
- **Android (Chrome):** tap **Install** on the home-screen card (or ⋮ → Install app)

It then opens full screen with its own icon and works offline: the game, both maps and the fonts are cached on first visit, and flags are cached as they're shown. Updates install automatically on the next launch.

Any static host works (GitHub Pages, Netlify, Vercel): deploy the `dist/` folder from `npm run build`. Installing needs HTTPS, so a phone on your Wi-Fi opening `http://<your-computer>:5173` can play but not install. To try the offline build locally, run `npm run build && npm run preview`.

The icons come from `public/app-icon.svg`; the plugin regenerates every size on each build (`pwa-assets.config.ts`).

## How it plays

| | Easy | Medium | Hard | Very Hard |
|---|---|---|---|---|
| Pool | 45 famous shapes | 101 | 160 | all 197 |
| Shape | filled, continent shown | filled | filled | outline only, slightly rotated, no scale bar |
| Timer | none | 30 s | 20 s | 12 s |
| 4-choice decoys | other continents | same continent | same-region look-alikes | closest look-alikes anywhere |
| Typing help | autocomplete after 1 letter | after 2 | after 3 | none |
| Hints | 3 free | none | none | none |

**Ways to answer:** **4 choices** (name the silhouette), **Typing** (a country is lit up on the world map; type its name, with neighbour names as a hint), or **Find on map**: you get the country's name (plus flag on Easy/Medium) and tap it on a pannable, zoomable world map. Map mode gets 10 extra seconds, offers a shape hint instead of letters, and hides borders on Very Hard. Tiny countries have dots so they're tappable.

**Modes:** Classic (15 shapes), Survival (3 lives, harder every 10 correct), Daily (10 shapes, same for everyone, one attempt, shareable result).

**Scoring:** base × speed bonus (up to ×1.5) × streak multiplier (up to ×2).

**Keys:** `1`–`4` pick a choice · `Enter` submit / confirm map pick / next · `H` hint (Easy) · `Esc` pause.

## Project layout

- `scripts/build-countries.ts`: builds `src/data/countries.json` and the pre-projected `src/data/worldmap.json` from Natural Earth 1:10m (`npm run build:data`). Each country is projected on its own (azimuthal equal-area centred on it) and simplified to fit a 1000×1000 viewBox. Rules for which overseas parts to drop are in `scripts/overrides.ts`, and difficulty tiers are in `scripts/tiers.ts`.
- `src/game/`: pure, tested logic: difficulty specs, question and decoy generation, answer matching (aliases, diacritics, typo tolerance), scoring, the game reducer, daily seeding.
- `src/components/`, `src/screens/`: React UI (Tailwind 4, motion, lucide icons).
- `src/store/`: settings and records persisted to `localStorage`.
- Open `/#debug` to see all 197 shapes in a grid (or `/?only=FRA,JPN` for specific ones).

Map data © [Natural Earth](https://www.naturalearthdata.com/) (public domain). Flags from [flag-icons](https://github.com/lipis/flag-icons) (MIT).

# Shape Atlas

Guess the country from its silhouette. All 197 countries (193 UN members + Vatican City, Palestine, Kosovo, Taiwan), four difficulty levels, and two ways to answer.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests (logic + data integrity)
npm run build      # static site in dist/
```

## How it plays

| | Easy | Medium | Hard | Very Hard |
|---|---|---|---|---|
| Pool | 45 famous shapes | 101 | 160 | all 197 |
| Shape | filled, continent shown | filled | filled | outline only, slightly rotated, no scale bar |
| Timer | none | 30 s | 20 s | 12 s |
| 4-choice decoys | other continents | same continent | same-region look-alikes | closest look-alikes anywhere |
| Typing help | autocomplete after 1 letter | after 2 | after 3 | none |
| Hints | 3 free | 3 × −30 | 2 × −50 | 1 × −120 |

**Modes:** Classic (15 shapes), Survival (3 lives, harder every 10 correct), Daily (10 shapes, same for everyone, one attempt, shareable result).

**Scoring:** base × speed bonus (up to ×1.5) × streak multiplier (up to ×2) − hint costs.

**Keys:** `1`–`4` pick a choice · `Enter` submit / next · `H` hint · `Esc` pause.

## Project layout

- `scripts/build-countries.ts`: builds `src/data/countries.json` from Natural Earth 1:10m (`npm run build:data`). Each country is projected on its own (azimuthal equal-area centred on it) and simplified to fit a 1000×1000 viewBox. Rules for which overseas parts to drop are in `scripts/overrides.ts`, and difficulty tiers are in `scripts/tiers.ts`.
- `src/game/`: pure, tested logic: difficulty specs, question and decoy generation, answer matching (aliases, diacritics, typo tolerance), scoring, the game reducer, daily seeding.
- `src/components/`, `src/screens/`: React UI (Tailwind 4, motion, lucide icons).
- `src/store/`: settings and records persisted to `localStorage`.
- Open `/#debug` to see all 197 shapes in a grid (or `/?only=FRA,JPN` for specific ones).

Map data © [Natural Earth](https://www.naturalearthdata.com/) (public domain). Flags from [flag-icons](https://github.com/lipis/flag-icons) (MIT).

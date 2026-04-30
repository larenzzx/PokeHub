# PokeHub

A React, TailwindCSS, and DaisyUI Pokemon app with a fast Pokedex, team builder, battle history, and classic turn-based battle simulation.

## Features

- Paginated full Pokedex using PokeAPI `limit` and `offset`
- Cached Pokemon detail, type, and weakness requests to reduce repeated API calls
- Responsive Pokemon cards with lazy-loaded detail modal data
- Team builder backed by the local JSON server
- Battle history backed by the local JSON server
- Stats-based battle mode
- Classic battle mode with HP, moves, turn order, damage calculation, battle messages, reset state, and sprite animations
- Battle intro transition with optional sound controls
- Optional audio support with fallback generated tones if files are missing

## Project Structure

- `src/api` - PokeAPI and local JSON server helpers
- `src/components` - shared UI components
- `src/hooks` - reusable React hooks, including battle audio
- `src/pages` - route-level pages
- `src/utils` - type styling, formatting, and battle logic
- `public/audio` - optional audio files

## Installation

```bash
npm install
```

## Development

Run the React app:

```bash
npm run dev
```

Run the local JSON server in a separate terminal for team and battle history persistence:

```bash
npm run server
```

The app still loads if the local JSON server is not running, but team and battle history writes will not persist.

## Build

```bash
npm run build
```

Preview a production build:

```bash
npm run preview
```

## Audio Files

Audio is optional and browser-safe. Music starts only after user interaction through battle start or sound controls.

Place lightweight files here if desired:

- `public/audio/main-theme.mp3`
- `public/audio/battle-theme.mp3`
- `public/audio/battle-start.mp3`
- `public/audio/attack.mp3`
- `public/audio/win.mp3`
- `public/audio/lose.mp3`
- `public/audio/click.mp3`

If a file is missing or blocked, the app falls back gracefully.

## Vercel Deployment

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Use the default Vite settings:
   - Build command: `npm run build`
   - Output directory: `dist`
4. Deploy.

No environment variables are required for the public PokeAPI integration. The local JSON server is for development only; for production persistence, replace it with a hosted API or database.

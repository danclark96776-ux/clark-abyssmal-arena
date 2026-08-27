# Abysmal Arena

A browser-only Three.js fighting game. It has no build step or backend, but it now uses browser ES modules so gameplay code, presentation, and embedded game data have clear ownership.

## Run locally

Use a local static server because ES modules are not reliably available from `file://` URLs:

```powershell
python -m http.server 8001
```

Open `http://localhost:8001/abysmal-arena.html`.

## Deploy to GitHub Pages

This project is already set up as a static Vite app, so GitHub Pages can host it with the built `dist` output.

1. Push the repo to GitHub.
2. In the GitHub repository, open Settings → Pages.
3. Set source to GitHub Actions.
4. The included workflow in `.github/workflows/deploy-pages.yml` will build and publish the game automatically on pushes to `main`.
5. After the workflow finishes, the site will be available at:

```text
https://<your-user>.github.io/<your-repo>/
```

The app includes a root redirect page so the landing URL opens correctly.

## Controls

Player 1 uses `A` and `D` to move, `W` to jump, `S` to guard, `E` for light attack, `Q` for heavy attack, and `F` for special. In local two-player mode, player 2 uses the arrow keys for movement, with the alternate attack keys handled by the game.

Each fighter has a unique special move with its own cost, damage scaling, and visual color burst.

## Structure

```text
abysmal-arena.html    Static application shell and third-party CDN scripts
styles/game.css       All visual styles and responsive layout rules
src/app.js            UI orchestration, match lifecycle, input, animation loop
src/data/config.js    Combat tuning and fighter roster definitions
src/data/stages.js    Stage data, texture cache, and stage selection
src/data/assets.js    Embedded sprites plus local IndexedDB-backed HD model import
src/game/fighter.js   Fighter state machine, hit detection, and animation
src/game/ai.js        CPU opponent decision logic
```

`src/data/assets.js` and `src/data/stages.js` are deliberately isolated because they contain the large embedded image payloads. A future asset pipeline can move these payloads into optimized files without touching the combat or UI modules.
[00-vision-overview.md](https://github.com/user-attachments/files/31376063/00-vision-overview.md)
[01-world-lore.md](https://github.com/user-attachments/files/31376065/01-world-lore.md)[CONTRIBUTING.md](https://github.com/user-attachments/files/31376074/CONTRIBUTING.md)
[05-open-questions-gaps.md](https://github.com/user-attachments/files/31376070/05-open-questions-gaps.md)
[04-3d-asset-status.md](https://github.com/user-attachments/files/31376069/04-3d-asset-status.md)
[03-art-style-guide.md](https://github.com/user-attachments/files/31376067/03-art-style-guide.md)
[02-characters.md](https://github.com/user-attachments/files/31376066/02-characters.md)
[README.md](https://github.com/user-attachments/files/31376075/README.md)

# DOMCollegeTask Tic-Tac-Toe

**Student's project that demonstrates frontend & native JS DOM knowledge.**

A frontend-only tic-tac-toe game with custom vector symbols, per-player colours, light/dark themes, a bot ladder, undo, statistics, and replay.

> **Status:** the static HTML/CSS shell, the empty module skeleton, and the behaviour spec are in place; the JavaScript implementation is in progress. Deployment target: GitHub Pages.

## AI Usage disclousre.
- **AI Agent was used to assist with writing fully or partially:**
  - *HTML / CSS* - styles/static markup.
  - Documentation (such as this README.md).
  - Env setup.
  - Testing.
- **AI Agent was NOT used to write any:**
  - JS files containing website dynamic logic. *Guidance/informational assist was used only for these files.*

## What is included (v1)

### One page

- No backend, no login, no real multiplayer.
- Everything happens on one page; replay is a view of the same page.

### Game

- 3×3 board, empty at start.
- Hover/focus preview of the current player's symbol.
- First move: random / Player 1 / Player 2; against the bot the labels become Player / Bot; saved.
- Win line, dimmed board, tie state, and Play again.
- Undo: rewinds to the start of your last turn; against the bot it also removes the bot's reply.
- Keyboard-operable cells with accessible labels.

### Player naming

Status, win, history, statistics, first-move choices, player-look headings, and symbol-group labels use **roles**, not symbol names:

- PvP: `Player 1` and `Player 2`.
- Against the bot: `Player` (human) and `Bot`.

Symbols are display only; the statistics rows show both the role text and the current symbol icon.

### Personalisation

- Eight vector symbols: X, O, star, heart, bolt, diamond, moon, triangle. Each player picks one; the second player cannot use the first player's symbol (they swap).
- Per-player colour with a native colour picker; the turn/win status pill, win line, statistics, and history follow.
- Light / dark / auto theme; saved.
- Appearance (theme, symbols, colours) applies live; match settings apply from the next game.

### Opponents

- Two players on one device (PvP).
- Bot modes: tries to lose, easy, medium, hard, impossible.
- The human is Player, the bot is Bot (internally slots `x` / `o`); the first-move setting can make the bot start.
- “Impossible” cannot be beaten, only drawn; “tries to lose” is the demo mode where a competent human always wins.

### Statistics, history, replay

- Last 10 results with opponent/difficulty metadata.
- Win rate per role (Player 1 / Player 2 in PvP, Player / Bot against the bot).
- Step-through replay with back / play-pause / next / exit.
- Starting a replay mid-game warns that it resets the current game progress; there is no save/restore of a live game.
- Everything persists in `localStorage` under `domcollege.ttt.v1`; no backend.

## Post-v1 (later)

1. **Variable / infinite board** — a larger or unbounded board with more marks needed to win.
2. **Recursive tic-tac-toe** — to place a symbol on the current board you have to win a sub-game of tic-tac-toe that starts when you choose that place.
3. Leaderboards / log-in would need a backend and real multiplayer would need auth, a database, and anti-cheat; all out of scope.

## Stack

- HTML
- CSS
- JavaScript (vanilla DOM, ES modules; no DOM libraries)
- `localStorage` for persistence
- GitHub Pages for deployment: root `index.html`, relative paths, no build step

## Running it locally (if needed)

Serve the **project root** and open `/`:

- VS Code Live Server: right-click the root `index.html` → *Open with Live Server*.
- Or `npx serve .` in the project root and open the printed URL.
# DOMCollegeTask Tic-Tac-Toe

**Student's project that demonstrates frontend & native JS DOM knowledge.**

**This example consists of a pretty simple tic-tac-toe game.**

**All of this project is frontend-only.**

## Content
*(Planned)*

### 1. One webpage containing all functionality.
*Reason: not much to add besides one page for the game in question, besides leaderbords/log-in -> but that requires proper backend.*
*Note: maybe this will become 2 pages for 'replay' functionality specifically.*

### 2. Main topic: tic-tac-toe game. Simple, yet, there are a lot of interactivity potential.

**What is included:**
- 3x3 playing field. Starts empty.
- Ability to add next symbol (O or X) to the board. On hover - shows preview of said symbol as semi-transparent.
- Starting symbol: either random (PRNG) or specific selected. Separate interactive setting for that and it is saved in cache. Default is random.
- Win/tie conditions:
  - Regardless of the game's end - a button appears to re-start the game.
  - When one player wins - line crosses the winning 3 symbols. Board is grayed out after that.
  - When nobody wins (tie) - board is simply grayed out.
3. Additional info: last 10 games results + win/lose statistics shown (winrate % for each symbol).
4. Ability to play against a bot (3 difficulties):
  - Impossible (bot plays perfectly, you can only win by playing first & using perfect strat)
  - Medium (some % chance bot plays suboptimally)
  - Free (bot always plays the worst move)

## Other 
*(Later/Possible additions)*

### 1. Ability to choose custom symbols, and not just 'O' and 'X' from a menu, for each player.
### 2. Game re-plays on pressing any of 'last 10 games'.

## Stack
- HTML
- CSS
- JS
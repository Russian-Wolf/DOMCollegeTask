const storage = {
  key: 'domcollege.ttt.v1',
  historyLimit: 10,
}

// Numbers are milliseconds.
const timing = {
  botDelay: 400,
  replayStep: 600,
}

// bestChance is a chance to play the best move in a given position vs random legal move.
const botDifficultyMap = {
  lose: { label: 'Tries to lose', bestChance: 0 },
  easy: { label: 'Easy', bestChance: 0.2 },
  medium: { label: 'Medium', bestChance: 0.5 },
  hard: { label: 'Hard', bestChance: 0.85 },
  impossible: { label: 'Impossible', bestChance: 1 },
}

// by opponent selected
const roleNames = {
  human: { p1: 'Player 1', p2: 'Player 2' },
  bot: { p1: 'Player', p2: 'Bot' },
}

const defaultSettings = {
  theme: 'auto',
  firstPlayer: 'random',
  opponent: 'human',
  difficulty: 'medium',
  symbols: { p1: 'x', p2: 'o' },
  colors: { p1: '#0e86b3', p2: '#2e9460' },
}

const initialStats = {
  total: 0,
  wins: { p1: 0, p2: 0 },
  ties: 0,
}

export const CONFIG = {
  storage,
  timing,
  botDifficultyMap,
  roleNames,
  defaultSettings,
  initialStats,
}

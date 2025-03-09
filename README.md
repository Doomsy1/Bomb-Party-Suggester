# Bomb Party Suggester

A helper script for JKLM.FUN's Bomb Party game that suggests words based on the current syllable.

## Quick Start

1. Install [Tampermonkey](https://www.tampermonkey.net/)
2. Click [here](https://cdn.jsdelivr.net/gh/Doomsy1/Bomb-Party-Suggester@main/src/main.js) to install
3. Go to [JKLM.FUN](https://jklm.fun) and play!

## Features

- 3 dictionary sizes: 5k, 20k, or 170k words
- Sort by frequency, length, or rarity
- Realistic typing simulation
- Adjustable typing settings

## Development

The project is organized into modular files:
- `src/main.js` - Main entry point
- `src/styles.js` - UI styles definition
- `src/utils.js` - Helper utilities
- `src/typer.js` - Typing simulation logic
- `src/dictionaries.js` - Dictionary loading and word matching
- `src/ui.js` - UI creation and management

## How It Works

This userscript:
1. Creates a UI panel that floats over the game
2. Loads dictionaries of varying sizes with word frequency data
3. Observes the syllable provided by the game
4. Finds and sorts matching words
5. Allows clicking on words to type them with realistic timing

## Credits

Word lists from:
- [English Words](https://github.com/filiph/english_words)
- [Google 10000 English](https://github.com/first20hours/google-10000-english)
- [ENABLE Dictionary](https://github.com/dolph/dictionary)

## License

MIT
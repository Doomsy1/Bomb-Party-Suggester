# 🎲 Bomb Party Helper

Enhance your gameplay on [Bomb Party](https://jklm.fun) by quickly finding word suggestions during your turn!

## 📁 Project Structure

The project is organized into the following directories:

```
bomb-party/
├── dist/                  # Compiled userscript output
├── src/                   # Source code
│   ├── core/              # Core functionality
│   │   ├── dictionaryLoader.js  # Dictionary loading and word matching
│   │   └── typer.js       # Auto-typing functionality
│   ├── ui/                # User interface components
│   │   ├── styles.js      # UI styling
│   │   ├── main.js        # Main UI components
│   │   ├── dragResize.js  # Dragging and resizing functionality
│   │   ├── observer.js    # DOM observation for game state
│   │   ├── settings.js    # Settings panel
│   │   └── suggester.js   # Word suggestion display
│   ├── utils/             # Utility functions
│   ├── assets/            # Static assets
│   ├── config/            # Configuration files
│   │   └── userScriptMeta.js # Userscript metadata
│   └── index.js           # Main entry point
├── esbuild.config.js      # Build configuration
├── server.js              # Development server
├── package.json           # Project dependencies
└── README.md              # Project documentation
```

## 🚀 Features

- **Instant Word Suggestions** (sorted by frequency, length, or value)
- **Auto-Typing**: Click-to-enter suggested words
- **Customizable UI**: Move, resize, and theme your helper
- **Easy Setup**: Instantly activates when playing Bomb Party

## 🛠️ Development

### Prerequisites

- Node.js and npm

### Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the userscript: `npm run build`

### Development Workflow

1. Make changes to files in the `src/` directory
2. Run `npm run build` to compile the userscript
3. The compiled userscript will be available in `dist/bomb-party-suggester.user.js`

### Local Development

For local development:
1. Run `npm start` to start the development server
2. The server will run at http://localhost:8080
3. Use the development userscript (`development.user.js`) which loads files directly from the server

## ⚠️ Note

Please play responsibly—use this tool to improve vocabulary and enjoy the game! 
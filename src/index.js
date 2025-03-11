// main entry point for the Bomb Party Suggester

// First import core functionality
import './core/typer.js';
import './core/dictionaryLoader.js';

// Then import UI components in the correct dependency order
import './ui/styles.js';
import './ui/dragResize.js';
import './ui/settings.js';
import './ui/suggester.js';
import './ui/main.js';
import './ui/observer.js';

// initialize the application
(function () {
  'use strict';

  if (typeof window.BPS !== 'undefined') {
    window.BPS.loadAllDictionaries().then(() => {
      window.BPS.initScript();
    });
  }
})(); 
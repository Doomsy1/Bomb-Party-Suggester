// esbuild.config.js
const fs = require('fs');
const esbuild = require('esbuild');
const path = require('path');

// Get the root directory
const rootDir = path.resolve(__dirname, '..');

// 1. Read your user script metadata from a separate file
const userScriptBanner = fs.readFileSync(path.join(rootDir, 'src/config/userScriptMeta.js'), 'utf8');

// 2. Run esbuild with a nice, short config
esbuild.build({
  entryPoints: [path.join(rootDir, 'src/index.js')],
  bundle: true,
  format: 'iife',
  outfile: path.join(rootDir, 'dist/bomb-party-suggester.user.js'),

  // Put the entire metadata block at the top
  banner: {
    js: userScriptBanner
  },

  minify: false,
  minifyWhitespace: false,
  minifyIdentifiers: false,
  minifySyntax: true,
  
  // Remove console.log statements and comments
  plugins: [
    {
      name: 'remove-console-logs',
      setup(build) {
        build.onLoad({ filter: /\.js$/ }, async (args) => {
          const source = await fs.promises.readFile(args.path, 'utf8');
          const transformed = source
            .replace(/console\.log\s*\([^)]*\)\s*;?/g, '')
            .replace(/console\.error\s*\([^)]*\)\s*;?/g, '');
          
          return { contents: transformed, loader: 'js' };
        });
      }
    }
  ]
}).then(() => {
  process.exit(0);
}).catch((error) => {
  process.exit(1);
});

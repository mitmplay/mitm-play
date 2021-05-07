const esbuild = require('esbuild')
esbuild.build({
  entryPoints: ['ws-client/_src/index.js'],
  outfile: 'ws-client/index.js',
  bundle: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('watch build succeeded:', result)
    },
  },
  sourcemap: 'inline',
  target: ['chrome89'],
  // minifyWhitespace: true,
}).then(result => {
  result.stop()
}).catch(() => process.exit(1))  
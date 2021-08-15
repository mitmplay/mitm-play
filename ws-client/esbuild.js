const esbuild = require('esbuild')
const _c = 'color: #bada55'

esbuild.build({
  entryPoints: ['ws-client/_src/index.js'],
  outfile: 'ws-client/index.js',
  bundle: true,
  watch: {
    onRebuild(error, result) {
      if (error) console.error('watch build failed:', error)
      else console.log('%cMacros: watch build succeeded:', _c, result)
    },
  },
  sourcemap: 'inline',
  target: ['chrome89'],
  // minifyWhitespace: true,
}).then(result => {
  result.stop()
}).catch(() => process.exit(1))  
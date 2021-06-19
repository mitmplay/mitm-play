const esbuild = require('esbuild')
const fs = require('fs-extra')
const { logmsg } = global.mitm.fn

function bundleEsbuild(bpath, opath) {
  esbuild.build({
    entryPoints: [bpath],
    outfile: opath,
    bundle: true,
    sourcemap: 'inline',
    target: ['chrome89'],
    minifyWhitespace: true,
    // minify: true,
  }).then(prm => {
    fs.removeSync(bpath)
  }).catch(err => {
    logmsg(err)
    process.exit(1)
  })
}
module.exports = bundleEsbuild
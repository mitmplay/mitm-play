const genBuild = require('./build-macros/builder')

const {
  lib:{c, fg, chokidar},
  fn:{logmsg},
} = global.mitm

function addMacro (path) { genBuild('add', path) }
function chgMacro (path) { genBuild('chg', path) }

function delMacro (path) {
  const { win32 } = global.mitm
  win32 && (path = path.replace(/\\/g, '/'))
  logmsg(c.red(`Macro del: ${path}`))
}

module.exports = () => {
  const {argv} = global.mitm
  const glob = [
    `${argv.route}/*/_macros_/macros.js`,
    `${argv.route}/*/_macros_/*@macros.js`,
  ]

  // Initialize watcher.
  logmsg(c.magentaBright('>>> Macros watcher:'), glob)
  const macrosWatcher = chokidar.watch(glob, { persistent: true })

  macrosWatcher // Add event listeners.
    .on('add', path => addMacro(path))
    .on('change', path => chgMacro(path))
    .on('unlink', path => delMacro(path))
  global.mitm.watcher.macrosWatcher = macrosWatcher
  const files = fg.sync(glob) //[`${argv.route}/*/_macros_/*@macros.js`]
  let glob2 = {}
  for (const fpath of files) {
    const pre = `${argv.route}/`
    const wopre = fpath.replace(/\\/g, '/').replace(pre, '')
    let [ns, p1, p2] = wopre.split('/')
    let [app] = p2.split(/@/)
    app==='macros.js' && (app = '$')
    glob2[`${argv.route}/${ns}/${p1}/${app}/*.js`] = true
  }
  glob2 = Object.keys(glob2).sort()
  const macro2Watcher = chokidar.watch(glob2, { persistent: true })

  function rebuild (path) {
    path = path.replace(/\\/g, '/')
    const [p1, p2] = path.split('_macros_/')
    let app = p2.split('/')[0]
    if (app!=='$') {
      app = `${p1}_macros_/${app}@macros.js`
    } else {
      app = `${p1}_macros_/macros.js`
    }
    genBuild('rebuild', app)
  }
  setTimeout(() => {
    logmsg(glob2)
    macro2Watcher // Add event listeners.
    .on('add', path => rebuild(path))
    .on('change', path => rebuild(path))
    .on('unlink', path => rebuild(path))
    global.mitm.watcher.macro2Watcher = macro2Watcher      
  }, 1000)
}

const c = require('ansi-colors')
const chokidar = require('chokidar')
const broadcast = require('./broadcast')
const { logmsg } = global.mitm.fn

const showFiles = global._debounce(broadcast('cache'), 1002, 'cache')

function addCache (path) {
  const { win32, files: { cache } } = global.mitm
  win32 && (path = path.replace(/\\/g, '/'))
  cache.push(path)
  showFiles()
}

function delCache (path) {
  const { win32, files: { cache } } = global.mitm
  win32 && (path = path.replace(/\\/g, '/'))
  const idx = cache.indexOf(path);
  (idx > -1) && cache.splice(idx, 1)
  showFiles()
}

module.exports = () => {
  const { home } = global.mitm.path
  const glob = Object.keys(global.mitm.argv.browser).map(x => `${home}/${x}/**/cache/**`)

  // Initialize watcher.
  logmsg(c.magentaBright('cache watcher:'), glob)
  const cacheWatcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  })

  cacheWatcher // Add event listeners.
    .on('add', path => addCache(path))
    .on('unlink', path => delCache(path))
  global.mitm.watcher.cacheWatcher = cacheWatcher
}

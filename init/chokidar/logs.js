const fs = require('fs-extra')
const c = require('ansi-colors')
const chokidar = require('chokidar')
const broadcast = require('./broadcast')

const showFiles = global._debounce(broadcast('log'), 1001, 'log')
const slash = p => p.replace(/\\/g, '/')

function addLog (path) {
  const { files: { _log, log } } = global.mitm
  log.push(path)
  const meta = path.replace(/\/log\/[^/]+/, m => `${m}/$`)
  fs.readFile(meta.replace(/.\w+$/, '.json'), (err, data) => {
    if (err) {
      _log[path] = {
        general: {
          ext: '',
          status: '',
          method: '',
          url: path
        }
      }
    } else {
      let json
      try {
        json = JSON.parse(`${data}`)
        const g = json.general
        g.path = (new URL(g.url)).pathname
      } catch (error) {
        json = {
          error: 'Error: JSON.parse',
          data: `${data}`
        }
      }
      _log[path] = json
    }
  })
  showFiles()
}

function delLog (path) {
  const { files: { _log, log } } = global.mitm
  _log[path] && delete _log[path]
  const idx = log.indexOf(path);
  (idx > -1) && log.splice(idx, 1)
  showFiles()
}

module.exports = () => {
  const home = global.mitm.path.home
  let glob = Object.keys(global.mitm.argv.browser).map(x => `${home}/${x}/**/log/**`)
  if (glob.length === 1) {
    glob = glob[0]
  }

  // Initialize watcher.
  const msg = global.mitm.fn.tilde(typeof glob === 'string' ? glob : JSON.stringify(glob))
  console.log(c.magentaBright(`watcher(log): ${msg}`))
  const logWatcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  })

  logWatcher // Add event listeners.
    .on('add', p => { p = slash(p); addLog(p) })
    .on('unlink', p => { p = slash(p); delLog(p) })
  global.mitm.watcher.logWatcher = logWatcher
}

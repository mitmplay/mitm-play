const c = require('ansi-colors')
const fg = require('fast-glob')
const chokidar = require('chokidar')
const _broadcast = require('./broadcast')
const loadJS = require('./loadJS')

const broadcast = _broadcast('route')
const slash = p => p.replace(/\\/g, '/')

module.exports = () => {
  const { win32 } = global.mitm
  const { tilde } = global.mitm.fn
  const { userroute } = global.mitm.path
  const files = fg.sync([userroute])

  function updateJS (path, msg) {
    win32 && (path = path.replace(/\\/g, '/'))
    loadJS(path, msg, broadcast)
  }

  function remove (path, msg) {
    win32 && (path = path.replace(/\\/g, '/'))
    loadJS.remove(path, msg, broadcast)
  }

  if (!files.length) {
    console.log('>>> no watcher', userroute, files)
    return
  }

  // Initialize watcher.
  const msg = tilde(userroute)
  console.log(c.magentaBright(`watcher(route): ${msg}`))
  const urouteWatcher = chokidar.watch(userroute, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true
  })

  // Something to use when events are received.
  const log = console.log.bind(console)
  urouteWatcher // Add event listeners.
    .on('add', p => {    p = slash(p); updateJS(p, c.greenBright(`>>> add route ${tilde(p)}`)) })
    .on('change', p => { p = slash(p); updateJS(p, c.cyanBright( `>>> chg route ${tilde(p)}`)) })
    .on('unlink', p => { p = slash(p); remove(  p, c.redBright(  `>>> del route ${tilde(p)}`)) })
  global.mitm.watcher.urouteWatcher = urouteWatcher
}

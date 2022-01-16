const _broadcast = require('./broadcast')
const loadJS = require('./loadJS')

const broadcast = _broadcast('route')
const slash = p => p.replace(/\\/g, '/')

const {
  lib:{c, fg, chokidar},
  fn:{logmsg},
} = global.mitm

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
    logmsg('>>> no watcher', userroute, files)
    return
  }

  // Initialize watcher.
  logmsg(c.magentaBright(`>>> Route watcher:`), [tilde(userroute)])
  const paths = [
    userroute,
    userroute.replace('index.js', '*@index.js')
  ]
  const urouteWatcher = chokidar.watch(paths, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true
  })

  // Something to use when events are received.
  urouteWatcher // Add event listeners.
    .on('add',    p => { p = slash(p); updateJS(p, c.blueBright(`>>> add route ${tilde(p)}`)) })
    .on('change', p => { p = slash(p); updateJS(p, c.blueBright(`>>> chg route ${tilde(p)}`)) })
    .on('unlink', p => { p = slash(p); remove(  p, c.blueBright(`>>> del route ${tilde(p)}`)) })
  global.mitm.watcher.urouteWatcher = urouteWatcher
}

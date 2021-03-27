const fs = require('fs-extra')
const c = require('ansi-colors')
const chokidar = require('chokidar')
const broadcast = require('./broadcast')

const showFiles = global._debounce(broadcast('log'), 1001, 'log')
const slash = p => p.replace(/\\/g, '/')

function addLog (path) {
  const { files: { _log, log } } = global.mitm
  log.push(path)
  if (global.mitm.__flag['file-log']) {
    console.log(c.red(`Log add: ${path}`))
  }
  const meta = path.replace(/\/log\/[^/]+/, m => `${m}/$`)
  fs.readFile(meta.replace(/.\w+$/, '.json'), (err, data) => {
    if (err) {
      const general = {
        ext: '',
        status: '',
        method: '',
        url: path
      }
      if (path.match('-sshot@')) {
        let url = path.replace(/(http.?)~~/, (s,p1) => `${p1}://`)
        url = url.replace(/~/g, '/').split('-sshot@')[1]
        general.url = url
        general.path= (new URL(url)).pathname
        general.ext = path.match(/\.(\w+)$/)[1]
        general.method = 'GET'
        general.status = 200
      }
      _log[path] = {general}
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
  if (global.mitm.__flag['file-log']) {
    console.log(c.red(`Log del: ${path}`))
  }
  showFiles()
}

module.exports = () => {
  const home = global.mitm.path.home
  const glob1 = Object.keys(global.mitm.argv.browser).map(x => `${home}/${x}/log`)
  const glob2 = Object.keys(global.mitm.argv.browser).map(x => `${home}/${x}/log/**`)
  const glob = Array(glob1, glob2).flat()

  // Initialize watcher.
  console.log(c.magentaBright(`>>> Log watcher:`), glob)
  const logWatcher = chokidar.watch(glob, {
    ignored: /\/(\$\/|\.DS_)/, // ignore /$/ -OR- /.DS_
    persistent: true
  })

  logWatcher // Add event listeners.
    .on('add', p => { p = slash(p); addLog(p) })
    .on('unlink', p => { p = slash(p); delLog(p) })
    // .on('unlinkDir', p => console.log(`Directory ${p} has been removed`))
  global.mitm.watcher.logWatcher = logWatcher
}

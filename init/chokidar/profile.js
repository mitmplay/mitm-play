// feat: profile
const c = require('ansi-colors')
const fs = require('fs-extra')
const chokidar = require('chokidar')
const broadcast = require('./broadcast')

const showFiles = global._debounce(broadcast('profile'), 1002, 'profile')

function loadSource (path) {
  const { win32, source, files: { profile } } = global.mitm
  win32 && (path = path.replace(/\\/g, '/'))
  fs.readFile(path, 'utf8', function (err, data) {
    if (err) {
      console.log(c.redBright('Error read source file'), err)
    } else {
      if (profile.indexOf(path) === -1) {
        profile.push(path)
      }
      source[path] = data
    }
  })
}

function addProfile (path) {
  loadSource(path)
  showFiles()
}

function chgProfile (path) {
  loadSource(path)
  showFiles()
}

function delProfile (path) {
  const { win32, files: { profile } } = global.mitm
  win32 && (path = path.replace(/\\/g, '/'))
  const idx = profile.indexOf(path);
  (idx > -1) && profile.splice(idx, 1)
  delete global.mitm.source[path]
  showFiles()
}

module.exports = () => {
  const { home } = global.mitm.path
  const glob = `${home}/argv/*.js`

  // Initialize watcher.
  console.log(c.magentaBright(`watcher(profile): ${glob}`))
  const profileWatcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  })

  profileWatcher // Add event listeners.
    .on('add', path => addProfile(path))
    .on('change', path => chgProfile(path))
    .on('unlink', path => delProfile(path))
  global.mitm.watcher.profileWatcher = profileWatcher
}

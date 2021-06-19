const c = require('ansi-colors')
const fs = require('fs-extra')
const _path = require('path')
const { logmsg } = global.mitm.fn

function chromePlugins(args) {
  const { fn: { flist, tilde, stringify }, path: { userroute } } = global.mitm
  const ppath = userroute.split('*')[0] + '_plugins_'
  const plugins = flist(ppath)
  const enabled = false
  const readAll = {}
  try {
    for (const fn of plugins) {
      const path = `${ppath}/${fn}`
      const manifest = fs.readJSONSync(`${path}/manifest.json`)
      readAll[path] = {
        version: manifest.version,
        name: manifest.name,
        enabled,
      }
    }
    const arr = []
    let allPlugins = readAll
    const exist = fs.existsSync(`${ppath}/index.json`)
    if (exist) {
      const cfg = fs.readJSONSync(`${ppath}/index.json`)
      for (const path in allPlugins) {
        const json1 = allPlugins[path]
        const json2 = cfg[path]
        if (json2 && json2.enabled) {
          json1.enabled = true
          arr.push(path)
        }
      }
    } else if (plugins.length) {
      fs.writeFileSync(`${ppath}/index.json`, JSON.stringify(allPlugins, null, 2))
    }
    let path = ''
    if (arr.length) {
      path = arr.join(',')
    }
    const chrome = `${global.__app}/plugins/chrome`
    path = path ? `${chrome},${path}`:chrome
    path = path.replace(/\\/g, '/')
    global.mitm.plugins = allPlugins
    logmsg(c.yellow('Plugins:'), tilde(path).split(','))
    args.push(`--load-extension=${path}`)
  } catch (err) {
    logmsg(c.red('Error loading Chrome-extentions'), err)
  }
}

module.exports = chromePlugins

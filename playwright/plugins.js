const fs = require('fs-extra')
const _path = require('path')

function chromePlugins(args) {
  const { fn: { flist, tilde }, path: { userroute } } = global.mitm
  const ppath = userroute.split('*')[0] + '_plugins_'
  const plugins = flist(ppath)
  const enabled = false
  const readAll = {}
  try {
    for (const fn of plugins) {
      const path = `${ppath}/${fn}`
      const manifest = fs.readJSONSync(`${path}/manifest.json`)
      readAll[manifest.name] = {
        version: manifest.version,
        name: manifest.name,
        enabled,
        path
      }
    }
    const arr = []
    let allPlugins = readAll
    const exist = fs.existsSync(`${ppath}/index.json`)
    if (exist) {
      const cfg = fs.readJSONSync(`${ppath}/index.json`)
      for (const name in allPlugins) {
        const json1 = allPlugins[name]
        const json2 = cfg[name]
        if (json2 && json2.enabled) {
          arr.push(json1.path)
          json1.enabled = true
        }
      }
    } else {
      fs.writeJSONSync(`${ppath}/index.json`, allPlugins)
    }
    global.mitm.plugins = allPlugins
    let path = `${global.__app}/plugins/chrome`
    if (arr.length) {
      path += `,${arr.join(',')}`
    }
    path = path.replace(/\\/g, '/')
    console.log('>>> Plugins:', tilde(path).split(','))
    args.push(`--disable-extensions-except=${path}`)
    args.push(`--load-extension=${path}`)
  } catch (err) {
    console.error('Error loading Chrome-extentions', err)
  }
}

module.exports = chromePlugins

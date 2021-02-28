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
        name: manifest.name,
        enabled,
        path
      }
    }
    let allPlugins = readAll
    const exist = fs.existsSync(`${ppath}/index.json`)
    if (exist) {
      const cfg = fs.readJSONSync(`${ppath}/index.json`)
      allPlugins = {
        ...readAll,
        ...cfg
      }
    } else {
      fs.writeJSONSync(`${ppath}/index.json`, allPlugins)
    }
    global.mitm.plugins = allPlugins
    const arr = []
    for (const name in allPlugins) {
      const json = allPlugins[name]
      if (json.enabled) {
        arr.push(json.path)
      }
    }
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

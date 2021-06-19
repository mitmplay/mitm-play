const fs = require('fs-extra')
const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

function err (e) {
  e && logmsg(c.redBright('Error remove files'), e)
}

function folders(path) {
  try {
    const arr = fs.readdirSync(path)
    return arr.filter(f => fs.statSync(`${path}/${f}`).isDirectory())
  } catch (error) {
    return []
  }
}

function remove(path) {
  const arr = folders(path)
  for (const f of arr) {
    fs.remove(`${path}/${f}`, err)
  }
}

function clear (o) {
  const { path } = global.mitm
  if (o) {
    if (o.folders) {
      for (const path of o.folders) {
        fs.remove(path, err)
      }
    } else if (o.browserName) {
      const { browserName, delete: d } = o
      fs.remove(`${path.home}/${browserName}/${d}`, err)
    } else {
      const d = o.delete
      const { browser } = global.mitm.argv
      for (const browserName in browser) {
        fs.remove(`${path.home}/${browserName}/${d}`, err)
      }
    }
  } else {
    const { browser, clear: d } = global.mitm.argv
    for (const browserName in browser) {
      if (d === true) {
        remove(`${path.home}/${browserName}/log`)
        remove(`${path.home}/${browserName}/cache`)
      } else {
        remove(`${path.home}/${browserName}/${d}`)
      }
    }
  }
}

module.exports = clear

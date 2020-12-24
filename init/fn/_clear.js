const fs = require('fs-extra')
const c = require('ansi-colors')

function err (e) {
  if (e) {
    console.log(c.redBright('Error remove files'), e)
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
    const { browser, delete: d } = global.mitm.argv
    for (const browserName in browser) {
      if (d === true) {
        fs.remove(`${path.home}/${browserName}/cache`, err)
        fs.remove(`${path.home}/${browserName}/log`, err)
      } else {
        fs.remove(`${path.home}/${browserName}/${d}`, err)
      }
    }
  }
}

module.exports = clear

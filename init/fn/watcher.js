const chokidar = require('chokidar')
const c = require('ansi-colors')
const fs = require('fs-extra')

let timeout = undefined;
let doubleCall = -1
function watcher(_p, arrayModule) {
  const cid = `${_p}/${arrayModule[0]}`
  if (global.mitm.watcher[cid]===undefined) {
    const mapPath = {}
    let arrayPath = arrayModule.map(p => {
      const _ = `${_p}/${p}`.replace(/\\/g, '/')
      mapPath[_] = p
      return _
    })
    const watch = chokidar.watch(arrayPath.slice(1))
    global.mitm.watcher[cid] = watch

    watch.on('change', p => {
      clearTimeout(timeout)
      timeout = setTimeout(()=> {
        timeout = undefined
        doubleCall = -1
      })
      doubleCall += 1
      if (doubleCall) {
        return
      }
      console.log('WATCHER', p, arrayPath)
      delete require.cache[require.resolve(p)]
      try {
        const time = new Date();
        fs.utimesSync(arrayPath[0], time, time);
      } catch (err) {
        fs.closeSync(fs.openSync(arrayPath[0], 'w'));
      }
    })
  }
}

module.exports = watcher

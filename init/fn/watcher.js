const stackTrace = require('stack-trace');
const chokidar = require('chokidar')
const c = require('ansi-colors')
const fs = require('fs-extra')

let timeout = undefined;
let doubleCall = -1
function watcher(arrayModule) {
  const trace = stackTrace.get()
  const pwd = trace[1].getFileName().replace(/\\/g, '/')
  if (global.mitm.watcher[pwd]===undefined) {
    const [_path] = pwd.split(/\/(?=[^\/]+$)/)
    const arrpath = arrayModule.map(mod => {
      mod = mod.replace(/^\.\//, '')
      const js = mod.match(/\.js$/) ? mod : `${mod}.js`
      return `${_path}/${js}`.replace(/\\/g, '/')
    })
    const watch = chokidar.watch(arrpath)
    global.mitm.watcher[pwd] = watch

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
      // console.log('WATCHER', pwd, arrpath)
      delete require.cache[require.resolve(p)]
      try {
        const time = new Date();
        fs.utimesSync(pwd, time, time);
      } catch (err) {
        fs.closeSync(fs.openSync(pwd, 'w'));
      }
    })
  }
}

module.exports = watcher

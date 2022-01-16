const stackTrace = require('stack-trace');
const chokidar = require('chokidar')
const {c, fs} = global.mitm.lib

let timeout = undefined;
let doubleCall = -1
function watcher(arrayModule, pwd) {
  if (pwd===undefined) {
    const trace = stackTrace.get()
    pwd = trace[1].getFileName().replace(/\\/g, '/')
  }
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
      // logmsg('WATCHER', pwd, arrpath)
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

function requires() {
  const trace = stackTrace.get()
  const pwd = trace[1].getFileName().replace(/\\/g, '/')
  const [path] = pwd.split(/\/(?=[^\/]+$)/)
  const args = [].slice.call(arguments)
  watcher(args, pwd)
  return args.map(r=>{
    const p = `${path}/${r}`
    return require(p)
  })
}

module.exports = {
  requires,
  watcher
}

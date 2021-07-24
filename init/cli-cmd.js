const _path = require('path')
const fs = require('fs-extra')
const fg = require('fast-glob')
const c = require('ansi-colors')
const prompt = require('prompt-sync')()
const loadJS = require('./chokidar/loadJS')
const { logmsg } = global.mitm.fn

module.exports = () => {
  const {
    fn: {
      home,
      _clear,
      toRegex
    },
    argv,
    _argv
  } = global.mitm

  const { path } = global.mitm
  const dirhandler = (err) => {
    err && logmsg(c.redBright('>>> Error creating browser profile folder'), err)
  }

  fs.ensureDir(path.home, err => {
    if (err) {
      logmsg(c.redBright('>>> Error creating home folder'), err)
    } else { // browwser profile
      fs.ensureDir(`${path.home}/_profiles_/chromium`, dirhandler)
      fs.ensureDir(`${path.home}/_profiles_/firefox`, dirhandler)
      fs.ensureDir(`${path.home}/_profiles_/webkit`, dirhandler)
    }
  })

  const { cwd } = path
  let { route } = argv
  let userroute
  if (!route) {
    route = home('~/user-route')
  } else {
    route = _path.normalize(route)
    route = home(route.replace(/\\/g, '/'))
    if (route.match(/^\.$/)) {
      route = route.replace(/^\.$/, `${cwd}`)
    } else if (route.match(/^\.\//)) {
      route = route.replace(/^\.\//, `${cwd}/`)
    } else if (route.match(/^\..\//)) {
      route = route.replace(/^\..\//, `${cwd}/../`)
    }
  }

  if (!fs.pathExistsSync(route)) {
    logmsg('Path', route)
    const n = prompt(`\nCreate ${route} (Y/n)? `)

    if (n !== '' && n.toLowerCase() !== 'y') {
      logmsg(c.red('Please provide correct "route" folder using -r option'))
      logmsg(c.magentaBright('or use demo route, ie: mitm-play -dr'),'\n')
      process.exit()
    } else {
      if (!fs.pathExistsSync(`${path.home}/argv/default.js`)) {
        argv.save = true
      }
      logmsg('PATH', route)
      const src = `${path.app}/user-route`
      fs.ensureDirSync(`${route}/_global_`)
      fs.ensureDirSync(`${route}/keybr.com`)
      fs.copyFileSync(`${src}/_global_/index.js`, `${route}/_global_/index.js`)
      fs.copyFileSync(`${src}/keybr.com/index.js`, `${route}/keybr.com/index.js`)
    }
  }

  route = route.replace(/\\/g, '/')
  userroute = `${route}/*/index.js`
  _argv.route = route
  argv.route = route

  path.route = route
  path.userroute = userroute
  const file1 = fg.sync([userroute])
  const file2 = fg.sync([userroute.replace('index.js', '*@index.js')])
  const files = file1.concat(file2)
  logmsg(c.redBright('INIT Route'), files)
  if (!files.length) {
    logmsg(c.red('Routes path is incorrect'), argv.route)
    logmsg(c.yellow('Please pass option: -r=\'...\' / --route=\'your routing path\''))
    process.exit()
  }
  global.mitm.data.nolog = true
  for (const file of files) { // feat: load routes for the first time
    loadJS(file)
  }
  delete global.mitm.data.nolog
  const {routes, routex} =  global.mitm
  for (const _ns in routex) {
    let _childns = {list: {}, _subns: ''}
    for (const id in routex[_ns]) {// feat: set same _childns
      if (id==='index.js') {
        _childns = routes[_ns]._childns
      } else {
        routes[`${id}@${_ns}`]._childns = _childns
      }
    }
  }

  if (typeof (argv.url) === 'string') {
    if (!argv.url.match('https')) {
      argv.urls = [`https://${argv.url}`]
    } else {
      argv.urls = [argv.url]
    }
  } else {
    let argv0 = argv._[0]
    if (argv0) {
      // on window comma change to space
      argv0 = argv0.trim().split(/[, ]+/)
      const { routes } = global.mitm
      const _urls = {}
      for (const namespace in routes) {
        const { url, urls } = routes[namespace]
        const urls2 = Object.keys(urls||{})
        for (const key of argv0) {
          const rgx = toRegex(key, 'i')
          let urlsSet = false
          if (urls) {
            // "_subns": ""
            // "_subns": "hi@keybr.com"
            if (urls2.includes(key)) {
              _urls[key] = urls[key]
              urlsSet = true // found
            } else {
              for (const loc in urls) { // feat: find in urls
                if (loc.match(rgx)) {
                  _urls[loc] = urls[loc]
                  urlsSet = true // found
                  break
                }
              }  
            }
          }
          /**
           * find on url if urls cannot be found
           */
          if (urlsSet) {
            if (mitm._childns===undefined) {
              const {_childns} = mitm.routes[namespace]
              if (namespace.match('@')) {
                for (const l in _childns.list) {
                  _childns.list[l] = false
                }
                _childns.list[namespace] = true
                _childns._subns = namespace  
              } else {
                _childns._subns = ''  
              }
              mitm._childns = _childns // feat: default app  
            }
            break
          } else if (url && url.match(rgx)) {
            _urls.def = url
          }
        }
      }
      const urls = Object.values(_urls)
      if (urls.length) {
        argv.urls = urls
      } else {
        argv.urls = ['https://keybr.com/']
      }
    } else if (!argv.urls || argv.urls.length===0) {
      const { routes } = global.mitm
      for (const key in routes) {
        if (key === '_global_') {
          continue
        }
        const { url, urls } = routes[key]
        if (url || urls) {
          if (url) {
            argv.urls = [url]
          } else if (urls) {
            const id = Object.keys(urls)[0]
            argv.urls = [urls[id]]
          }
          break
        }
      }
    }
  }
  delete argv.url

  _clear()

  if (argv.save) {
    const { save, ...rest } = argv
    let _args = (process.argv.slice(2).join(' ') + ' ')
    _args = _args.replace(/=([^ ]+)/g, (x, x1) => `='${x1}'`)
    const fpath = `${path.home}/argv/${save === true ? 'default' : save}.js`
    const body = JSON.stringify({ _args, _argv: rest }, null, 2)
    fs.ensureFile(fpath, err => {
      if (err) {
        logmsg(c.redBright('>>> Error saving cli options'), fpath)
      } else {
        fs.writeFile(fpath, body, err => {
          err && logmsg(c.redBright('>>> Error saving cli options'), err)
        })
      }
    })
  }
}

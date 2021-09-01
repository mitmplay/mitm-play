const fs = require('fs-extra')
const c = require('ansi-colors')
const { logmsg } = global.mitm.fn

function argsChg (id, key) {
  const { argv } = global.mitm
  if (id && argv[id]) {
    argv[key] = argv[id]
    delete argv[id]
  }
  if (argv[key] === 'false') {
    argv[key] = false
  }
}

function obj (key, id) {
  const { argv } = global.mitm
  if (argv[id]) {
    if (argv[key] === undefined) {
      argv[key] = {}
    }
    argv[key][id] = argv[id]
  }
}

function loadProfile (profile) {
  const { path } = global.mitm
  const _prfl = `${path.home}/argv/${profile}.js`
  const exist = fs.existsSync(_prfl)
  if (!exist) {
    return false
  }
  const saveArgs = JSON.parse(fs.readFileSync(_prfl))
  let msg1 = saveArgs._args
  const arr1 = msg1.match(/=['"]?([^:]+:[^@]+)@\w+/)
  if (arr1) {
    // feat: hide password
    msg1 = msg1.replace(arr1[1], '******:******')
  }
  logmsg(c.green(`>>> cmd: mitm-play ${msg1.trim()}`), `(${profile})`)
  // logmsg(c.green(`>>> cmd: mitm-play ${JSON.stringify(saveArgs._args, null, 2)}`),`(${profile})`);
  return saveArgs
}

module.exports = () => {
  let { argv, path } = global.mitm
  const [prm0, prm1] = argv._
  argv.profile = false

  argsChg('a', 'activity'  ) // feat: _global_.args
  argsChg('b', 'basic'     ) 
  argsChg('c', 'clear'     ) 
  argsChg('d', 'devtools'  )
  argsChg('e', 'device'    )
  argsChg('f', 'fullog'    ) // feat: _global_.args
  argsChg('g', 'group'     )
  argsChg('h', 'help'      )
  argsChg('i', 'insecure'  )
  argsChg('k', 'cookie'    ) // feat: _global_.args
  argsChg('l', 'lazylog'   )
  argsChg('n', 'nosocket'  ) // feat: _global_.args
  argsChg('o', 'offline'   ) // console.log without \n
  argsChg('p', 'csp'       ) // feat: _global_.args
  argsChg('r', 'route'     )
  argsChg('s', 'save'      )
  argsChg('t', 'incognito' )
  argsChg('u', 'url'       )
  argsChg('v', 'video'     )
  argsChg('w', 'worker'    ) 
  argsChg('x', 'proxy'     )
  argsChg('z', 'lazyclick' ) // feat: _global_.args
  argsChg('e', 'devtools'  )

  argsChg('D', 'debug'     )
  argsChg('G', 'nogpu'     )
  argsChg('H', 'nohost'    ) // feat: _global_.args
  argsChg('I', 'inspect'   )
  argsChg('K', 'dark'      )
  argsChg('N', 'nice'      )
  argsChg('P', 'cdp'       )
  argsChg('R', 'redirect'  )
  argsChg('S', 'svelte'    )
  argsChg('U', 'nourl'     ) // feat: _global_.args
  argsChg('V', 'verbose'   )
  argsChg('X', 'proxypac'  )

  argsChg('C', 'chromium'  )
  argsChg('F', 'firefox'   )
  argsChg('W', 'webkit'    )

  obj('browser', 'chromium') // on Window: Chrome POST payload is missing!
  obj('browser', 'firefox' )
  obj('browser', 'webkit'  )

  if (argv.activity===true) {
    argv.activity = 'rec' // rec:tag-html
  }

  if (argv.device===true) {
    argv.device = 'iPhone 11 Pro'
  }

  if (prm0 && prm0.match(/^http/)) {
    if (argv.route===undefined) {
      argv.route = true
    }
    if (argv.url===undefined) {
      argv.url = prm0
    } else {
      logmsg(`incorrect params`)
      process.exit(1)
    }
  }
  let {route} = argv
  if (route) {
    if (route===true) {
      argv.route = `${path.app}/user-route`
    } else {
      let postfix = route.match(/^-\w+/)
      if (postfix) {
        argv.route = `${path.app}/uroute${postfix}`
      }
    }  
  }

  let saveArgs = prm1 ? loadProfile(prm1) : undefined
  if (saveArgs) {
    argv.profile = true
  } else if (prm1 !== 'default') {
    saveArgs = loadProfile('default')
  }

  let browser
  if (saveArgs && !argv.save) {
    let msg2 = process.argv.slice(2).join(' ')
    const arr2 = msg2.match(/=['"]?([^:]+:[^@]+)@\w+/)
    if (arr2) {
      // feat: hide password
      msg2 = msg2.replace(arr2[1], '******:******')
    }
    logmsg(c.green(`>>> cmd2 mitm-play ${msg2}`))
    const {
      _argv: {
        browser: b,
        chromium,
        firefox,
        webkit,
        ...rest
      }
    } = saveArgs
    browser = b
    logmsg(c.green('>>> Profile argv._'), argv._)
    if (rest._ && argv._.length===0) {
      delete argv._
    }
    global.mitm.argv = { ...rest, ...argv }
    argv = global.mitm.argv
  }

  if (argv.debug) {
    process.env.DEBUG = 'pw:api'
  }

  if (browser === undefined || Object.keys(browser).length === 0) {
    browser = { chromium: true }
  }

  if (argv.browser === undefined || Object.keys(argv.browser).length === 0) {
    argv.browser = { ...browser }
  }
  for (const id in argv.browser) {
    const browser = argv.browser[id]
    if (typeof (browser) === 'string') {
      argv.browser[id] = browser.replace(/\\/g, '/')
    }
  }
  global.mitm._argv = {...argv} // original argv
}

const c = require('ansi-colors')
const chokidar = require('chokidar')
const esbuild = require('esbuild')
const fs = require('fs-extra')

const hotKeys = obj => {
  window.mitm.macrokeys = {
    ...window.mitm.macrokeys,
    ...obj
  }
}

const autoclick = () => {
  setTimeout(() => {
    document.querySelector('.btn-autofill').click()
  }, 1000)
}

function __body2(app, _global, _body1, _body2) {
return (
`(function(global, macro1) {
  // file: ${app}@macros.js
  ${_body2.replace(/\n/g, '\n  ')}
  // macros.js + ${app}@macros.js
  const {macros: macro2} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
    ...macro2,
  }
})((function() {
  // file: _global_/macros.js
  ${_global.replace(/\n/g, '\n  ')}
  // pass to function params
  return window.mitm.macros
})(), (function() {
  // file: macros.js
  ${_body1.replace(/\n/g, '\n  ')}
  // pass to function params
  return window.mitm.macros
})())`)
}

function __body1(_global, _body1) {
return (`
(function(global) {
  // file: macros.js
  ${_body1.replace(/\n/g, '\n  ')}
  const {macros: macro1} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
  }
})((function() {
  // file: _global_/macros.js
  ${_global.replace(/\n/g, '\n  ')}
  // pass to function params
  return window.mitm.macros
})())`).replace(/\n/, '')
}

function __autoKeys(body) {
return (`
// [Ctrl] + [Alt] + [A] => run hotkey KeyA
// [Ctrl] + [Shift] => Hide / Show Buttons
if (window._ws_connect===undefined) {
  window._ws_connect = {}
};\n
window.mitm.fn.autoclick = ${autoclick + ''};\n
window.mitm.fn.hotKeys = ${hotKeys + ''};\n
window.mitm._macros_ = () => {
  window.mitm.macrokeys = {};
};\n
window._ws_connect.macrosOnMount = data => {
  console.log('macros code executed after ws open', data)
};\n
${body};\n`).replace(/\n/, '')
}

function genBuild(msg, fpath) {
  const {
    argv,
    win32,
    fn: {
      _tldomain,
      _nameSpace
    }
  } = global.mitm
  let _global = ''
  let _body1 = ''
  let _body2 = ''
  let body = ''
  let path

  if (win32) {
    fpath = fpath.replace(/\\/g, '/')
  }
  const rpath = fpath.replace(`${argv.route}/`, '')
  console.log(c.red(`${msg}: ${rpath}`))

  path = `${argv.route}/_global_/macros.js`
  if (fs.existsSync(path)) {
    _global = `${fs.readFileSync(path)}`
  }

  const [folder, file, other] = rpath.split('/')
  if (other===undefined) {
    path = `${argv.route}/${folder}/macros.js`
    if (fs.existsSync(path)) {
      _body1 = `${fs.readFileSync(path)}`
    }
    if (file.match('@')) {
      const [app] = file.split('@')
      path = `${argv.route}/${folder}/${file}`
      if (fs.existsSync(path)) {
        _body2 = `${fs.readFileSync(path)}`
        body = __body2(app, _global, _body1, _body2)
      }
    } else {
      body = __body1(_global, _body1)
    }
  }
  body = __autoKeys(body)
  const bpath = fpath.replace('macros.js', 'build.js')
  console.log(c.redBright('Write'), bpath)
  fs.writeFile(bpath, body, err => {
    if (err) {
      console.log(c.redBright('Error saving'), err)
      return
    }
    const opath = fpath.replace('macros.js', 'bundle.js')
    esbuild.build({
      entryPoints: [bpath],
      outfile: opath,
      bundle: true,
      // minify: true,
      sourcemap: 'inline',
      target: ['chrome89'],
    }).catch(() => process.exit(1))
  })
}

function addMacro (path, msg) {
  genBuild('add', path)
}

function chgMacro (path) {
  genBuild('chg', path)
}

function delMacro (path) {
  const { win32 } = global.mitm
  win32 && (path = path.replace(/\\/g, '/'))
  console.log(c.red(`Macro del: ${path}`))
}

module.exports = () => {
  const {argv} = global.mitm
  const glob = [
    `${argv.route}/*/macros.js`,
    `${argv.route}/*/*@macros.js`,
  ]

  // Initialize watcher.
  console.log(c.magentaBright('>>> Macros watcher:'), glob, {
    ignored: /_.*_/,
    persistent: true
  })
  const macrosWatcher = chokidar.watch(glob, { persistent: true })

  macrosWatcher // Add event listeners.
    .on('add', path => addMacro(path))
    .on('change', path => chgMacro(path))
    .on('unlink', path => delMacro(path))
  global.mitm.watcher.macrosWatcher = macrosWatcher
}

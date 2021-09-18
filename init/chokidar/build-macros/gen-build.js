const fs = require('fs-extra')
const c = require('ansi-colors')
const bundleRollup = require('./rollup')
const bundleEsbuild = require('./es-build')
const { logmsg } = global.mitm.fn

function __autoKeys(body) {
return (`
// [Ctrl] + [Alt] + [A] => run hotkey KeyA
// [Ctrl] + [Shift] => Hide / Show Buttons
${body}\n`).replace(/\n/, '')}

function __body1(global, _body1) {
return (`
const {macros} = window.mitm
${_body1}
if (typeof _body1==='function') {
  _body1 = _body1()
}
${global}
if (typeof global==='function') { 
  global = global()
}
window.mitm.macros = {
  ...global,
  ...macros,
  ..._body1,
}`).replace(/\n/, '')}

function __body2(app, _global, _body1, _body2) {
return (`
const {macros} = window.mitm
${_body1}
if (typeof _body1==='function') { 
  _body1 = _body1()
}
${_body2}
if (typeof _body2==='function') {
  _body2 = _body2()
}
${_global}
if (typeof global==='function') { 
  global = global()
}
window.mitm.macros = {
  ...global,
  ...macros,
  ..._body1,
  ..._body2
}`).replace(/\n/, '')}

function bundling(fpath, body) {
  const {argv} = global.mitm
  body = __autoKeys(body)
  const bpath = fpath.replace('macros.js', 'build.js')
  // logmsg(c.redBright('Write'), bpath)
  fs.writeFile(bpath, body, err => {
    if (err) {
      logmsg(c.redBright('Error saving'), err)
      return
    }
    const opath = fpath.replace('_macros_', '_bundle_')
    if (argv.svelte) {
      bundleRollup(bpath, opath)
    } else {
      bundleEsbuild(bpath, opath)
    }
  })  
}

function genBuild(msg, fpath) {
  const {argv,win32} = global.mitm
  let _global = ''
  let _body1 = ''
  let _body2 = ''
  let body = ''
  let path

  if (win32) {
    fpath = fpath.replace(/\\/g, '/')
  }
  const rpath = fpath.replace(`${argv.route}/`, '')
  logmsg(c.red(`${msg}: ${rpath}`))

  path = `${argv.route}/_global_/_macros_/macros.js`
  if (fs.existsSync(path)) {
    _global = `let global = require('../../_global_/_macros_/macros')`
  } else {
    _global = 'let global = {}'
  }

  const [folder, fmacro, file, other] = rpath.split('/')
  if (other===undefined) {
    path = `${argv.route}/${folder}/${fmacro}/macros.js`
    if (fs.existsSync(path)) {
      _body1 = `let _body1 = require('./macros')`
    } else {
      _body1 = `let _body1 = {}`
    }
    if (file.match('@')) {
      const [app] = file.split('@')
      path = `${argv.route}/${folder}/${fmacro}/${file}`
      if (fs.existsSync(path)) {
        _body2 = `let _body2 = require('./${file}')`
      } else {
        _body2 = `let _body2 = {}`
      }
      body = __body2(app, _global, _body1, _body2)
    } else {
      body = __body1(_global, _body1)
    }
  }
  bundling(fpath, body)
}
module.exports = genBuild
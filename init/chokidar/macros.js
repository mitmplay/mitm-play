const {nodeResolve} = require('@rollup/plugin-node-resolve')
const commonjs = require('@rollup/plugin-commonjs')
const chokidar = require('chokidar')
const esbuild = require('esbuild')
const rollup = require('rollup')
const c = require('ansi-colors')
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
  
function __body1(_global, _body1) {
return (`
(function(global) {
  // file: macros.js
  ${_body1.replace(/\n/g, '\n  ')}
  if (typeof _body1==='function') {
    _body1 = _body1()
  }
  const {macros: macro1} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
    ..._body1,
  }
})((function() {
  // file: _global_/macros.js
  ${_global.replace(/\n/g, '\n  ')}
  if (typeof _global==='function') { return _global()
  } else if (_global!==undefined ) { return _global }
})())`).replace(/\n/, '')
}
  
function __body2(app, _global, _body1, _body2) {
return (
`(function(global, _body1) {
  // file: ${app}@macros.js
  ${_body2.replace(/\n/g, '\n  ')}
  if (typeof _body2==='function') {
    _body2 = _body2()
  }
  // macros.js + ${app}@macros.js
  const {macros: macro1} = window.mitm
  window.mitm.macros = {
    ...global,
    ...macro1,
    ..._body1,
    ..._body2
  }
})((function() {
  // file: _global_/macros.js
  ${_global.replace(/\n/g, '\n  ')}
  if (typeof _global==='function') { return _global()
  } else if (_global!==undefined ) { return _global }
})(), (function() {
  // file: macros.js
  ${_body1.replace(/\n/g, '\n  ')}
  if (typeof _body1==='function') { return _body1()
  } else if (_body1!==undefined ) { return _body1 }
})())`)
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
  console.log(c.red(`${msg}: ${rpath}`))

  path = `${argv.route}/_global_/macros.js`
  if (fs.existsSync(path)) {
    _global = `let _global = require('../_global_/macros')`
  }

  const [folder, file, other] = rpath.split('/')
  if (other===undefined) {
    path = `${argv.route}/${folder}/macros.js`
    if (fs.existsSync(path)) {
      _body1 = `let _body1 = require('./macros')`
    }
    if (file.match('@')) {
      const [app] = file.split('@')
      path = `${argv.route}/${folder}/${file}`
      if (fs.existsSync(path)) {
        _body2 = `let _body2 = require('./${file}')`
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
    bundleEsbuild(bpath, opath)
    // bundleRollup(bpath, opath)
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

function bundleEsbuild(bpath, opath) {
  esbuild.build({
    entryPoints: [bpath],
    outfile: opath,
    bundle: true,
    // minify: true,
    sourcemap: 'inline',
    target: ['chrome89'],
  }).catch(() => process.exit(1))  
}

function bundleRollup(bpath, opath) {
  // see below for details on the options
  const inputOptions = {
    input: bpath,
    plugins: [
      nodeResolve({
        browser: true,
        // dedupe: ['svelte'],
        // preferBuiltins: false
      }),
      commonjs()
    ]
  };
  const outputOptions = {
    file: opath,
    sourcemap: 'inline',
    format: 'iife'
  };

  async function build() {
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);
    console.log(bundle.watchFiles); // an array of file names this bundle depends on
    const { output } = await bundle.generate(outputOptions);

    for (const chunkOrAsset of output) {
      if (chunkOrAsset.type === 'asset') {
        console.log('Asset', chunkOrAsset);
      } else {
        console.log('Chunk', chunkOrAsset.modules);
      }
    }
    await bundle.write(outputOptions);
    await bundle.close();
  }
  build();
}

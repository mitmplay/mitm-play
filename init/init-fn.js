const fg = require('fast-glob')
const chokidar = require('chokidar')
const { promisify } = require('util')
const clearModule = require('clear-module');

const { _keyLength, _sortLength, _sort } = require('./fn/_key-length')
const { _routeSet, toRegex, rmethod } = require('./fn/_route-set')
const { sqlList, sqlIns, sqlUpd, sqlDel } = require('../sqlite')
const { formToObj, objToForm } = require('./fn/form')
const { watcher, requires } = require('./fn/watcher')
const { _proxy, _noproxy } = require('./fn/_proxies')
const { exec, execFile } = require('./fn/_exec-file')
const { tilde, home } = require('./fn/tildehome')
const _globalTag = require('./fn/_globalTag')
const _nameSpace = require('./fn/_namespace')
const _tldomain = require('./fn/_tldomain')
const _wsclient = require('./fn/_wsclient')
const _debounce = require('./fn/_debounce')
const stringify = require('./fn/stringify')
const addRoute = require('./fn/addRoute')
const relaxCSP = require('./fn/relaxCSP')
const _wsmitm = require('./fn/_wsmitm')
const _clear = require('./fn/_clear')
const _tag4 = require('./fn/_tag4')
const flist = require('./fn/flist')
const sleep = promisify(setTimeout)

module.exports = () => {
  global.mitm.lib = {
    ...global.mitm.lib,
    clearModule,
    chokidar,
    execFile,
    exec,
    fg,
  }
  global.mitm.fn = {
    ...global.mitm.fn,
    _sortLength,
    _keyLength,
    _nameSpace,
    _globalTag,
    _debounce,
    _routeSet,
    _tldomain,
    _wsclient,
    _noproxy,
    _wsmitm,
    _proxy,
    _clear,
    _sort,
    _tag4,
    sleep,
    formToObj,
    objToForm,
    stringify,
    addRoute,
    relaxCSP,
    requires,
    rmethod,
    toRegex,
    watcher,
    sqlList,
    sqlIns,
    sqlUpd,
    sqlDel,
    flist,
    tilde,
    home
  }
}

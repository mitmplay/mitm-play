const fs = require('fs-extra');
const fg = require('fast-glob');
const c = require('ansi-colors');
const chokidar = require('chokidar');

const {routeSet, toRegex} = require('./fn/route-set');
const {formToObj, objToForm} = require('./fn/form');
const {exec, execFile} = require('./fn/exec-file');
const {tilde, home} = require('./fn/tildehome');
const unstrictCSP = require('./fn/unstrictCSP');
const _skipByTag = require('./fn/_skipbytag');
const nameSpace = require('./fn/namespace');
const stringify = require('./fn/stringify');
const tldomain = require('./fn/tldomain');
const wsclient = require('./fn/wsclient');
const debounce = require('./fn/debounce');
const session = require('./fn/session');
const wsmitm = require('./fn/wsmitm');
const clear = require('./fn/clear');
const _tag4 = require('./fn/_tag4');

module.exports = () => {
  global.mitm.fn = {
    _skipByTag,
    _tag4,
    unstrictCSP,
    formToObj,
    objToForm,
    stringify,
    nameSpace,
    chokidar,
    tldomain,
    wsclient,
    routeSet,
    execFile,
    debounce,
    toRegex,
    session,
    wsmitm,
    clear,
    tilde,
    home,
    exec,
    fg,
    fs,
    c,
  }
}

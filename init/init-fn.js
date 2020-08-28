const fs = require('fs-extra');
const fg = require('fast-glob');
const c = require('ansi-colors');
const chokidar = require('chokidar');

const {hello, mock, resp} = require('./fn/hellomock');
const {routeSet, toRegex} = require('./fn/route-set');
const {exec, execFile} = require('./fn/exec-file');
const {tilde, home} = require('./fn/tildehome');
const unstrictCSP = require('./fn/unstrictCSP');
const nameSpace = require('./fn/namespace');
const stringify = require('./fn/stringify');
const tldomain = require('./fn/tldomain');
const wsclient = require('./fn/wsclient');
const debounce = require('./fn/debounce');
const session = require('./fn/session');
const wsmitm = require('./fn/wsmitm');
const loadJS = require('./fn/loadJS');
const clear = require('./fn/clear');

module.exports = () => {
  global.mitm.fn = {
    unstrictCSP,
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
    loadJS,
    clear,
    hello,
    tilde,
    home,
    mock,
    resp,
    exec,
    fg,
    fs,
    c,
  }
}

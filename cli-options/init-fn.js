const fs = require('fs-extra');
const fg = require('fast-glob');
const c = require('ansi-colors');
const chokidar = require('chokidar');

const {hello, mock, resp} = require('./fn/hellomock');
const {exec, execFile} = require('./fn/exec-file');
const {tilde, home} = require('./fn/tildehome');
const unstrictCSP = require('./fn/unstrictCSP');
const stringify = require('./fn/stringify');
const routeSet = require('./fn/route-set');
const tldomain = require('./fn/tldomain');
const loadJS = require('./fn/loadJS');
const clear = require('./fn/clear');

module.exports = () => {
  global.mitm.fn = {
    unstrictCSP,
    stringify,
    chokidar,
    tldomain,
    routeSet,
    execFile,
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

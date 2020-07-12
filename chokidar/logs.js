const fs = require('fs-extra');
const c = require('ansi-colors');
const chokidar = require('chokidar');
const broadcast = require('./broadcast');

const showFiles = global._debounce(broadcast('log'), 1001, 'log');

function addLog(path) {
  const {win32,files:{_log, log}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  log.push(path);
  let meta = path.replace(/\/log\/\w+/,m => `${m}/$`);
  fs.readFile(meta.replace(/.\w+$/, '.json'), (err, data) => {
    if (err) {
      _log[path] = {
        general: {
          ext: '',
          status: '',
          method: '',
          url: path,  
        }
      };
    } else {
      const json = JSON.parse(`${data}`);
      _log[path] = json;
    }
  });
  showFiles();
}

function delLog(path) {
  const {win32,files:{_log, log}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  _log[path] && delete _log[path];
  const idx = log.indexOf(path);
  (idx>-1) && log.splice(idx,1);
  showFiles();
}

module.exports = () => {
  const {home} = global.mitm;
  const glob = Object.keys(mitm.argv.browser).map(x=>`${home}/${x}/**/log/**`);

  // Initialize watcher.
  console.log(c.magentaBright(`log watcher:`),glob);
  const logWatcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  });

  logWatcher // Add event listeners.
  .on('add',    path => addLog(path))
  .on('unlink', path => delLog(path));
  global.mitm.watcher.logWatcher = logWatcher;
}

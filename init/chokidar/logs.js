const fs = require('fs-extra');
const c = require('ansi-colors');
const chokidar = require('chokidar');
const broadcast = require('./broadcast');

const showFiles = global._debounce(broadcast('log'), 1001, 'log');
const slash = p => p.replace(/\\/g, '/');

function addLog(path) {
  const {files:{_log, log}} = global.mitm;
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
      const g = json.general;
      g.path = (new URL(g.url)).pathname;
      _log[path] = json;
    }
  });
  showFiles();
}

function delLog(path) {
  const {files:{_log, log}} = global.mitm;
  _log[path] && delete _log[path];
  const idx = log.indexOf(path);
  (idx>-1) && log.splice(idx,1);
  showFiles();
}

module.exports = () => {
  const home = global.mitm.path.home;
  const glob = Object.keys(mitm.argv.browser).map(x=>`${home}/${x}/**/log/**`);

  // Initialize watcher.
  console.log(c.magentaBright(`watcher(log): ${JSON.stringify(glob)}`));
  const logWatcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  });

  logWatcher // Add event listeners.
  .on('add',    p => {p = slash(p); addLog(path)})
  .on('unlink', p => {p = slash(p); delLog(path)});
  global.mitm.watcher.logWatcher = logWatcher;
}

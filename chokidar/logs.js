const c = require('ansi-colors');
const chokidar = require('chokidar');
const broadcast = require('./broadcast');

const showFiles = global._debounce(broadcast('log'), 1001, 'log');

function addLog(path) {
  const {win32,files:{log}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  log.push(path);
  showFiles();
}

function delLog(path) {
  const {win32,files:{log}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
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

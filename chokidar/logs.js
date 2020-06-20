const c = require('ansi-colors');
const chokidar = require('chokidar');
const broadcast = require('./broadcast');

const showFiles = broadcast('_fileLogs', 'log');

function addLog(path) {
  const {win32,files:{log}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  log.push(path);
  showFiles();
}

function delLog(path) {
  if (global.mitm.win32) {
    path = path.replace(/\\/g, '/');
  }
  const idx = global.mitm.files.log.indexOf(path);
  if (idx>-1) {
    delete global.mitm.files.log[idx];
  }
  showFiles();
}

module.exports = () => {
  const {home} = global.mitm;
  const glob = Object.keys(mitm.argv.browser).map(x=>`${home}/${x}/**/log/**`);

  // Initialize watcher.
  console.log(c.magentaBright(`log watcher:`),glob);
  const watcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  });

  watcher // Add event listeners.
  .on('add',    path => addLog(path))
  .on('unlink', path => delLog(path));  
}

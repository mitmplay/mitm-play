const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');

// files = [];
const showAddedFiles = global._debounce(function(_log) {
  let data = global.mitm.files.log;
  // _log && console.log(c.yellowBright(`>> logs:`), data);
  files = [];

  data = `_fileLogs${JSON.stringify({data})}`
  global.broadcast({data});
}, 1000);

function addLog(path, _log=true) {
  const {win32,files:{log}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  log.push(path);
  // files.push(path);
  showAddedFiles(_log);
}

function delLog(path) {
  if (global.mitm.win32) {
    path = path.replace(/\\/g, '/');
  }
  const idx = global.mitm.files.log.indexOf(path);
  if (idx>-1) {
    delete global.mitm.files.log[idx];
  }
  console.log(c.red(`>> del log ${path}`));
}

module.exports = () => {
  const {home} = global.mitm;
  // const glob = home+'/**/log/**';
  const glob = Object.keys(mitm.argv.browser).map(x=>`${home}/${x}/**/log/**`);

  // Initialize watcher.
  console.log(c.magentaBright(`log watcher:`),glob);
  const watcher = chokidar.watch(glob, {
    persistent: true
  });

  watcher // Add event listeners.
  .on('add',    path => addLog(path))
  .on('unlink', path => delLog(path));  
}

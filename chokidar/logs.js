const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');

function addLog(path, log=true) {
  if (global.mitm.win32) {
    path = path.replace(/\\/g, '/');
  }
  global.mitm.files.log.push(path);
  log && console.log(c.green(`>> add log ${path}`));
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
  const glob = home+'/**/log/**';
  const files = mitm.fn.fg.sync([glob]);
  
  global.mitm.files.log = [];
  for (let path of files) {
    addLog(path, false);
  }

  // Initialize watcher.
  console.log(c.magentaBright(`log watcher ${glob}`));
  const watcher = chokidar.watch(glob, {
    persistent: true
  });

  watcher // Add event listeners.
  .on('add',    path => addLog(path))
  .on('unlink', path => delLog(path));  
}

const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');

function addCache(path, log=true) {
  if (global.mitm.win32) {
    path = path.replace(/\\/g, '/');
  }
  global.mitm.files.cache.push(path);
  log && console.log(c.green(`>> add cache ${path}`));
}

function delCahe(path) {
  if (global.mitm.win32) {
    path = path.replace(/\\/g, '/');
  }
  const idx = global.mitm.files.cache.indexOf(path);
  if (idx>-1) {
    delete global.mitm.files.cache[idx];
  }
  console.log(c.red(`>> del cache ${path}`));
}

module.exports = () => {
  const {home} = global.mitm;
  const glob = home+'/**/cache/**';
  const files = mitm.fn.fg.sync([glob]);
  
  global.mitm.files.cache = [];
  for (let path of files) {
    addCache(path, false);
  }

  // Initialize watcher.
  console.log(c.magentaBright(`cache watcher ${glob}`));
  const watcher = chokidar.watch(glob, {
    persistent: true
  });

  watcher // Add event listeners.
  .on('add',    path => addCache(path))
  .on('unlink', path => delCahe(path));  
}

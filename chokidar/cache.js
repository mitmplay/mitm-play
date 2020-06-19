const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');

// files = [];
const showAddedFiles = global._debounce(function(_log) {
  let data = global.mitm.files.cache;
  // _log && console.log(c.yellow(`>> cache:`), data);
  files = [];

  data = `_fileCache${JSON.stringify({data})}`
  global.broadcast({data});
}, 1000);

function addCache(path, _log=true) {
  const {win32,files:{cache}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  cache.push(path);
  // files.push(path);
  showAddedFiles(_log);
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
  // const glob = home+'/**/cache/**';
  const glob = Object.keys(mitm.argv.browser).map(x=>`${home}/${x}/**/cache/**`);

  // Initialize watcher.
  console.log(c.magentaBright(`cache watcher:`),glob);
  const watcher = chokidar.watch(glob, {
    persistent: true
  });

  watcher // Add event listeners.
  .on('add',    path => addCache(path))
  .on('unlink', path => delCahe(path));  
}

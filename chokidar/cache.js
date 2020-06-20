const c = require('ansi-colors');
const chokidar = require('chokidar');
const broadcast = require('./broadcast');

const showFiles = broadcast('_fileCache', 'cache');

function addCache(path) {
  const {win32,files:{cache}} = global.mitm;
  win32 && (path = path.replace(/\\/g, '/'));
  cache.push(path);
  showFiles();
}

function delCahe(path) {
  if (global.mitm.win32) {
    path = path.replace(/\\/g, '/');
  }
  const idx = global.mitm.files.cache.indexOf(path);
  if (idx>-1) {
    delete global.mitm.files.cache[idx];
  }
  showFiles();
}

module.exports = () => {
  const {home} = global.mitm;
  const glob = Object.keys(mitm.argv.browser).map(x=>`${home}/${x}/**/cache/**`);

  // Initialize watcher.
  console.log(c.magentaBright(`cache watcher:`),glob);
  const watcher = chokidar.watch(glob, {
    ignored: /\/\$\//, // ignore /$/
    persistent: true
  });

  watcher // Add event listeners.
  .on('add',    path => addCache(path))
  .on('unlink', path => delCahe(path));  
}

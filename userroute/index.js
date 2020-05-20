const fg = require('fast-glob');
const chokidar = require('chokidar');

const load = function(path) {
  console.log('>> userroute', path);
  const rpath = require.resolve(path);
  if (require.cache[rpath]) {
    delete require.cache[rpath];
  }
  return require(path);
}

const loadJS = function(path, log) {
  const {clear} = global.mitm.fn;
  console.log(log);
  load(path);
  clear();
}

module.exports = () => {
  const {userroute} = mitm.data;
  const files = fg.sync([userroute]);

  if (!files.length) {
    console.log('>> no watcher', userroute, files);
    // return;
  }
  
  // Initialize watcher.
  const watcher = chokidar.watch(userroute, {
    // ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  });
  
  // Something to use when events are received.
  const log = console.log.bind(console);
  watcher // Add event listeners.
  .on('add', path => loadJS(path, `File ${path} has been added`))
  .on('change', path => loadJS(path, `File ${path} has been changed`))
  .on('unlink', path => log(`File ${path} has been removed`));  
}

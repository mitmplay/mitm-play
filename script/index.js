const fs = require('fs-extra');
const fg = require('fast-glob');
const chokidar = require('chokidar');

const load = function(path) {
  delete require.cache[require.resolve(path)];
  return require(path);
}

const loadJS = function(path, log) {
  console.log(log);
  load(path);
}

module.exports = () => {
  const {userscript} = mitm.argv;
  const files = fg.sync([userscript]);

  if (!files.length) {
    console.log('>> no watcher', userscript, files);
    // return;
  }
  
  // Initialize watcher.
  const watcher = chokidar.watch(userscript, {
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

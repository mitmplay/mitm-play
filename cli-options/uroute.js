const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');

module.exports = () => {
  const {
    fn: {loadJS},
    data: {userroute},
  } = global.mitm;
  const files = fg.sync([userroute]);

  if (!files.length) {
    console.log('>> no watcher', userroute, files);
    return;
  }
  
  // Initialize watcher.
  const watcher = chokidar.watch(userroute, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true
  });
  
  // Something to use when events are received.
  const log = console.log.bind(console);
  watcher // Add event listeners.
  .on('add',    path => loadJS(path, c.greenBright(`>> add route ${path}`)))
  .on('change', path => loadJS(path,  c.cyanBright(`>> chg route ${path}`)))
  .on('unlink', path =>          log(  c.redBright(`>> del route ${path}`)));  
}

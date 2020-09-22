const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');
const _broadcast = require('./broadcast');

const broadcast = _broadcast('route');

module.exports = () => {
  const {userroute} = global.mitm.path;
  const files = fg.sync([userroute]);
  const {loadJS} = global.mitm.fn;

  function updateJS(path, msg) {
    loadJS(path, msg, broadcast);
  }
  
  if (!files.length) {
    console.log('>> no watcher', userroute, files);
    return;
  }
  
  // Initialize watcher.
  console.log(c.magentaBright(`watcher(route): ${userroute}`))
  const urouteWatcher = chokidar.watch(userroute, {
    ignored: /(^|[/\\])\../, // ignore dotfiles
    persistent: true
  });
  
  // Something to use when events are received.
  const log = console.log.bind(console);
  urouteWatcher // Add event listeners.
  .on('add',    path => updateJS(path, c.greenBright(`>> add route ${path}`)))
  .on('change', path => updateJS(path,  c.cyanBright(`>> chg route ${path}`)))
  .on('unlink', path => log(             c.redBright(`>> del route ${path}`)));
  global.mitm.watcher.urouteWatcher = urouteWatcher;
}

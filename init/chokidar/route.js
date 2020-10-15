const c = require('ansi-colors');
const fg = require('fast-glob');
const chokidar = require('chokidar');
const _broadcast = require('./broadcast');
const loadJS = require('./loadJS');

const broadcast = _broadcast('route');
const slash = p => p.replace(/\\/g, '/');

module.exports = () => {
  const {userroute} = global.mitm.path;
  const files = fg.sync([userroute]);

  function updateJS(path, msg) {
    loadJS(path, msg, broadcast);
  }
  
  if (!files.length) {
    console.log('>>> no watcher', userroute, files);
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
  .on('add',    p => {p = slash(p); updateJS(p, c.greenBright(`>>> add route ${p}`))})
  .on('change', p => {p = slash(p); updateJS(p,  c.cyanBright(`>>> chg route ${p}`))})
  .on('unlink', p => {p = slash(p); log(          c.redBright(`>>> del route ${p}`))});
  global.mitm.watcher.urouteWatcher = urouteWatcher;
}

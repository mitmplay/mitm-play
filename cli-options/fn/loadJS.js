const c = require('ansi-colors');

const load = function(path) {
  const rpath = require.resolve(path);
  if (require.cache[rpath]) {
    delete require.cache[rpath];
  }
  return require(path);
}

let debunk;
const loadJS = function(path, log) {
  const {clear} = global.mitm.fn;
  console.log(log);
  load(path);
  debunk && clearTimeout(debunk);
  debunk = setTimeout(() => {
    let keys = Object.keys(global.mitm.routes);
    keys = keys.sort(function(a, b) {
      return b.length - a.length || // sort by length, if equal then
             a.localeCompare(b);    // sort by dictionary order
    });
    const routes = {};
    for (let key of keys) {
      routes[key] = global.mitm.routes[key];
    }
    console.log(c.red('>> Reset routes'));
    global.mitm.routes = routes;
    clear();
  }, 500);
}

module.exports = loadJS;

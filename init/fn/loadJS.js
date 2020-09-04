const c = require('ansi-colors');

const load = function(path) {
  const rpath = require.resolve(path);
  if (require.cache[rpath]) {
    delete require.cache[rpath];
  }
  return require(path);
}

const resort = global._debounce(function(fn) {
  let keys = Object.keys(global.mitm.routes);
  keys = keys.sort(function(a, b) {
    return b.length - a.length || // sort by length, if equal then
           a.localeCompare(b);    // sort by dictionary order
  });
  const routes = {};
  for (let key of keys) {
    routes[key] = global.mitm.routes[key];
  }
  console.log(c.red('(*reset routes*)'));
  global.mitm.routes = routes;
  let tag1 = {};
  for (let ns in global.mitm.__tag2) {
    tag1 = {
      ...tag1,
      ...global.mitm.__tag2[ns]
    }
  }
  global.mitm.__tag1 = tag1;
  global.mitm.fn.clear();
  fn && fn();
}, 900, 'clear');

const loadJS = function(path, log, fn) {
  const {fs,routeSet} = global.mitm.fn;
  log && console.log(log);
  try {
    const domain = path.match(/([\w.-]+)[\\/]([\w.-]+)$/)[1];
    const route = {path, ...load(path)};
    routeSet(route, domain, true);
    fs.readFile(path, "utf8", function(err, data) {
      if (err) {
        console.log(c.redBright('Error read source file'), err);
      } else {
        global.mitm.source[domain] = data;
      }
    });
    resort(fn);      
  } catch (error) {
    console.log(c.redBright('Failed load route'), error);
    process.exit(1);
  }
}
loadJS.load = load;
module.exports = loadJS;

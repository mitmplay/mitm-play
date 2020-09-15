const _path = require('path');
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
    // if (ns==='oldstorage.com.sg') 
    //   debugger;
    let tagX = {};
    const flag = !mitm.routes[ns].tags;
    const tag2 = global.mitm.__tag2[ns];
    for (let id in tag2) {
      const mainTag = id.split(':');
      tagX[mainTag[1] || id] = flag;
      tag2[id] = flag;
      if (!flag) {
        // can be improve!!!
        for (let d of mitm.routes[ns].tags) {
          if (id===d || mainTag[1]===d) {
            tag2[id] = true;
            tagX[d] = true;
          }
        }
      }
    }
    tag1 = {
      ...tag1,
      ...tagX,
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
    path = _path.normalize(path);
    let domain = path.match(/([\w~.-]+)[\\/]([\w.-]+)$/)[1];
    // domain = domain.replace(/~/,'[^.]*');
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

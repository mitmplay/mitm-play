const _path = require('path');
const c = require('ansi-colors');
const namespaces = {};

const load = function(path) {
  const rpath = require.resolve(path);
  if (require.cache[rpath]) {
    delete require.cache[rpath];
  }
  return require(path);
}

function sort(obj) {
  const _g = obj._global_;
  delete obj._global_;
  const newobj = {};
  const keys = Object.keys(obj).sort();
  for (let id of keys) {
    newobj[id] = obj[id];
  }
  _g && (newobj._global_ = _g);
  return newobj;
}

const resort = global._debounce(function(fn) {
  const {routes: {_global_}, fn: {routeSet}} = global.mitm;
  if (namespaces._global_===undefined) {
    routeSet(_global_, '_global_');
  }
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
  global.mitm.__tag2 = sort(global.mitm.__tag2);
  global.mitm.__tag3 = sort(global.mitm.__tag3);
  let tag1 = {};
  for (let ns in global.mitm.__tag2) {
    // if (ns==='oldstorage.com.sg') 
    //   debugger;
    let tagX = {};
    const flag = mitm.routes[ns].tags;
    const tag2 = global.mitm.__tag2[ns];
    const tag3 = global.mitm.__tag3[ns];
    for (let id in tag3) {
      for (let url in tag3[id]) {
        const typs = tag3[id][url];
        for (let key in typs) {
          if (typs[key]===true) {
            typs[key] = false;
          }
        }
        if (flag) {
          for (let d of mitm.routes[ns].tags) {
            typs[d]!==undefined && (typs[d] = true)
          }
        }
      }
    }
    for (let id in tag2) {
      const mainTag = id.split(':');
      tagX[mainTag[1] || id] = !flag;
      tag2[id] = !flag;
      if (flag) {
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
  global.mitm.__tag1 = sort(tag1);
  global.mitm.fn.clear();
  global.mitm.fn._tag4();
  fn && fn();
}, 900, 'clear');

const loadJS = function(path, msg, fn) {
  const {fs,routeSet} = global.mitm.fn;
  msg && console.log(msg);
  try {
    path = _path.normalize(path);
    let domain = path.match(/([\w~.-]+)[\\/]([\w.-]+)$/)[1];
    // domain = domain.replace(/~/,'[^.]*');
    const route = {path, ...load(path)};
    namespaces[domain] = true;
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

const fs = require('fs-extra')
const c = require('ansi-colors')
const _debounce = require('../fn/_debounce')
const resort = _debounce(routeSort, 900, 'clear')

function loadJS (path, msg, fn) {
  const { _routeSet } = global.mitm.fn
  msg && console.log(msg)
  try {
    const domain = path.match(/([\w~.-]+)[\\/]([\w.-]+)$/)[1]
    const route = { path, ...load(path) }
    _routeSet(route, domain, true)
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log(c.redBright('Error read source file'), err)
      } else {
        global.mitm.source[domain] = data
      }
    })
    resort(fn)
  } catch (error) {
    console.log(c.redBright('Failed load route'), error)
    process.exit(1)
  }
}

function load (path) {
  const rpath = require.resolve(path)
  if (require.cache[rpath]) {
    delete require.cache[rpath]
  }
  const reslt = require(path)
  const jpath = rpath.replace(/\.js/, '.json')
  reslt.jpath = jpath.replace(/\\/g, '/')

  if (fs.existsSync(jpath)) {
    const jsn = fs.readJsonSync(jpath)
    if (jsn.tags) {
      reslt.tags = jsn.tags
    }
  }
  return reslt
}

const remove = function (path, msg, fn) {
  msg && console.log(msg)
  try {
    const domain = path.match(/([\w~.-]+)[\\/]([\w.-]+)$/)[1]
    delete global.mitm.routes[domain]
    delete global.mitm.router[domain]
    delete global.mitm.__tag2[domain]
    delete global.mitm.__tag3[domain]
    delete global.mitm.__tag4[domain]
    resort(fn)
  } catch (error) {
    console.log(c.redBright('Failed delete route'), error)
    process.exit(1)
  }
}

function keyLength (a, b) {
  return b.length - a.length || // sort by length, if equal then
         a.localeCompare(b) // sort by dictionary order
}

function sort (obj, size=false) {
  const _g = obj._global_
  delete obj._global_
  const newobj = {}
  const arr = Object.keys(obj)
  let keys
  if (size) {
    keys = arr.sort(keyLength)
  } else {
    keys = arr.sort()
  }
  for (const id of keys) {
    newobj[id] = obj[id]
  }
  _g && (newobj._global_ = _g)
  return newobj
}

function routeSort (fn) {
  const { routes: { _global_ } } = global.mitm
  const { _routeSet } = global.mitm.fn
  _routeSet(_global_, '_global_')
  console.log(c.red('(*reset routes*)'))
  global.mitm.routes = sort(global.mitm.routes, true)
  global.mitm.router = sort(global.mitm.router, true)
  global.mitm.__tag2 = sort(global.mitm.__tag2)
  global.mitm.__tag3 = sort(global.mitm.__tag3)
  let tag1 = {}
  for (const ns in global.mitm.__tag2) {
    // if (ns === '_global_') {
    //   debugger
    // }
    const tagX = {}
    const flag = global.mitm.routes[ns].tags
    const tag2 = global.mitm.__tag2[ns]
    const tag3 = global.mitm.__tag3[ns]
    for (const id in tag3) {
      for (const url in tag3[id]) {
        const typs = tag3[id][url]
        for (const key in typs) {
          if (typs[key] === true) {
            typs[key] = false
          }
        }
        if (flag) {
          for (const d of global.mitm.routes[ns].tags) {
            typs[d] !== undefined && (typs[d] = true)
          }
        }
      }
    }
    for (const id in tag2) {
      const mainTag = id.split(':')
      tagX[mainTag[1] || id] = !flag
      tag2[id] = !flag
      if (flag) {
        // can be improve!!!
        for (const d of global.mitm.routes[ns].tags) {
          if (id === d || mainTag[1] === d) {
            tag2[id] = true
            tagX[d] = true
          }
        }
      }
    }
    tag1 = {
      ...tag1,
      ...tagX
    }
  }
  global.mitm.__tag1 = sort(tag1)
  global.mitm.fn._clear()
  global.mitm.fn._tag4()
  fn && fn()
}

loadJS.load = load
loadJS.remove = remove
loadJS.routeSort = routeSort

module.exports = loadJS

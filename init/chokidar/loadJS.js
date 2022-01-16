const typs = require('../fn/_typs')
const _debounce = require('../fn/_debounce')

const {
  lib:{c, fs},
  fn:{logmsg},
} = global.mitm

/**
 * at loadJS end of linear call will trigger the non liniear code: routeSort
 * to populate remaining: __tag1, __tag4
 */
const resort = _debounce(routeSort, 900, 'clear')

function loadJS (path, msg, fn) {
  const { _routeSet } = global.mitm.fn
  msg && logmsg(msg)
  try {
    const arr = path.match(/([\w~.-]+)[\\/]([@\w.-]+)$/)
    const file = arr[2].split('/').pop()
    const domain = arr[1]
    const route = { path, ...load(path) }
    /**
     * populate: __tag2, __tag3 on each namespace
     */
    const r = _routeSet(route, domain, file)
    fs.readFile(path, 'utf8', function (err0, data0) {
      if (err0) {
        logmsg(c.redBright('Error read source file'), err0)
      } else {
        let key = ''
        const [sub, index] = file.split('@')
        if (index) {
          key = `${sub}@${domain}`
        } else {
          key = `${domain}${r ? '' : '/'+file}`
        }
        global.mitm.source[key] = data0
        if (r) {
          let fmacro = path.split('/').pop()
          fmacro = path.replace(fmacro, `_macros_/${fmacro}`) // feat: _macros_
          fmacro = fmacro.replace('index.js', 'macros.js')
          fs.access(fmacro, fs.F_OK, (err1) => {
            if (!err1) {
              fs.readFile(fmacro, 'utf8', function (err2, data2) {
                if (err2) {
                  logmsg(c.redBright('Error read macros file'), err2)
                } else {
                  global.mitm.source[`${key}/macros`] = data2
                }
              })
            }
          })
        }
      }
    })  
    resort(fn) // feat: upadte tags
  } catch (error) {
    logmsg(c.redBright('Failed load route'), error)
    process.exit(1)
  }
}

function load (path) {
  const apath = path.split('/')
  apath.splice(-1, 0, '_tags_')

  const rpath = require.resolve(path)
  if (require.cache[rpath]) {
    delete require.cache[rpath]
  }

  const reslt = require(path)
  const _join =  apath.join('/')
  const _jpath = _join.replace(/\.js/, '.json')
  reslt._jpath = _jpath

  apath.pop()
  fs.ensureDirSync(apath.join('/'))

  if (fs.existsSync(_jpath)) { // restore tags
    try {
      const jsn = fs.readJsonSync(_jpath)
      if (jsn.tags) {
        reslt.tags = jsn.tags
      }
      if (jsn._subns) {
        if (reslt._childns===undefined) { // not created yet!
          reslt._childns = {list: {}, _subns: ''}
        }
        reslt._childns._subns = jsn._subns
        reslt._childns.list[jsn._subns] = true
      }
    } catch (error) {
      logmsg('invalid json', _jpath)
    }
  }
  return reslt
}

const remove = function (path, msg, fn) {
  msg && logmsg(msg)
  try {
    const domain = path.match(/([\w~.-]+)[\\/]([\w.-]+)$/)[1]
    delete global.mitm.routes[domain]
    delete global.mitm.router[domain]
    delete global.mitm.__tag2[domain]
    delete global.mitm.__tag3[domain]
    delete global.mitm.__tag4[domain]
    resort(fn)
  } catch (error) {
    logmsg(c.redBright('Failed delete route'), error)
    process.exit(1)
  }
}

function sort (obj, size=false, _typO=false) {
  const { _keyLength, _sortLength } = global.mitm.fn
  const _g = obj._global_
  delete obj._global_
  const newobj = {}
  // Sort namespace
  const keys = Object.keys(obj)
  if (size) {
    keys.sort(_keyLength)
  } else {
    keys.sort()
  }
  for (const id of keys) {
    const ns = obj[id]
    newobj[id] = ns
    if (_typO) {
      // Sort URL in rule
      for (const rule in ns) {
        if (_typO.indexOf(rule.split(':')[0])>-1) { // rule without tag
          ns[rule] = _sortLength(ns[rule])
        }
      }
    }
  }
  _g && (newobj._global_ = _g)
  return newobj
}

function routeSort (fn) { // feat: upadte tags
  const { routes: { _global_ } } = global.mitm
  const { _routeSet } = global.mitm.fn
  if (_global_._childns===undefined) {
    _routeSet(_global_, '_global_', '')
  }
  logmsg(c.red('(*reset routes*)'))
  global.mitm.routes = sort(global.mitm.routes, true, typs.typO)
  global.mitm.router = sort(global.mitm.router, true, typs.typO)
  global.mitm.__tag2 = sort(global.mitm.__tag2, true)
  global.mitm.__tag3 = sort(global.mitm.__tag3, true)
  let tag1 = {}
  const m3 = x=>x.split(':').pop()
  const f3 = x=>x.slice(0,4)==='tag3'
  for (const ns in global.mitm.__tag2) {
    const _tags = {}
    const flag = global.mitm.routes[ns].tags
    const tag2 = global.mitm.__tag2[ns]
    const tag3 = global.mitm.__tag3[ns]
    tag1[ns] = {}
    for (const id in tag3) {
      const secs = tag3[id]
      for (const sec in secs) {
        const tags = secs[sec].tags
        for (const tag in tags) {
          const _tag = tag.split(':').pop()
          _tags[_tag] = false // collect tag1
          if (tags[tag] === true) {
            tags[tag] = false // feat: update __tag3
          }
        }
        if (flag) { // feat: restore tags from json
          const _tag3 = flag.filter(f3).map(m3)
          const _arr_ = Object.keys(tags)
          for (const tag of _tag3) {
            if (tags[tag]===undefined) { // feat: restore url:tag from json
              const key = _arr_.filter(x => x.match(`^(url:|)${tag}$`))[0] // tag url:tag-name
              key && (tags[key] = true) // feat: upadte tags
            } else {
              tags[tag] = true // feat: update __tag2
            }
          }
        }
      }
    }
    for (const id in tag2) {
      const _tag = id.split(':').pop()
      _tags[_tag] = false // collect tag1
      tag2[id].state = !flag // feat: update __tag2
      if (flag) {
        for (const d of flag) {
          if (id===d) {
            tag1[ns][_tag] = true
            tag2[id].state = true // feat: update __tag2
          }
        }
      }
    }
    for (const _ns in global.mitm.routes) {
      const tags = global.mitm.routes[ns].tags || []
      for (const id of tags) {
        if (!id.match(':')) {
          tag1[ns][id] = true
        }
      }
      const {_childsn} = global.mitm.routes[_ns]
      if (_childsn && _childsn._subns) {
        _childns.list[_childsn._subns] = true // restore tags
      }
    }
    tag1[ns] = sort({..._tags, ...tag1[ns]})
  }
  if (mitm._childns) { // feat: default app
    const {_childns} = mitm
    const {routes, routex} =  global.mitm
    const _ns = _childns._subns.split('@').pop()
    for (const id in routex[_ns]) {
      const ns = id==='index.js' ? _ns : `${id}@${_ns}`
      routes[ns]._childns = _childns
    }
  }
  global.mitm.__tag1 = tag1
  global.mitm.fn._clear()
  global.mitm.fn._tag4()
  fn && fn()
}

loadJS.load = load
loadJS.remove = remove
loadJS.routeSort = routeSort

module.exports = loadJS

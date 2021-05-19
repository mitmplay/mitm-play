const fs = require('fs-extra')
const c = require('ansi-colors')
const typs = require('../fn/_typs')
const _debounce = require('../fn/_debounce')
/**
 * at loadJS end of linear call will trigger the non liniear code: routeSort
 * to populate remaining: __tag1, __tag4
 */
const resort = _debounce(routeSort, 900, 'clear')

function loadJS (path, msg, fn) {
  const { _routeSet } = global.mitm.fn
  msg && console.log(msg)
  try {
    const arr = path.match(/([\w~.-]+)[\\/]([@\w.-]+)$/)
    const file = arr[2].split('/').pop()
    const domain = arr[1]
    const route = { path, ...load(path) }
    /**
     * populate: __tag2, __tag3 on each namespace
     */
    const r = _routeSet(route, domain, file)
    fs.readFile(path, 'utf8', function (err, data) {
      if (err) {
        console.log(c.redBright('Error read source file'), err)
      } else {
        let key = ''
        const [sub, index] = file.split('@')
        if (index) {
          key = `${sub}@${domain}`
        } else {
          key = `${domain}${r ? '' : '/'+file}`
        }
        global.mitm.source[key] = data
        if (r) {
          const file = path.split('/').pop()
          let macros = path.replace(file, `_macros_/${file}`) // feat: _macros_
          macros = macros.replace('index.js', 'macros.js')
          fs.access(macros, fs.F_OK, (err) => {
            if (!err) {
              fs.readFile(macros, 'utf8', function (err, data) {
                if (err) {
                  console.log(c.redBright('Error read macros file'), err)
                } else {
                  global.mitm.source[`${key}/macros`] = data
                }
              })
            }
          })
        }
      }
    })  
    resort(fn) // feat: upadte tags
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
  const _jpath = rpath.replace(/\.js/, '.json')
  reslt._jpath = _jpath.replace(/\\/g, '/')

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
      console.log('invalid json', _jpath)
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

function sort (obj, size=false, _typO) {
  const { _keyLength, _sortLength } = global.mitm.fn
  const _g = obj._global_
  delete obj._global_
  const newobj = {}
  // Sort namespace
  const arr = Object.keys(obj)
  let keys
  if (size) {
    keys = arr.sort(_keyLength)
  } else {
    keys = arr.sort()
  }
  for (const id of keys) {
    const ns = obj[id]
    newobj[id] = ns
    if (_typO) {
      // Sort URL in rule
      for (rule in ns) {
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
  const { routes: { _global_ }, argv } = global.mitm
  const { _routeSet } = global.mitm.fn
  if (_global_._childns===undefined) {
    _routeSet(_global_, '_global_', '')
  }
  console.log(c.red('(*reset routes*)'))
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
          if (tags[tag] === true) {
            _tags[tag.split(':').pop()] = false
            tags[tag] = false // feat: update __tag3
          }
        }
        if (flag) { // restore tags from json
          const _tag3 = flag.filter(f3).map(m3)
          const _tags = Object.keys(tags)
          for (let tag of _tag3) {
            if (tags[tag]===undefined) {
              tag = _tags.filter(x => x.indexOf(tag)>-1)[0] // tag url:tag-name
              tag && (tags[tag] = true) // feat: upadte tags
            } else {
              tags[tag] = true // feat: update __tag2
            }
          }
        }
      }
    }
    for (const id in tag2) {
      _tags[id.split(':').pop()] = false
      const mainTag = id.split(':')
      tag2[id].state = !flag // feat: update __tag2
      if (flag) {
        for (const d of flag) {
          if (id===d) {
            tag1[ns][mainTag.pop()] = true
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

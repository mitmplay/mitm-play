const _setlogs = require('./_setlogs')
/**
 * update global.mitm.__tag4 to contain all namespaces which having tags
 * if namespace contain only typTags, it will having empty object
 * this empty object is required for typTags (routes/match.js)
 * to work on _global_ tag properly
 *
 * @param {namespace} _ns
 */
const tags = function (_ns) {
  const { router, __tag2 } = global.mitm
  const tag4 = {}
  let routr = {}
  let tag2 = {}
  if (_ns) {
    routr[_ns] = router[_ns]
    tag2[_ns] = __tag2[_ns]
  } else {
    routr = { ...router }
    tag2 = { ...__tag2 }
  }
  for (const namespace in routr) {
    tag4[namespace] = {}
    const node = tag4[namespace]
    const ns = routr[namespace]
    for (const id in ns) {
      if (node[id] === undefined) {
        node[id] = []
      }
      node[id].push(id)
    }
  }
  for (const namespace in tag2) {
    const tags = {}
    const ns = tag2[namespace]
    const node = tag4[namespace]
    for (const id in ns) {
      const [typ, tag] = id.split(':')
      if (ns[id]) {
        if (tag) {
          if (node[typ] === undefined) {
            node[typ] = [typ]
          }
          node[typ].push(id)
          tags[tag] = true
        } else {
          tags[typ] = true
        }
      }
    }
    global.mitm.routes[namespace].jtags = Object.keys(tags).sort()
  }
  if (_ns) {
    if (tag4[_ns]) {
      global.mitm.__tag4[_ns] = tag4[_ns]
    }
  } else {
    global.mitm.__tag4 = tag4
  }
  _setlogs()
}

module.exports = tags

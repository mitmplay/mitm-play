const _setlogs = require('./_setlogs')
/**
 * update global.mitm.__tag4 to contain all namespaces which having tags
 * if namespace contain only typTags, it will having empty object
 * this empty object is required for typTags (routes/match.js)
 * to work on _global_ tag properly
 *
 * @param {namespace} _ns
 */
const tagsfn = function (_ns) {
  const { __tag1, __tag2, __tag3, router } = global.mitm
  const tag4 = {}
  let routr = {}
  let tag1 = {}
  let tag2 = {}
  let tag3 = {}
  if (_ns) {
    routr[_ns] = router[_ns]
    tag1[_ns] = __tag1[_ns]
    tag2[_ns] = __tag2[_ns]
    tag3[_ns] = __tag3[_ns]
  } else {
    routr = { ...router }
    tag1 = { ...__tag1 }
    tag2 = { ...__tag2 }
    tag3 = { ...__tag3 }
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
  const atags = {}
  for (const namespace in tag2) {
    const tags = {}
    const ns = tag2[namespace]
    const node = tag4[namespace]
    for (const id in ns) {
      const [typ, tag] = id.split(':')
      if (tag1[namespace][tag]) {
        tags[tag] = true
      }
      if (ns[id].state) { // feat: update __tag2
        if (tag) {
          if (node[typ] === undefined) {
            node[typ] = [typ]
          }
          node[typ].push(id)
          const _tags = ns[id].tag1
          if (_tags && ns[id].state) {
            let tagOk = true // feat: update __tag2
            for (const tg of _tags) {
              if (__tag1[namespace][tg]===false) {
                tagOk = false
                break
              }
            }
            if (tagOk) {
              node[typ].push(`${id} ${_tags.join(' ')}`)
            }
          }
          tags[id] = true
        } else {
          tags[typ] = true
        }
      } else { // feat: tag3 inside tag2 and depend to tag1 
        for (const tg4 in node) {
          const [_typ, _tags] = tg4.split(':')
          if (_tags) {
            if (node[_typ]===undefined) {
              node[_typ] = [_typ, tg4]
            } else if (!node[_typ].includes(tg4)) {
              node[_typ] = node[_typ].concat(node[tg4])
            }
          }
        }
      }
    }
    atags[namespace] = tags
  }
  for (const namespace in tag3) {
    const tags = {}
    const ns = tag3[namespace]
    for (const id in ns) {
      const urls = ns[id]
      for (const url in urls) {
        const secs = urls[url]
        for (const tag in secs.tags) {
          if (tag1[namespace][tag]) {
            tags[tag] = true
          }
          if (secs.tags[tag]===true) { // feat: update __tag3
            tags[`tag3:${tag}`] = true
          }
        }
      }
    }
    if (!atags[namespace]) {
      atags[namespace] = tags
    } else {
      atags[namespace] = {...atags[namespace], ...tags}
    }
  }
  for (const ns in atags) {
    global.mitm.routes[ns]._jtags = Object.keys(atags[ns]).sort()
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

module.exports = tagsfn

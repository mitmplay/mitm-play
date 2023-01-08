const { c } = global.mitm.lib
const { typC, typA, typO } =  require('./_typs')

const rmethod = /^(GET|PUT|POST|DELETE|)#?\d*!?:([ \!\(\)\w.#~-]+:|)(.+)/ //# __tag2_TO_tag1_RULES // feat: tags in url
const tgInUrl = /:[ \!\(\)\w.#~-]+:/ //# __tag2_TO_tag1_RULES // feat: tags in url

function toRegex (gpath, flags = '') {
  return new RegExp(gpath
    .replace(/\//g, '\\/')
    .replace(/\?/g, '\\?')
    .replace(/\.([^*+]|$)/g, (m,p1) => `\\.${p1}`)
    .replace(/(\[.*)(\\\/)(.*\])/g, (m,p1,p2,p3) => `${p1}/${p3}`)
    .replace(/(\[.*)(\\\?)(.*\])/g, (m,p1,p2,p3) => `${p1}?${p3}`)
    .replace(/(\[.*)(\\\.)(.*\])/g, (m,p1,p2,p3) => `${p1}.${p3}`), flags)
}

function routerSet (router, typ, method, gpath) {
  if (method && method[3][0]==='!') {
    console.log(c.red.bgYellowBright(`Error route: ${ method[0]}`))
    console.log({typ, method})
    process.exit()
  }
  let regex // feat: url start with method: ie: GET:/api/login
  if (method) {
    router[typ][`${gpath}~method`] = method[1]
    regex = toRegex(method.pop())
  } else {
    regex = toRegex(gpath)
  }
  router[typ][gpath] = regex
}

const fkeys = x => x !== 'tags' && x !== 'contentType'

function _routeSet (_r, namespace, file) {
  const { routes, routex, __mocks } = global.mitm
  let r = {}
  for (let key in _r) {
    const id = key.replace(/ +/, ' ').trim()
    if (id===key) {
      r[key] = _r[key]
    } else {
      r[id] = _r[key]
    }
  }
  if (r._childns===undefined) {
    r._childns = {list: {}, _subns: ''}
  }
  const [sub, index] = file.split('@')
  if (routex[namespace]===undefined) {
    routex[namespace] = {}
  }
  routex[namespace][sub] = r // need before logic below
  if (index) {
    const ns = routes[namespace]
    namespace = `${sub}@${namespace}`
    if ( ns._childns.list[namespace]===undefined) {
      ns._childns.list[namespace] = false
    }
    for (const key in r) { // feat: nested routes
      const tgt = r[key]
      const src = ns[key]
      if(src && typeof src==='object' && !Array.isArray(src)) {
        r[key] = {...src, ...tgt}
      }
    }
    for (const key in ns) { // feat: nested routes
      if(r[key]===undefined) {
        r[key] = ns[key]
      }
    }
  }
  routes[namespace] = r // need logic above & below
  if (namespace === '_global_') {
    routes._global_.mock = {
      ...routes._global_.mock,
      ...__mocks // feat: __mocks
    }
  }
  const tags = {}
  const urls = {}
  const router = {}
  router._namespace_ = toRegex(namespace.replace(/~/g, '[^.]*'))

  const _typlist = function (typs) {
    const typlist = Object.keys(r).filter(x => {
      const secs = r[x]
      const [typ, _tags] = x.split(':') // ie: 'css:1.no-ads active': {...}
      if (typ===typs) {
        if (_tags) {
          const path = []
          for (const gpath in secs) {
            const arr = gpath.match(rmethod)
            path.push(arr ? arr[3] : gpath)
          }
          const [tag, ...tag1] = _tags.split(/ +/)
          const id = tag1.length ? `${typ}:${tag}` : x
          tags[id] = {state: true, tag1, typ, path} // feat: update __tag2
        }
        return true
      }
    })
    r[typs] && typlist.unshift(typs)
    return typlist
  }

  for (const typs of typC) {
    _typlist(typs)
  }

  for (const typs of typA) {
    const typlist = _typlist(typs)
    for (const typ of typlist) {
      router[typ] = {}
      for (const gpath of r[typ]) {
        const method = gpath.match(rmethod)
        routerSet(router, typ, method, gpath)
      }
    }
  }

  function _nsstag(typ, gpath){
    // feat: remove tag from url/rule for __tag3
    const arrTag = gpath.match(rmethod)
    if (arrTag) {
      const [, method,, path] = arrTag
      gpath = method ? `${method}:${path}` : path // remove from url
    }
    typ = typ.split(':')[0] // remove from rule
    if (urls[gpath] === undefined) {
      urls[gpath] = {}
    }
    const nss = urls[gpath]
    if (nss[typ] === undefined) {
      nss[typ] = {note: '', tags: {}, tag1: []}
    }
    return nss[typ] // feat: update __tag3
  }
  
  function addType (typ) {
    router[typ] = {}
    const [ptyp, ptags] = typ.split(':')
    for (const gpath in r[typ]) {
      const method = gpath.match(rmethod) // feat: tags in url
      routerSet(router, typ, method, gpath)
      const site = r[typ][gpath]

      if (site===undefined || site===null) { // fix:empty-gpathing{'GET:/google': ''}
        const obj = {}
        obj[typ] = r[typ]
        console.log(c.red(`\n incorrect route: ${namespace}\n`), obj, '\n')
        process.exit(1)
      }
 
      let tag3
      if (site.tags) {
        if (Array.isArray(site.tags)) {
          site.tags = site.tags.join(' ')
        }
        tag3 = _nsstag(typ, gpath) // feat: update __tag3
        const ctype = site.contentType ? `[${site.contentType.join(',')}]` : ''
        const keys = Object.keys(site).filter(fkeys).join(',')
        tag3.note = `${ctype}<${keys}>`.replace('<>', '') // feat: update __tag3

        if (site.tags.match(':')) {
          throw new Error('char ":" cannot be included in tags!')
        }
        const arr = site.tags.split(/ +/)
        for (const tag of arr) {
          tag3.tags[tag] = false
        }
      }

      if (gpath.match(tgInUrl) && method[2]!=='hidden:') { // feat: tags in url
        const [utg, ...tag1] = method[2].split(':')[0].split(/ +/)
        const path = [gpath.split(':').pop()]
        tag3 = _nsstag(typ, gpath)
        tag3.tag1 = tag1
        const tag = `url:${utg}`
        tag3.tags[tag] = false // feat: update __tag3
        tags[tag] = { state: false, tag1, typ, path } // feat: update __tag2
      }
      if (tag3 && ptags) {
        const [tag2, ...tag1] = ptags.split(/ +/)
        tag3.ptyp = ptyp
        tag3.tag1 = tag1
        tag3.tag2 = `${ptyp}:${tag2}`
      }

      if (site.contentType) {
        const contentType = {}
        for (const typ2 of site.contentType) {
          if (contentType[typ2]) {
            const ct = site.contentType.join("', '")
            throw new Error([
              'contentType should be unique:',
              `${namespace}.${typ}['${gpath}'].contentType => ['${ct}']`])
          }
          contentType[typ2] = toRegex(typ2)
        }
        router[typ][`${gpath}~contentType`] = contentType
      }
    }
  }

  // feat: _global_.flag
  if (namespace === '_global_') {
    typO.unshift('args', 'flag')
  }
  for (const typs of typO) {
    const typlist = _typlist(typs)
    for (const typ of typlist) {
      addType(typ)
    }
  }

  if (namespace === '_global_') {
    router.config = global.mitm.router._global_.config
  }
  global.mitm.router[namespace] = router
  global.mitm.__tag2[namespace] = tags
  global.mitm.__tag3[namespace] = urls
  return r
}

module.exports = {
  _routeSet,
  toRegex,
  rmethod
}

const c = require('ansi-colors')
const { fn: { home, _nameSpace } } = global.mitm
const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }
const mmethod = /^(GET|PUT|POST|DELETE):/
const nohttp = /https?:\/\//
const { logmsg } = global.mitm.fn
const m1 = {GET: 'gt', PUT: 'pt', POST: 'ps', DELETE: 'dl' }
const m2 = {GET: 'gt:',PUT: 'pt:',POST: 'ps:',DELETE: 'dl:'}

function mth(m, k) {
  return (k.match(/^:/) ? m1: m2)[m] || m
}

function bloc(s) {
  return `${c.red('[')}${s}${c.red(']')}`
}

function _url(s, other='') {
  const length = s.length + other.length
  return `${c.red('(')}${length>95 ? s.slice(0,92)+'...' : s}${c.red(')')}`
}

function typTags (typ, namespace) {
  const { __tag4 } = global.mitm
  const ns = __tag4[namespace]
  if (ns) {
    return ns[typ] || []
  } else {
    return []
  }
}

function validRoute(namespace) {
  const { routes } = global.mitm
  // routes[namespace] can be undefined
  if (!namespace) {
    return false
  } else if (!routes[namespace]) {
    logmsg(c.red(`\nUndefined namespace: ${namespace}!`))
    logmsg(c.redBright(`Please fix: *index.json - _subns value or delete the file!\n`))
    process.exit(1)
  }
  return true
}

const searchArr = ({url, method, browserName, typ: typs}) => {
  const { __args, __tag1, __tag2, __tag3, router, routes } = global.mitm

  return function (nspace) {
    const namespace = _nameSpace(nspace)
    if (!namespace) {
      return
    }
    if (routes[namespace]) {
      const tg1 = __tag1[namespace]
      const tg2 = __tag2[namespace]
      const tg3 = __tag3[namespace] || {}
  
      const list = typTags(typs, namespace)
      for (const typ of list) {
        const obj = router[namespace][typ]
        const route = routes[namespace][typ] || []
        for (const key of route) {
          const isTagsOk = checkTags(tg1, tg2, tg3, typ, key)
          if (obj && isTagsOk) {
            const arr = url.match(obj[key])
            if (arr) {
              let log
              const ty = typ.padEnd(8, ' ')
              if (key.match(mmethod)) {
                log = `${browser[browserName]} ${ty} ${bloc(key)}`
              } else {
                log = `${browser[browserName]} ${ty} ${bloc(c.gray(mth(method, key))+key)}`
              }
              const { host, origin: o, pathname, search } = new URL(url)
              let msg = (__args.nohost ? '' : o.replace(nohttp,''))+pathname
              !__args.nourl && (log += _url(msg, method+key))
              const hidden = key.match(/^[\w#]*!:/)
              return {
                namespace,
                pathname,
                hidden,
                search,
                host,
                url,
                key,
                arr,
                log,
                typ
              }
            }
          }
        }
      }
    }
  }
}

function okTag1(tag1, tags) { //feat: tag2/3 depend to tag1
  for (const tag of tag1) {
    if (tags[tag]) {
      return true
    }
  }
  return false
}

function okTags(tags, utg='') {
  let ok = false
  for (const tg in tags) {
    const tag = tags[tg]
    if (utg && tg===utg) {
      return tag || ok // feat: tags in url or in tags
    }
    tag && (ok = true)
  }
  return ok
}

function checkTags(tg1, tg2, tg3, typ, key) {
  const {fn:{rmethod}} = global.mitm
  let tag
  let str = key
  const arrTag = str.match(rmethod)
  if (arrTag) {
    const [, method, tg, path] = arrTag       // feat: tags in url
    str = method ? `${method}:${path}` : path // remove from url
    if (tg) {
      tag = `url:${tg.slice(0,-1).split(/ +/)[0]}`
    }
  }
  const [_typ, _tags] = typ.split(':')
  let isTagsOk = tg3[str] && tg3[str][_typ]
  if (isTagsOk) { // need check on __tag3 
    const {tag1, tags} = tg3[str][_typ]
    if (tag1.length) {
      isTagsOk = okTag1(tag1,  tg1)
    }
    if (isTagsOk && Object.keys(tags).length) {
      isTagsOk = okTags(tags, tag)
    }
  }
  if (!isTagsOk && _tags) { // if not, need to check on__tag2
    const [tag, ...tag1] = typ.split(/ +/)
    isTagsOk = tg2[tag].state
    if (isTagsOk && tag1.length) {
      isTagsOk = false
      for (const _t1 of tag1) {
        if (tg1[_t1]) {
          isTagsOk = true
          break
        }
      }
    }
  }
  return isTagsOk===undefined || isTagsOk
}

const searchFN = (typs, { url, method, browserName }) => {
  const { __args, __tag1, __tag2, __tag3, router, routes } = global.mitm

  return function search (nspace) {
    const namespace = _nameSpace(nspace)
    if (!validRoute(namespace)) {
      return
    }
    const tg1 = __tag1[namespace]
    const tg2 = __tag2[namespace]
    const tg3 = __tag3[namespace] || {}
    let workspace = routes[namespace].workspace
    if (workspace) {
      workspace = home(workspace)
    }

    const list = typTags(typs, namespace)

    for (const typ of list) {
      const route = routes[namespace][typ]
      const obj = router[namespace][typ]

      for (const key in route) {
        const isTagsOk = checkTags(tg1, tg2, tg3, typ, key)
        const arr = isTagsOk && url.match(obj[key])
        const _m = obj[`${key}~method`]

        if (arr && (!_m ||_m===method)) {
          const { host, origin: o, pathname, search } = new URL(url)
          let msg = (__args.nohost ? '' : o.replace(nohttp,''))+pathname

          let [t, oth, urls] = key.split(':')
          let id3 // feat: construct id3 for tag3
          if (t && (urls||oth)) {// t: GET/PUT/POST
            id3 = `${t}:${urls||oth}`
          } else {
            id3 = urls || key.replace(/^:/, '')
          }
          let [ty, tg] = typ.split(':')
          let log = `${browser[browserName]} ${ty.padEnd(8, ' ')} `
          let tgs = tg || ''

          let tags = []
          let obj3 = tg3[id3]
          if (obj3 && obj3[ty]) {
            tags = obj3[ty].tags || {}
            const t3 = Object.keys(tags).filter(x=>tags[x])
            t3.length && (tgs += `{${t3.reverse()}}`)
          }

          if (__args.nourl && __args.nourl==='url') {
            log += _url(msg, tgs)
          } else {
            let other = key+tgs
            if (key.match(mmethod)) {
              log += `${bloc(id3)}`
            } else {
              other += method
              log += `${bloc(c.gray(mth(method, id3))+id3)}`
            }
            !__args.nourl && (log += _url(msg, other))
          }

          tgs && (log += tgs)
          const hidden = key.match(/^[\w#]*!:/)
          return  {
            contentType: obj[`${key}~contentType`],
            route: route[key],
            workspace,
            namespace,
            pathname,
            hidden,
            search,
            tags,
            host,
            url,
            key,
            arr,
            log,
            typ
          }
        }
      }
    }
  }
}

const searchKey = key => {
  const { routes } = global.mitm

  return function search (nspace) {
    const namespace = _nameSpace(nspace)
    if (!validRoute(namespace)) {
      return
    }

    return routes[namespace][key]
  }
}

const matched = (search, { url, oriRef }) => {
  // match to domain|origin|referer|_global_
  const domain = global.mitm.fn._tldomain(url) 
  let match = search(domain) // match to domain

  if (!match && oriRef) {
    match = search(oriRef) // to origin|referer
  }
  if (!match) {
    match = search('_global_') // to global
  }
  // logmsg('>>> Match', tld, !!match)
  return match
}

module.exports = {
  searchArr,
  searchKey,
  searchFN,
  matched
}

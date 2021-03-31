const c = require('ansi-colors')
const { fn: { home, _nameSpace } } = global.mitm
const browser = { chromium: '[C]', firefox: '[F]', webkit: '[W]' }

function typTags (typ, namespace) {
  const { __tag4 } = global.mitm
  const ns = __tag4[namespace]
  // if (typ==='proxy')
  //   debugger;
  if (ns) {
    return ns[typ] || []
  } else {
    return []
  }
}

const searchArr = ({ typ: typs, url, browserName }) => {
  const { __args, router, routes } = global.mitm

  return function (nspace) {
    const namespace = _nameSpace(nspace)
    if (!namespace) {
      return
    }
    if (routes[namespace]) {
      const list = typTags(typs, namespace)
      for (const typ of list) {
        const obj = router[namespace][typ]
        const arr = routes[namespace][typ] || []
        for (const key of arr) {
          if (obj) {
            const arr = url.match(obj[key])
            if (arr) {
              let log = `${browser[browserName]} ${typ} (${key})`
              const { host, origin, pathname, search } = new URL(url)
              const msg = pathname.length <= 100 ? pathname : pathname.slice(0, 100) + '...'
              !__args.nourl && (log += `.url(${__args.nohost ? '' : origin}${msg})`)
              const hidden = key.match(/^[\w#]*!:/)
              const matched = {
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
              return matched
            }
          }
        }
      }
    }
  }
}

function checkTags(tg3, typ, key) {
  const { rmethod } = global.mitm.fn
  let isTagsOk = true
  let str = key
  const arrTag = str.match(rmethod)
  if (arrTag) {
    const [, method,, path] = arrTag          // feat: tags in url
    str = method ? `${method}:${path}` : path // remove from url
  }
  const typ3 = typ.split(':')[0]
  if (tg3[str] && tg3[str][typ3]) {
    const nodes = tg3[str][typ3]
    for (const tag in nodes) {
      if (nodes[tag] === false) {
        isTagsOk = false
        break
      }
    }
  }
  return isTagsOk
}

const searchFN = (typs, { url, method, browserName }) => {
// const {router,routes, data} = global.mitm;
  const { __args, __tag3, router, routes } = global.mitm

  return function search (nspace) {
    const namespace = _nameSpace(nspace)
    if (!namespace) {
      return
    }

    let workspace = routes[namespace].workspace
    if (workspace) {
      workspace = home(workspace)
    }

    const list = typTags(typs, namespace)

    for (const typ of list) {
      // if (namespace==='oldstorage.com.sg' && typs==='cache' && url.match('meta'))
      //   debugger;
      const route = routes[namespace][typ]
      const obj = router[namespace][typ]
      const tg3 = __tag3[namespace] || {}

      for (const key in route) {
        let isTagsOk = checkTags(tg3, typ, key)

        const arr = isTagsOk && url.match(obj[key])
        const _m = obj[`${key}~method`]

        if (arr && (!_m ||_m===method)) {
          const { host, origin, pathname, search } = new URL(url)
          const msg = pathname.length <= 100 ? pathname : pathname.slice(0, 100) + '...'

          const [ty, tg] = typ.split(':')
          let log = `${browser[browserName]} ${ty.padEnd(8, ' ')} `
          if (__args.nourl && __args.nourl==='url') {
            log += `${__args.nohost ? '' : origin}${msg}`
          } else {
            log += `(${key})`
            !__args.nourl && (log += `.url(${__args.nohost ? '' : origin}${msg})`)
          }
          tg && (log += `:${tg}`)

          const hidden = key.match(/^[\w#]*!:/)
          const matched = {
            contentType: obj[`${key}~contentType`],
            route: route[key],
            workspace,
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
          // if (data.maches===undefined) {
          //   data.maches = [];
          // } else if (data.maches.length>20) {
          //   data.maches.shift();
          // }
          // data.maches.push(matched);
          return matched
        }
      }
    }
  }
}

const searchKey = key => {
  const { routes } = global.mitm

  return function search (nspace) {
    const namespace = _nameSpace(nspace)
    if (!namespace) {
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
  // console.log('>>> Match', tld, !!match)
  return match
}

module.exports = {
  searchArr,
  searchKey,
  searchFN,
  matched
}

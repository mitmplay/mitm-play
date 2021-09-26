module.exports = function ({ url }, reqs) {
  const {mitm} = global
  let {
    argv,
    path,
    info,
    __args,
    __flag,
    client,
    routes,
    plugins,
    version,
    fn: {
      _nameSpace
    }
  } = mitm
  const namespace = _nameSpace(url)
  let macros = []
  if (namespace && routes[namespace].macros) {
    const m = { ...routes[namespace].macros }
    for (const i in m) {
      macros.push(`\n    "${i}": ${m[i] + ''}`)
    }
  }
  const {headers: {referer}} = reqs
  const {origin, pathname} = new URL(referer)
  const _csp = info.csp[`${origin}${pathname}`]
  const csp = {}
  if (_csp) {
    _csp.split('; ').forEach(d=> {
      const [k, ...v] = d.split(/ +/)
      csp[k] = v
    })
  }
  info = {csp}
  macros = `,\n  "macros": {${macros.join(',')}\n  }\n}`
  let json = {
    __args,
    __flag,
    info,
    argv,
    path,
    client,
    routes,
    plugins,
    files: {
      log_events: {},
      cache_events: {},
      route_events: {},
      profile_events: {}, // feat: profile
      markdown_events: {}, // feat: markdown
      getRoute_events: {},
      getProfile_events: {},
      getMarkdown_events: {}
    },
    fn: {},
    version,
    autofill: {},
    macrokeys: {},
    autobuttons: {},
    leftbuttons: {},
    rightbuttons: {},
  }
  json = JSON.stringify(json)
  json = json.replace(/}$/g, macros)
  return `window.mitm = ${json}`
}

module.exports = function (resp, reqs) {
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
  const namespace = _nameSpace(reqs.url)
  let macros = []
  if (namespace && routes[namespace].macros) {
    const m = { ...routes[namespace].macros }
    for (const i in m) {
      macros.push(`\n    "${i}": ${m[i] + ''}`)
    }
  }

  const csp = {}
  let referer = reqs.headers.referer
  if (referer) {
    const {origin, pathname} = new URL(referer)
    const {_csp, reportTo} = info.csp[`${origin}${pathname}`] || {}
    if (_csp) {
      _csp.split('; ').forEach(d=> {
        const [k, ...policy] = d.split(/ +/)
        csp[k] = {policy: policy.sort()}
      })
    }
    csp.reportTo = reportTo
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

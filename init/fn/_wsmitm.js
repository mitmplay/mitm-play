module.exports = function ({ url }) {
  const {
    argv,
    path,
    __args,
    __flag,
    client,
    routes,
    plugins,
    version,
    fn: {
      _nameSpace
    }
  } = global.mitm
  const namespace = _nameSpace(url)
  let macros = []
  if (namespace && routes[namespace].macros) {
    const m = { ...routes[namespace].macros }
    for (const i in m) {
      macros.push(`\n    "${i}": ${m[i] + ''}`)
    }
  }
  macros = `,\n  "macros": {${macros.join(',')}\n  }\n}`
  let json = {
    __args,
    __flag,
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
    version
  }
  json = JSON.stringify(json, null, 2)
  json = json.replace(/\n}$/g, macros)
  return `window.mitm = ${json}`
}

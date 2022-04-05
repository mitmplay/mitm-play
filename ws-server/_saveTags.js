const {
  lib:{fs},
  fn:{logmsg},
} = global.mitm

module.exports = ({ data }) => {
  const { __args } = global.mitm
  if (__args.debug.includes('T')) {
    logmsg('>>> saveTags')
  }
  global.mitm.__tag1 = data.__tag1
  global.mitm.__tag2 = data.__tag2
  global.mitm.__tag3 = data.__tag3
  global.mitm.fn._tag4()

  const {routes} = global.mitm
  for (_ns in routes) {
    let _subns = ''
    const ns = routes[_ns]
    ns._childns = data._childns[_ns] || {list: {}, _subns: ''}
    for (const id in ns._childns.list) {
      if (ns._childns.list[id]) {
        ns._childns._subns = id
        _subns = id
        break
      }
    }
    if (ns._jpath && ns._jtags) {
      const json = {
        _: 'auto-generated during saveTags!',
        tags: ns._jtags,
        _subns
      }
      fs.writeJson(ns._jpath, json, {spaces: '  '}, err0 => {
        err0 && console.error(ns._jpath, {err0})
      })
    }
  }
  const serial = JSON.stringify({routes})
  global.broadcast({ data: `_saveTags${serial}` })

  return 'OK'
}

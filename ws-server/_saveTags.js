const fs = require('fs-extra')

module.exports = ({ data }) => {
  console.log('>>> saveTags')
  global.mitm.__tag1 = data.__tag1
  global.mitm.__tag2 = data.__tag2
  global.mitm.__tag3 = data.__tag3
  global.mitm.fn._tag4()

  const {routes} = global.mitm
  for (namespace in routes) {
    const ns = routes[namespace]
    if (ns.jpath && ns.jtags) {
      const json = {
        _: 'auto-generated during saveTags!',
        tags: ns.jtags
      }
      fs.writeJson(ns.jpath, json, {spaces: '  '}, err => {
        err && console.error(ns.jpath, {err})
      })
    }  
  }

  return 'OK'
}

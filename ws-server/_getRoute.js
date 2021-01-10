const {typC, typA, typO} = require('../init/fn/_typs')
const rmethod = /^(GET|PUT|POST|DELETE|):([\w.#~-]+:|)(.+)/ // feat: tags in url

function noTagInRule(rule) {
  const arr = rule.match(rmethod) // feat: tags in url
  return arr ? `${arr[1]}:${arr[3]}` : rule
}

module.exports = () => {
  const __urls = {}
  const files = {}
  const {
    routes,
    __tag1,
    __tag2,
    __tag3,
    __tag4
  } = global.mitm
  const data = {
    routes,
    files,
    _tags_: {
      __tag1,
      __tag2,
      __tag3,
      __tag4,
      __urls
    }
  }
  const {source:s, routes: r} = global.mitm
  for (const ns in r) {
    const _secs = r[ns]
    const fpath = _secs.path
    if (fpath) {
      const arr = fpath.split('/')
      arr.pop()
      const path = arr.join('/')
      const content = s[ns]
      const title = ns
      files[ns] = {
        path,
        title,
        fpath,
        content
      }
    }

    const urls = {}
    for (sec in _secs) {
      if (typO.indexOf(sec)===-1||sec.indexOf(':')!==-1) {
        continue
      }
      const rules = _secs[sec]
      for (_rule in rules) {
        const arr = _rule.match(rmethod)
        if (!arr || !arr[3]) {
          let url = noTagInRule(_rule)
          if (sec==='flag' || sec==='args') {
            url = `${url}:${rules[_rule]}`
          }
          if (urls[url]===undefined) {
            urls[url] = {
              tags: ['notag'],
              secs: {},
            }
          }
          urls[url].secs[sec] = true
        }
      }
    }
    __urls[ns] = urls
  }
  return data
}

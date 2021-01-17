const c = require('ansi-colors')
const rmethod = /^(GET|PUT|POST|DELETE|)#?\d*!?:([\w.#~-]+:|)(.+)/ // feat: tags in url

function _skipByTag (match, typ) {
  const { __args, __tag3 } = global.mitm
  let { namespace, key, url } = match
  let arrTag = key.match(rmethod)
  if (arrTag) {
    const [, method,, path] = arrTag
    //__tag3[namespace][key] - key match to rule without tag
    key = method ? `${method}:${path}` : path
  }
  let tag3 = {}
  // const tag = typ.split(':')[0]
  if (__tag3._global_ && __tag3._global_[key]) {
    tag3 = __tag3._global_[key][typ]
  } else if (__tag3[namespace] && __tag3[namespace][key]) {
    tag3 = __tag3[namespace][key][typ]
  }
  const {tags} = tag3 // feat: update __tag3
  if (tags) {
    for (const tag in tags) {
      if (tags[tag] === false) {
        if (__args.verbose) {
          const { origin, pathname } = new URL(url)
          const msg = pathname.length <= 100 ? pathname : pathname.slice(0, 100) + '...'
          console.log(c.magentaBright(`>>> tags (${tag}).match(${match.key}) ${origin}${msg}`))
        }
        return true
      }
    }
  }
  return false
}

module.exports = _skipByTag

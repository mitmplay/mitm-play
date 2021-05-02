const c = require('ansi-colors')

function skipTag1(tag1, tags) {
  for (const tag of tag1) { //feat: tag3 depend to tag1
    if (tags[tag]) {
      return false
    }
  }
  return true
}

function skipTags(tags) {
  for (const tag in tags) {
    if (tags[tag]) {
      return false
    }
  }
  return true
}

function checkTags(namespace, key, typ, tags, skip=false) {
  const {__tag1, __tag2, __tag3} = global.mitm
  if (__tag3[namespace] && __tag3[namespace][key]) {
    const tag3 = __tag3[namespace][key][typ]
    if (tag3===undefined) {
      return skip
    }
    let {tag1, tag2, tags} = tag3 // feat: update __tag3
    if (tag1.length) {
      skip = skipTag1(tag1,  __tag1[namespace])
    }
    if (!skip && tag2 &&  __tag2[namespace][tag2].state) { // feat: no need to check tag3
      return false
    }
    if (!skip && tags.length) {
      skip = skipTags(tags)
    }
  } else if (tags.match(':')) {
    const [tag, ...tag1] = tags.split(/ +/)
    const obj = __tag2[namespace][tag]
    if (obj && !obj.state) {
      return true
    } else if (tag1.length) {
      skip = skipTag1(tag1,  __tag1[namespace])
    }
  }
  return skip
}

function _skipByTag (match, typ) {
  const { __args, fn: { rmethod }} = global.mitm
  let { namespace, key, url } = match
  // feat: remove tag from url/rule for __tag3
  let arrTag = key.match(rmethod)
  if (arrTag) {
    const [, method,, path] = arrTag
    key = method ? `${method}:${path}` : path // remove from url
  }
  let skip = checkTags(namespace, key, typ, match.typ)
  if (skip && namespace!=='_global_') {
    skip = checkTags('_global_', key, typ, match.typ, skip)
  }
  if (skip) {
    if (__args.verbose) {
      const { origin, pathname } = new URL(url)
      const msg = pathname.length <= 100 ? pathname : pathname.slice(0, 100) + '...'
      console.log(c.magentaBright(`>>> skip tag [${match.key}](${origin}${msg})`))
    }
  }
  return skip
}

module.exports = _skipByTag

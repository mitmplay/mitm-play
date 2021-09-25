const { searchArr, matched } = require('./match')

const skipResponse = async function (reqs, _3d) {
  const { url, browserName } = reqs
  const search1 = searchArr({ typ: 'noskip', url, browserName })
  const search2 = searchArr({ typ: 'skip'  , url, browserName })
  let noskp, skip
  if (_3d) {
    noskp = search1('_global_')
    skip  = search2('_global_')
  } else { // match to domain|origin|referer|_global_
    noskp = matched(search1, reqs)
    skip  = matched(search2, reqs)
  }
  return noskp ? false : skip
}

module.exports = skipResponse

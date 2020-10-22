const { searchArr, matched } = require('./match')

const skipResponse = async function (reqs, _3d) {
  const { url } = reqs
  const search = searchArr({ typ: 'skip', url })
  return _3d ? search('_global_') : matched(search, reqs)
}

module.exports = skipResponse

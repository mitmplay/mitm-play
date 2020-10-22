/* eslint-disable camelcase */
function _noproxy () {
  const { NO_PROXY, no_proxy } = process.env
  let bypass = 'localhost,127.0.0.1'

  if (NO_PROXY || no_proxy) {
    bypass += `,${NO_PROXY || no_proxy}`
  }
  return bypass
}

function _proxy () {
  const { HTTP_PROXY, http_proxy } = process.env
  return (HTTP_PROXY || http_proxy)
}

module.exports = {
  _noproxy,
  _proxy
}

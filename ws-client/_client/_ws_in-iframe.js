module.exports = () => {
  let ifrm
  try {
    ifrm = window.self !== window.top
  } catch (e) {
    ifrm = true
  }
  return ifrm ? 'iframe' : 'window'
}

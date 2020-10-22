module.exports = respHeader => {
  if (respHeader['set-cookie']) {
    const setCookie = []
    for (const cookie of respHeader['set-cookie']) {
      const arr = cookie.split(/; */)
      const items = {}
      for (const itm of arr) {
        const [k, v] = itm.split('=')
        items[k] = v || true
      }
      const expire = cookie.match(/expires=([^;]+)/)
      if (expire) {
        const elapsed = Date.parse(expire[1]) - Date.now()
        items._elapsed = elapsed
      }
      setCookie.push(items)
    }
    return setCookie
  }
}

module.exports = respHeader => {
  if (respHeader['set-cookie']) {
    const setCookie = []
    let cookies = respHeader['set-cookie']
    if (typeof cookies === 'string') {
      cookies = [cookies]
    }
    for (const cookie of cookies) {
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

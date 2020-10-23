function resetCookies (setCookie) {
  const cookies = []
  for (const item of setCookie) {
    const { _elapsed, ...rest } = item
    const cookie = []
    for (const key in rest) {
      if (key === 'expires') {
        const now = new Date()
        const time = now.getTime()
        now.setTime(time + _elapsed)
        cookie.push(`expires=${now.toGMTString()}`)
      } else if (rest[key] === true) {
        cookie.push(`${key}`)
      } else {
        cookie.push(`${key}=${rest[key]}`)
      }
    }
    cookies.push(cookie.join('; '))
  }
  return cookies
}

module.exports = resetCookies

 function cookieToObj(respHeader) {
  const setCookie = []
  if (respHeader['set-cookie']) {
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
      const expire = cookie.match(/expires=([^;]+)/i)
      if (expire) {
        const elapsed = Date.parse(expire[1]) - Date.now()
        items._elapsed = elapsed
      }
      setCookie.push(items)
    }
  }
  return setCookie
}

function objToCookie(arr) {
  const setCookie = []
  for (const obj of arr) {
    const keyValue = []
    for (const key in obj) {
      const value = obj[key]
      if (value!==true) {
        keyValue.push(`${key}=${value}`)
      } else {
        keyValue.push(key)
      }
    }
    setCookie.push(keyValue.join('; '))
  }
  return setCookie
}

function getCookie(arr, id) {
  for (const obj of arr) {
    const key = Object.keys(obj)[0]
    if (key===id) {
      return obj
    }
  }
}

const {fn} = global.mitm
fn.getCookie   = getCookie
fn.cookieToObj = cookieToObj
fn.objToCookie = objToCookie

module.exports = cookieToObj
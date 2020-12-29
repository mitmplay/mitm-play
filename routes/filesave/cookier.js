cookieToObj = headers => {
  if (headers.cookie && typeof (headers.cookie) === 'string') {
    const cookieObj = {}
    headers.cookie.split('; ').sort().forEach(element => {
      const [k, v] = element.split('=')
      cookieObj[k] = v
    })
    headers.cookie = cookieObj
  }
}
objToCookie = headers => {
  const {cookie} = headers
  if (typeof cookie !== 'string') {
    let cooky = []
    for (const key in cookie) {
      cooky.push(`${key}=${cookie[key]}`)
    }
    headers.cookie = cooky.join('; ')
  }
}
module.exports = {
  cookieToObj,
  objToCookie
}

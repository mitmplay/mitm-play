const {c} = global.mitm.lib

function ctype (match, resp) {
  const atype = match.route.contentType
  const ctype = resp.headers['content-type'] || 'text'

  if (atype===undefined) {
    console.log(c.red(`Warning: no contentType`), match.log)
    return false
  } else if (atype.length && ctype) {
    return atype.find(t => {
      t==='js' && (t='javascript')
      const rgx = match.contentType[t]
      const rtn = ctype.match(rgx)
      return rtn
    })
  } else {
    return false
  }
}

const xtype = {
  js  : 'application/javascript',
  json: 'application/json',
  map : 'application/json',
  xml : 'application/xml',
  svg : 'image/svg+xml',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
  text: 'text/plain',
  html: 'text/html',
  htm : 'text/html',
  ico : 'image/x-icon',
  png : 'image/png',
  gif : 'image/gif',
  css : 'text/css'
}

module.exports = {
  ctype,
  xtype
}

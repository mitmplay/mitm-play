const fs = require('fs-extra')
const cssbeauty = require('cssbeautify')

module.exports = ({ data }) => {
  const { fpath } = data
  const fmeta = fpath.replace(/\/log\/[^/]+/, m => `${m}/$`)
  const headers = `${fs.readFileSync(fmeta.replace(/.\w+$/, '.json'))}`
  const content = `${fs.readFileSync(fpath)}`
  let response = content
  let ext = fpath.match(/\.(\w+)$/)

  if (ext) {
    ext = ext[1]
    if (ext === 'css') {
      response = cssbeauty(content, {
        autosemicolon: true
      })
    } else if (ext === 'json') {
      const obj = JSON.parse(content)
      response = JSON.stringify(obj.respBody, null, 2)
    }
  } else {
    ext = ''
  }
  return {
    headers: headers,
    response,
    ext
  }
}

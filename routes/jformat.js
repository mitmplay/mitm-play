const stringify = require("json-stringify-pretty-compact");

function jformat(body, resp, __args) {
  if (__args.jformat) {
    if (resp.headers['content-type'].match(/json/)) {
      let json = JSON.parse(`${body}`)
      body = stringify(json, null, 2)
    }  
  }
  return body
}
module.exports = jformat

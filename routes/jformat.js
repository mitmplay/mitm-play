const stringify = require("json-stringify-pretty-compact");

function jformat(body, resp, __args) {
  if (__args.jformat) {
    if (resp.headers['content-type'].match(/json/)) {
      body = `${body}`
      if (body.length) {
        try {
          let json = JSON.parse(body)
          body = stringify(json, null, 2)          
        } catch (error) {
          console.error('JSON Err:', body)
        }  
      }
    }  
  }
  return body
}
module.exports = jformat

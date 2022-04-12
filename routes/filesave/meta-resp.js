const _ext = require('../filepath/ext')
const searchParams = require('./search-params')
const _setCookie = require('./set-cookie')

const {
  lib:{c},
  fn:{logmsg},
} = global.mitm

const { xjson } = searchParams

module.exports = ({ reqs, resp, match }) => {
  let { method, body: reqsBody, headers: reqsHeader } = reqs
  let meta
  const { url, status, headers: rheaders } = resp
  let respHeader = JSON.parse(JSON.stringify(rheaders))
  const setCookie = _setCookie(respHeader)
  let CSP = respHeader['content-security-policy'] ||
             respHeader['content-security-policy-report-only']
  if (CSP) {
    const obj = {}
    CSP.split(/ *; */).forEach(element => {
      const [id, ...arr] = element.split(/ +/)
      id && (obj[id] = arr.sort().join(' '))
    })
    CSP = obj
  }
  if (match?.route?.jsonHeader) {
    for (const key of match.route.jsonHeader) {
      if (respHeader[key]!==undefined) {
        try {
          respHeader[key] = JSON.parse(respHeader[key])        
        } catch (error) {
          respHeader[key] = 'JSON Error!'
        }  
      }
    }
  }
  try {
    if (respHeader['report-to']) {
      respHeader['report-to'] = JSON.parse(respHeader['report-to'])
    }
  } catch (error) {
    respHeader['report-to'] = 'JSON Error!'
  }
  try {
    const urlParams = searchParams(url)
    if (reqsBody) {
      reqsBody = `${reqsBody}`
      const raw = reqsBody
      if (reqsBody.match(xjson)) {
        reqsBody = JSON.parse(reqsBody)
      } else if (reqsBody.match(/[\n ]*(\w+=).+(&)/)) {
        const formField = searchParams(reqsBody)
        reqsBody = { '*form*': formField, raw }
      }
    } else {
      reqsBody = ''
    }
    meta = {
      general: {
        ext: _ext(resp),
        status,
        method,
        url
      },
      respHeader,
      reqsBody,
      reqsHeader
    }
    if (Object.keys(urlParams).length > 1) {
      meta.urlParams = urlParams
    }
    if (setCookie) {
      meta.setCookie = setCookie
    }
    if (CSP) {
      meta.CSP = CSP
    }
  } catch (error) {
    logmsg(c.bgYellowBright.bold.red('>>> Error JSON.stringify'))
    logmsg(error)
  }
  return meta
}

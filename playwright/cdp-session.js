const c = require('ansi-colors')
const routeCDP = require('../routes-cdp')
const Events = require('../routes-cdp/events')

const patterns = [
  {urlPattern: '*', requestStage: 'Request'},
  {urlPattern: '*', requestStage: 'Response'}
]
const nohttp = /https?:\/\//

module.exports = async page => {
  const {__flag} = global.mitm
  if (page._CDP) {
    console.log('CDP ALREADY INIT!!!')
    return
  }
  const client = await page.context().newCDPSession(page)
  page._CDP = client

  if (global.mitm.argv.cdp===undefined) {
    return
  }
  const requestIds = {}
  await client.send('Fetch.enable', {patterns});
  await client.on('Fetch.requestPaused', async reqEvent => {
    let {
      requestId,
      responseHeaders,
      responseStatusCode,
      request: {...request},
    } = reqEvent
    const {url} = request

    let reqResponse
    //====================================
    if (responseStatusCode===undefined) {
      request.headers = lowerCase(request.headers)
      reqResponse = await routeCDP(page, client, {requestId,request})
      if (reqResponse) {
        requestIds[requestId] = reqResponse
        let {request, response, fulfill} = reqResponse
        if (!fulfill) {
          await continueRequest(request)
        } else {
          response.requestId = requestId
          await fulfillRequest(response)
        }
      } else {
        console.log('Fetch.continueRequest rqs', url)
        await client.send('Fetch.continueRequest', { requestId })
      }
    } else {
    //====================================
      reqResponse = requestIds[requestId]
      if (reqResponse && !reqResponse.fulfill) {
        const {request: reqs, rqs2, responseHandler, _3ds} = reqResponse
        delete requestIds[requestId]

        if (responseHandler) {
          const headers = arrToObj(responseHeaders)
          if (responseHandler.length) {
            const status = responseStatusCode
            let rObj = {body: ''}
            if ([301, 302].includes(responseStatusCode)) {
              console.log('Fetch.continueRequest rdr', url)
              await client.send('Fetch.continueRequest', { requestId })
              return
            } else {
              try {
                rObj = await client.send('Fetch.getResponseBody', {requestId});          
              } catch (error) {
                console.log('error', url)
              }  
            }
            const ct = headers['content-type']
            const ec = ct.match(/(font|image)/) ? 'binary' : 'ascii'
            let body = ''
            if (rObj.base64Encoded) {
              body = Buffer.from(rObj.body, 'base64').toString(ec)
            }

            let resp = {requestId,url,status,headers,body}
            resp = await Events(responseHandler, resp, reqs)
            // if (ct.match(/html/)) {
            //   debugger
            // }

            if (rObj.base64Encoded) {
              body = Buffer.from(resp.body, ec).toString('base64')
              resp.body = body
            }

            return await fulfillRequest(resp)
          } else {
            const { origin, pathname } = new URL(url)
            const host = origin.replace(nohttp,'')
            if (!rqs2 && __flag) {
              let msg = `${host}${pathname}`
              if (msg.length > 95) {
                msg = `${msg.slice(0, 95)}...`
              }
              msg = `${c.red('(')}${c.grey(msg)}${c.red(')')}`
              if (_3ds) {
                if (__flag['no-namespace']) {
                  console.log(c.redBright(`[C] no-namespace %s`), msg)
                }
              } else {
                if (__flag['referer-reqs']) {
                  console.log(c.redBright.italic(`[C] referer-reqs %s`), msg)
                }
              }
            }
            // const { headers, method, body: postData } = reqs
            if (typeof headers.cookie !== 'string') {
              objToCookie(headers) // feat: cookie autoconvert
            }
          }
        }  
      }
      console.log('Fetch.continueRequest rsp', url)
      await client.send('Fetch.continueRequest', { requestId })
    }
  })

  async function fulfillRequest(resp) {
    let {requestId,url,status,headers,body} = resp
    headers['content-length'] = `${body.length}`

    const responseCode = status
    const responseHeaders = objToArr(headers)

    if (body instanceof Buffer) {
      body = body.toString('ascii')
    }

    const response = {
      requestId,
      responseCode,
      responseHeaders,
      body
    }

    try {
      const msg = [url.split('?')[0], response.body.length]
      console.log('Fetch.fulfillRequest. res', ...msg)
      await client.send('Fetch.fulfillRequest', response)
      // await client.send('Fetch.continueRequest', { requestId })
    } catch (error) {
      console.error(error)
    }
  }

  async function continueRequest(request) {
    let {
      requestId,
      url,
      method,
      headers,
      postData
    } = request
    headers = objToArr(headers)
    try {
      request = {
        requestId,
        url,
        method,
        headers,
        postData
      }
      console.log('Fetch.continueRequest req', url)
      await client.send('Fetch.continueRequest', request)              
    } catch (error) {
      console.error(error)
    }
  }  
}

function arrToObj(_headers) {
  const headers = {}
  for (const ob of _headers) {
    headers[ob.name.toLowerCase()] = ob.value
  }
  return headers
}

function lowerCase(_headers) {
  const headers = {}
  for (const name in _headers) {
    headers[name.toLowerCase()] =  _headers[name]
  }
  return headers
}

function objToArr(_headers) {
  const headers = []
  for (const name in _headers) {
    const value = _headers[name]
    headers.push({name, value})
  }
  return headers
}
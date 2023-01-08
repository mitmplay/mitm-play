const {c} = global.mitm.lib

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
  console.log('Init CDP!')
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
          if (response.body) {
            response.body = Buffer.from(response.body, 'ascii').toString('base64')
          }
          await fulfillRequest(response)
        }
      } else {
        // console.log(`Fetch.continueRequest rqs ${url}`)
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
              // console.log(`Fetch.continueRequest rdr ${url}`)
              await client.send('Fetch.continueRequest', { requestId })
              return
            } else {
              try {
                rObj = await client.send('Fetch.getResponseBody', {requestId});          
              } catch (error) {
                console.error('error', url)
              }  
            }
            const ct = headers['content-type'] || ''
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
                  console.log(c.redBright(`[C] no-namespace ${msg}`))
                }
              } else {
                if (__flag['referer-reqs']) {
                  console.log(c.redBright.italic(`[C] referer-reqs ${msg}`))
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
      // console.log(`Fetch.continueRequest rsp ${url}`)
      await client.send('Fetch.continueRequest', { requestId })
    }
  })

  async function fulfillRequest(resp) {
    const { argv, __flag } = global.mitm
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
      if (argv.debug?.includes('P') || __flag['page-load']) {
        const msg = []
        if (url) {
          msg.push(url.split('?')[0])
          msg.push(response.body.length)
          console.log(`Fetch.fulfillRequest. res ${msg.join(' ')}`)
        }
      }
      await client.send('Fetch.fulfillRequest', response)
    } catch (error) {
      console.error(error)
    }
  }

  async function continueRequest(reqs) {
    let {requestId,url,method,headers,postData} = reqs
 
    headers = objToArr(headers)
 
    const request = {
      requestId,
      url,
      method,
      headers,
      postData
    }
 
    try {
      // console.log(`Fetch.continueRequest req ${url}`)
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
    const value = `${_headers[name]}`
    headers.push({name, value})
  }
  return headers
}

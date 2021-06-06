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
  const client = await page.context().newCDPSession(page)
  page._CDP = client

  if (global.mitm.argv.cdp===undefined) {
    return
  }
  const requestIds = {}
  await client.send('Fetch.enable', {patterns});
  await client.on('Fetch.requestPaused', async reqEvent => {
    const {
      requestId,
      request: {url},
      responseStatusCode,
      responseHeaders,
    } = reqEvent
  
    let reqResponse
    if (responseStatusCode===undefined) {
      reqResponse = await routeCDP(page, client, reqEvent)
      if (reqResponse) {
        const {request, response, fulfill} = reqResponse
        requestIds[requestId] = reqResponse
        if (fulfill) {
          // console.log('Fetch.fulfillRequest', url)
          await client.send('Fetch.fulfillRequest', { requestId, ...response })
          return
        } else {
          if (request) {
            const headers = []
            const {headers: _headers} = request
            for (const name in _headers) {
              const value = _headers[name]
              headers.push({name, value})
            }
            request.headers = headers
            // console.log('Fetch.continueRequest req', url)
            try {
              await client.send('Fetch.continueRequest', { requestId, ...request })              
            } catch (error) {
              console.error(error)
            }
            return
          }
      }
      }
    } else {
      reqResponse = requestIds[requestId]
      if (reqResponse && !reqResponse.fulfill) {
        const {request: reqs, rqs2, responseHandler, _3ds} = reqResponse
        delete requestIds[requestId]
        const headers = []
        for (const name in responseHeaders) {
          const value = responseHeaders[name]
          headers.push({name, value})
        }
        const responseCode = responseStatusCode
        let rObj = {body: ''}
        if (![301, 302].includes(responseStatusCode)) {
          try {
            rObj = await client.send('Fetch.getResponseBody', {requestId});          
          } catch (error) {
            console.log('error', url)
          }  
        }
        const resp = {
          url,
          headers,
          responseCode,
          body: rObj.body,
        }
        if (responseHandler) {
          // console.log('Fetch.continueRequest res', url)
          if (responseHandler.length) {
            const response = await Events(responseHandler, resp, reqs)
            await client.send('Fetch.fulfillRequest', { requestId, ...response })
            return  
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
            const { headers, method, body: postData } = reqs
            if (typeof headers.cookie !== 'string') {
              objToCookie(headers) // feat: cookie autoconvert
            }      
          }
        }  
      }
    }
    try {
      if (!reqResponse || !reqResponse.fulfill) {
        await client.send('Fetch.continueRequest', { requestId })        
      }
    } catch (error) {
      console.error(error)
    }
    // if (responseStatusCode>300 && responseStatusCode<400) {
    //   console.log(responseStatusCode, url)
    //   console.log(reqEvent)
    // }
    // if (responseStatusCode===undefined) {
    //   requestHeaders['accept-language'] = 'id'
    //   const headers = []
    //   for (const name in requestHeaders) {
    //     const value = requestHeaders[name]
    //     headers.push({name, value})
    //   }
    //   await client.send('Fetch.continueRequest', { requestId, headers })
    // } else {
    //   await client.send('Fetch.continueRequest', { requestId })
    // }
  })
}

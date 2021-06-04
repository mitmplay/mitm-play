const patterns = [{urlPattern: '*', requestStage: 'Response'}]
module.exports = async page => {
  const client = await page.context().newCDPSession(page)
  page._CDP = client

  if (global.mitm.argv.cdp===undefined) {
    return
  } 

  await client.send('Fetch.enable', {patterns});
  await client.on('Fetch.requestPaused', async reqEvent => {
    const {
      requestId,
      responseStatusCode,
      responseHeaders= [],
      request: {url, method}
    } = reqEvent
    
    if (responseStatusCode>300 && responseStatusCode<400) {
      console.log(reqEvent)
    }

    await client.send('Fetch.continueRequest', { requestId })
  })
}

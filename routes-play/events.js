async function Events (responseHandler, resp, reqs, route) {
  const { __args } = global.mitm
  let msg
  let count = 0
  const mtyp = []
  if (!__args.fullog && resp.log) { // feat: fullog
    msg = resp.log.msg
    count = 1
  }
  for (const fn of responseHandler) {
    const rsp2 = await fn(resp, reqs)
    if (rsp2) {
      if (!__args.fullog && rsp2.log) { // feat: fullog
        if (count===0) {
          msg = rsp2.log.msg
        } else {
          mtyp.push(rsp2.log.mtyp)
        }
        count ++
      }
      if (rsp2 === undefined) {
        break
      }
      resp = rsp2
    }
  }
  if (msg && !__args.fullog) { // feat: fullog
    if (mtyp.length) {
      msg += `[${mtyp.join(',')}]`
    }
    console.log(msg)  
  }
  routeCall(route, 'fulfill', resp)
}

function routeCall(route, cmd, params) {
  const { headers } = params || {}
  if (headers) {
    delete headers['xplay-page']
    delete headers['xplay-session']  
  }
  if (['GET', 'DELETE'].includes(params?.method)) {
    delete params.postData
  } else if (params?.postData===null) {
    // playwright/issues/6479#issuecomment-1193105330
    params.postData = Buffer.from('', "utf-8");
  }
  route[cmd](params)    
}

module.exports = {
  Events,
  routeCall
}

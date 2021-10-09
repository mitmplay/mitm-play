const route = {
  url: 'https://github.com',
  noskip: [
    'github.com/'
  ],
  html: {
    'github.com/': {
      response(resp) {
        const ids = 'content-security-policy'
        const csp = resp.headers[ids]
        const rgx = /(script|style)-src /g
        const fnc = (s,s1)=>`${s1}-src github.com `
        resp.headers[ids] = csp.replace(rgx, fnc).
        replace(/connect-src /, 'connect-src wss://localhost:3001 ')
      }
    }
  },
  log: {
    'data.json': {
      contentType: ['json'],
      db: true
    }
  }
}
module.exports = route;

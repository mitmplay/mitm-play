const route = {
  url: 'https://cspvalidator.org',
  noskip: [
    'cspvalidator.org/'
  ],
  html: {
    'cspvalidator.org/': {
      response(resp) {},
      ws:true
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

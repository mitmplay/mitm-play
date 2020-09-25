const route = {
  title: 'Google',
  url: 'http://google.com/',
  tags: ['response'],
  skip: [],
  cache: {},
  html: {
    '/': {
      response(resp) {
        let body = `${resp.body}`;
        body = body.replace('</body', `'<style>body{background:cyan !important;}</style></body`); 
        resp.body = body;
      },
      tags: 'response', 
    }
  }
}
module.exports = route;

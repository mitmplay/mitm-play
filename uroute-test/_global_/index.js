const route = {
  skip: ['httpwatch.com'],
  flag: {
    'referer-reqs': true,
    'no-namespace': true,
    'ws-broadcast': true,
    'ws-connect': true,
    'ws-message': true,
    'frame-load': true,
    'page-load': true
  },
  'args:no-ads': {
    activity: '123:lol'
  },
  preset: {
    clear: {
      title: 'clear tags',
      tags: []
    }
  }
}
module.exports = route;
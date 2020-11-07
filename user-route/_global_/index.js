// create file: ~/user-route/_global_/index.js & add this content:
const route = {
  tags: [],
  'config:no-logs': {
    logs: {
      'referer-reqs': false,
      'no-namespace': false,
    }
  }
}
module.exports = route;
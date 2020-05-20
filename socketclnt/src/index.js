const postmessage = require('./postmessage');
const initSocket = require('./init-socket');
const _global = require('./global');

module.exports = () => {
  postmessage();
  initSocket();
  _global();
}

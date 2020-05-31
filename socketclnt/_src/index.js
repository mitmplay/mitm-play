const _ws_postmessage = require('./_ws_postmessage');
const _ws_initSocket = require('./_ws_init-socket');
const _ws_general = require('./_ws_general');

module.exports = () => {
  _ws_postmessage();
  _ws_initSocket();
  _ws_general();
}

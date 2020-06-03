const _ws_postmessage = require('./_ws_postmessage');
const _ws_initSocket = require('./_ws_init-socket');
const _ws_observer = require('./_ws_observer');
const _ws_general = require('./_ws_general');
const _ws_sshot = require('./_ws_sshot');

module.exports = () => {
  _ws_postmessage();
  _ws_initSocket();
  _ws_observer();
  _ws_general();
  _ws_sshot();
}

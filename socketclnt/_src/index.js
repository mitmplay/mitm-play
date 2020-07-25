const _ws_postmessage = require('./_ws_postmessage');
const _ws_initSocket = require('./_ws_init-socket');
const _ws_screenshot = require('./_ws_screenshot');
const _ws_location = require('./_ws_location');
const _ws_observer = require('./_ws_observer');
const _ws_general = require('./_ws_general');
const _ws_cspErr = require('./_ws_csp-err');

module.exports = () => {
  _ws_postmessage();
  _ws_initSocket();
  _ws_screenshot();
  _ws_location();
  _ws_observer();
  _ws_general();
  _ws_cspErr();
}

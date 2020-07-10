const fs = require('fs-extra');
const pc = require('child_process');

module.exports = ({data}) =>{
  const {width, height} = data;
  mitm.pages.chromium.setViewportSize({width, height});
  return 'OK';
};

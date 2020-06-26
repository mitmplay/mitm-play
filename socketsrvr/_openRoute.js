const fs = require('fs-extra');
const pc = require('child_process');

module.exports = ({data}) =>{
  const {platform} = process;
  if (platform==='win32') {  
    pc.exec(`start "" "${data.path}"`);
  } else {
    pc.exec(`code "" "${data.path}"`);
  }
  return 'OK';
};

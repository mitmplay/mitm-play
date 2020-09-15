const fs = require('fs-extra');
const pc = require('child_process');

module.exports = ({data}) =>{
  const {platform} = process;
  if (platform==='win32') {  
    pc.exec(`code "" "${global.mitm.path.home}"`);
  } else {
    pc.exec(`code "${global.mitm.path.home}"`);
  }
  return 'OK';
};

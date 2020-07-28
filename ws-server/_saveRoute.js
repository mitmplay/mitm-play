const fs = require('fs-extra');

module.exports = ({data}) =>{  
  const {path, content} = data;
  fs.writeFile(path, content, err => {
    err && console.log('Error write file', path);
  })
  return 'OK';
};

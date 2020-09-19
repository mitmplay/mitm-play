module.exports = ({data}) =>{  
  console.log('>> saveTags');
  global.mitm.__tag1 = data.__tag1;
  global.mitm.__tag2 = data.__tag2;
  global.mitm.__tag3 = data.__tag3;
  global.mitm.fn.tag4();

  return 'OK';
};

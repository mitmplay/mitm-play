module.exports = ({data}) =>{
  const {browserName} = data;

  global.mitm.fn.clear({
    delete: 'log',
    browserName,
  });

  let json = {ok:'OK'};
  console.log(data);
  return json;
};

module.exports = ({data}) =>{
  const {imageUrl, ...o} = data; 
  let json = {ok:'OK'};
  console.log(o);
  return json;
};
 
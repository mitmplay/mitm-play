module.exports = ({data}) =>{
  const {postmessage} = data;
  const {client} = global.mitm;

  client.postmessage = postmessage;
  const serial = JSON.stringify({data: client});

  global.broadcast({data: `_setClient${serial}`});
  return {postmessage};
};

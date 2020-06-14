const {filename} = require('./file-util');

module.exports = ({match, reqs}) => {
  let {host, route: {at}} = match;

  const fpath = filename(match);
  (at===undefined) && (at = '');

  let stamp1,stamp2;
  if (at.match(/^\^/)) {
    at = at.slice(1);
    stamp1 = `${at}/${host}${fpath}`;
    stamp2 = `${at}/${host}/$${fpath}`;
  } else {
    at && (at = `/${at}`);
    stamp1 = `${host}${at}${fpath}`;
    stamp2 = `${host}${at}/$${fpath}`;
  }

  const {group} = global.mitm.argv;
  const {browserName} = reqs;
  let root ;
  if (group) {
    root = `${global.mitm.home}/${browserName}/_${group}/cache`;
  } else {
    root = `${global.mitm.home}/${browserName}/cache`;
  }
  
  const fpath1 = `${root}/${stamp1}`;
  const fpath2 = `${root}/${stamp2}.json`;
  return {fpath1, fpath2};  
}

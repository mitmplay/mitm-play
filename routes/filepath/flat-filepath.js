const {filename} = require('./file-util');

module.exports = ({match, reqs, resp, stamp}) => {
  let {host,pathname,route:{at,contentType}} = match;
  const {home, session, argv: {group}} = global.mitm;
  const fpath = filename(match, '-');

  if (at===undefined) {
    at = contentType.join('-');
  }

  const {browserName} = reqs;
  let root;
  if (group) {
    root = `${home}/${browserName}/_${group}/log`;
  } else {
    root = `${home}/${browserName}/log`;
  }

  let fpath1,fpath2;
  if (at.match(/^\^/)) {
    at = at.slice(1);
    fpath1 = `${root}/${session}/${at}/${stamp}-${host}-${fpath}`;
    fpath2 = `${root}/${session}/${at}/$/${stamp}-${host}-${fpath}.json`;
  } else {
    fpath1 = `${root}/${session}/${stamp}--${at}@${host}-${fpath}`;
    fpath2 = `${root}/${session}/$/${stamp}--${at}@${host}-${fpath}.json`;
  }
  return {fpath1, fpath2};
}

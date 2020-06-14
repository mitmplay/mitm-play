function hashCode(txt) {
  let hash = 0;
  if (txt.length == 0) {
    return '';
  }
  for (let i = 0; i < txt.length; i++) {
    let char = txt.charCodeAt(i);
    hash = ((hash<<5)-hash)+char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash+'';
}

function fileWithHash(file) {
  const part1 = file.match(/[^;]+/)[0];
  if (file!==part1) {
    const part2 = file.substr(part1.length);
    return `${part1}-${hashCode(part2)}`;
  } else {
    return file;
  }
}

function filename(match, sep='/') {
  let {pathname, route: {querystring}} = match;
  const arr = pathname.replace(/-/g, '_').split('/');
  let file = arr.pop();
  if (file==='') {
    file = '_';
  }
  if (querystring) {
    file = `hash-${hashCode(file)}`;  
  } else {
    let file2 = file;
    if (file.match(/\.\w+$/)) {
      file2 = file.replace(/\.\w+$/, '');
    }
    file = fileWithHash(file2);
  }
  arr.push(file);
  return arr.join(sep);
}

module.exports = {
  fileWithHash,
  filename,
  hashCode,
}

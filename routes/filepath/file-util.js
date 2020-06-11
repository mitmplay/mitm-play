function hashCode(txt) {
  var hash = 0;
  if (txt.length == 0) {
      return '';
  }
  for (var i = 0; i < txt.length; i++) {
      var char = txt.charCodeAt(i);
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

module.exports = {
  fileWithHash,
  hashCode,
}

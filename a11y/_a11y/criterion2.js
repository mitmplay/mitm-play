function criterion2(tags) {
  for(const tag of tags) {
    const criterionMap = mitm.routes._global_.a11y
    if (criterionMap && criterionMap[tag]) {
      const {id, desc, link} = criterionMap[tag]
      const {baseUrl=''} = criterionMap
      return {
        name: id, desc,
        link: `${baseUrl}${link}`,
      }
    }
  }
}

module.exports = criterion2

function criterion2(tags) {
  const criterions = {}
  const criterionMap = mitm.routes._global_.a11y || {}
  const {baseUrl=''} = criterionMap
  for(const tag of tags) {
    const arr = criterionMap[tag] || []
    for (const criterion of arr) {
      const {id, desc, link} = criterion
      criterions[id] = {
        name: id, desc,
        link: `${baseUrl}${link}`,
      }  
    }
  }
  return criterions
}

module.exports = criterion2

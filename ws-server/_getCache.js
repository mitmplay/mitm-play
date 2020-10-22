module.exports = () => {
  const data = {}
  global.mitm.files.cache.forEach(element => {
    const arr = element.split('/')
    const title = arr.pop()
    const path = arr.join('/')
    data[element] = {
      title,
      path
    }
  })
  return data
}

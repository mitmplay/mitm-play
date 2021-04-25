module.exports = () => {
  const hello = 'global'

  window.mitm.macros = {global: hello}
  return window.mitm.macros
}

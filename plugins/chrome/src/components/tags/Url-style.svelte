<script>
export let btn = {}
export let _id = ''

function hideBtn(b) { 
  let arr = Object.keys(b).filter(x => !b[x])
  const hide = arr.map(x => x.slice(0,1)==='_' ? `.urls>li>.${x}` : `.${_id} li.${x}`)
  console.log('render url style...')
  const content =  `<style>${hide.join(',')} {
    display: none;
  }<style>`
  return content
}
// to be rerendered func need to be pass in
</script>

<span>{@html hideBtn(btn)}</span>

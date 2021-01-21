<script>
export let btn = {}
export let _id = ''

function hideBtn(b) { 
  let arr = Object.keys(b).filter(x => !b[x])
  const hide = arr.map(x => {
    if (x.slice(0,1)==='_' || x==='dev') {
      return `.${_id}>li>.${x}`
    } else if (x==='def') {
      return `.${_id}>li>._notag`
    } else {
      return `.${_id} li.${x}`
    }
  })
  console.log('render url style...')
  const content =  `<style>${hide.join(',')} {
    display: none;
  }<style>`
  return content
}
// to be rerendered func need to be pass in
</script>

<span>{@html hideBtn(btn)}</span>

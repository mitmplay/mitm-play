<script>
  export let node;
  const rect = node.getBoundingClientRect()
  const {top: t, left: l, height: h} = rect
  const {x,y} = document.body.getBoundingClientRect()
  const top   = -y + t + h
  const left  = -x + l
  const style = `top:${top}px;left:${left}px;`
  const {
    axeDesc,
    axeGrp,
    axeHelp,
    axeHelper,
    axeImpact,
    axeTags,
    axeTarget,
  } = node.dataset
/**
axeHelp: "Elements must have sufficient color contrast"
axeDesc: "Ensures the contrast between foreground and background colors meets WCAG 2 AA contrast ratio thresholds"
axeTags: "cat.color,wcag2aa,wcag143"
axeHelper: "https://dequeuniversity.com/rules/axe/4.4/color-contrast?application=axeAPI"
axeGrp: "color-contrast"
axeImpact: "serious"
axeTarget: ".QOk0QH0ZliTN6lLqgerl.KgIdWLyaOwaGazWOCLB4:nth-child(6)"
*/
</script>

<div 
class="a11y-popup" {style}>
  <h4>{axeHelp}</h4>
  <p>{axeDesc}</p>
  <p><b>tags:</b> {axeTags}</p>
  <p><b>impact:</b> {axeImpact}</p>
  <p><b>link:</b> <a href="{axeHelper}">{axeGrp}</a></p>
</div>

<style>
.a11y-popup {
  background-color: rgba(255, 228, 196, 0.65);
  backdrop-filter: blur(4px);
  border-radius: 6px;
  position: absolute;
  margin-top: 2px;
  padding: 0 10px;
  height: auto;
  width: 300px;
  box-shadow: 
    rgb(0 0 0 / 25%) 0px 54px 55px, 
    rgb(0 0 0 / 12%) 0px -12px 30px, 
    rgb(0 0 0 / 12%) 0px 4px 6px, 
    rgb(0 0 0 / 17%) 0px 12px 13px, 
    rgb(0 0 0 /  9%) 0px -3px 5px;
}
</style>

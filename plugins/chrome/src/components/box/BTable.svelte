<script>
export let id

const props = {
  class: 'table-content'
}

if (id) {
  props.id = id
}
</script>

<table {...props}>
<slot></slot>
</table>

<style>
.table-content {
  margin-top: 19px
}
table {
  border-collapse: collapse;
  font-family:  Consolas, Lucida Console, Courier New, monospace;
  font-size: 12px;
  width: 100%;
}
</style>
<table class="table-header">
  <tr>
    <td>
      <div class="td-header">
        <slot></slot>
      </div>
    </td>
  </tr>
</table>

<style>
.table-header {
  position: fixed;
}
.td-header {
  padding-left: 5px;
}
table {
  border-collapse: collapse;
  font-family:  Consolas, Lucida Console, Courier New, monospace;
  font-size: 12px;
  width: 100%;
}
td {
  /* border: 1px solid #999; */
  border-bottom: 1px solid #c0d8cca1;
  background-color: aliceblue;
  font-weight: bold;
  padding: 0.1rem;
}
</style>
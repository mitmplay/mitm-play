const sqlList  = require('./sqlList')
const sqlIns = require('./sqlIns')
const sqlDel = require('./sqlDel')
const sqlUpd = require('./sqlUpd')

module.exports = {
  sqlList,
  sqlIns,
  sqlDel,
  sqlUpd,
}
// await mitm.fn.sqlIns({hst: 'demo2', grp: 'group2', typ: 'type2', name: 'name2', value: 'value2'})
// await mitm.fn.sqlIns({hst: 'demo3', grp: 'group3', typ: 'type3', name: 'name3', value: 'value3'})
// await mitm.fn.sqlList({})
const _path = require('path')
const fs = require('fs-extra')
const fg = require('fast-glob')
const c = require('ansi-colors')
const prompt = require('prompt-sync')()
const { logmsg } = global.mitm.fn

module.exports = async () => {
  const knex = require('knex')({
    client: 'sqlite3',
    connection: {
      filename: `${mitm.path.route}/mydb.sqlite`
    },
    useNullAsDefault: true
  });
  const exists = await knex.schema.hasTable('kv')
  console.log('Is table there?', exists)

  if (!exists) {
    await knex.schema.createTable('kv', function(t) {
      t.increments('id').primary();
      t.string('hst' , 100);
      t.string('app' , 100);
      t.string('grp' , 100);
      t.string('typ' , 100);
      t.string('name', 100);
      t.text(  'value'    );
      t.index(['hst', 'app', 'typ', 'app'])
      t.index(['hst', 'grp', 'typ', 'grp'])
    });
  }
  mitm.db = knex

  let rows = await knex('kv').select('*')
  if (!rows.length) {
    await knex('kv').insert({
      hst  : 'host1',
      app  : 'apps1',
      grp  : 'group1',
      typ  : 'type1',
      name : 'name1',
      value: 'value1'
    })
    rows = await knex('kv').select('*')
  }
  console.log('Knex Rows:', rows)
}

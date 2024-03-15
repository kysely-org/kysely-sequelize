import type {Kysely} from 'kysely'
import {expectAssignable, expectError, expectType} from 'tsd'
import type {KyselifyModel} from '../../../src/index.js'
import {KitchenSinkModel} from '../../nodejs/models/kitchen-sink.model.js'

type KitchenSink = KyselifyModel<KitchenSinkModel>

interface Database {
  kitchenSink: KitchenSink
}

async function testSelect(db: Kysely<Database>) {
  const kyselyResult = await db.selectFrom('kitchenSink').selectAll().executeTakeFirstOrThrow()
  const sequelizeResult = (await KitchenSinkModel.findOne())!.toJSON()

  expectType<number>(kyselyResult.id)
  expectType<Date>(kyselyResult.createdAt)
  expectType<Date>(kyselyResult.updatedAt)
  expectType<string>(kyselyResult.name)
  expectType<string | null>(kyselyResult.preferredName)
  expectType<number | null>(kyselyResult.kitchenId)
  expectAssignable<typeof kyselyResult>(sequelizeResult)
}

async function testInsert(db: Kysely<Database>) {
  db.insertInto('kitchenSink').values({name: 'John Doe'})
  db.insertInto('kitchenSink').values({name: 'John Doe', preferredName: 'Johnny'})
  db.insertInto('kitchenSink').values({name: 'John Doe', preferredName: null})
  db.insertInto('kitchenSink').values({name: 'John Doe', createdAt: new Date()})
  db.insertInto('kitchenSink').values({name: 'John Doe', updatedAt: new Date()})
  db.insertInto('kitchenSink').values({name: 'John Doe', kitchenId: 123})
  db.insertInto('kitchenSink').values({name: 'John Doe', kitchenId: null})

  // missing name
  expectError(db.insertInto('kitchenSink').values({}))
  // wrong data type for name
  expectError(db.insertInto('kitchenSink').values({name: 2}))
  // id is generated always!
  expectError(db.insertInto('kitchenSink').values({id: 2, name: 'John Doe'}))
  // wrong data type for preferredName
  expectError(db.insertInto('kitchenSink').values({name: 'John Doe', preferredName: 2}))
  // wrong data type for createdAt
  expectError(db.insertInto('kitchenSink').values({name: 'John Doe', createdAt: null}))
  // wrong data type for kitchenId
  expectError(db.insertInto('kitchenSink').values({name: 'John Doe', kitchenId: '123'}))
  // fullName is a non-attribute
  expectError(db.insertInto('kitchenSink').values({name: 'John Doe', fullName: 'yossi'}))
}

async function testUpdate(db: Kysely<Database>) {
  db.updateTable('kitchenSink').set({})
  db.updateTable('kitchenSink').set({name: 'John Doe'})
  db.updateTable('kitchenSink').set({preferredName: 'Johnny'})
  db.updateTable('kitchenSink').set({preferredName: null})
  db.updateTable('kitchenSink').set({createdAt: new Date()})
  db.updateTable('kitchenSink').set({updatedAt: new Date()})
  db.updateTable('kitchenSink').set({kitchenId: 123})
  db.updateTable('kitchenSink').set({kitchenId: null})

  // id is generated always!
  expectError(db.updateTable('kitchenSink').set({id: 2}))
  // wrong data type for name
  expectError(db.updateTable('kitchenSink').set({name: 2}))
  // wrong data type for preferredName
  expectError(db.updateTable('kitchenSink').set({preferredName: 2}))
  // wrong data type for createdAt
  expectError(db.updateTable('kitchenSink').set({createdAt: null}))
  // wrong data type for updatedAt
  expectError(db.updateTable('kitchenSink').set({updatedAt: null}))
  // wrong data type for kitchenId
  expectError(db.updateTable('kitchenSink').set({kitchenId: '123'}))
  // fullName is a non-attribute
  expectError(db.updateTable('kitchenSink').set({fullName: 'yossi'}))
}

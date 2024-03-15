import type {Kysely} from 'kysely'
import {expectType} from 'tsd'
import type {KyselifyModel} from '../../src/index.js'
import {KitchenSinkModel} from './models/kitchen-sink.model.js'

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
  expectType<typeof kyselyResult>(sequelizeResult)
}

async function testInsert(db: Kysely<Database>) {
  db.insertInto('kitchenSink').values({name: 'John Doe'})
  db.insertInto('kitchenSink').values({name: 'John Doe', preferredName: 'Johnny'})
  db.insertInto('kitchenSink').values({name: 'John Doe', preferredName: null})
  db.insertInto('kitchenSink').values({name: 'John Doe', createdAt: new Date()})
  db.insertInto('kitchenSink').values({name: 'John Doe', updatedAt: new Date()})
  db.insertInto('kitchenSink').values({name: 'John Doe', kitchenId: 123})
  db.insertInto('kitchenSink').values({name: 'John Doe', kitchenId: null})

  // @ts-expect-error - missing name
  db.insertInto('kitchenSink').values({})
  // @ts-expect-error - wrong data type for name
  db.insertInto('kitchenSink').values({name: 2})
  // @ts-expect-error - id is generated always!
  db.insertInto('kitchenSink').values({id: 2, name: 'John Doe'})
  // @ts-expect-error - wrong data type for preferredName
  db.insertInto('kitchenSink').values({name: 'John Doe', preferredName: 2})
  // @ts-expect-error - wrong data type for createdAt
  db.insertInto('kitchenSink').values({name: 'John Doe', createdAt: null})
  // @ts-expect-error - wrong data type for kitchenId
  db.insertInto('kitchenSink').values({name: 'John Doe', kitchenId: '123'})
  // @ts-expect-error - fullName is a non-attribute
  db.insertInto('kitchenSink').values({name: 'John Doe', fullName: 'yossi'})
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

  // @ts-expect-error - id is generated always!
  db.updateTable('kitchenSink').set({id: 2})
  // @ts-expect-error - wrong data type for name
  db.updateTable('kitchenSink').set({name: 2})
  // @ts-expect-error - wrong data type for preferredName
  db.updateTable('kitchenSink').set({preferredName: 2})
  // @ts-expect-error - wrong data type for createdAt
  db.updateTable('kitchenSink').set({createdAt: null})
  // @ts-expect-error - wrong data type for updatedAt
  db.updateTable('kitchenSink').set({updatedAt: null})
  // @ts-expect-error - wrong data type for kitchenId
  db.updateTable('kitchenSink').set({kitchenId: '123'})
  // @ts-expect-error - fullName is a non-attribute
  db.updateTable('kitchenSink').set({fullName: 'yossi'})
}

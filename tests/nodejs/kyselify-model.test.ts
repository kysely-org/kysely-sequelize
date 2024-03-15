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

import {SUPPORTED_DIALECTS} from '../../src/supported-dialects.js'
import {TestContext, destroyTest, initTest, seedDatabase} from './test-setup.js'

for (const dialect of SUPPORTED_DIALECTS) {
  describe(`KyselySequelizeDialect: ${dialect}`, () => {
    let ctx: TestContext

    before(async function () {
      ctx = await initTest(this, dialect)
      await seedDatabase(ctx)
    })

    after(async () => {
      await destroyTest(ctx)
    })

    it('should work', async () => {
      //   const results = await ctx.kysely.selectFrom('person').selectAll().execute()

      //   console.log('results', results)

      //   await ctx.kysely.transaction().execute(async (trx) => {
      //     const results = await trx.selectFrom('person').selectAll().execute()

      //     console.log('results', results)
      //   })

      const result2 = await ctx.kysely
        .insertInto('toy')
        .values({
          name: 'test',
          petId: 2,
          price: 12.2,
        })
        .execute()

      console.log('result2', result2)
    })
  })
}

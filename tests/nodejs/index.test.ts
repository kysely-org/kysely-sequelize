import {SUPPORTED_DIALECTS} from '../../src/supported-dialects.js'
import {TestContext, destroyTest, initTest, seedDatabase} from './test-setup.js'

for (const dialect of SUPPORTED_DIALECTS.filter((d) => d === 'postgres')) {
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
      const results = await ctx.kysely.selectFrom('person').selectAll().execute()

      console.log('results', results)
    })
  })
}

import {expect} from 'chai'
import {jsonArrayFrom as jsonArrayFromMySQL} from 'kysely/helpers/mysql'
import {jsonArrayFrom as jsonArrayFromPostgres} from 'kysely/helpers/postgres'
import {SUPPORTED_DIALECTS} from '../../src/supported-dialects.js'
import {PersonModel} from './models/person.model.js'
import {PetModel} from './models/pet.model.js'
import {DEFAULT_DATA_SET, TestContext, initTest, seedDatabase} from './test-setup.js'

for (const dialect of SUPPORTED_DIALECTS) {
  describe(`KyselySequelizeDialect: ${dialect}`, () => {
    let ctx: TestContext

    const jsonArrayFrom = {
      mysql: jsonArrayFromMySQL,
      postgres: jsonArrayFromPostgres,
    }[dialect]

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await seedDatabase(ctx)
    })

    afterEach(async () => {
      await ctx.sequelize.truncate({cascade: true})
    })

    after(async () => {
      await ctx.sequelize.drop()
      await ctx.kysely.destroy()
    })

    it('should be able to perform select queries', async () => {
      const ormPeople = await PersonModel.findAll({
        attributes: {exclude: ['id']},
        include: [{attributes: {exclude: ['id', 'ownerId']}, model: PetModel}],
      }).then((people) => people.map((person) => person.toJSON()))

      expect(ormPeople).to.deep.equal(DEFAULT_DATA_SET)

      const queryBuilderPeople = await ctx.kysely
        .selectFrom('person')
        .select((eb) => [
          'firstName',
          'gender',
          'lastName',
          'maritalStatus',
          'middleName',
          jsonArrayFrom(
            eb.selectFrom('pet').whereRef('pet.ownerId', '=', 'person.id').select(['pet.name', 'pet.species']),
          ).as('pets'),
        ])
        .execute()

      expect(queryBuilderPeople).to.deep.equal(ormPeople)
    })

    it('should be able to perform insert queries', async () => {
      const results = await ctx.kysely.insertInto('person').values({gender: 'female'}).execute()

      expect(results).to.deep.equal(
        {
          mysql: [{insertId: BigInt(DEFAULT_DATA_SET.length + 1), numInsertedOrUpdatedRows: BigInt(1)}],
          postgres: [{insertId: undefined, numInsertedOrUpdatedRows: BigInt(1)}],
        }[dialect],
      )
    })
  })
}

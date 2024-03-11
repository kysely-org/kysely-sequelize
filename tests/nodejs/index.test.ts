import {expect} from 'chai'
import {DeleteResult, InsertResult, UpdateResult} from 'kysely'
import {jsonArrayFrom as jsonArrayFromMSSQL} from 'kysely/helpers/mssql'
import {jsonArrayFrom as jsonArrayFromMySQL} from 'kysely/helpers/mysql'
import {jsonArrayFrom as jsonArrayFromPostgres} from 'kysely/helpers/postgres'
import {jsonArrayFrom as jsonArrayFromSQLite} from 'kysely/helpers/sqlite'
import {SUPPORTED_DIALECTS, SupportedDialect} from '../../src/supported-dialects.js'
import {PersonModel} from './models/person.model.js'
import {PetModel} from './models/pet.model.js'
import {
  DEFAULT_DATA_SET,
  dropDatabase,
  initTest,
  seedDatabase,
  truncateDatabase,
  type TestContext,
} from './test-setup.js'

for (const dialect of SUPPORTED_DIALECTS) {
  describe(`KyselySequelizeDialect: ${dialect}`, () => {
    let ctx: TestContext

    const jsonArrayFrom = {
      mssql: jsonArrayFromMSSQL,
      mysql: jsonArrayFromMySQL,
      postgres: jsonArrayFromPostgres,
      sqlite: jsonArrayFromSQLite,
    }[dialect] as typeof jsonArrayFromMySQL

    before(async function () {
      ctx = await initTest(this, dialect)
    })

    beforeEach(async () => {
      await seedDatabase(ctx)
    })

    afterEach(async () => {
      await truncateDatabase(ctx)
    })

    after(async () => {
      await dropDatabase(ctx)
      await ctx.kysely.destroy()
    })

    it('should be able to perform select queries', async () => {
      const ormPeople = await PersonModel.findAll({
        attributes: {exclude: ['id']},
        include: [{attributes: {exclude: ['id', 'ownerId']}, model: PetModel}],
      }).then((people) => people.map((person) => person.toJSON()))

      expect(ormPeople).to.deep.equal(DEFAULT_DATA_SET)

      const query = ctx.kysely
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

      const queryBuilderPeople = await query.execute()

      expect(queryBuilderPeople).to.deep.equal(ormPeople)
    })

    it('should be able to perform insert queries', async () => {
      const result = await ctx.kysely.insertInto('person').values({gender: 'female'}).executeTakeFirstOrThrow()

      expect(result).to.deep.equal(
        (
          {
            mssql: {insertId: undefined, numInsertedOrUpdatedRows: BigInt(1)},
            mysql: {insertId: BigInt(DEFAULT_DATA_SET.length + 1), numInsertedOrUpdatedRows: BigInt(1)},
            postgres: {insertId: undefined, numInsertedOrUpdatedRows: BigInt(1)},
            sqlite: {insertId: BigInt(DEFAULT_DATA_SET.length + 1), numInsertedOrUpdatedRows: BigInt(1)},
          } satisfies Record<SupportedDialect, {[K in keyof InsertResult]: InsertResult[K]}>
        )[dialect],
      )
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should be able to perform insert queries with returning', async () => {
        const result = await ctx.kysely
          .insertInto('person')
          .values({gender: 'female'})
          .returning('id')
          .executeTakeFirst()

        expect(result).to.deep.equal(
          (
            {
              postgres: {id: DEFAULT_DATA_SET.length + 1},
              // FIXME: sequelize/sqlite3 bug? its returning metadata, but no rows.
              sqlite: undefined,
            } satisfies Record<'postgres' | 'sqlite', unknown>
          )[dialect],
        )
      })
    }

    it('should be able to perform update queries', async () => {
      const result = await ctx.kysely
        .updateTable('person')
        .set({maritalStatus: 'widowed'})
        .where('id', '=', 1)
        .executeTakeFirstOrThrow()

      expect(result).to.deep.equal(
        (
          {
            mssql: {numChangedRows: undefined, numUpdatedRows: BigInt(1)},
            mysql: {numChangedRows: BigInt(1), numUpdatedRows: BigInt(1)},
            postgres: {numChangedRows: undefined, numUpdatedRows: BigInt(1)},
            sqlite: {
              numChangedRows: undefined,
              // FIXME: sequelize/sqlite3 bug? its returning empty metadata and rows.
              numUpdatedRows: BigInt(0),
            },
          } satisfies Record<SupportedDialect, {[K in keyof UpdateResult]: UpdateResult[K]}>
        )[dialect],
      )
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should be able to perform update queries with returning', async () => {
        const result = await ctx.kysely
          .updateTable('person')
          .set({maritalStatus: 'widowed'})
          .where('id', '=', 1)
          .returning(['gender'])
          .executeTakeFirstOrThrow()

        expect(result).to.deep.equal({gender: DEFAULT_DATA_SET[0].gender})
      })
    }

    it('should be able to perform delete queries', async () => {
      const result = await ctx.kysely.deleteFrom('person').where('id', '=', 1).executeTakeFirstOrThrow()

      expect(result).to.deep.equal(
        (
          {
            mssql: {numDeletedRows: BigInt(1)},
            mysql: {numDeletedRows: BigInt(1)},
            postgres: {numDeletedRows: BigInt(1)},
            // FIXME: sequelize/sqlite3 bug? its returning empty metadata and rows.
            sqlite: {numDeletedRows: BigInt(0)},
          } satisfies Record<SupportedDialect, {[K in keyof DeleteResult]: DeleteResult[K]}>
        )[dialect],
      )
    })

    if (dialect === 'postgres' || dialect === 'sqlite') {
      it('should be able to perform delete queries with returning', async () => {
        const result = await ctx.kysely
          .deleteFrom('person')
          .where('id', '=', 1)
          .returning('gender')
          .executeTakeFirstOrThrow()

        expect(result).to.deep.equal({gender: DEFAULT_DATA_SET[0].gender})
      })
    }
  })
}

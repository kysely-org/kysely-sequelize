import * as chai from 'chai'
import {
  CamelCasePlugin,
  Kysely,
  MssqlAdapter,
  MssqlIntrospector,
  MssqlQueryCompiler,
  MysqlAdapter,
  MysqlIntrospector,
  MysqlQueryCompiler,
  ParseJSONResultsPlugin,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type Compilable,
  type KyselyPlugin,
} from 'kysely'
import {Sequelize, type SequelizeOptions} from 'sequelize-typescript'
import {
  KyselySequelizeDialect,
  type KyselifyCreationAttributes,
  type KyselySequelizeDialectConfig,
} from '../../src/index.js'
import type {SupportedDialect} from '../../src/supported-dialects.js'
import {PersonModel, type PersonCreationAttributes} from './models/person.model.js'
import {PetModel, type PetCreationAttributes} from './models/pet.model.js'
import {ToyModel, type ToyCreationAttributes} from './models/toy.model.js'

export type Person = KyselifyCreationAttributes<PersonCreationAttributes>
export type Pet = KyselifyCreationAttributes<PetCreationAttributes>
export type Toy = KyselifyCreationAttributes<ToyCreationAttributes>

export interface Database {
  person: Person
  pet: Pet
  toy: Toy
  'toy_schema.toy': Toy
}

interface PersonInsertParams extends PersonCreationAttributes {
  pets?: PetInsertParams[]
}

interface PetInsertParams extends Omit<PetCreationAttributes, 'ownerId'> {
  toys?: Omit<ToyCreationAttributes, 'petId'>[]
}

export interface TestContext {
  kysely: Kysely<Database>
  sequelize: Sequelize
}

export type PerDialect<T> = Record<SupportedDialect, T>

const TEST_INIT_TIMEOUT = 5 * 60 * 1_000

export const PLUGINS: KyselyPlugin[] = [new CamelCasePlugin()]

const BASE_SEQUELIZE_CONFIG = {
  logging: false,
  models: [PersonModel, PetModel, ToyModel],
  pool: {max: 20, min: 0},
} satisfies SequelizeOptions

export const CONFIGS: Record<
  SupportedDialect,
  Omit<KyselySequelizeDialectConfig, 'sequelize'> & {
    sequelizeConfig: SequelizeOptions
  }
> = {
  mssql: {
    kyselySubDialect: {
      createAdapter: () => new MssqlAdapter(),
      createIntrospector: (db) => new MssqlIntrospector(db),
      createQueryCompiler: () => new MssqlQueryCompiler(),
    },
    sequelizeConfig: {
      ...BASE_SEQUELIZE_CONFIG,
      database: 'kysely_test',
      dialect: 'mssql',
      host: 'localhost',
      password: 'KyselyTest0',
      port: 21433,
      username: 'sa',
    },
  },
  mysql: {
    kyselySubDialect: {
      createAdapter: () => new MysqlAdapter(),
      createIntrospector: (db) => new MysqlIntrospector(db),
      createQueryCompiler: () => new MysqlQueryCompiler(),
    },
    sequelizeConfig: {
      ...BASE_SEQUELIZE_CONFIG,
      database: 'kysely_test',
      dialect: 'mysql',
      dialectOptions: {
        // Return big numbers as strings just like pg does.
        supportBigNumbers: true,
        bigNumberStrings: true,
      },
      host: 'localhost',
      password: 'kysely',
      port: 3308,
      username: 'kysely',
    },
  },
  postgres: {
    kyselySubDialect: {
      createAdapter: () => new PostgresAdapter(),
      createIntrospector: (db) => new PostgresIntrospector(db),
      createQueryCompiler: () => new PostgresQueryCompiler(),
    },
    sequelizeConfig: {
      ...BASE_SEQUELIZE_CONFIG,
      database: 'kysely_test',
      dialect: 'postgres',
      host: 'localhost',
      port: 5434,
      username: 'kysely',
    },
  },
  sqlite: {
    kyselySubDialect: {
      createAdapter: () => new SqliteAdapter(),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
    sequelizeConfig: {
      ...BASE_SEQUELIZE_CONFIG,
      dialect: 'sqlite',
      storage: ':memory:',
    },
  },
}

export async function initTest(ctx: Mocha.Context, dialect: SupportedDialect): Promise<TestContext> {
  const config = CONFIGS[dialect]

  const sequelize = new Sequelize(config.sequelizeConfig)

  ctx.timeout(TEST_INIT_TIMEOUT)
  await sequelize.authenticate({
    retry: {
      backoffBase: 1_000,
      backoffExponent: 1,
      max: TEST_INIT_TIMEOUT / 1_000,
      timeout: TEST_INIT_TIMEOUT,
    },
  })

  await sequelize.drop()
  await sequelize.sync()

  const kysely = new Kysely<Database>({
    dialect: new KyselySequelizeDialect({...config, sequelize}),
    plugins: [dialect === 'mssql' || dialect === 'sqlite' ? new ParseJSONResultsPlugin() : null, ...PLUGINS].filter(
      Boolean,
    ) as KyselyPlugin[],
  })

  return {kysely, sequelize}
}

export async function seedDatabase(_ctx: TestContext): Promise<void> {
  await PersonModel.bulkCreate(DEFAULT_DATA_SET, {
    include: [
      {
        as: 'pets',
        model: PetModel,
        include: [{as: 'toys', model: ToyModel}],
      },
    ],
  })
}

export async function truncateDatabase(ctx: TestContext): Promise<void> {
  const {sequelize} = ctx

  const dialect = sequelize.getDialect() as SupportedDialect
  const tables = [PersonModel.tableName, PetModel.tableName, ToyModel.tableName]

  await sequelize.transaction(async (transaction) => {
    if (dialect === 'mssql') {
      await sequelize.query('EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT all"', {transaction})
    } else if (dialect === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', {transaction})
    }

    if (dialect === 'mssql') {
      await sequelize.query('EXEC sp_MSforeachtable "DELETE FROM ?"', {transaction})
    } else {
      await sequelize.truncate({cascade: true, restartIdentity: true, transaction})
    }

    if (dialect === 'mssql') {
      await sequelize.query('EXEC sp_MSforeachtable "ALTER TABLE ? CHECK CONSTRAINT all"', {transaction})
      await sequelize.query('EXEC sp_MSforeachtable "DBCC CHECKIDENT (\'?\', RESEED, 0)"', {transaction})
    } else if (dialect === 'mysql') {
      await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', {transaction})
      await Promise.all(
        tables.map((table) => sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`, {transaction})),
      )
    } else if (dialect === 'sqlite') {
      await sequelize.query('UPDATE SQLITE_SEQUENCE SET SEQ = 0', {transaction})
    }
  })
}

export async function dropDatabase(_ctx: TestContext): Promise<void> {
  await _ctx.sequelize.drop()
}

export const DEFAULT_DATA_SET: PersonInsertParams[] = [
  {
    firstName: 'Jennifer',
    middleName: null,
    lastName: 'Aniston',
    gender: 'female',
    pets: [{name: 'Catto', species: 'cat'}],
    maritalStatus: 'divorced',
  },
  {
    firstName: 'Arnold',
    middleName: null,
    lastName: 'Schwarzenegger',
    gender: 'male',
    pets: [{name: 'Doggo', species: 'dog'}],
    maritalStatus: 'divorced',
  },
  {
    firstName: 'Sylvester',
    middleName: 'Rocky',
    lastName: 'Stallone',
    gender: 'male',
    pets: [{name: 'Hammo', species: 'hamster'}],
    maritalStatus: 'married',
  },
]

export function testSql(
  query: Compilable,
  dialect: SupportedDialect,
  expectedPerDialect: PerDialect<{sql: string | string[]; parameters: any[]}>,
): void {
  const expected = expectedPerDialect[dialect]
  const expectedSql = Array.isArray(expected.sql) ? expected.sql.map((it) => it.trim()).join(' ') : expected.sql
  const sql = query.compile()

  chai.expect(expectedSql).to.equal(sql.sql)
  chai.expect(expected.parameters).to.eql(sql.parameters)
}

export const expect = chai.expect

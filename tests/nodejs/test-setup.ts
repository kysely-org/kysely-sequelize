import * as chai from 'chai'
import {
  CamelCasePlugin,
  Kysely,
  MysqlAdapter,
  MysqlIntrospector,
  MysqlQueryCompiler,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
  type Compilable,
  type KyselyPlugin,
} from 'kysely'
import {PoolOptions} from 'sequelize'
import {ModelCtor, Sequelize, SequelizeOptions} from 'sequelize-typescript'
import {Kyselify, KyselySequelizeDialect, KyselySubDialect, type KyselySequelizeDialectConfig} from '../../src/index.js'
import type {SupportedDialect} from '../../src/supported-dialects.js'
import {PersonCreationAttributes, PersonModel} from './models/person.model.js'
import {PetCreationAttributes, PetModel} from './models/pet.model.js'
import {ToyCreationAttributes, ToyModel} from './models/toy.model.js'

type Person = Kyselify<PersonCreationAttributes>
type Pet = Kyselify<PetCreationAttributes>
type Toy = Kyselify<ToyCreationAttributes>

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

export const PLUGINS: KyselyPlugin[] = []

export const POOL_SIZE = 20

const postgresSubDialect: KyselySubDialect = {
  createAdapter: () => new PostgresAdapter(),
  createIntrospector: (db) => new PostgresIntrospector(db),
  createQueryCompiler: () => new PostgresQueryCompiler(),
}

const mysqlSubDialect: KyselySubDialect = {
  createAdapter: () => new MysqlAdapter(),
  createIntrospector: (db) => new MysqlIntrospector(db),
  createQueryCompiler: () => new MysqlQueryCompiler(),
}

const sqliteSubDialect: KyselySubDialect = {
  createAdapter: () => new SqliteAdapter(),
  createIntrospector: (db) => new SqliteIntrospector(db),
  createQueryCompiler: () => new SqliteQueryCompiler(),
}

const models = [PersonModel, PetModel, ToyModel] satisfies ModelCtor[]
const pool = {max: POOL_SIZE, min: 0} satisfies PoolOptions
const plugins = [new CamelCasePlugin({maintainNestedObjectKeys: true})] satisfies KyselyPlugin[]

export const CONFIGS: Record<
  SupportedDialect,
  Omit<KyselySequelizeDialectConfig, 'sequelize'> & {
    sequelizeConfig: SequelizeOptions
  }
> = {
  mysql: {
    kyselySubDialect: mysqlSubDialect,
    sequelizeConfig: {
      database: 'kysely_test',
      dialect: 'mysql',
      dialectOptions: {
        // Return big numbers as strings just like pg does.
        supportBigNumbers: true,
        bigNumberStrings: true,
      },
      host: 'localhost',
      logging: false,
      models,
      password: 'kysely',
      pool,
      port: 3308,
      username: 'kysely',
    },
  },
  postgres: {
    kyselySubDialect: postgresSubDialect,
    sequelizeConfig: {
      database: 'kysely_test',
      dialect: 'postgres',
      host: 'localhost',
      logging: false,
      models,
      pool,
      port: 5434,
      username: 'kysely',
    },
  },
  //   sqlite: {
  //     kyselySubDialect: sqliteSubDialect,
  //     sequelizeConfig: {
  //       dialect: 'sqlite',
  //       models,
  //       pool,
  //       storage: ':memory:',
  //     },
  //   },
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
    plugins,
  })

  return {kysely, sequelize}
}

export async function seedDatabase(_ctx: TestContext): Promise<void> {
  await PersonModel.bulkCreate(DEFAULT_DATA_SET, {
    include: [
      {
        as: 'pets',
        model: PetModel,
        include: [
          {
            as: 'toys',
            model: ToyModel,
          },
        ],
      },
    ],
  })
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

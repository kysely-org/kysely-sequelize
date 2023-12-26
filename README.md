# kysely-sequelize

Sequelize is a modern TypeScript and Node.js ORM for Oracle, Postgres, MySQL, MariaDB, SQLite and SQL Server, and more. Featuring solid transaction support, relations, eager and lazy loading, read replication and more.

As of Dec 10, 2023, Sequelize is gearing up for v7 (currently in alpha) and [has 1,554,999 weekly downloads on npm](https://npmtrends.com/prisma-vs-sequelize-vs-typeorm) (2nd most popular ORM behind Prisma). It is a very popular ORM for Node.js and TypeScript (thanks to `sequelize-typescript`).

Just like most ORMs for Node.js, Sequelize has poor TypeScript support when it comes to writing queries outside of the ORM's CRUD methods - something that happens more often than you might imagine - usually due to performance optimizations OR as a general escape hatch. This is where Kysely comes in.

Kysely (pronounced “Key-Seh-Lee”) is a type-safe and autocompletion-friendly TypeScript SQL query builder. Inspired by Knex. Mainly developed for Node.js but also runs on Deno and in the browser.

A match made in heaven, on paper. Let’s see how it works in practice, with `kysely-sequelize` - a toolkit (dialect, type translators, etc.) that allows using your existing Sequelize instance with Kysely.

## Installation

Main dependencies:

```sh
npm i kysely kysely-sequelize sequelize sequelize-typescript
```

PostgreSQL:

```sh
npm i pg 
```

MySQL:

```sh
npm i mysql2 
```

MS SQL Server (MSSQL):

```sh
npm i tedious
```

SQLite:

ATTTENTION: While Kysely supports `better-sqlite3` with its core SQLite dialect, Sequelize uses `sqlite3` under the hood. This library doesn't use Kysely's own drivers.

```sh
npm i sqlite3
```

## Usage

### Models

Define your models using `sequelize-typescript` and manual attribute typing. Sadly, using the `InferAttributes<M>` and `InferCreationAttributes<M>` way doesn't work with `kysely-sequelize`, as type translation would depend on an unexported Sequelize unique symbol.

`src/models/person.model.ts`:

```ts
import type {Optional} from 'sequelize'
import {Column, DataType, HasMany, Model, Table} from 'sequelize-typescript'
import {PetModel} from './pet.model'

export interface PersonAttributes {
  id: number
  firstName: string | null
  middleName: string | null
  lastName: string | null
  gender: 'male' | 'female' | 'other'
  maritalStatus: 'single' | 'married' | 'divorced' | 'widowed' | null
}

export type PersonCreationAttributes = Optional<PersonAttributes, 'id'>

@Table({modelName: 'Person', tableName: 'person', timestamps: false, underscored: true})
export class PersonModel extends Model<PersonAttributes, PersonCreationAttributes> {
  declare id: PersonAttributes['id']

  @Column(DataType.STRING(255))
  firstName: PersonAttributes['firstName']

  @Column(DataType.STRING(255))
  middleName: PersonAttributes['middleName']

  @Column(DataType.STRING(255))
  lastName: PersonAttributes['lastName']

  @Column({allowNull: false, type: DataType.STRING(50)})
  gender: PersonAttributes['gender']

  @Column(DataType.STRING(50))
  maritalStatus: PersonAttributes['maritalStatus']

  @HasMany(() => PetModel)
  pets: PetModel[]
}
```

`src/models/pet.model.ts`:

```ts
import type {Optional} from 'sequelize'
import {BelongsTo, Column, DataType, ForeignKey, HasMany, Model, Table} from 'sequelize-typescript'
import {PersonModel} from './person.model.js'
import {ToyModel} from './toy.model.js'

export interface PetAttributes {
  id: number
  name: string
  ownerId: number
  species: 'dog' | 'cat' | 'hamster'
}

export type PetCreationAttributes = Optional<PetAttributes, 'id'>

@Table({
  modelName: 'Pet',
  indexes: [{fields: ['owner_id'], name: 'pet_owner_id_index'}],
  tableName: 'pet',
  timestamps: false,
  underscored: true,
})
export class PetModel extends Model<PetAttributes, PetCreationAttributes> {
  declare id: PetAttributes['id']

  @Column({allowNull: false, type: DataType.STRING(255)})
  name: PetAttributes['name']

  @Column({allowNull: false, onDelete: 'CASCADE', type: DataType.INTEGER})
  @ForeignKey(() => PersonModel)
  ownerId: PetAttributes['ownerId']

  @Column({allowNull: false, type: DataType.STRING(50)})
  species: PetAttributes['species']

  @BelongsTo(() => PersonModel)
  owner: PersonModel

  @HasMany(() => ToyModel)
  toys: ToyModel[]
}
```

`src/models/toy.model.ts`:

```ts
import type {Optional} from 'sequelize'
import {BelongsTo, Column, DataType, ForeignKey, Model, Table} from 'sequelize-typescript'
import {PetModel} from './pet.model'

export interface ToyAttributes {
  id: number
  name: string
  price: number
  petId: number
}

export type ToyCreationAttributes = Optional<ToyAttributes, 'id'>

@Table({modelName: 'Toy', tableName: 'toy', timestamps: false, underscored: true})
export class ToyModel extends Model<ToyAttributes, ToyCreationAttributes> {
  declare id: ToyAttributes['id']

  @Column({allowNull: false, type: DataType.STRING(255)})
  name: ToyAttributes['name']

  @Column({allowNull: false, type: DataType.INTEGER})
  @ForeignKey(() => PetModel)
  petId: ToyAttributes['petId']

  @Column({allowNull: false, type: DataType.DOUBLE})
  price: ToyAttributes['price']

  @BelongsTo(() => PetModel)
  pet: PetModel
}
```

### Kysely Database Interface

Use `KyselifyCreationAttributes` to transform your Sequelize models into Kysely-compatible types.

`src/types/database.ts`:

```ts
import type {Insertable, Selectable, Updateable} from 'kysely'
import type {KyselifyCreationAttributes} from 'kysely-sequelize'
import type {PersonCreationAttributes, PetCreationAttributes, ToyCreationAttributes} from '../models'

export type PersonTable = KyselifyCreationAttributes<PersonCreationAttributes>
//              ^? { id: Generated<number>, firstName: string | null, ... }
export type PetTable = KyselifyCreationAttributes<PetCreationAttributes>
export type ToyTable = KyselifyCreationAttributes<ToyCreationAttributes>

export interface Database {
  person: PersonTable
  pet: PetTable
  toy: ToyTable
}
```

### Sequelize Instance

Create a Sequelize instance.

`src/sequelize.ts`:

```ts
import {Sequelize} from 'sequelize-typescript'
import {PersonModel, PetModel, ToyModel} from './models'

let sequelize: Sequelize

async function getSequelize(): Promise<Sequelize> {
  if (sequelize) {
    return sequelize
  }

  // this create a new Sequelize instance for Postgres
  // kysely-sequelize also supports MySQL, SQLite, and MS SQL Server.
  const sqlz = new Sequelize({
    database: '{{database}}',
    dialect: 'postgres',
    host: '{{host}}',
    models: [PersonModel, PetModel, ToyModel],
    pool: {max: 20, min: 0},
    port: 5434,
    username: '{{username}}',
  })

  await sqlz.authenticate({
    retry: {
      backoffBase: 1_000,
      backoffExponent: 1,
      max: (5 * 60 * 1_000) / 5,
      timeout: 5 * 60 * 1_000,
    },
  })

  await sequelize.sync()

  sequelize = sqlz
}
```

### Kysely Instance

Create a Kysely instance.

`src/kysely.ts`:

```ts
import {
  CamelCasePlugin,
  Kysely,
  PostgresAdapter,
  PostgresIntrospector,
  PostgresQueryCompiler
} from 'kysely'
import {KyselySequelizeDialect} from 'kysely-sequelize'
import type {Database} from './types/database'

let kysely: Kysely<Database>

async function getKysely(): Promise<Kysely<Database>> {
  if (kysely) {
    return kysely
  }

  const sequelize = await getSequelize()

  kysely = new Kysely<Database>({
    dialect: new KyselySequelizeDialect({
      // kysely-sequelize also supports MySQL, SQLite, and MS SQL Server.
      // Since Kysely's MS SQL Server dialect is unreleased, you'll have to install Kysely directly from Github for now.
      kyselyDialect: {
        createAdapter: () => PostgresAdapter(),
        createIntrospector: (db) => new PostgresIntrospector(db),
        createQueryCompiler: () => new PostgresQueryCompiler(),
      },
      sequelize,
    }),
    // `CamelCasePlugin` is used to align with Sequelize's `underscored` option.
    plugins: [new CamelCasePlugin()],
  })

  return kysely
}
```

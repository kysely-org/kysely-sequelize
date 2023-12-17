import type {Dialect} from 'kysely'
import type {Sequelize} from 'sequelize-typescript'

export interface KyselySequelizeDialectConfig {
  kyselySubDialect: KyselySubDialect
  sequelize: Sequelize
}

export type KyselySubDialect = Omit<Dialect, 'createDriver'>

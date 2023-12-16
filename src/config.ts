import type {Dialect} from 'kysely'
import type {Sequelize} from 'sequelize-typescript'

export interface KyselySequelizeDialectConfig {
  kyselyDialect: Omit<Dialect, 'createDriver'>
  sequelize: Sequelize
}

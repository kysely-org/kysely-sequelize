import type {DatabaseConnection, Driver, TransactionSettings} from 'kysely'
import type {Sequelize} from 'sequelize'
import type {KyselySequelizeDialectConfig} from './config.js'
import {KyselySequelizeConnection} from './connection.js'

export class KyselySequelizeDriver implements Driver {
  readonly #sequelize: Sequelize

  constructor(config: KyselySequelizeDialectConfig) {
    this.#sequelize = config.sequelize
  }

  async acquireConnection(): Promise<DatabaseConnection> {
    return new KyselySequelizeConnection(this.#sequelize)
  }

  async beginTransaction(connection: KyselySequelizeConnection, settings: TransactionSettings): Promise<void> {
    await connection.beginTransaction(settings)
  }

  async commitTransaction(connection: KyselySequelizeConnection): Promise<void> {
    await connection.commitTransaction()
  }

  async destroy(): Promise<void> {
    await this.#sequelize.close()
  }

  async init(): Promise<void> {
    // noop
  }

  async releaseConnection(connection: KyselySequelizeConnection): Promise<void> {
    connection.release()
  }

  async rollbackTransaction(connection: KyselySequelizeConnection): Promise<void> {
    await connection.rollbackTransaction()
  }
}

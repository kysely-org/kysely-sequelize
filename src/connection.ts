import type {CompiledQuery, DatabaseConnection, QueryResult, TransactionSettings} from 'kysely'
import type {Sequelize, Transaction, TransactionOptions} from 'sequelize'
import {ISOLATION_LEVELS} from './isolation-levels.js'

export class KyselySequelizeConnection implements DatabaseConnection {
  readonly #sequelize: Sequelize
  #transaction?: Transaction
  #underlyingConnection?: object

  constructor(sequelize: Sequelize) {
    this.#sequelize = sequelize
  }

  async beginTransaction(settings: TransactionSettings): Promise<void> {
    if (this.#transaction) {
      throw new Error('Transaction already begun!')
    }

    this.#transaction = await this.#sequelize.transaction(this.#translateTransactionSettings(settings))
  }

  async commitTransaction(): Promise<void> {
    if (!this.#transaction) {
      throw new Error('No transaction!')
    }

    await this.#transaction.commit()
    this.#transaction = undefined
  }

  release(): void {
    if (this.#underlyingConnection) {
      this.#sequelize.connectionManager.releaseConnection(this.#underlyingConnection)
      this.#underlyingConnection = undefined
    }
  }

  async rollbackTransaction(): Promise<void> {
    if (!this.#transaction) {
      throw new Error('No transaction!')
    }

    await this.#transaction.rollback()
    this.#transaction = undefined
  }

  async executeQuery<R>(compiledQuery: CompiledQuery<unknown>): Promise<QueryResult<R>> {
    if (this.#transaction) {
      const results = await this.#sequelize.query(
        {query: compiledQuery.sql, values: [...compiledQuery.parameters]},
        {transaction: this.#transaction},
      )

      console.log('results', results)

      return {
        rows: [],
      }
    }

    if (!this.#underlyingConnection) {
      // since we can't know if we're in single connection multi-query mode or not,
      // we'll always use the write connection.
      this.#underlyingConnection = await this.#sequelize.connectionManager.getConnection({type: 'write'})
    }

    console.log('this.#underlyingConnection', this.#underlyingConnection)
    console.log('this.#underlyingConnection.query', (this.#underlyingConnection as any)['query'])

    return {
      rows: [],
    }
  }

  async *streamQuery<R>(
    compiledQuery: CompiledQuery<unknown>,
    chunkSize?: number | undefined,
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error('Method not implemented.')
  }

  #translateTransactionSettings(settings: TransactionSettings): TransactionOptions {
    return {
      ...(settings.isolationLevel ? {isolationLevel: ISOLATION_LEVELS[settings.isolationLevel]} : {}),
    }
  }
}

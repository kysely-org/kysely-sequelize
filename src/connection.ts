import {type CompiledQuery, type DatabaseConnection, type QueryResult, type TransactionSettings} from 'kysely'
import {QueryTypes, type Sequelize, type Transaction, type TransactionOptions} from 'sequelize'
import {ISOLATION_LEVELS} from './isolation-levels.js'

export class KyselySequelizeConnection implements DatabaseConnection {
  readonly #sequelize: Sequelize
  #connection?: unknown
  #transaction?: Transaction

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
    if (this.#connection) {
      this.#sequelize.connectionManager.releaseConnection(this.#connection)
      this.#connection = undefined
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
    const queryOptions = await this.#getQueryOptions(compiledQuery)

    const [rows, ...huh] = await this.#sequelize.query(compiledQuery.sql, queryOptions)

    console.log('rows', rows)
    console.log('huh', huh)

    return {
      rows: rows as R[],
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
      autocommit: false,
      ...(settings.isolationLevel ? {isolationLevel: ISOLATION_LEVELS[settings.isolationLevel]} : {}),
    }
  }

  async #getQueryOptions(compiledQuery: CompiledQuery<unknown>) {
    const queryType = {
      [compiledQuery.query.kind]: QueryTypes.RAW,
      ['SelectQueryNode']: QueryTypes.SELECT,
      ['InsertQueryNode']: QueryTypes.INSERT,
      ['UpdateQueryNode']: QueryTypes.UPDATE,
      ['DeleteQueryNode']: QueryTypes.DELETE,
    }[compiledQuery.query.kind]

    const paramsKey = this.#sequelize.getDialect() === 'mysql' ? 'replacements' : 'bind'

    if (this.#transaction) {
      return {
        [paramsKey]: [...compiledQuery.parameters],
        queryType,
        transaction: this.#transaction,
      }
    }

    if (!this.#connection) {
      this.#connection = await this.#sequelize.connectionManager.getConnection({type: 'write'})
    }

    return {
      [paramsKey]: [...compiledQuery.parameters],
      queryType,
      transaction: {connection: this.#connection} as unknown as Transaction,
    }
  }
}

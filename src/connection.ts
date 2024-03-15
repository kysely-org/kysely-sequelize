import type {CompiledQuery, DatabaseConnection, QueryResult, TransactionSettings} from 'kysely'
import type {QueryOptions, Sequelize, Transaction, TransactionOptions} from 'sequelize'
import {ISOLATION_LEVELS} from './isolation-levels.js'
import type {SupportedDialect} from './supported-dialects.js'
import {isNumber, isObject, isString} from './type-utils.js'

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
    const query = this.#getQuery(compiledQuery)
    const queryOptions = await this.#getQueryOptions(compiledQuery)

    const [rows, metadata] = await this.#sequelize.query(query, queryOptions)

    return {
      ...this.#getLastInsertedIdAndNumAffectedRows(rows, metadata),
      rows: Array.isArray(rows) ? (rows as R[]) : [],
    }
  }

  async *streamQuery<R>(
    _compiledQuery: CompiledQuery<unknown>,
    _chunkSize?: number | undefined,
  ): AsyncIterableIterator<QueryResult<R>> {
    throw new Error(
      'Sequelize does not support streaming queries yet! follow https://github.com/sequelize/sequelize/issues/15827',
    )
  }

  #translateTransactionSettings(settings: TransactionSettings): TransactionOptions {
    const {isolationLevel} = settings

    if (isolationLevel === 'snapshot') {
      throw new Error('Snapshot isolation level is not supported by Sequelize!')
    }

    return {
      autocommit: false,
      ...(isolationLevel ? {isolationLevel: ISOLATION_LEVELS[isolationLevel]} : {}),
    }
  }

  #getQuery(compiledQuery: CompiledQuery<unknown>): string {
    const dialect = this.#sequelize.getDialect() as SupportedDialect

    if (dialect === 'mssql') {
      let {sql} = compiledQuery

      compiledQuery.parameters.forEach((parameter, index) => {
        sql = sql.replace(
          new RegExp(`@${index + 1}([^\\d])?`),
          isString(parameter) ? `N'${parameter}'$1` : `${parameter}$1`,
        )
      })

      return sql
    }

    return compiledQuery.sql
  }

  async #getQueryOptions(compiledQuery: CompiledQuery<unknown>): Promise<QueryOptions> {
    const dialect = this.#sequelize.getDialect() as SupportedDialect
    const paramsKey = ['mysql', 'sqlite'].includes(dialect)
      ? 'replacements'
      : ['postgres'].includes(dialect)
      ? 'bind'
      : undefined

    return {
      ...(paramsKey ? {[paramsKey]: compiledQuery.parameters} : {}),
      transaction:
        this.#transaction ||
        ({
          connection: (this.#connection ||= await this.#sequelize.connectionManager.getConnection({type: 'write'})),
        } as unknown as Transaction),
    }
  }

  #getLastInsertedIdAndNumAffectedRows(rows: unknown, metadata: unknown): Omit<QueryResult<any>, 'rows'> {
    const dialect = this.#sequelize.getDialect() as SupportedDialect

    if (dialect === 'postgres') {
      return {
        numAffectedRows: isNumber(metadata)
          ? BigInt(metadata)
          : isObject(metadata) && 'rowCount' in metadata && isNumber(metadata.rowCount)
          ? BigInt(metadata.rowCount)
          : undefined,
      }
    }

    if (dialect === 'mysql') {
      return {
        insertId: isNumber(rows) ? BigInt(rows) : undefined,
        numAffectedRows: isNumber(metadata)
          ? BigInt(metadata)
          : isObject(metadata) && 'affectedRows' in metadata && isNumber(metadata.affectedRows)
          ? BigInt(metadata.affectedRows)
          : undefined,
        numChangedRows:
          isObject(metadata) && 'changedRows' in metadata && isNumber(metadata.changedRows)
            ? BigInt(metadata.changedRows)
            : undefined,
      }
    }

    if (dialect === 'mssql') {
      return {
        insertId: isNumber(rows) ? BigInt(rows) : undefined,
        numAffectedRows: isNumber(metadata) ? BigInt(metadata) : undefined,
      }
    }

    if (dialect === 'sqlite') {
      if (!isObject(metadata)) {
        return {}
      }

      const {changes, lastID} = metadata

      return {
        insertId: isNumber(lastID) ? BigInt(lastID) : undefined,
        numAffectedRows: isNumber(changes) ? BigInt(changes) : undefined,
      }
    }

    return {}
  }
}

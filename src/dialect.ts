import type {DatabaseIntrospector, Dialect, DialectAdapter, Driver, Kysely, QueryCompiler} from 'kysely'
import type {KyselySequelizeDialectConfig} from './config.js'
import {KyselySequelizeDriver} from './driver.js'
import {assertSupportedDialect} from './supported-dialects.js'

export class KyselySequelizeDialect implements Dialect {
  readonly #config: KyselySequelizeDialectConfig

  constructor(config: KyselySequelizeDialectConfig) {
    assertSupportedDialect(config.sequelize.getDialect())
    this.#config = config
  }

  createAdapter(): DialectAdapter {
    return this.#config.kyselySubDialect.createAdapter()
  }

  createDriver(): Driver {
    return new KyselySequelizeDriver(this.#config)
  }

  createIntrospector(db: Kysely<any>): DatabaseIntrospector {
    return this.#config.kyselySubDialect.createIntrospector(db)
  }

  createQueryCompiler(): QueryCompiler {
    return this.#config.kyselySubDialect.createQueryCompiler()
  }
}

import type {IsolationLevel} from 'kysely'
import {Transaction} from 'sequelize'

export const ISOLATION_LEVELS = {
  'read committed': Transaction.ISOLATION_LEVELS.READ_COMMITTED,
  'read uncommitted': Transaction.ISOLATION_LEVELS.READ_UNCOMMITTED,
  'repeatable read': Transaction.ISOLATION_LEVELS.REPEATABLE_READ,
  serializable: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
} as const satisfies Record<Exclude<IsolationLevel, 'snapshot'>, Transaction.ISOLATION_LEVELS>
